import fs from "node:fs";

const [, , inputPath = "tmp/clearflow_clean/clean_zip_lookup.json"] = process.argv;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

function toRow(row) {
  const raw = {
    zip_code: row.zip_code ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    county: row.county ?? null,
    pwsid: row.pwsid ?? null,
    utility_name: row.utility_name ?? null,
    water_score: row.water_score ?? null,
    population_served: row.population_served ?? null,
    total_contaminants: row.total_contaminants ?? null,
    over_legal_count: row.over_legal_count ?? null,
    over_health_count: row.over_health_count ?? null,
    water_source: row.water_source ?? null,
    resolution: row.resolution ?? null,
  };

  return {
    zip_code: String(row.zip_code).padStart(5, "0").slice(0, 5),
    city: row.city ?? null,
    state: row.state ?? null,
    county: row.county ?? null,
    pwsid: row.pwsid ?? null,
    utility_name: row.utility_name ?? null,
    water_score: row.water_score ?? null,
    population_served: row.population_served ?? null,
    total_contaminants: row.total_contaminants ?? 0,
    over_legal_count: row.over_legal_count ?? 0,
    over_health_count: row.over_health_count ?? 0,
    water_source: row.water_source ?? null,
    resolution: row.resolution ?? null,
    raw_json: raw,
  };
}

async function supabaseRequest(path, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
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
      if (!res.ok) {
        throw new Error(`Supabase ${options.method ?? "GET"} ${path} failed ${res.status}: ${await res.text()}`);
      }
      return res;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

const rows = JSON.parse(fs.readFileSync(inputPath, "utf8"));
if (!Array.isArray(rows)) throw new Error("Expected clean_zip_lookup.json to contain a JSON array.");
const resolvedRows = rows.filter((row) => row.pwsid);

console.log(`Importing ${resolvedRows.length}/${rows.length} resolved clean ZIP lookup rows from ${inputPath}`);

const batchSize = 500;
let imported = 0;

for (let i = 0; i < resolvedRows.length; i += batchSize) {
  const batch = resolvedRows.slice(i, i + batchSize).map(toRow);
  await supabaseRequest("clearflow_zip_lookup?on_conflict=zip_code", {
    method: "POST",
    body: JSON.stringify(batch),
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
  });
  imported += batch.length;
  if (imported % 5000 === 0 || imported === resolvedRows.length) {
    console.log(`Imported ${imported}/${resolvedRows.length}`);
  }
}

console.log("ClearFlow ZIP lookup import complete.");
