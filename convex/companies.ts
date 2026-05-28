import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { audit, canRole, getMembership, normalizeRole, planUserLimit, requireRole } from "./security";

declare const process: { env: Record<string, string | undefined> };

const roleValidator = v.union(
  v.literal("owner"),
  v.literal("sales_rep")
);

function inviteToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

async function tokenHash(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const getMyCompany = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const memberships = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const membership = memberships
      .filter((entry) => entry.acceptedAt || entry.role === "owner")
      .sort((a, b) => {
        const rank: Record<string, number> = { viewer: 10, sales_rep: 20, manager: 30, admin: 40, owner: 50 };
        return (rank[normalizeRole(b.role)] ?? 0) - (rank[normalizeRole(a.role)] ?? 0);
      })[0];

    if (!membership) return null;
    const company = await ctx.db.get(membership.companyId);
    return company ? { ...company, role: normalizeRole(membership.role), featureAccess: membership.featureAccess } : null;
  },
});

export const createCompany = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    disclaimer: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) throw new Error("You already belong to a company");

    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      phone: args.phone,
      email: args.email,
      website: args.website,
      address: args.address,
      primaryColor: args.primaryColor || "#2563eb",
      disclaimer: args.disclaimer,
      country: args.country || "US",
      brandMode: "standard",
      createdBy: userId,
      stripePlan: "free",
      stripeStatus: "none",
    });

    const user = await ctx.db.get(userId);

    await ctx.db.insert("companyMembers", {
      companyId,
      userId,
      role: "owner",
      name: user?.name,
      email: user?.email,
      acceptedAt: Date.now(),
    });

    await audit(ctx, {
      companyId,
      actorId: userId,
      action: "company.created",
      entityType: "company",
      entityId: String(companyId),
    });

    if (user?.email) {
      await ctx.scheduler.runAfter(0, api.email.sendWelcomeEmail, {
        to: user.email,
        name: user.name,
        companyName: args.name,
      });
    }

    return companyId;
  },
});

export const updateCompany = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    disclaimer: v.optional(v.string()),
    solutionProductName: v.optional(v.string()),
    solutionProductImage: v.optional(v.string()),
    solutionProductDescription: v.optional(v.string()),
    solutionProductBullets: v.optional(v.array(v.string())),
    additionalProducts: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
      image: v.optional(v.string()),
      bullets: v.array(v.string()),
    }))),
    customDomain: v.optional(v.string()),
    brandMode: v.optional(v.string()),
    country: v.optional(v.string()),
    reportLimitOverride: v.optional(v.number()),
    customProposalUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "owner");

    const update: Record<string, unknown> = {};
    for (const key of Object.keys(args) as Array<keyof typeof args>) {
      if (args[key] !== undefined) update[key] = args[key];
    }

    await ctx.db.patch(membership.companyId, update);
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "company.updated",
      entityType: "company",
      entityId: String(membership.companyId),
      metadata: update,
    });
    return membership.companyId;
  },
});

export const getTeamMembers = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];

    const members = await ctx.db
      .query("companyMembers")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
    const company = await ctx.db.get(result.membership.companyId);
    const userLimit = planUserLimit(company);

    const acceptedMembers = await Promise.all(
      members.map(async (m) => {
        const reports = await ctx.db
          .query("reports")
          .withIndex("by_generatedBy", (q) => q.eq("generatedBy", m.userId))
          .collect();
        return {
          ...m,
          kind: "member",
          role: normalizeRole(m.role),
          reportCount: reports.length,
        };
      })
    );

    const invites = await ctx.db
      .query("companyInvites")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();

    const pendingInvites = invites
      .filter((invite) => !invite.acceptedAt && !invite.revokedAt && invite.expiresAt > Date.now())
      .map((invite) => ({
        _id: invite._id,
        kind: "invite",
        name: invite.email.split("@")[0],
        email: invite.email,
        role: normalizeRole(invite.role),
        reportCount: 0,
        invitedAt: invite._creationTime,
        expiresAt: invite.expiresAt,
      }));

    const roster = [...acceptedMembers, ...pendingInvites].sort((a, b) =>
      String(a.email || "").localeCompare(String(b.email || ""))
    );

    return roster.map((entry) => ({
      ...entry,
      teamLimit: Number.isFinite(userLimit) ? userLimit : null,
      teamUsed: roster.length,
    }));
  },
});

export const inviteTeamMember = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.string(),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "owner");
    if (!canRole(membership.role, "owner") && args.role === "owner") {
      throw new Error("Only owners can invite other owners");
    }

    const token = inviteToken();
    const hashed = await tokenHash(token);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const email = args.email.trim().toLowerCase();
    const existingMember = await ctx.db
      .query("companyMembers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existingMember && existingMember.companyId === membership.companyId && existingMember.acceptedAt) {
      throw new Error("That user is already a member of your company");
    }

    const existingInvite = await ctx.db
      .query("companyInvites")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const invite of existingInvite) {
      if (invite.companyId === membership.companyId && !invite.acceptedAt && !invite.revokedAt && invite.expiresAt > Date.now()) {
        throw new Error("That email already has a pending invite");
      }
    }

    const company: any = await ctx.db.get(membership.companyId);
    const userLimit = planUserLimit(company);
    if (Number.isFinite(userLimit)) {
      const members = await ctx.db
        .query("companyMembers")
        .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
        .collect();
      const pendingInvites = await ctx.db
        .query("companyInvites")
        .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
        .collect();
      const activeCount = members.filter((member) => member.acceptedAt || member.role === "owner").length;
      const pendingCount = pendingInvites.filter((invite) => !invite.acceptedAt && !invite.revokedAt && invite.expiresAt > Date.now()).length;
      if (activeCount + pendingCount >= userLimit) {
        throw new Error(`Team limit reached for your current plan (${userLimit} user${userLimit === 1 ? "" : "s"}). Upgrade to invite more users.`);
      }
    }

    const inviter: any = await ctx.db.get(userId);
    const inviteId = await ctx.db.insert("companyInvites", {
      companyId: membership.companyId,
      email,
      role: args.role,
      tokenHash: hashed,
      invitedBy: userId,
      expiresAt,
    });

    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "team.invited",
      entityType: "companyInvite",
      entityId: String(inviteId),
      metadata: { email, role: args.role },
    });

    const baseUrl = process.env.SITE_URL || "https://aquareport.org";
    await ctx.scheduler.runAfter(0, api.email.sendTeamInviteEmail, {
      to: email,
      inviterName: inviter?.name,
      companyName: company?.name || "your company",
      role: args.role,
      inviteUrl: `${baseUrl}/invite?token=${encodeURIComponent(token)}`,
    });

    return { inviteId, token, expiresAt };
  },
});

export const addTeamMember = inviteTeamMember;

export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const hashed = await tokenHash(args.token);
    const invite = await ctx.db
      .query("companyInvites")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", hashed))
      .first();
    if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt < Date.now()) {
      throw new Error("Invite is invalid or expired");
    }

    const user = await ctx.db.get(userId);
    if (user?.email && user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new Error("Please sign in with the email address this invite was sent to");
    }

    const existingMembership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existingMembership && existingMembership.companyId !== invite.companyId) {
      throw new Error("This account already belongs to another company");
    }
    if (existingMembership?.companyId === invite.companyId) {
      await ctx.db.patch(invite._id, { acceptedAt: Date.now() });
      return { companyId: invite.companyId, role: existingMembership.role };
    }

    const placeholder = await ctx.db
      .query("companyMembers")
      .withIndex("by_email", (q) => q.eq("email", invite.email))
      .first();

    if (placeholder && !placeholder.acceptedAt) {
      await ctx.db.patch(placeholder._id, {
        userId,
        name: user?.name || placeholder.name,
        acceptedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("companyMembers", {
        companyId: invite.companyId,
        userId,
        role: invite.role,
        name: user?.name,
        email: user?.email || invite.email,
        invitedBy: invite.invitedBy,
        acceptedAt: Date.now(),
        featureAccess: invite.role === "sales_rep" ? ["pipeline"] : ["all"],
      });
    }

    await ctx.db.patch(invite._id, { acceptedAt: Date.now() });
    await audit(ctx, {
      companyId: invite.companyId,
      actorId: userId,
      action: "team.invite_accepted",
      entityType: "companyInvite",
      entityId: String(invite._id),
    });

    return { companyId: invite.companyId, role: invite.role };
  },
});

export const revokeInvite = mutation({
  args: { inviteId: v.id("companyInvites") },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "owner");
    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.companyId !== membership.companyId) {
      throw new Error("Invite not found");
    }
    await ctx.db.patch(args.inviteId, { revokedAt: Date.now() });
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "team.invite_revoked",
      entityType: "companyInvite",
      entityId: String(args.inviteId),
      metadata: { email: invite.email, role: invite.role },
    });
  },
});

export const removeTeamMember = mutation({
  args: { memberId: v.id("companyMembers") },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "owner");

    const target = await ctx.db.get(args.memberId);
    if (!target || target.companyId !== membership.companyId) {
      throw new Error("Member not found");
    }
    if (target.userId === userId) throw new Error("Cannot remove yourself");
    if (normalizeRole(target.role) === "owner" && normalizeRole(membership.role) !== "owner") {
      throw new Error("Only owners can remove owners");
    }

    await ctx.db.delete(args.memberId);
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "team.removed",
      entityType: "companyMember",
      entityId: String(args.memberId),
      metadata: { email: target.email, role: target.role },
    });
  },
});

export const updateTeamMemberRole = mutation({
  args: {
    memberId: v.id("companyMembers"),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "owner");
    const target = await ctx.db.get(args.memberId);
    if (!target || target.companyId !== membership.companyId) {
      throw new Error("Member not found");
    }
    if (target.userId === userId) throw new Error("Cannot change your own role");
    if (normalizeRole(target.role) === "owner" && normalizeRole(membership.role) !== "owner") {
      throw new Error("Only owners can change owner roles");
    }
    if (args.role === "owner" && normalizeRole(membership.role) !== "owner") {
      throw new Error("Only owners can assign owner roles");
    }

    await ctx.db.patch(args.memberId, { role: args.role });
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "team.role_updated",
      entityType: "companyMember",
      entityId: String(args.memberId),
      metadata: { email: target.email, previousRole: target.role, role: args.role },
    });
  },
});

export const updateFeatureAccess = mutation({
  args: {
    memberId: v.id("companyMembers"),
    featureAccess: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "owner");
    const target = await ctx.db.get(args.memberId);
    if (!target || target.companyId !== membership.companyId) {
      throw new Error("Member not found");
    }
    // Ensure "pipeline" is always included
    const access = Array.from(new Set(["pipeline", ...args.featureAccess]));
    await ctx.db.patch(args.memberId, { featureAccess: access });
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "team.feature_access_updated",
      entityType: "companyMember",
      entityId: String(args.memberId),
      metadata: { email: target.email, featureAccess: access },
    });
  },
});

// ─── Image Upload (Convex File Storage) ──────────────────────────

/**
 * Generate a short-lived upload URL for company images (logo, product image).
 * Any authenticated company member can upload.
 */
export const generateCompanyUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "sales_rep"); // any member can upload
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save a company image (logo or product) from Convex storage.
 * Resolves the storage ID to a URL and saves both.
 */
export const saveCompanyImage = mutation({
  args: {
    field: v.union(v.literal("logo"), v.literal("productImage")),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "owner");
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Failed to resolve storage URL");

    const update: Record<string, unknown> = {};
    if (args.field === "logo") {
      update.logoUrl = url;
      update.logoStorageId = args.storageId;
    } else {
      update.solutionProductImage = url;
      update.productImageStorageId = args.storageId;
    }

    // Delete old storage if replacing
    const company = await ctx.db.get(membership.companyId);
    if (company) {
      const oldStorageId =
        args.field === "logo"
          ? (company.logoStorageId as string | undefined)
          : (company.productImageStorageId as string | undefined);
      if (oldStorageId && oldStorageId !== args.storageId) {
        try {
          await ctx.storage.delete(oldStorageId as any);
        } catch {
          // ignore if already deleted
        }
      }
    }

    await ctx.db.patch(membership.companyId, update);
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "company.image_uploaded",
      entityType: "company",
      entityId: String(membership.companyId),
      metadata: { field: args.field },
    });

    return url;
  },
});

/**
 * Remove a company image (logo or product) and delete from storage.
 */
export const removeCompanyImage = mutation({
  args: {
    field: v.union(v.literal("logo"), v.literal("productImage")),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "owner");
    const company = await ctx.db.get(membership.companyId);
    if (!company) throw new Error("Company not found");

    const update: Record<string, unknown> = {};
    if (args.field === "logo") {
      update.logoUrl = "";
      update.logoStorageId = undefined;
      if (company.logoStorageId) {
        try { await ctx.storage.delete(company.logoStorageId); } catch { /* ok */ }
      }
    } else {
      update.solutionProductImage = "";
      update.productImageStorageId = undefined;
      if (company.productImageStorageId) {
        try { await ctx.storage.delete(company.productImageStorageId); } catch { /* ok */ }
      }
    }

    await ctx.db.patch(membership.companyId, update);
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "company.image_removed",
      entityType: "company",
      entityId: String(membership.companyId),
      metadata: { field: args.field },
    });
  },
});

/**
 * Resolve a Convex storage ID to a URL. Used by frontend after uploading
 * an image to get the public URL for display/storage in config fields.
 */
export const resolveStorageUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "sales_rep");
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Storage file not found");
    return url;
  },
});
