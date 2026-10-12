export const HAS_ITINERARY = ['AWAITING_CONFIRMATION', 'GENERATED', 'EDITING'];
export const STATUS_LABELS = {
  CONDITIONS_SET: '조건 입력 완료', PREFERENCE_GATHERING: '취향 대화 중',
  READY_TO_GENERATE: '일정 생성 대기', AWAITING_CONFIRMATION: '일정 준비 · 완성 확인 대기',
  GENERATED: '일정 완성', EDITING: '일정 수정 중',
};
export const statusAfterEdit = (status) => status === 'AWAITING_CONFIRMATION' ? status : 'EDITING';
