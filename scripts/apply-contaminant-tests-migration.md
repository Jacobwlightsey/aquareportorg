# Apply Contaminant Tests Migration

This migration is intentionally additive. It does not delete or rewrite `contaminant_readings`.

Applied against the AquaReport Supabase project on 2026-05-18:

```sql
-- supabase/migrations/202605180001_contaminant_tests_reporting_layer.sql
```

What it does:

- Creates `contaminant_tests`.
- Creates `contaminant_report_summary`.
- Creates `utility_data_quality_flags`.
- Backfills `contaminant_tests` from existing `contaminant_readings` as detected legacy imports.
- Renames the old RPCs to:
  - `get_water_report_legacy`
  - `zip_water_report_legacy`
- Recreates:
  - `get_water_report`
  - `zip_water_report`
- Merges new tested contaminant rows with legacy detected readings.
- Returns tested/detected counts plus `data_quality_flags`.

Expected report response additions:

```json
{
  "utility": {},
  "report_year": 2023,
  "total_tested": 19,
  "total_detected": 12,
  "total_above_legal_limit": 1,
  "total_above_health_guideline": 11,
  "contaminants": [],
  "tested_contaminants": [],
  "detected_contaminants": [],
  "data_quality_flags": []
}
```

The response also preserves the legacy `utility_info` and `contaminants[].contaminant` / `contaminants[].detected_level` fields so the current app stays compatible.

Important data QA finding:

- The local `production_database.zip` summary says the prepared dataset contains about 1,821,598 contaminant readings.
- The live Supabase `contaminant_readings` table currently contains 204,805 rows.
- That means the report RPC layer is now safer and flags incomplete data, but the next data rebuild should bulk-load the missing production readings from `production_database.zip` before we trust every utility count.
