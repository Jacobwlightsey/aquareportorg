import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Data retention: clean up old tracking events daily at 3 AM UTC
crons.daily(
  "cleanup tracking events",
  { hourUTC: 3, minuteUTC: 0 },
  internal.tracking.cleanupOldEvents,
);

// Data retention: clean up old consent records weekly (Sunday 4 AM UTC)
crons.weekly(
  "cleanup consent records",
  { dayOfWeek: "sunday", hourUTC: 4, minuteUTC: 0 },
  internal.consent.cleanupOldConsent,
);

export default crons;
