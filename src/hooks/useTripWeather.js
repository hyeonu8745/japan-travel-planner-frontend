import { useEffect, useState } from 'react';
import { getTripWeather } from '../api/weather';

export default function useTripWeather(tripId, dates, enabled) {
  const [result,setResult] = useState(null), [retry,setRetry] = useState(0);
  const key = `${tripId}:${dates}:${enabled}:${retry}`;
  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      try {
        const data = await getTripWeather(tripId,{signal:controller.signal});
        if (!controller.signal.aborted) setResult({key,data,error:''});
      } catch (error) { if (!controller.signal.aborted) setResult({key,data:null,error:error.message}); }
    });
    return () => controller.abort();
  },[tripId,key,enabled]);
  return {...(result?.key === key ? result : {data:null,error:''}),loading:enabled && result?.key !== key,reload:()=>setRetry(value=>value+1)};
}
