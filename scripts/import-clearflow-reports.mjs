import fs from "node:fs";

const [, , inputPath = "tmp/clearflow_import/data/all_reports.json"] = process.argv;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

function zip5(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? digits.slice(0, 5) : null;
}

function asTextArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item != null).map((item) => String(item));
}

function toRow(report) {
  return {
    pwsid: String(report.pwsid),
    utility_name: report.utility_name ?? null,
    state: report.state ?? null,
    city: report.city ?? null,
    county: report.county ?? null,
    zip_code: report.zip_code ?? null,
    zip5: zip5(report.zip_code),
    zip_codes_served: asTextArray(report.zip_codes_served),
    cities_served: asTextArray(report.cities_served),
    population_served: report.population_served ?? null,
    water_source: report.water_source ?? null,
    owner_type: report.owner_type ?? null,
    water_score: report.water_score ?? null,
    total_contaminants: report.total_contaminants ?? 0,
    critical_count: report.critical_count ?? 0,
    high_count: report.high_count ?? 0,
    moderate_count: report.moderate_count ?? 0,
    over_legal_count: report.over_legal_count ?? 0,
    over_health_count: report.over_health_count ?? 0,
    contaminants: Array.isArray(report.contaminants) ? report.contaminants : [],
    report_json: report,
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

const raw = fs.readFileSync(inputPath, "utf8");
const reports = JSON.parse(raw);
if (!Array.isArray(reports)) throw new Error("Expected all_reports.json to contain a JSON array.");

console.log(`Importing ${reports.length} ClearFlow reports from ${inputPath}`);

const batchSize = 200;
let imported = 0;

for (let i = 0; i < reports.length; i += batchSize) {
  const batch = reports.slice(i, i + batchSize).map(toRow);
  await supabaseRequest("clearflow_water_reports?on_conflict=pwsid", {
    method: "POST",
    body: JSON.stringify(batch),
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
  });
  imported += batch.length;
  if (imported % 2000 === 0 || imported === reports.length) {
    console.log(`Imported ${imported}/${reports.length}`);
  }
}

console.log("ClearFlow report import complete.");
