import { useCallback } from "react";
import { getTripWeather } from "../api/weather";
import useTripResource from "./useTripResource";

export default function useTripWeather(tripId, dates, enabled) {
  const load = useCallback((options) => getTripWeather(tripId, options), [tripId]);
  return useTripResource(dates, load, enabled);
}
