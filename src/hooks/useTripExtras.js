import { useCallback } from "react";
import { getItineraryBudget, getExcludedRestaurants } from "../api/itineraryExtras";
import useTripResource from "./useTripResource";

export default function useTripExtras(tripId, revision, enabled) {
  const load = useCallback(async (options) => {
    // One failed endpoint must not hide the other endpoint's result.
    const [budget, excluded] = await Promise.allSettled([
      getItineraryBudget(tripId, options),
      getExcludedRestaurants(tripId, options),
    ]);
    return {
      budget: budget.status === "fulfilled" ? budget.value : null,
      budgetError: budget.status === "rejected" ? budget.reason.message : "",
      excluded: excluded.status === "fulfilled" ? excluded.value : null,
      excludedError: excluded.status === "rejected" ? excluded.reason.message : "",
    };
  }, [tripId]);

  const { data, loading, reload } = useTripResource(revision, load, enabled);
  return {
    budget: data?.budget ?? null,
    budgetError: data?.budgetError ?? "",
    excluded: data?.excluded ?? null,
    excludedError: data?.excludedError ?? "",
    loading,
    reload,
  };
}
