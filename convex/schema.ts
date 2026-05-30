import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  companies: defineTable({
    name: v.string(),
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    productImageStorageId: v.optional(v.id("_storage")),
    primaryColor: v.optional(v.string()),
    disclaimer: v.optional(v.string()),
    solutionProductName: v.optional(v.string()),
    solutionProductImage: v.optional(v.string()),
    solutionProductDescription: v.optional(v.string()),
    solutionProductBullets: v.optional(v.array(v.string())),
    solutionRetailValue: v.optional(v.number()),
    additionalProducts: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
      image: v.optional(v.string()),
      bullets: v.array(v.string()),
    }))),
    customDomain: v.optional(v.string()),
    brandMode: v.optional(v.string()),
    country: v.optional(v.string()), // "US" | "CA" — set during onboarding, drives i18n
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    googleReviewUrl: v.optional(v.string()),
    // Stripe
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePlan: v.optional(v.string()),
    stripeStatus: v.optional(v.string()),
    stripePeriodEnd: v.optional(v.number()),
    reportLimitOverride: v.optional(v.number()),
    demoConfig: v.optional(v.any()),
    demoStepConfig: v.optional(v.any()),
    customProposalUrl: v.optional(v.string()),
    // Enterprise
    isEnterprise: v.optional(v.boolean()),
    enterpriseParentId: v.optional(v.id("companies")), // links child locations to parent
    enterpriseConfig: v.optional(v.object({
      locations: v.optional(v.array(v.object({
        name: v.string(),
        address: v.optional(v.string()),
        companyId: v.optional(v.id("companies")),
      }))),
      billingEmail: v.optional(v.string()),
      billingNotes: v.optional(v.string()),
      contractStart: v.optional(v.number()),
      contractEnd: v.optional(v.number()),
      customPricing: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_customDomain", ["customDomain"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),

  companyMembers: defineTable({
    companyId: v.id("companies"),
    userId: v.id("users"),
    role: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    invitedBy: v.optional(v.id("users")),
    acceptedAt: v.optional(v.number()),
    featureAccess: v.optional(v.array(v.string())),
  })
    .index("by_company", ["companyId"])
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),

  reports: defineTable({
    companyId: v.id("companies"),
    generatedBy: v.optional(v.id("users")),
    leadId: v.optional(v.id("leads")),
    zip: v.string(),
    utilityName: v.string(),
    pwsid: v.string(),
    city: v.string(),
    state: v.string(),
    populationServed: v.number(),
    waterSource: v.string(),
    totalContaminants: v.number(),
    overHealthGuidelines: v.number(),
    overLegalLimits: v.number(),
    contaminants: v.string(),
    customerName: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    customerCity: v.optional(v.string()),
    customerState: v.optional(v.string()),
    customerZip: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    waterScore: v.optional(v.number()),
    scoreMode: v.optional(v.string()),
    chlorine: v.optional(v.number()),
    hardness: v.optional(v.number()),
    tds: v.optional(v.number()),
    ph: v.optional(v.number()),
    pdfStorageId: v.optional(v.id("_storage")),
    pdfUrl: v.optional(v.string()),
    flipbookUrl: v.optional(v.string()),
    flipbookThumbnail: v.optional(v.string()),
    flipbookId: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    aiSalesNotes: v.optional(v.string()),
    presentationScript: v.optional(v.string()),
    aiEmailDraft: v.optional(v.string()),
    shareToken: v.optional(v.string()),
    testNotes: v.optional(v.string()),
    repName: v.optional(v.string()),
    repDate: v.optional(v.string()),
    repPhone: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_generatedBy", ["generatedBy"])
    .index("by_shareToken", ["shareToken"])
    .index("by_lead", ["leadId"]),

  leads: defineTable({
    companyId: v.id("companies"),
    reportId: v.optional(v.id("reports")),
    reportShareToken: v.optional(v.string()),
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    message: v.optional(v.string()),
    // Unified pipeline status — one lead = one customer journey
    // new_lead → call_to_set → scheduled → report_created → demo_done → forms_sent → sold → installed | closed_lost
    status: v.string(),
    utilityCityState: v.optional(v.string()),
    source: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    lastSyncedAt: v.optional(v.number()),
    // Facebook Lead Ads fields
    fbLeadId: v.optional(v.string()),
    fbFormId: v.optional(v.string()),
    fbFormName: v.optional(v.string()),
    fbCampaignName: v.optional(v.string()),
    fbAdSetName: v.optional(v.string()),
    fbAdName: v.optional(v.string()),
    rawFbFields: v.optional(v.string()), // JSON
    consentGiven: v.optional(v.boolean()),
    consentTimestamp: v.optional(v.number()),
    // Smart lead scoring
    aiScore: v.optional(v.number()),
    aiScoreFactors: v.optional(v.string()), // JSON
    lastViewedAt: v.optional(v.number()),
    viewCount: v.optional(v.number()),
    // ─── Merged from deals table (CRM rework) ─────────────────────
    dealValue: v.optional(v.number()),
    equipmentList: v.optional(v.string()), // JSON array
    priority: v.optional(v.string()), // "hot" | "warm" | "cold"
    expectedCloseDate: v.optional(v.number()),
    lostReason: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    stageHistory: v.optional(v.string()), // JSON array [{stage, timestamp, userId}]
    notes: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zip: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_status", ["companyId", "status"])
    .index("by_report", ["reportId"])
    .index("by_fb_lead", ["companyId", "fbLeadId"])
    .index("by_assigned", ["companyId", "assignedTo"]),

  enterpriseLeads: defineTable({
    name: v.string(),
    companyName: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.optional(v.string()),
    source: v.string(),
    status: v.string(),
    submittedByUserId: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"]),

  companyInvites: defineTable({
    companyId: v.id("companies"),
    email: v.string(),
    role: v.string(),
    tokenHash: v.string(),
    invitedBy: v.id("users"),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_email", ["email"])
    .index("by_tokenHash", ["tokenHash"]),

  auditLogs: defineTable({
    companyId: v.optional(v.id("companies")),
    actorId: v.optional(v.id("users")),
    action: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.string()),
    ipHash: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_actor", ["actorId"])
    .index("by_action", ["action"]),

  usageEvents: defineTable({
    companyId: v.optional(v.id("companies")),
    userId: v.optional(v.id("users")),
    event: v.string(),
    quantity: v.number(),
    period: v.string(),
    publicKey: v.optional(v.string()),
    metadata: v.optional(v.string()),
  })
    .index("by_company_period", ["companyId", "period"])
    .index("by_user_period", ["userId", "period"])
    .index("by_public_period", ["publicKey", "period"]),

  apiKeys: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    keyHash: v.string(),
    scopes: v.array(v.string()),
    createdBy: v.id("users"),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_keyHash", ["keyHash"]),

  integrationConnections: defineTable({
    companyId: v.id("companies"),
    provider: v.string(),
    status: v.string(),
    authType: v.string(),
    displayName: v.optional(v.string()),
    encryptedConfig: v.optional(v.string()),
    syncLeadEvents: v.optional(v.boolean()),
    syncReportEvents: v.optional(v.boolean()),
    lastSyncAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    lastHealthCheck: v.optional(v.number()),
    tokenExpiresAt: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("by_company", ["companyId"])
    .index("by_provider", ["companyId", "provider"]),

  integrationEvents: defineTable({
    companyId: v.id("companies"),
    provider: v.string(),
    connectionId: v.optional(v.id("integrationConnections")),
    eventType: v.string(),
    status: v.string(),
    attempts: v.number(),
    nextRetryAt: v.optional(v.number()),
    payload: v.optional(v.string()),
    response: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_status", ["status"])
    .index("by_provider", ["companyId", "provider"]),

  aiGenerations: defineTable({
    companyId: v.id("companies"),
    reportId: v.optional(v.id("reports")),
    userId: v.optional(v.id("users")),
    purpose: v.string(),
    model: v.string(),
    promptVersion: v.string(),
    inputHash: v.string(),
    output: v.string(),
    status: v.string(),
  })
    .index("by_company", ["companyId"])
    .index("by_report", ["reportId"])
    .index("by_purpose", ["companyId", "purpose"]),

  territoryInsights: defineTable({
    companyId: v.id("companies"),
    zip: v.string(),
    state: v.optional(v.string()),
    riskScore: v.number(),
    totalReports: v.number(),
    totalLeads: v.number(),
    conversionRate: v.number(),
    topContaminants: v.string(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_zip", ["companyId", "zip"])
    .index("by_risk", ["companyId", "riskScore"]),

  customDomains: defineTable({
    companyId: v.id("companies"),
    domain: v.string(),
    status: v.string(),
    verificationToken: v.string(),
    verifiedAt: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_domain", ["domain"]),

  demoSessions: defineTable({
    companyId: v.id("companies"),
    reportId: v.optional(v.id("reports")),
    leadId: v.optional(v.id("leads")),
    userId: v.optional(v.id("users")),
    outcome: v.string(),
    notes: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    customerName: v.optional(v.string()),
    waterScore: v.optional(v.number()),
    dealValue: v.optional(v.number()),
    equipmentRecommended: v.optional(v.string()), // JSON
    pricingSnapshot: v.optional(v.string()), // JSON - captures pricing state from demo
    // Demo Report fields
    selectedConcerns: v.optional(v.string()), // JSON array of concern keys
    liveReadings: v.optional(v.string()), // JSON { chlorine, ph, hardness, tds }
    verifiedScore: v.optional(v.number()),
    stepTimings: v.optional(v.string()), // JSON array of { stepKey, duration }
    monthlyExpenses: v.optional(v.number()),
    boostApplied: v.optional(v.boolean()),
    demoMode: v.optional(v.string()), // "quick" | "standard" | "full"
    // AI Sales Coach fields
    audioStorageId: v.optional(v.id("_storage")),
    audioMimeType: v.optional(v.string()),
    audioDurationSeconds: v.optional(v.number()),
    transcript: v.optional(v.string()), // full transcript text
    aiCoachReport: v.optional(v.string()), // JSON — structured coaching report
    aiCoachStatus: v.optional(v.string()), // "uploading" | "transcribing" | "analyzing" | "complete" | "error"
    aiCoachError: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_report", ["reportId"])
    .index("by_user", ["companyId", "userId"]),

  // ─── NEW: Deals / Pipeline ─────────────────────────────────────
  deals: defineTable({
    companyId: v.id("companies"),
    reportId: v.optional(v.id("reports")),
    demoSessionId: v.optional(v.id("demoSessions")),
    leadId: v.optional(v.id("leads")),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    stage: v.string(), // "new_lead" | "appointment_set" | "demo_completed" | "proposal_sent" | "negotiation" | "closed_won" | "closed_lost"
    assignedTo: v.optional(v.id("users")),
    dealValue: v.optional(v.number()),
    equipmentList: v.optional(v.string()), // JSON array
    lostReason: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    priority: v.optional(v.string()), // "hot" | "warm" | "cold"
    notes: v.optional(v.string()),
    source: v.optional(v.string()),
    stageHistory: v.optional(v.string()), // JSON array of {stage, timestamp, userId}
  })
    .index("by_company", ["companyId"])
    .index("by_stage", ["companyId", "stage"])
    .index("by_assigned", ["companyId", "assignedTo"])
    .index("by_report", ["reportId"]),

  // ─── NEW: Appointments / Scheduler ─────────────────────────────
  appointments: defineTable({
    companyId: v.id("companies"),
    dealId: v.optional(v.id("deals")),
    leadId: v.optional(v.id("leads")),
    reportId: v.optional(v.id("reports")),
    assignedTo: v.id("users"),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    customerCity: v.optional(v.string()),
    customerState: v.optional(v.string()),
    customerZip: v.optional(v.string()),
    scheduledAt: v.number(),
    durationMinutes: v.number(),
    type: v.string(), // "demo" | "follow_up" | "service" | "re_test" | "install"
    status: v.string(), // "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
    notes: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_assigned", ["companyId", "assignedTo"])
    .index("by_date", ["companyId", "scheduledAt"])
    .index("by_deal", ["dealId"]),

  // ─── NEW: Follow-up Sequences ──────────────────────────────────
  followUpSequences: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    trigger: v.string(), // "demo_follow_up" | "report_sent" | "proposal_sent" | "post_install" | "re_test" | "custom"
    isActive: v.boolean(),
    steps: v.string(), // JSON array of {delayDays, channel:"email"|"sms", subject, body, templateId}
    createdBy: v.id("users"),
  })
    .index("by_company", ["companyId"])
    .index("by_trigger", ["companyId", "trigger"]),

  followUpMessages: defineTable({
    companyId: v.id("companies"),
    sequenceId: v.optional(v.id("followUpSequences")),
    leadId: v.optional(v.id("leads")),
    dealId: v.optional(v.id("deals")),
    reportId: v.optional(v.id("reports")),
    recipientEmail: v.optional(v.string()),
    recipientPhone: v.optional(v.string()),
    channel: v.string(), // "email" | "sms"
    stepIndex: v.number(),
    status: v.string(), // "pending" | "sent" | "delivered" | "opened" | "clicked" | "replied" | "failed" | "cancelled"
    scheduledAt: v.number(),
    sentAt: v.optional(v.number()),
    openedAt: v.optional(v.number()),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_sequence", ["sequenceId"])
    .index("by_status", ["companyId", "status"])
    .index("by_scheduled", ["companyId", "scheduledAt"]),

  // ─── NEW: Proposals ────────────────────────────────────────────
  proposals: defineTable({
    companyId: v.id("companies"),
    dealId: v.optional(v.id("deals")),
    leadId: v.optional(v.id("leads")),
    reportId: v.optional(v.id("reports")),
    demoSessionId: v.optional(v.id("demoSessions")),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    equipment: v.string(), // JSON array of {name, description, price}
    totalPrice: v.number(),
    discounts: v.optional(v.string()), // JSON
    monthlyPayment: v.optional(v.number()),
    waterScore: v.optional(v.number()),
    projectedScore: v.optional(v.number()),
    contaminantSummary: v.optional(v.string()),
    status: v.string(), // "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired"
    sentAt: v.optional(v.number()),
    viewedAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),
    shareToken: v.optional(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_company", ["companyId"])
    .index("by_deal", ["dealId"])
    .index("by_shareToken", ["shareToken"])
    .index("by_status", ["companyId", "status"]),

  // ─── NEW: Contracts + E-Signatures ─────────────────────────────
  contracts: defineTable({
    companyId: v.id("companies"),
    proposalId: v.optional(v.id("proposals")),
    dealId: v.optional(v.id("deals")),
    leadId: v.optional(v.id("leads")),
    formType: v.optional(v.string()), // "customer_agreement" | "referral" | "service_request" | "water_test_booking"
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    equipment: v.string(), // JSON
    totalPrice: v.number(),
    monthlyPayment: v.optional(v.number()),
    paymentTerms: v.optional(v.string()),
    status: v.string(), // "draft" | "sent" | "viewed" | "signed" | "countersigned" | "completed"
    customerSignature: v.optional(v.string()), // base64 SVG
    customerSignedAt: v.optional(v.number()),
    dealerSignature: v.optional(v.string()),
    dealerSignedAt: v.optional(v.number()),
    shareToken: v.optional(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
    depositAmount: v.optional(v.number()),
    depositPaid: v.optional(v.boolean()),
    installDate: v.optional(v.number()),
    suggestedInstallDates: v.optional(v.array(v.number())),
    customerSelectedDate: v.optional(v.number()),
    installApproved: v.optional(v.boolean()),
    installApprovedBy: v.optional(v.id("users")),
    installApprovedAt: v.optional(v.number()),
    installStatus: v.optional(v.string()), // "pending_dates" | "dates_sent" | "customer_selected" | "approved" | "completed"
    installNotes: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_company", ["companyId"])
    .index("by_deal", ["dealId"])
    .index("by_lead", ["leadId"])
    .index("by_shareToken", ["shareToken"])
    .index("by_status", ["companyId", "status"]),

  // ─── NEW: Service Agreements ───────────────────────────────────
  serviceAgreements: defineTable({
    companyId: v.id("companies"),
    dealId: v.optional(v.id("deals")),
    leadId: v.optional(v.id("leads")),
    customerId: v.optional(v.string()), // customer identifier
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    equipmentInstalled: v.string(), // JSON array
    installDate: v.number(),
    monthlyFee: v.number(),
    status: v.string(), // "active" | "expiring" | "expired" | "cancelled"
    renewalDate: v.number(),
    lastServiceDate: v.optional(v.number()),
    nextServiceDate: v.optional(v.number()),
    serviceHistory: v.optional(v.string()), // JSON array
    filterSchedule: v.optional(v.string()), // JSON: {filterType, intervalMonths, lastChanged, nextChange}
    notes: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_status", ["companyId", "status"])
    .index("by_renewal", ["companyId", "renewalDate"]),

  // ─── NEW: Filter / Service Reminders ───────────────────────────
  serviceReminders: defineTable({
    companyId: v.id("companies"),
    agreementId: v.optional(v.id("serviceAgreements")),
    dealId: v.optional(v.id("deals")),
    leadId: v.optional(v.id("leads")),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    reminderType: v.string(), // "filter_change" | "annual_retest" | "service_visit" | "renewal"
    dueDate: v.number(),
    status: v.string(), // "pending" | "sent" | "completed" | "snoozed"
    sentAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_due", ["companyId", "dueDate"])
    .index("by_status", ["companyId", "status"]),

  // ─── NEW: Google Review Requests ───────────────────────────────
  reviewRequests: defineTable({
    companyId: v.id("companies"),
    dealId: v.optional(v.id("deals")),
    leadId: v.optional(v.id("leads")),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    status: v.string(), // "pending" | "sent" | "positive_review" | "negative_feedback" | "skipped"
    sentAt: v.optional(v.number()),
    rating: v.optional(v.number()),
    feedback: v.optional(v.string()),
    googleReviewUrl: v.optional(v.string()),
    delayDays: v.number(), // days after install to send
    scheduledAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_status", ["companyId", "status"])
    .index("by_scheduled", ["companyId", "scheduledAt"]),

  // ─── NEW: Testimonials ─────────────────────────────────────────
  testimonials: defineTable({
    companyId: v.id("companies"),
    customerName: v.string(),
    quote: v.string(),
    rating: v.optional(v.number()),
    source: v.string(), // "google" | "manual" | "collected"
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    approved: v.boolean(),
    featured: v.optional(v.boolean()),
  })
    .index("by_company", ["companyId"])
    .index("by_approved", ["companyId", "approved"]),

  // ─── NEW: Commissions ──────────────────────────────────────────
  commissions: defineTable({
    companyId: v.id("companies"),
    userId: v.id("users"),
    dealId: v.optional(v.id("deals")),
    leadId: v.optional(v.id("leads")),
    demoSessionId: v.optional(v.id("demoSessions")),
    dealValue: v.number(),
    commissionRate: v.number(), // percentage
    commissionAmount: v.number(),
    status: v.string(), // "pending" | "approved" | "paid"
    period: v.string(), // "2026-05" etc.
    paidAt: v.optional(v.number()),
    customerName: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_user", ["companyId", "userId"])
    .index("by_period", ["companyId", "period"])
    .index("by_status", ["companyId", "status"]),

  // ─── Sprint 4A: Spouse Review Links ─────────────────────────────
  spouseReviewLinks: defineTable({
    reportId: v.id("reports"),
    companyId: v.id("companies"),
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_token", ["token"])
    .index("by_report", ["reportId"]),

  // ─── NEW: Training Modules ─────────────────────────────────────
  trainingModules: defineTable({
    companyId: v.id("companies"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(), // "demo_skills" | "product_knowledge" | "objection_handling" | "scripts" | "onboarding"
    content: v.string(), // Rich text / markdown content
    videoUrl: v.optional(v.string()),
    order: v.number(),
    isRequired: v.optional(v.boolean()),
    createdBy: v.id("users"),
  })
    .index("by_company", ["companyId"])
    .index("by_category", ["companyId", "category"]),

  trainingProgress: defineTable({
    companyId: v.id("companies"),
    userId: v.id("users"),
    moduleId: v.id("trainingModules"),
    status: v.string(), // "not_started" | "in_progress" | "completed"
    completedAt: v.optional(v.number()),
    score: v.optional(v.number()),
  })
    .index("by_user", ["companyId", "userId"])
    .index("by_module", ["moduleId"]),

  // ─── NEW: Marketing Content ────────────────────────────────────
  marketingContent: defineTable({
    companyId: v.id("companies"),
    type: v.string(), // "social_post" | "door_hanger" | "mailer" | "leave_behind" | "email_template"
    title: v.string(),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    platform: v.optional(v.string()), // "facebook" | "instagram" | "twitter"
    status: v.string(), // "draft" | "ready" | "posted"
    scheduledAt: v.optional(v.number()),
    postedAt: v.optional(v.number()),
    zip: v.optional(v.string()),
    waterData: v.optional(v.string()), // JSON - local water quality data used
    createdBy: v.id("users"),
  })
    .index("by_company", ["companyId"])
    .index("by_type", ["companyId", "type"])
    .index("by_status", ["companyId", "status"]),

  // ─── NEW: Competitor Comparisons ───────────────────────────────
  competitorTemplates: defineTable({
    companyId: v.id("companies"),
    competitorName: v.string(),
    competitorType: v.string(), // "big_box" | "other_dealer" | "diy_filter" | "pitcher" | "ro_only"
    removesContaminants: v.optional(v.string()), // JSON array
    doesNotRemove: v.optional(v.string()), // JSON array
    priceRange: v.optional(v.string()),
    limitations: v.optional(v.string()), // JSON array of limitation strings
    createdBy: v.id("users"),
  })
    .index("by_company", ["companyId"]),

  // ─── NEW: Referral Rewards (expanding existing system) ─────────
  // ─── Tracking Events (Facebook / Attribution) ──────────────────
  trackingEvents: defineTable({
    companyId: v.id("companies"),
    eventName: v.string(), // "PageView" | "Lead" | "DemoStarted" | "DemoCompleted" | "DealClosed" | "Purchase" | custom
    eventCategory: v.string(), // "page_view" | "conversion" | "custom"
    sessionId: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    referrer: v.optional(v.string()),
    // PII fields — always SHA-256 hashed
    emailHash: v.optional(v.string()),
    phoneHash: v.optional(v.string()),
    // Facebook identifiers
    fbClickId: v.optional(v.string()), // _fbc cookie
    fbBrowserId: v.optional(v.string()), // _fbp cookie
    fbEventId: v.optional(v.string()), // dedup ID
    // Attribution
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    // Meta
    ipHash: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(v.string()), // JSON
  })
    .index("by_company", ["companyId"])
    .index("by_event", ["companyId", "eventName"])
    .index("by_session", ["companyId", "sessionId"])
    .index("by_fbEventId", ["fbEventId"]),

  // ─── Consent Records (Privacy / CCPA) ──────────────────────────
  consentRecords: defineTable({
    companyId: v.id("companies"),
    sessionId: v.string(),
    consentGiven: v.boolean(),
    consentScope: v.string(), // "tracking" | "marketing" | "all"
    ipHash: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_session", ["companyId", "sessionId"]),

  // ─── Audience Segments (Pro plan, schema only) ─────────────────
  audienceSegments: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    description: v.optional(v.string()),
    rules: v.string(), // JSON filter rules
    estimatedSize: v.optional(v.number()),
    lastCalculatedAt: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("by_company", ["companyId"]),

  audienceExports: defineTable({
    companyId: v.id("companies"),
    segmentId: v.id("audienceSegments"),
    destination: v.string(), // "facebook" | "csv"
    status: v.string(), // "pending" | "processing" | "completed" | "failed"
    recordCount: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_company", ["companyId"])
    .index("by_segment", ["segmentId"]),

  platformAdmins: defineTable({
    email: v.string(),
    addedBy: v.optional(v.string()), // userId of who added them
    addedAt: v.number(),
  }).index("by_email", ["email"]),

  // ─── Dealer Lead Capture (B2B marketing) ────────────────────────
  dealerLeads: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    companyName: v.optional(v.string()),
    companySize: v.optional(v.string()), // "solo" | "2-5" | "6-15" | "16-50" | "50+"
    message: v.optional(v.string()),
    status: v.string(), // "new" | "contacted" | "qualified" | "demo_scheduled" | "demo_completed" | "converted" | "lost"
    notes: v.optional(v.string()),
    // Tracking / attribution
    trackingLinkId: v.optional(v.id("trackingLinks")),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    referrer: v.optional(v.string()),
    landingPage: v.optional(v.string()),
    // Lifecycle
    contactedAt: v.optional(v.number()),
    demoScheduledAt: v.optional(v.number()),
    convertedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"])
    .index("by_trackingLink", ["trackingLinkId"]),

  trackingLinks: defineTable({
    name: v.string(), // e.g. "Facebook - Water Dealers - May 2026"
    slug: v.string(), // unique slug for URL: /book-demo/fb-may26
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    isActive: v.boolean(),
    clickCount: v.number(),
    leadCount: v.number(),
    createdAt: v.number(),
    createdBy: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

  referralRewards: defineTable({
    companyId: v.id("companies"),
    referrerName: v.string(),
    referrerEmail: v.optional(v.string()),
    referrerPhone: v.optional(v.string()),
    referredName: v.optional(v.string()),
    referralCode: v.string(),
    rewardType: v.string(), // "service_credit" | "cash" | "discount"
    rewardAmount: v.number(),
    status: v.string(), // "pending" | "earned" | "redeemed" | "expired"
    earnedAt: v.optional(v.number()),
    redeemedAt: v.optional(v.number()),
    dealId: v.optional(v.id("deals")),
  })
    .index("by_company", ["companyId"])
    .index("by_code", ["referralCode"])
    .index("by_status", ["companyId", "status"]),
});

export default schema;
