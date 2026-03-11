import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { perfLog, PerfEntry } from '@/scripts/perf-utils';

export function usePerfTracker(
  screenName: string,
  isLoading: boolean = false,
  hasData: boolean = false
) {
  const mountTime = useRef(performance.now());
  const fetchDoneTime = useRef<number | null>(null);
  const recorded = useRef(false);

  useEffect(() => {
    if (!isLoading && fetchDoneTime.current === null) {
      fetchDoneTime.current = performance.now();
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && hasData && fetchDoneTime.current !== null && !recorded.current) {
      recorded.current = true;
      const now = performance.now();

      const entry: PerfEntry = {
        screen: screenName,
        fetchMs: Math.round(fetchDoneTime.current - mountTime.current),
        renderMs: Math.round(now - fetchDoneTime.current),
        totalMs: Math.round(now - mountTime.current),
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      };

      perfLog.push(entry);

      if (__DEV__) {
        console.log(
          `\n⏱ [${screenName}] fetch: ${entry.fetchMs}ms | render: ${entry.renderMs}ms | total: ${entry.totalMs}ms`
        );
      }
    }
  }, [isLoading, hasData]);
}
