import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMembership } from "./security";

export const getAppointments = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    const { membership } = result;
    let appointments = await ctx.db
      .query("appointments")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .collect();
    if (args.startDate) appointments = appointments.filter((a) => a.scheduledAt >= args.startDate!);
    if (args.endDate) appointments = appointments.filter((a) => a.scheduledAt <= args.endDate!);
    if (membership.role === "sales_rep") {
      appointments = appointments.filter((a) => String(a.assignedTo) === String(membership.userId));
    }
    return appointments.sort((a, b) => a.scheduledAt - b.scheduledAt);
  },
});

export const getMyDayAppointments = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    const { membership } = result;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 86400000;
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_assigned", (q) =>
        q.eq("companyId", membership.companyId).eq("assignedTo", membership.userId)
      )
      .collect();
    return appointments
      .filter((a) => a.scheduledAt >= startOfDay && a.scheduledAt < endOfDay && a.status !== "cancelled")
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  },
});

export const createAppointment = mutation({
  args: {
    dealId: v.optional(v.id("deals")),
    leadId: v.optional(v.id("leads")),
    reportId: v.optional(v.id("reports")),
    assignedTo: v.optional(v.id("users")),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    customerCity: v.optional(v.string()),
    customerState: v.optional(v.string()),
    customerZip: v.optional(v.string()),
    scheduledAt: v.number(),
    durationMinutes: v.number(),
    type: v.string(),
    notes: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const { membership } = result;
    return await ctx.db.insert("appointments", {
      companyId: membership.companyId,
      ...args,
      assignedTo: args.assignedTo || membership.userId,
      status: "scheduled",
    });
  },
});

export const updateAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const appt = await ctx.db.get(args.appointmentId);
    if (!appt || appt.companyId !== result.membership.companyId) throw new Error("Not found");
    const { appointmentId, ...update } = args;
    const clean = Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined));
    if ((clean as any).status === "completed") (clean as any).completedAt = Date.now();
    await ctx.db.patch(appointmentId, clean);
  },
});

export const deleteAppointment = mutation({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const appt = await ctx.db.get(args.appointmentId);
    if (!appt || appt.companyId !== result.membership.companyId) throw new Error("Not found");
    await ctx.db.patch(args.appointmentId, { status: "cancelled" });
  },
});
