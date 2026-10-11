import test from 'node:test';
import assert from 'node:assert/strict';
import { foodArtworkKey, attractionArtworkKey, placeArtwork, dayHeaderArtwork } from '../src/utils/placeArtwork.js';
import { chatOptions, chatMessageTime } from '../src/utils/chatPresentation.js';

test('장르 순서대로 이미지를 선택하고 이름만으로 음식을 단정하지 않는다', () => {
  assert.equal(foodArtworkKey({ genreLabels:['장어덮밥','스시'] }), 'unadon');
  assert.equal(foodArtworkKey({ genreLabels:['츠케멘','라멘'] }), 'tsukemen');
  assert.equal(foodArtworkKey({ genreLabels:['해산물','스시'] }), 'sushi');
  assert.equal(foodArtworkKey({ name:'스시 건물', genreLabels:[] }), null);
  assert.equal(foodArtworkKey({ genre:'とんかつ' }), 'tonkatsu');
});
test('미지의 음식은 잘못된 음식 그림 대신 중립 식탁 그림을 쓴다', () => {
  assert.equal(placeArtwork({ genreLabels:['미분류 음식'] }, 'LUNCH'), '/assets/food-v2/dining.png');
  assert.equal(placeArtwork({ genreLabels:['퓨전 요리'] }, 'LUNCH'), '/assets/food-v2/creative.png');
  assert.equal(foodArtworkKey({ genreLabels:['채식 메뉴'] }), null);
});
test('사용자가 지적한 실제 두 장소는 체험 시설·공방 이미지로 구분한다', () => {
  assert.equal(attractionArtworkKey({ name:'Samurai Ninja Museum Asakusa Tokyo',labels:['놀이시설'] }), 'experience');
  assert.equal(attractionArtworkKey({ nameKo:'사무라이 닌자 뮤지엄 아사쿠사 도쿄',labels:['관광명소'] }), 'experience');
  assert.equal(attractionArtworkKey({ name:'Chopsticks Studio Asakusa',labels:['관광명소'] }), 'workshop');
});
test('museum이라는 단어와 역사유적이라는 분류만으로 건물 형태를 단정하지 않는다', () => {
  assert.equal(attractionArtworkKey({ name:'Some Museum',labels:['놀이시설'] }), 'amusement');
  assert.equal(attractionArtworkKey({ name:'기타 뮤지엄',labels:['관광명소'] }), 'landmark');
  assert.equal(attractionArtworkKey({ labels:['역사유적'] }), 'memorial');
});

test('스크린샷의 누락된 음식 두 종류를 일본어와 한국어 장르에서 찾는다', () => {
  assert.equal(foodArtworkKey({genreLabels:['양식','오므라이스']}),'omurice');
  assert.equal(foodArtworkKey({genreLabels:['오야코동']}),'oyakodon');
  assert.equal(foodArtworkKey({genre:'親子丼'}),'oyakodon');
});

test('넓은 분류만 오는 실제 장소와 피규어 전문점을 명확한 이름으로 연결한다', () => {
  assert.equal(attractionArtworkKey({name:'平将門塚',labels:['역사명소','관광명소','역사유적']}),'memorial');
  assert.equal(attractionArtworkKey({name:'外苑いちょう並木',labels:['관광명소','경승지','역사유적']}),'ginkgo');
  assert.equal(attractionArtworkKey({name:'あみあみ 秋葉原店',labels:['쇼핑']}),'figure-shop');
  assert.equal(attractionArtworkKey({nameKo:'코토부키야 아키하바라',labels:['관광명소']}),'figure-shop');
  assert.equal(attractionArtworkKey({labels:['쇼핑','피규어']}),'figure-shop');
  assert.equal(attractionArtworkKey({name:'일반 상점',labels:['쇼핑']}),'shopping');
  assert.equal(attractionArtworkKey({labels:['사찰','역사유적']}),'temple');
});
test('구체적인 관광지 종류를 우선하고 신사와 사찰은 서로 다르게 표시한다', () => {
  assert.equal(attractionArtworkKey({ labels:['박물관','몰입형 전시'] }), 'media-art');
  assert.equal(attractionArtworkKey({ labels:['신사','관광명소'] }), 'shrine');
  assert.equal(attractionArtworkKey({ labels:['사찰'] }), 'temple');
  assert.equal(attractionArtworkKey({ labels:['공원'] }), 'park');
});
test('기존 지역 enum으로 헤더를 골라 두 지역의 라벨 자체는 변경하지 않는다', () => {
  assert.equal(dayHeaderArtwork({ zone:'ASAKUSA_UENO',zones:['ASAKUSA_UENO','AKIHABARA_KANDA'] }), '/assets/regions-v2/asakusa-ueno.png');
  assert.equal(dayHeaderArtwork({ zone:'UNKNOWN',zones:['ODAIBA'] }), '/assets/regions-v2/odaiba.png');
  assert.equal(dayHeaderArtwork({ zone:'UNKNOWN' }), null);
});
test('서버 선택지의 예산·휴일 경고를 카드에 그대로 남긴다', () => {
  const content="후보예요.\n1. 스시 이시카와 (스시 · 타베로그 3.72 · 걸어서 4분 · 예산 조금 넘음)\n2. 라멘집 (라멘 · 이 날 정기 휴일)\n번호로 골라 주세요.";
  const options=chatOptions(content);
  assert.equal(options.length,2);
  assert.equal(options[0].number,'1');
  assert.deepEqual(options[0].genreLabels,['스시']);
  assert.match(options[0].detail,/예산 조금 넘음/);
  assert.match(options[1].detail,/이 날 정기 휴일/);
});
test('정형 정보가 없는 선택지와 여러 줄 대화를 훼손하지 않는다', () => {
  assert.deepEqual(chatOptions('1. 첫 번째 장소\n2. 두 번째 장소').map((o)=>o.name), ['첫 번째 장소','두 번째 장소']);
  assert.deepEqual(chatOptions('DAY2 항목을 바꿨어요.'), []);
  assert.equal(chatMessageTime('2026-10-11T13:45:00'), '13:45');
  assert.equal(chatMessageTime(null), '');
});
