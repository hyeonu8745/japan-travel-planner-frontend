export const displayName = (place) => place?.nameKo || place?.name || "";
export const dayZonesLabel = (day) => day?.zonesLabel || day?.zoneLabel || "";
export function restaurantGenres(restaurant) {
  if (Array.isArray(restaurant?.genreLabels)) return restaurant.genreLabels.join(" · ");
  return (restaurant?.genre || "").split(",").map((label) => label.trim()).filter(Boolean).slice(0, 2).join(" · ");
}

export function confirmationReplies(reply) {
  if (!reply?.awaitingConfirmation) return [];
  const numbers = [...new Set([...String(reply.assistantMessage?.content || "").matchAll(/^\s*(\d+)[.)、]\s*\S/gm)].map((match) => match[1]))];
  return numbers.length > 1 ? [...numbers, "그대로"] : ["네", "그대로"];
}

export function retainedSelection(itinerary, selection) {
  return selection && itinerary?.days?.some((day) => day.dayNumber === selection.dayNumber && day.stops.some((stop) => stop.order === selection.order)) ? selection : null;
}
