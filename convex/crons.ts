import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "check stuck notebook generations",
  { minutes: 2 },
  internal.retryGeneration.checkStuckSessions,
);

export default crons;
