# 2026-10-12 프론트 연동과 확인 순서

## 반영 내용

- AWAITING_CONFIRMATION을 일정이 있는 상태로 취급한다. 생성 성공은 확인 대기이며, 완성 API 응답 뒤에만 확정 상태를 사용한다.
- 확인 대기 중 채팅·버튼 수정·복원은 대기 상태를 유지한다. 완성 후 수정은 EDITING, AI 재생성은 다시 확인 대기다.
- 여행 목록에서도 확인 대기는 계획 중으로 분류한다. 새로고침 시 서버 여행 상태와 일정을 조회해 복원한다.
- 생성 요청 대기 중에는 진행률 100%나 완료 표시를 사용하지 않는다.
- 식비는 일정표와 별도의 [식비] 탭에서 보여준다. 일행 전체와 1인을 구분하고, 날짜 합계는 일행 전체, 끼니 budgetText는 1인으로 표시한다. 서버 note와 아침 제외 안내, 예산 미상 식당 수, 환율 기준을 표시한다.
- 일정 수정·교체·복원·조건 변경·확정 후 식비와 제외 목록을 다시 조회한다. 과거 버전에는 최신 식비를 섞어 표시하지 않는다.
- 주의 리뷰가 있는 현재 식당의 상세 화면에서 기존 후보·교체 흐름으로 들어간다. 제외 식당 목록과 다시 추천 허용을 연결했다.
- 포스터 생성은 사용자의 버튼 클릭으로만 요청한다. 5초 간격으로 상태를 조회하고, DONE인 장부터 표시하며 DONE/FAILED에서 중단한다. 조회 오류 시 자동 반복하지 않고 상태 다시 확인을 제공한다.
- 인증 헤더로 이미지를 blob으로 받아 표시하고 같은 object URL로 저장한다. 페이지를 떠나거나 이미지가 교체되면 URL을 해제한다.
- 별도 인쇄 프레임에 장을 순서대로 넣고 A4 세로, 여백 0, object-fit contain, 페이지 나눔을 사용한다. 인쇄 종료 후 프레임을 제거한다.
- stale 안내, AI 이미지 주의 문구, remainingToday를 표시한다. 최신 포스터가 없는 404에서는 남은 횟수를 임의로 3회라고 표시하지 않는다.
- 에러의 message는 서버 원문을 표시한다. 401은 기존 로그인 이동을 유지하며 서버 문구가 있으면 그대로 사용한다.

## 화면에서 확인할 순서

1. 새 일정을 생성한다. 요청 중에는 생성 중, 응답 뒤에는 일정이 준비됐어요와 완성 버튼이 보여야 한다.
2. 완성을 누르기 전에 채팅 수정과 버튼 교체를 해 본다. 일정과 지도는 바뀌고 완성 버튼은 남아 있어야 한다. 새로고침해도 같은 확인 대기 화면이어야 한다.
3. 완성을 누른다. 응답 뒤에만 버튼이 사라지고 여행 상태가 일정 완성으로 바뀌어야 한다. 이미 확정한 여행에서 새로고침해도 버튼이 다시 나오지 않아야 한다. 다시 만들기를 하면 확인 대기로 돌아가야 한다.
4. 상단 [식비] 탭을 열어 총 예상 식비와 설정한 예산, 1인 비용을 확인한다. 인원, 판정 배지, 제외 항목 note, 아침 제외, 예산 미상 수, 100엔 기준 환율과 날짜·출처를 확인한다. 날짜별 펼치기에서 일행 전체와 끼니 1인 기준이 구분돼야 한다.
5. 주의 리뷰가 있는 식당에서 다른 식당으로 바꾸기를 누르고 후보로 교체한다. 다시 추천하지 않는 식당 목록에 이전 식당이 표시돼야 한다. 다시 추천을 누르면 목록에서 사라져야 하며 현재 일정은 그대로여야 한다.
6. 상단 포스터 만들기로 이동한다. 버튼 클릭 뒤 남은 횟수와 생성 상태를 확인한다. 첫 장이 완성되면 다른 장을 기다리는 동안에도 표시돼야 한다. 모든 장 완료 또는 실패 후 네트워크 조회가 멈춰야 한다.
7. PNG 저장과 PDF로 저장 / 인쇄를 확인한다. PDF에서는 한 장이 한 페이지에 잘리지 않고 들어가야 한다. 일정 변경 뒤 포스터 화면에 다시 들어가면 stale 안내가 보여야 한다. 일부 실패해도 완성된 장을 저장할 수 있어야 한다.

## 변경 파일

- src/api/client.js
- src/api/itineraryExtras.js
- src/hooks/useTripExtras.js
- src/pages/PlannerPage.jsx
- src/pages/PosterPage.jsx
- src/pages/TripsPage.jsx
- src/components/PosterArchive.jsx
- src/components/planner/BudgetSummary.jsx
- src/components/planner/ExcludedRestaurants.jsx
- src/components/planner/ChatPanel.jsx
- src/components/planner/DayTimeline.jsx
- src/components/planner/GeneratingOverlay.jsx
- src/components/planner/PlaceDetail.jsx
- src/components/planner/RestaurantDetails.jsx
- src/utils/tripStatus.js
- src/utils/budgetPresentation.js
- src/utils/posterPrint.js
- src/styles/api1012.css
- tests/api-10-12.test.mjs
- docs/frontend-api-2026-10-12.md

## 검증 기록

빌드·린트 및 로직 테스트 5개 통과. 실제 컴포넌트와 예시 HTTP 응답으로 확인 대기 중 채팅·버튼 수정, 완성 응답, 409 서버 문구, 식비 단위와 미상 표시, 추천 제외 해제, 인증 이미지, PNG 저장의 추가 요청 없음, DONE/FAILED 조회 종료와 일부 실패 장 보존을 확인했다. 인쇄는 페이지 정렬·이미지 로드 대기·여백·비율·인쇄 종료 정리를 테스트했다.

실제 백엔드 여행을 변경하거나 유료 이미지 생성 요청을 실행하지 않았다. 실제 API와 브라우저 PDF 출력은 위 순서로 최종 확인한다. 기존 지도·에셋과 개발 서버 HMR 설정은 유지했다.

테스트 실행: `node --test tests/api-10-12.test.mjs`


## 식비와 포스터 디자인 개선

식비 탭의 날짜별 식당에서 상세 버튼을 누르면 해당 날짜와 항목으로 이동한다. 여러 식사가 있어 항목을 특정할 수 없으면 임의의 식당으로 연결하지 않는다. 포스터에는 브랜드 헤더, 생성·인쇄 버튼, 장별 번호와 상태, 종이 형태의 이미지 프레임을 적용했다. API·인증·다운로드·인쇄 흐름은 유지했다.

추가 변경 파일: src/components/planner/BudgetPanel.jsx, src/styles/budgetPosterDesign.css, src/utils/budgetPresentation.js, src/components/planner/DayTimeline.jsx, src/pages/PlannerPage.jsx, src/pages/PosterPage.jsx, tests/budget-panel.test.mjs.
