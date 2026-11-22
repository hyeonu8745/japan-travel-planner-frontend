import { getRegions } from '../api/regions';
import useTripResource from './useTripResource';

export default function useRegions(enabled = true) {
  const result = useTripResource('regions', getRegions, enabled);
  return { ...result, regions: result.data ?? [] };
}
