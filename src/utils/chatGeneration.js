// Only a fresh preference-chat response can request first-time generation.
// Readiness alone is not consent, and edit responses may already contain a new itinerary.
export function shouldGenerateFromChat(reply, tripStatus) {
  return reply?.userWantsGeneration === true && reply.mode !== 'EDIT' && reply.itinerary == null &&
    !['AWAITING_CONFIRMATION', 'GENERATED', 'EDITING'].includes(tripStatus);
}
