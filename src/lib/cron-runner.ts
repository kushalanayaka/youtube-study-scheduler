import { processDueReminders } from "./cron";

const globalForCron = globalThis as unknown as {
  cronRunnerStarted: boolean | undefined;
  cronIsRunning: boolean | undefined;
};

export function startBackgroundCronRunner() {
  if (globalForCron.cronRunnerStarted) return;
  globalForCron.cronRunnerStarted = true;

  console.log("[Background Cron Worker] Starting 10-second study task reminder scheduler...");

  const executeTick = async () => {
    if (globalForCron.cronIsRunning) return;
    globalForCron.cronIsRunning = true;
    try {
      const result = await processDueReminders();
      if (result.processed > 0) {
        console.log(`[Background Cron Worker] Processed ${result.processed} reminders (${result.successes} succeeded, ${result.failures} failed)`);
      }
    } catch (err) {
      console.error("[Background Cron Worker Error]:", err);
    } finally {
      globalForCron.cronIsRunning = false;
    }
  };

  setTimeout(executeTick, 2000);
  setInterval(executeTick, 10000);
}
