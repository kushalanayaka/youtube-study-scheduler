export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBackgroundCronRunner } = await import("@/lib/cron-runner");
    startBackgroundCronRunner();
  }
}
