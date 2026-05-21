/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as AquaReportEmail from "../AquaReportEmail.js";
import type * as admin from "../admin.js";
import type * as adminCleanup from "../adminCleanup.js";
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as companies from "../companies.js";
import type * as constants from "../constants.js";
import type * as dealerShared from "../dealerShared.js";
import type * as email from "../email.js";
import type * as http from "../http.js";
import type * as integrations from "../integrations.js";
import type * as leads from "../leads.js";
import type * as lib_reportTemplate from "../lib/reportTemplate.js";
import type * as publicApi from "../publicApi.js";
import type * as referrals from "../referrals.js";
import type * as reportPdf from "../reportPdf.js";
import type * as reportPdfClient from "../reportPdfClient.js";
import type * as reports from "../reports.js";
import type * as security from "../security.js";
import type * as stripe from "../stripe.js";
import type * as supabase from "../supabase.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  AquaReportEmail: typeof AquaReportEmail;
  admin: typeof admin;
  adminCleanup: typeof adminCleanup;
  ai: typeof ai;
  auth: typeof auth;
  companies: typeof companies;
  constants: typeof constants;
  dealerShared: typeof dealerShared;
  email: typeof email;
  http: typeof http;
  integrations: typeof integrations;
  leads: typeof leads;
  "lib/reportTemplate": typeof lib_reportTemplate;
  publicApi: typeof publicApi;
  referrals: typeof referrals;
  reportPdf: typeof reportPdf;
  reportPdfClient: typeof reportPdfClient;
  reports: typeof reports;
  security: typeof security;
  stripe: typeof stripe;
  supabase: typeof supabase;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
