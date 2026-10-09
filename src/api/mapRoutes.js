// Display-only paths. This cache lives only in one mounted map screen.
function routePath(points) {
  if (!Array.isArray(points) || points.length < 2) throw new Error("Missing path");
  return points.map((point) => {
    const lat = typeof point.lat === "function" ? point.lat() : point.lat;
    const lng = typeof point.lng === "function" ? point.lng() : point.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error("Invalid path");
    return { lat, lng };
  });
}

export function createRouteCache(loadRoute = async () => {
  const { Route } = await window.google.maps.importLibrary("routes");
  return Route;
}) {
  const requests = new Map();
  let libraryPromise;
  return {
    get(segment) {
      if (!["WALK", "DRIVE"].includes(segment.mode)) return Promise.resolve({ path: segment.path, failed: false });
      const [origin, destination] = segment.path;
      const key = JSON.stringify([segment.mode, origin.lat, origin.lng, destination.lat, destination.lng]);
      if (!requests.has(key)) {
        requests.set(key, (async () => {
          let timeout;
          try {
            const work = (async () => {
              libraryPromise ??= loadRoute();
              const Route = await libraryPromise;
              const response = await Route.computeRoutes({
                origin, destination, travelMode: segment.mode === "WALK" ? "WALKING" : "DRIVING",
                fields: ["path"], computeAlternativeRoutes: false,
              });
              return { path: routePath(response.routes?.[0]?.path), failed: false };
            })();
            return await Promise.race([work, new Promise((_, reject) => {
              timeout = setTimeout(() => reject(new Error("Route timeout")), 10000);
            })]);
          } catch {
            // Keep the failure for this screen; no automatic repeated paid calls.
            return { path: segment.path, failed: true };
          } finally { clearTimeout(timeout); }
        })());
      }
      return requests.get(key);
    },
  };
}
