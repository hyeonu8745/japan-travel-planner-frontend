/** 메인 화면에서 입력한 여행 요청 (아직 여행이 만들어지기 전) */
export const TRIP_PROMPT_KEY = "tabimate.tripPrompt";

/** 여행이 만들어진 뒤, 그 여행 전용으로 옮겨둔 요청 */
export function tripPromptKey(tripId) {
  return `tabimate.tripPrompt.${tripId}`;
}
