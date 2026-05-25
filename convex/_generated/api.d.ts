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
import type * as appointments from "../appointments.js";
import type * as auth from "../auth.js";
import type * as commissions from "../commissions.js";
import type * as companies from "../companies.js";
import type * as constants from "../constants.js";
import type * as contracts from "../contracts.js";
import type * as dealerShared from "../dealerShared.js";
import type * as deals from "../deals.js";
import type * as demoAssistant from "../demoAssistant.js";
import type * as email from "../email.js";
import type * as followUps from "../followUps.js";
import type * as http from "../http.js";
import type * as integrations from "../integrations.js";
import type * as leads from "../leads.js";
import type * as lib_proposalTemplate from "../lib/proposalTemplate.js";
import type * as lib_reportTemplate from "../lib/reportTemplate.js";
import type * as marketing from "../marketing.js";
import type * as proposalPdf from "../proposalPdf.js";
import type * as proposals from "../proposals.js";
import type * as publicApi from "../publicApi.js";
import type * as referrals from "../referrals.js";
import type * as reportPdf from "../reportPdf.js";
import type * as reportPdfClient from "../reportPdfClient.js";
import type * as reports from "../reports.js";
import type * as retention from "../retention.js";
import type * as security from "../security.js";
import type * as spouseReview from "../spouseReview.js";
import type * as stripe from "../stripe.js";
import type * as supabase from "../supabase.js";
import type * as training from "../training.js";
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
  appointments: typeof appointments;
  auth: typeof auth;
  commissions: typeof commissions;
  companies: typeof companies;
  constants: typeof constants;
  contracts: typeof contracts;
  dealerShared: typeof dealerShared;
  deals: typeof deals;
  demoAssistant: typeof demoAssistant;
  email: typeof email;
  followUps: typeof followUps;
  http: typeof http;
  integrations: typeof integrations;
  leads: typeof leads;
  "lib/proposalTemplate": typeof lib_proposalTemplate;
  "lib/reportTemplate": typeof lib_reportTemplate;
  marketing: typeof marketing;
  proposalPdf: typeof proposalPdf;
  proposals: typeof proposals;
  publicApi: typeof publicApi;
  referrals: typeof referrals;
  reportPdf: typeof reportPdf;
  reportPdfClient: typeof reportPdfClient;
  reports: typeof reports;
  retention: typeof retention;
  security: typeof security;
  spouseReview: typeof spouseReview;
  stripe: typeof stripe;
  supabase: typeof supabase;
  training: typeof training;
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
