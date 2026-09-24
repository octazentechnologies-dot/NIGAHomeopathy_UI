import { getTeleQueue } from "./realbackend_helper";

/** TEL-02.04 — default client poll interval for the tele waiting queue (SignalR not in S3). */
export const TELE_QUEUE_POLL_MS = 5000;

/**
 * Repeatedly GET /api/Tele/Queue until the returned stop() is called.
 * @param {(payload: any, error?: any) => void} onTick
 * @param {{ intervalMs?: number }} [options]
 * @returns {() => void} stop
 */
export function startTeleQueuePoll(onTick, options = {}) {
  const intervalMs = options.intervalMs > 0 ? options.intervalMs : TELE_QUEUE_POLL_MS;
  let stopped = false;
  let timer = null;

  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(run, intervalMs);
  };

  const run = async () => {
    if (stopped) return;
    try {
      const payload = await getTeleQueue();
      if (!stopped) onTick?.(payload, null);
    } catch (err) {
      if (!stopped) onTick?.(null, err);
    }
    schedule();
  };

  run();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
