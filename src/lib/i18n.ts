/**
 * Country-aware i18n utilities for AquaReport.
 *
 * Dealers pick their country (US or CA) during onboarding.
 * All user-facing labels, regulatory references, and validation
 * logic adapt automatically via this module.
 */

export type Country = "US" | "CA";

export interface CountryText {
  /** "ZIP Code" or "Postal Code" */
  zipLabel: string;
  /** "State" or "Province" */
  stateLabel: string;
  /** "City" — same in both */
  cityLabel: string;
  /** Regulatory agency name: "EPA" or "Health Canada" */
  agency: string;
  /** Guideline abbreviation: "MCL" or "GCDWQ" */
  guideline: string;
  /** Full guideline name */
  guidelineFull: string;
  /** Health guideline source: "EWG" or "Health Canada" */
  healthSource: string;
  /** Health guideline label */
  healthGuideline: string;
  /** "EPA & EWG" or "Health Canada (GCDWQ)" */
  agencyAndHealth: string;
  /** Placeholder for zip/postal input */
  zipPlaceholder: string;
  /** Max character length for code input */
  zipMaxLength: number;
  /** Minimum characters before triggering lookup */
  zipMinLength: number;
  /** Regex pattern for validation */
  zipPattern: RegExp;
  /** User-facing validation error */
  zipError: string;
  /** Country display name */
  countryName: string;
  /** "EPA Registered" or "Health Canada Compliant" */
  trustBadge: string;
  /** State abbreviation max length (2 for both) */
  stateMaxLength: number;
  /** Address placeholder */
  addressPlaceholder: string;
}

const US_TEXT: CountryText = {
  zipLabel: "ZIP Code",
  stateLabel: "State",
  cityLabel: "City",
  agency: "EPA",
  guideline: "MCL",
  guidelineFull: "Maximum Contaminant Level",
  healthSource: "EWG",
  healthGuideline: "EWG health guidelines",
  agencyAndHealth: "EPA legal limits and EWG health guidelines",
  zipPlaceholder: "85001",
  zipMaxLength: 5,
  zipMinLength: 5,
  zipPattern: /^\d{5}$/,
  zipError: "Valid 5-digit ZIP code is required",
  countryName: "United States",
  trustBadge: "EPA Registered",
  stateMaxLength: 2,
  addressPlaceholder: "123 Main St, City, State",
};

const CA_TEXT: CountryText = {
  zipLabel: "Postal Code",
  stateLabel: "Province",
  cityLabel: "City",
  agency: "Health Canada",
  guideline: "GCDWQ",
  guidelineFull: "Maximum Acceptable Concentration",
  healthSource: "Health Canada",
  healthGuideline: "Health Canada guidelines",
  agencyAndHealth: "Health Canada guidelines (GCDWQ)",
  zipPlaceholder: "T5J 2N4",
  zipMaxLength: 7,
  zipMinLength: 3,
  zipPattern: /^[A-Za-z]\d[A-Za-z](\s?\d[A-Za-z]\d)?$/,
  zipError: "Valid Canadian postal code is required (e.g. T5J 2N4)",
  countryName: "Canada",
  trustBadge: "Health Canada Compliant",
  stateMaxLength: 2,
  addressPlaceholder: "123 Main St, City, Province",
};

/**
 * Return the full text object for a country code.
 * Defaults to US when country is undefined (backward compatible).
 */
export function getCountryText(country?: Country | string | null): CountryText {
  return country === "CA" ? CA_TEXT : US_TEXT;
}

/**
 * Validate a zip/postal code string for the given country.
 */
export function isValidCode(code: string, country?: Country | string | null): boolean {
  const t = getCountryText(country);
  return t.zipPattern.test(code.trim());
}

/**
 * Check if the code is long enough to trigger an auto-lookup.
 */
export function isCodeReadyForLookup(code: string, country?: Country | string | null): boolean {
  const t = getCountryText(country);
  return code.trim().length >= t.zipMinLength;
}
