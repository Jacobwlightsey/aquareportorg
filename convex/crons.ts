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

// Follow-ups: process due messages every 15 minutes
crons.interval(
  "process follow-up messages",
  { minutes: 15 },
  internal.followUps.processDueFollowUps,
);

// Retention: process due service reminders every hour
crons.interval(
  "process service reminders",
  { hours: 1 },
  internal.retention.processDueReminders,
);

// Reviews: process due review requests every hour
crons.interval(
  "process review requests",
  { hours: 1 },
  internal.retention.processDueReviewRequests,
);

export default crons;
