import { useEffect, useState } from 'react';
import { getItineraryBudget, getExcludedRestaurants } from '../api/itineraryExtras';

export default function useTripExtras(tripId, revision, enabled) {
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const key = `${tripId}:${revision}:${retry}:${enabled}`;
  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      const responses = await Promise.allSettled([
        getItineraryBudget(tripId, { signal: controller.signal }),
        getExcludedRestaurants(tripId, { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      const [budget, excluded] = responses;
      setResult({ key, budget: budget.status === 'fulfilled' ? budget.value : null,
        budgetError: budget.status === 'rejected' ? budget.reason.message : '',
        excluded: excluded.status === 'fulfilled' ? excluded.value : null,
        excludedError: excluded.status === 'rejected' ? excluded.reason.message : '' });
    });
    return () => controller.abort();
  }, [tripId, enabled, key]);
  return { ...(result?.key === key ? result : { budget: null, excluded: null, budgetError: '', excludedError: '' }),
    loading: enabled && result?.key !== key, reload: () => setRetry((value) => value + 1) };
}
