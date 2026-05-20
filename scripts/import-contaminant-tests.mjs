import fs from "node:fs";
import path from "node:path";

const file = process.env.AQUAREPORT_CLEAN_READINGS_FILE || "C:/tmp/aquareport-clean_contaminant_readings.json";
const endpoint =
  process.env.AQUAREPORT_IMPORT_ENDPOINT ||
  "https://groovy-basilisk-939.convex.site/api/admin/import-contaminant-tests";
const token = process.env.AQUAREPORT_IMPORT_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const batchSize = Number(process.env.AQUAREPORT_IMPORT_BATCH_SIZE || 500);
const maxUtilities = Number(process.env.AQUAREPORT_IMPORT_MAX_UTILITIES || 0);

if (!token && (!supabaseUrl || !supabaseServiceRoleKey)) {
  throw new Error("AQUAREPORT_IMPORT_TOKEN or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY is required");
}

function reportYear(reading) {
  const value = reading.source_year ?? reading.sample_year;
  return Number.isFinite(Number(value)) ? Number(value) : new Date().getFullYear();
}

function detectionStatus(reading) {
  if (reading.detected_level_numeric != null || reading.ewg_detected_level != null) return "detected";
  if (reading.over_legal_limit || reading.over_health_guideline || (reading.violation_count ?? 0) > 0) return "unknown";
  return "not_detected";
}

function sourceType(reading) {
  if (reading.data_source === "ewg_wayback") return "ewg_reference";
  if (reading.data_source === "epa_sdwa" || reading.data_source === "violation" || reading.data_source === "lcr_sample") {
    return "epa_sdwis";
  }
  return "manual";
}

function toRows(pwsid, contaminantMap) {
  return Object.values(contaminantMap).map((reading) => {
    const value = reading.detected_level_numeric ?? reading.ewg_detected_level ?? null;
    const status = detectionStatus(reading);
    return {
      utility_id: pwsid,
      contaminant_id:
        reading.contaminant_code ||
        String(reading.canonical_contaminant_name || reading.contaminant_name || "unknown")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_"),
      contaminant_name: reading.canonical_contaminant_name || reading.contaminant_name || "Unknown contaminant",
      report_year: reportYear(reading),
      test_date: null,
      detected: status === "detected",
      detection_status: status,
      detected_value: value,
      min_value: null,
      max_value: null,
      unit: reading.normalized_unit ?? null,
      legal_limit: reading.legal_limit_numeric ?? null,
      health_guideline: reading.health_guideline_numeric ?? null,
      source_type: sourceType(reading),
      source_url: null,
      raw_value: reading.raw_detected_level == null ? value == null ? null : String(value) : String(reading.raw_detected_level),
      raw_unit: reading.raw_unit ?? reading.normalized_unit ?? null,
      confidence_score: status === "detected" ? 0.82 : 0.72,
    };
  });
}

async function postBatch(rows, stats) {
  if (rows.length === 0) return;
  const direct = Boolean(supabaseUrl && supabaseServiceRoleKey);
  const res = await fetch(
    direct ? `${supabaseUrl}/rest/v1/contaminant_tests` : endpoint,
    {
      method: "POST",
      headers: direct
        ? {
            apikey: supabaseServiceRoleKey,
            Authorization: `Bearer ${supabaseServiceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          }
        : {
            "Content-Type": "application/json",
            "x-aquareport-import-token": token,
          },
      body: JSON.stringify(direct ? rows : { rows }),
    },
  );
  if (!res.ok) {
    throw new Error(`Import failed ${res.status}: ${await res.text()}`);
  }
  stats.rows += rows.length;
  if (stats.rows % 25000 < batchSize) {
    console.log(`Imported ${stats.rows.toLocaleString()} contaminant test rows from ${stats.utilities.toLocaleString()} utilities`);
  }
}

async function importFile() {
  const stream = fs.createReadStream(file, { encoding: "utf8", highWaterMark: 1024 * 1024 });
  let started = false;
  let readingKey = false;
  let key = "";
  let currentKey = "";
  let capturing = false;
  let depth = 0;
  let inString = false;
  let escape = false;
  let objectText = "";
  let batch = [];
  const stats = { utilities: 0, rows: 0 };

  for await (const chunk of stream) {
    for (const ch of chunk) {
      if (!started) {
        if (ch === "{") started = true;
        continue;
      }

      if (capturing) {
        objectText += ch;
        if (escape) {
          escape = false;
          continue;
        }
        if (ch === "\\") {
          escape = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          continue;
        }
        if (inString) continue;
        if (ch === "{") depth++;
        if (ch === "}") depth--;
        if (depth === 0) {
          const contaminantMap = JSON.parse(objectText);
          const rows = toRows(currentKey, contaminantMap);
          batch.push(...rows);
          stats.utilities++;
          objectText = "";
          capturing = false;
          currentKey = "";

          while (batch.length >= batchSize) {
            await postBatch(batch.splice(0, batchSize), stats);
          }
          if (maxUtilities > 0 && stats.utilities >= maxUtilities) {
            await postBatch(batch, stats);
            console.log(`Stopped at max utility limit ${maxUtilities}`);
            return;
          }
        }
        continue;
      }

      if (readingKey) {
        if (escape) {
          key += ch;
          escape = false;
          continue;
        }
        if (ch === "\\") {
          escape = true;
          continue;
        }
        if (ch === '"') {
          readingKey = false;
          currentKey = key;
          key = "";
          continue;
        }
        key += ch;
        continue;
      }

      if (ch === '"') {
        readingKey = true;
        key = "";
        continue;
      }
      if (currentKey && ch === "{") {
        capturing = true;
        depth = 1;
        inString = false;
        escape = false;
        objectText = "{";
      }
    }
  }

  await postBatch(batch, stats);
  console.log(`Done. Imported ${stats.rows.toLocaleString()} rows from ${stats.utilities.toLocaleString()} utilities.`);
}

console.log(`Importing ${path.basename(file)} to ${endpoint}`);
await importFile();
