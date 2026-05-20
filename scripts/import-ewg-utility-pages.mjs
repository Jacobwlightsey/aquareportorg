import fs from "node:fs";
import path from "node:path";

const DEFAULT_PWSIDS = [
  "NY7003493",
  "CA1910067",
  "IL0316000",
  "TX1010013",
  "AZ0407025",
  "PA1510001",
  "TX0150018",
  "CA3710020",
  "TX0570004",
  "CA4310011",
  "TX2270001",
  "FL2161328",
  "CA3810011",
  "OH2504412",
  "NC0160010",
  "IN5249004",
  "WA5377050",
  "CO0116001",
  "DC0000002",
  "MA6000000",
  "FL4130871",
  "GA1210001",
  "NV0000090",
  "OR4100657",
  "TN0000494",
];

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");
const sqlOutputDir = getArg("--sql-output-dir");
const fromSupabaseThin = process.argv.includes("--from-supabase-thin");
const includeExistingEwg = process.argv.includes("--include-existing-ewg");
const missingEwgOnly = process.argv.includes("--missing-ewg-only") || !includeExistingEwg;
const minPopulation = Number(getArg("--min-population") ?? 100000);
const maxExistingTests = Number(getArg("--max-existing-tests") ?? 14);
const pwsids = getArgList("--pwsids") ?? DEFAULT_PWSIDS;
const limit = Number(getArg("--limit") ?? (fromSupabaseThin ? 500 : pwsids.length));
const delayMs = Number(getArg("--delay-ms") ?? 350);
const flushEvery = Number(getArg("--flush-every") ?? 25);
const targets = fromSupabaseThin ? [] : pwsids.slice(0, limit);

if ((fromSupabaseThin || (!dryRun && !sqlOutputDir)) && (!supabaseUrl || !supabaseServiceRoleKey)) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for this mode");
}

function getArg(name) {
  const direct = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function getArgList(name) {
  const value = getArg(name);
  if (!value) return undefined;
  return value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function textMatch(html, regex) {
  const match = html.match(regex);
  return match ? decodeHtml(match[1]) : null;
}

function parseMeasurement(raw) {
  const text = decodeHtml(raw);
  if (!text || /no legal limit|n\/a|not available/i.test(text)) {
    return { value: null, unit: null, raw: text };
  }

  const match = text.match(/([-+]?\d[\d,]*(?:\.\d+)?(?:e[-+]?\d+)?)\s*([a-zA-Zµ/ ]+)?/i);
  if (!match) return { value: null, unit: null, raw: text };

  const unit = (match[2] ?? "")
    .replace(/\s*\(.*?\)\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    value: Number(match[1].replace(/,/g, "")),
    unit: unit || null,
    raw: text,
  };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function sqlQuote(value) {
  if (value == null) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  if (value == null) return "null";
  return Number.isFinite(Number(value)) ? String(Number(value)) : "null";
}

function rowSql(row) {
  return `(${[
    "gen_random_uuid()",
    sqlQuote(row.utility_id),
    sqlQuote(row.contaminant_id),
    sqlQuote(row.contaminant_name),
    sqlNumber(row.report_year),
    "null",
    row.detected ? "true" : "false",
    sqlQuote(row.detection_status),
    sqlNumber(row.detected_value),
    "null",
    "null",
    sqlQuote(row.unit),
    sqlNumber(row.legal_limit),
    sqlNumber(row.health_guideline),
    sqlQuote(row.source_type),
    sqlQuote(row.source_url),
    sqlQuote(row.raw_value),
    sqlQuote(row.raw_unit),
    sqlNumber(row.confidence_score),
    "now()",
  ].join(", ")})`;
}

function writeSqlFiles(rows, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const utilityIds = [...new Set(rows.map((row) => row.utility_id))];
  const deleteSql = `delete from public.contaminant_tests where utility_id in (${utilityIds.map(sqlQuote).join(", ")}) and source_type = 'ewg_reference';`;
  const insertColumns = `insert into public.contaminant_tests (
  id, utility_id, contaminant_id, contaminant_name, report_year, test_date,
  detected, detection_status, detected_value, min_value, max_value, unit,
  legal_limit, health_guideline, source_type, source_url, raw_value, raw_unit,
  confidence_score, created_at
) values\n`;

  const files = [];
  for (let index = 0; index < rows.length; index += 150) {
    const chunk = rows.slice(index, index + 150);
    const sql = `${index === 0 ? `${deleteSql}\n\n` : ""}${insertColumns}${chunk.map(rowSql).join(",\n")};`;
    const file = path.join(outputDir, `ewg-import-${String(files.length + 1).padStart(3, "0")}.sql`);
    fs.writeFileSync(file, sql);
    files.push(file);
  }
  return files;
}

function sectionById(html, id) {
  const start = html.indexOf(`id="${id}"`);
  if (start < 0) return "";
  const next = html.indexOf('<div class="contaminants-list"', start + id.length);
  const endMarkers = [next, html.indexOf('<div id="find-a-filter"', start + id.length)].filter((index) => index > start);
  const end = endMarkers.length > 0 ? Math.min(...endMarkers) : html.length;
  return html.slice(start, end);
}

function contaminantCards(section) {
  return section
    .split(/<div[^>]+class=["'][^"']*contaminant-grid-item[^"']*["'][^>]*>/i)
    .slice(1)
    .filter((card) => /this-utility-text|contaminant-name|<h3>/i.test(card));
}

function parseCard(card, pwsid, sourceUrl, reportYear, overHealthSection) {
  const name = textMatch(card, /<h3[^>]*>([\s\S]*?)<\/h3>/i);
  const utility = parseMeasurement(textMatch(card, /class=["']this-utility-text["'][^>]*>\s*This Utility:\s*([^<]+)/i));
  const legal = parseMeasurement(textMatch(card, /class=["']legal-limit-text["'][^>]*>\s*([^<]+)/i));
  const health = parseMeasurement(
    textMatch(card, /class=["']health-guideline-text["'][^>]*>\s*EWG(?:'|&#39;|&apos;)s Health Guideline:\s*([^<]+)/i),
  );
  const effect = textMatch(card, /class=["']potentital-effect["'][^>]*>\s*Potential Effect:\s*([^<]+)/i);
  const code = textMatch(card, /contaminant\.php\?contamcode=([^"'>\s]+)/i);

  if (!name || utility.value == null) return null;

  return {
    utility_id: pwsid,
    contaminant_id: code || slugify(name),
    contaminant_name: name,
    report_year: reportYear,
    test_date: null,
    detected: true,
    detection_status: "detected",
    detected_value: utility.value,
    min_value: null,
    max_value: null,
    unit: utility.unit,
    legal_limit: legal.value,
    health_guideline: health.value,
    source_type: "ewg_reference",
    source_url: sourceUrl,
    raw_value: effect ? `${utility.raw}; potential_effect=${effect}` : utility.raw,
    raw_unit: utility.unit,
    confidence_score: overHealthSection ? 0.94 : 0.9,
  };
}

function parseTotals(html) {
  const compact = decodeHtml(html);
  const totalMatch = compact.match(/(\d+)\s+Total Contaminants/i);
  const aboveMatch = compact.match(/(\d+)\s+Contaminants Exceed EWG/i);
  const rangeMatch = compact.match(/data from\s+(\d{4})\s*[-–]\s*(\d{4})/i);
  return {
    totalDetected: totalMatch ? Number(totalMatch[1]) : null,
    totalAboveHealth: aboveMatch ? Number(aboveMatch[1]) : null,
    reportYear: rangeMatch ? Number(rangeMatch[2]) : new Date().getFullYear(),
  };
}

function parseEwgPage(html, pwsid, sourceUrl) {
  const totals = parseTotals(html);
  const aboveCards = contaminantCards(sectionById(html, "contams_above_hbl"));
  const otherCards = contaminantCards(sectionById(html, "contams_other"));
  const rows = [...aboveCards.map((card) => parseCard(card, pwsid, sourceUrl, totals.reportYear, true)), ...otherCards.map((card) => parseCard(card, pwsid, sourceUrl, totals.reportYear, false))]
    .filter(Boolean);

  const deduped = new Map();
  for (const row of rows) {
    deduped.set(row.contaminant_id || slugify(row.contaminant_name), row);
  }

  return {
    pwsid,
    sourceUrl,
    totals,
    rows: [...deduped.values()],
  };
}

async function fetchEwgPage(pwsid) {
  const sourceUrl = `https://www.ewg.org/tapwater/system.php?pws=${encodeURIComponent(pwsid)}`;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(sourceUrl, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 AquaReportDataQA/1.0",
          accept: "text/html,application/xhtml+xml",
        },
      });
      if (!res.ok) throw new Error(`EWG fetch failed for ${pwsid}: ${res.status} ${res.statusText}`);
      return { sourceUrl, html: await res.text() };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
}

async function supabaseRequest(path, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
        ...options,
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
          "Content-Type": "application/json",
          ...(options.headers ?? {}),
        },
      });
      if (!res.ok) throw new Error(`Supabase ${options.method ?? "GET"} ${path} failed ${res.status}: ${await res.text()}`);
      return res;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

async function supabaseJson(path, options = {}) {
  const res = await supabaseRequest(path, options);
  return await res.json();
}

async function supabaseJsonAll(path, pageSize = 1000, maxRows = 10000) {
  const all = [];
  for (let start = 0; start < maxRows; start += pageSize) {
    const end = start + pageSize - 1;
    const page = await supabaseJson(path, {
      headers: {
        Range: `${start}-${end}`,
        Prefer: "count=exact",
      },
    });
    all.push(...page);
    if (page.length < pageSize) break;
  }
  return all;
}

async function getThinTargets() {
  const rows = await supabaseJsonAll(
    `utilities?select=pwsid,utility_name,state,population_served,pws_type&or=(pws_type.eq.CWS,pws_type.eq.Community%20water%20system)&population_served=gte.${minPopulation}&order=population_served.desc.nullslast&limit=5000`,
  );
  const utilityIds = rows.map((row) => row.pwsid).filter(Boolean);
  const counts = new Map();
  const noDataFlagged = new Set();

  for (let index = 0; index < utilityIds.length; index += 20) {
    const chunk = utilityIds.slice(index, index + 20);
    const inList = chunk.map((id) => `"${id}"`).join(",");
    const [tests, flags] = await Promise.all([
      supabaseJson(`contaminant_tests?select=utility_id,source_type&utility_id=in.(${inList})&limit=5000`),
      supabaseJson(`utility_data_quality_flags?select=utility_id,issue_type&utility_id=in.(${inList})&issue_type=eq.ewg_no_detected_cards&limit=5000`),
    ]);
    for (const test of tests) {
      const current = counts.get(test.utility_id) ?? { total: 0, ewg: 0 };
      current.total++;
      if (test.source_type === "ewg_reference") current.ewg++;
      counts.set(test.utility_id, current);
    }
    for (const flag of flags) {
      noDataFlagged.add(flag.utility_id);
    }
  }

  return rows
    .map((row) => ({ ...row, counts: counts.get(row.pwsid) ?? { total: 0, ewg: 0 }, noDataFlagged: noDataFlagged.has(row.pwsid) }))
    .filter((row) => !row.noDataFlagged)
    .filter((row) => (missingEwgOnly ? row.counts.ewg === 0 : row.counts.total <= maxExistingTests))
    .slice(0, limit);
}

async function replaceRowsForUtilities(allRows) {
  const utilityIds = [...new Set(allRows.map((row) => row.utility_id))];
  if (utilityIds.length === 0) return;
  const inList = utilityIds.map((id) => `"${id}"`).join(",");
  await supabaseRequest(`contaminant_tests?utility_id=in.(${inList})&source_type=eq.ewg_reference`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });

  for (let index = 0; index < allRows.length; index += 500) {
    const batch = allRows.slice(index, index + 500);
    await supabaseRequest("contaminant_tests", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(batch),
    });
  }
}

async function insertQualityFlags(flags) {
  if (flags.length === 0) return;
  await supabaseRequest("utility_data_quality_flags", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(flags),
  });
}

async function main() {
  const runTargets = fromSupabaseThin ? await getThinTargets() : targets.map((pwsid) => ({ pwsid }));
  console.log(`Targeting ${runTargets.length} utilities${fromSupabaseThin ? ` with population >= ${minPopulation} and <= ${maxExistingTests} existing tests` : ""}.`);

  const imports = [];
  const failures = [];
  const noDataFlags = [];
  let flushedRows = 0;

  async function flushImports(force = false) {
    const pendingRows = imports.flatMap((item) => item.rows);
    if (pendingRows.length === 0) return;
    if (!force && imports.length < flushEvery) return;
    if (dryRun || sqlOutputDir) return;

    await replaceRowsForUtilities(pendingRows);
    await insertQualityFlags(noDataFlags.splice(0, noDataFlags.length));
    flushedRows += pendingRows.length;
    console.log(`Flushed ${pendingRows.length} rows to Supabase. Total flushed: ${flushedRows}.`);
    imports.length = 0;
  }

  for (const target of runTargets) {
    const pwsid = target.pwsid;
    try {
      const { sourceUrl, html } = await fetchEwgPage(pwsid);
      const parsed = parseEwgPage(html, pwsid, sourceUrl);
      imports.push(parsed);
      if (parsed.rows.length === 0) {
        noDataFlags.push({
          utility_id: pwsid,
          issue_type: "ewg_no_detected_cards",
          description: "EWG page was reachable, but no detected contaminant cards were parsed during enrichment.",
          severity: "medium",
        });
      }
      const expected = parsed.totals.totalDetected ?? "?";
      const above = parsed.totals.totalAboveHealth ?? "?";
      const label = target.utility_name ? ` ${target.utility_name}` : "";
      console.log(`${pwsid}${label}: parsed ${parsed.rows.length} detected contaminants (${above} above health, ${expected} total on EWG)`);
      await flushImports(false);
    } catch (error) {
      failures.push({ pwsid, error: error instanceof Error ? error.message : String(error) });
      console.warn(`${pwsid}: skipped after fetch/parse failure: ${error instanceof Error ? error.message : String(error)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const allRows = imports.flatMap((item) => item.rows);
  if (dryRun) {
    console.log(`Dry run complete. Would replace ${allRows.length} ewg_reference rows across ${imports.length} utilities. Failures: ${failures.length}.`);
    return;
  }

  if (!sqlOutputDir && noDataFlags.length > 0) {
    await insertQualityFlags(noDataFlags.splice(0, noDataFlags.length));
  }

  if (sqlOutputDir) {
    const files = writeSqlFiles(allRows, sqlOutputDir);
    console.log(`Wrote ${files.length} SQL import files to ${sqlOutputDir} for ${allRows.length} rows.`);
    return;
  }

  await flushImports(true);
  console.log(`Imported ${flushedRows} EWG contaminant rows. Failures: ${failures.length}.`);
  if (failures.length > 0) {
    console.log(JSON.stringify({ failures }, null, 2));
  }
}

await main();
