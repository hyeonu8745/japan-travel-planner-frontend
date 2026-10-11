import test from "node:test";
import assert from "node:assert/strict";
import { displayName, dayZonesLabel, restaurantGenres, confirmationReplies, retainedSelection } from "../src/utils/itineraryPresentation.js";

test("한국어 이름을 우선하고 번역이 없는 후보는 원래 이름을 유지한다", () => {
  const place = { name: "丸五", nameKo: "마루고" };
  assert.equal(displayName(place), "마루고");
  assert.equal(place.name, "丸五");
  assert.equal(displayName({ name: "丸五", nameKo: null }), "丸五");
});
test("두 지역 이름을 표시하고 이전 일정도 열 수 있다", () => {
  assert.equal(dayZonesLabel({ zonesLabel: "아사쿠사·우에노 + 아키하바라·간다", zoneLabel: "아사쿠사·우에노" }), "아사쿠사·우에노 + 아키하바라·간다");
  assert.equal(dayZonesLabel({ zoneLabel: "신주쿠" }), "신주쿠");
});
test("한국어 장르와 빈 장르 배열을 서버 그대로 표시한다", () => {
  assert.equal(restaurantGenres({ genre: "寿司", genreLabels: ["스시", "해산물"] }), "스시 · 해산물");
  assert.equal(restaurantGenres({ genre: "寿司", genreLabels: [] }), "");
  assert.equal(restaurantGenres({ genre: "寿司,海鮮" }), "寿司 · 海鮮");
});
test("서버 확인 요청이 없으면 번호가 들어 있는 인사도 확인 버튼을 만들지 않는다", () => {
  assert.deepEqual(confirmationReplies({ awaitingConfirmation: false, assistantMessage: { content: "1. 음식\n2. 분위기" } }), []);
});
test("다중 후보는 실제 번호를 보내고 예산·휴일 안내는 변경하지 않는다", () => {
  const reply = { awaitingConfirmation: true, assistantMessage: { content: "1. 라멘 (예산 조금 넘음)\n2. 스시 (이 날 정기 휴일)\n3. 돈카츠\n번호로 골라 주세요." } };
  assert.deepEqual(confirmationReplies(reply), ["1", "2", "3", "그대로"]);
  assert.match(reply.assistantMessage.content, /이 날 정기 휴일/);
});
test("단일 후보 및 단순 확인은 네·그대로를 보낸다", () => {
  for (const content of ["1. 스시\n이렇게 바꿀까요?", "DAY2 저녁을 스시로 바꿀까요?"]) {
    assert.deepEqual(confirmationReplies({ awaitingConfirmation: true, assistantMessage: { content } }), ["네", "그대로"]);
  }
});
test("버전의 모든 stopId가 바뀌어도 같은 날짜·순서의 선택을 유지한다", () => {
  const selection = { dayNumber: 2, order: 3 };
  assert.equal(retainedSelection({ version: 14, days: [{ dayNumber: 2, stops: [{ id: 9903, order: 3 }] }] }, selection), selection);
  assert.equal(retainedSelection({ days: [{ dayNumber: 1, stops: [{ id: 9903, order: 3 }] }] }, selection), null);
  assert.equal(retainedSelection({ days: [{ dayNumber: 2, stops: [{ id: 9904, order: 2 }] }] }, selection), null);
});
