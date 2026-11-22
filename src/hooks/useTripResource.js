import { useEffect, useMemo, useState } from "react";

// Query identity hides results from earlier trips/revisions before their cleanup runs.
export default function useTripResource(key, load, enabled) {
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const request = useMemo(() => ({ key, load, enabled, retry }), [key, load, enabled, retry]);

  useEffect(() => {
    if (!request.enabled) return undefined;
    const controller = new AbortController();

    // StrictMode discards its first effect before this microtask starts a request.
    Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      try {
        const data = await request.load({ signal: controller.signal });
        if (!controller.signal.aborted) setResult({ request, data, error: "" });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ request, data: null, error: error.message });
      }
    });

    return () => controller.abort();
  }, [request]);

  const current = request.enabled && result?.request === request;
  return {
    data: current ? result.data : null,
    error: current ? result.error : "",
    loading: request.enabled && !current,
    reload: () => setRetry((value) => value + 1),
  };
}
