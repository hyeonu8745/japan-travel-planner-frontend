export const DELETE_TRIP_MESSAGE = "이 여행을 삭제할까요?\n\n여행 조건, AI 대화, 파악된 취향,\n일정과 모든 변경 이력이 함께 삭제됩니다.\n\n삭제한 여행은 복구할 수 없습니다.";

export const REGENERATE_CONDITIONS_MESSAGE = "이 조건을 바꾸면 일정을 새로 만들어요.\n약 7초 정도 걸릴 수 있고,\n직접 바꾼 식당·관광지는 이전 버전에 남습니다.\n\n계속할까요?";

// Keep the update body identical to the creation form; never send response metadata.
export function tripFormValues(trip = {}) {
  return {
    startDate: trip.startDate ?? "",
    endDate: trip.endDate ?? "",
    travelers: trip.travelers ?? 1,
    budget: trip.budget ?? "",
    travelPace: trip.travelPace ?? "NORMAL",
    transportMode: trip.transportMode ?? "PUBLIC_TRANSIT",
    accommodationName: trip.accommodationName ?? "",
    accommodationAddress: trip.accommodationAddress ?? "",
    arrivalAirport: trip.arrivalAirport ?? "",
    arrivalFlightTime: trip.arrivalFlightTime?.slice(0, 5) ?? "",
    departureAirport: trip.departureAirport ?? "",
    departureFlightTime: trip.departureFlightTime?.slice(0, 5) ?? "",
    interests: trip.interests ?? [],
    allergies: trip.allergies ?? "",
    mobilityConstraints: trip.mobilityConstraints ?? "",
  };
}

export function requiresRegeneration(previous, next) {
  const before = tripFormValues(previous);
  const after = tripFormValues(next);
  return ["startDate", "endDate", "travelers", "budget", "travelPace", "allergies", "arrivalAirport", "arrivalFlightTime", "departureAirport", "departureFlightTime"]
    .some((field) => String(before[field]) !== String(after[field])) ||
    JSON.stringify([...before.interests].sort()) !== JSON.stringify([...next.interests].sort());
}
