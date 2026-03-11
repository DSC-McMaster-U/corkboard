export type PerfEntry = {
  screen: string;
  fetchMs: number;
  renderMs: number;
  totalMs: number;
  platform: string;
  timestamp: string;
};

export const perfLog: PerfEntry[] = [];

export function getPerfLog(): PerfEntry[] {
  return [...perfLog];
}

export function clearPerfLog(): void {
  perfLog.length = 0;
}

export function printPerfSummary(): void {
  if (perfLog.length === 0) {
    console.log('No performance entries recorded yet.');
    return;
  }

  console.log('\nPerformance Summary');
  console.log('---');
  perfLog.forEach(e => {
    console.log(`[${e.screen}] fetch: ${e.fetchMs}ms | render: ${e.renderMs}ms | total: ${e.totalMs}ms (${e.platform})`);
  });

  const avgFetch = Math.round(perfLog.reduce((s, e) => s + e.fetchMs, 0) / perfLog.length);
  const avgRender = Math.round(perfLog.reduce((s, e) => s + e.renderMs, 0) / perfLog.length);
  const avgTotal = Math.round(perfLog.reduce((s, e) => s + e.totalMs, 0) / perfLog.length);
  const slowest = perfLog.reduce((max, e) => (e.totalMs > max.totalMs ? e : max), perfLog[0]);

  console.log('---');
  console.log(`Averages → fetch: ${avgFetch}ms | render: ${avgRender}ms | total: ${avgTotal}ms`);
  console.log(`Slowest  → ${slowest.screen}: ${slowest.totalMs}ms`);
}
