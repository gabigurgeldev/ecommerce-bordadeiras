import { after } from "next/server";

/** Run async work after the response is sent (Next.js 15+). */
export function scheduleBackground(
  task: () => Promise<void>,
  label?: string,
): void {
  after(async () => {
    try {
      await task();
    } catch (err) {
      console.error(label ? `[${label}]` : "[background]", err);
    }
  });
}
