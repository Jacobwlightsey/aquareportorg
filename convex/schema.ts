import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  companies: defineTable({
    name: v.string(),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    disclaimer: v.optional(v.string()),
    solutionProductName: v.optional(v.string()),
    solutionProductImage: v.optional(v.string()),
    solutionProductDescription: v.optional(v.string()),
    solutionProductBullets: v.optional(v.array(v.string())),
    // Additional solution products (array of {name, description, image, bullets})
    additionalProducts: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
      image: v.optional(v.string()),
      bullets: v.array(v.string()),
    }))),
    customDomain: v.optional(v.string()),
    brandMode: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    // Stripe
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePlan: v.optional(v.string()), // "starter" | "pro" | "enterprise"
    stripeStatus: v.optional(v.string()), // "active" | "past_due" | "canceled"
    stripePeriodEnd: v.optional(v.number()),
    reportLimitOverride: v.optional(v.number()),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_customDomain", ["customDomain"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),

  companyMembers: defineTable({
    companyId: v.id("companies"),
    userId: v.id("users"),
    role: v.string(), // "owner" | "admin" | "manager" | "sales_rep" | "viewer"
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    invitedBy: v.optional(v.id("users")),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),

  reports: defineTable({
    companyId: v.id("companies"),
    generatedBy: v.optional(v.id("users")),
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
    contaminants: v.string(), // JSON stringified array
    // Lead / customer info
    customerName: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    customerCity: v.optional(v.string()),
    customerState: v.optional(v.string()),
    customerZip: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    // Computed
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
    // Shareable link
    shareToken: v.optional(v.string()),
    // On-site test results (editable by dealer)
    testNotes: v.optional(v.string()),
    repName: v.optional(v.string()),
    repDate: v.optional(v.string()),
    repPhone: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_generatedBy", ["generatedBy"])
    .index("by_shareToken", ["shareToken"]),

  // Leads captured from customer-facing reports
  leads: defineTable({
    companyId: v.id("companies"),
    reportShareToken: v.optional(v.string()),
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    message: v.optional(v.string()),
    status: v.string(), // "new" | "contacted" | "closed"
    utilityCityState: v.optional(v.string()),
    source: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    lastSyncedAt: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_status", ["companyId", "status"]),

  enterpriseLeads: defineTable({
    name: v.string(),
    companyName: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.optional(v.string()),
    source: v.string(),
    status: v.string(), // "new" | "contacted" | "closed"
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
});

export default schema;
