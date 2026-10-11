import test from 'node:test';
import assert from 'node:assert/strict';
import { ARTWORK_CATALOGUE } from '../src/utils/artworkCatalogue.js';
import { foodArtworkKey, attractionArtworkKey, placeArtwork, dayHeaderArtwork } from '../src/utils/placeArtwork.js';

test('every researched genre has a unique representative and all aliases resolve', () => {
  const ids = ARTWORK_CATALOGUE.map(x => `${x.kind}/${x.key}`);
  assert.equal(new Set(ids).size, ids.length);
  for (const x of ARTWORK_CATALOGUE) for (const alias of x.aliases) {
    const key = x.kind === 'food' ? foodArtworkKey({genreLabels:[alias]}) : attractionArtworkKey({labels:[alias]});
    assert.equal(key, x.key, `${x.kind}: ${alias}`);
  }
});
test('specific dishes win over broad cuisines without guessing from restaurant names', () => {
  assert.equal(foodArtworkKey({genreLabels:['양식','오므라이스']}),'omurice');
  assert.equal(foodArtworkKey({genreLabels:['일식','타코야키']}),'takoyaki');
  assert.equal(foodArtworkKey({genreLabels:['일식 / 타코야키']}),'takoyaki');
  assert.equal(foodArtworkKey({genre:'和食（その他）'}),'washoku');
  assert.equal(foodArtworkKey({genreLabels:['채식']}),'vegetarian');
  assert.equal(foodArtworkKey({genreLabels:['유기농']}),'organic');
  assert.equal(foodArtworkKey({genreLabels:['채식 메뉴']}),null);
  assert.equal(foodArtworkKey({genreLabels:[],genre:'とんかつ'}),'tonkatsu');
  assert.equal(foodArtworkKey({name:'스시 건물'}),null);
  assert.equal(foodArtworkKey({genreLabels:['일식']}),'washoku');
  assert.equal(placeArtwork({},'DINNER'),'/assets/food-v2/dining.png');
});
test('reported missing venues are connected without turning all museums into castle pictures', () => {
  assert.equal(attractionArtworkKey({name:'東京ジャーミイ・ディヤーナト トルコ文化センター',nameKo:'도쿄 자미이 디야네트 터키 문화센터',labels:['모스크','관광명소','문화센터']}),'mosque');
  assert.equal(attractionArtworkKey({labels:['관광명소','문화센터','모스크']}),'mosque');
  assert.equal(placeArtwork({genreLabels:['타코야키']},'DINNER'),'/assets/food-v2/takoyaki.png');
  assert.equal(attractionArtworkKey({name:'SOOTANG HOBBY OMOTESANDO（スータンホビー表参道）',labels:['관광명소']}),'figure-shop');
  assert.equal(attractionArtworkKey({nameKo:'수탕 하비 오모테산도'}),'figure-shop');
  assert.equal(attractionArtworkKey({name:'渋谷スクランブル交差点',labels:['관광명소','야경']}),'crossing');
  assert.equal(attractionArtworkKey({name:'Samurai Ninja Museum Asakusa Tokyo',labels:['놀이시설']}),'experience');
  assert.equal(attractionArtworkKey({name:'Chopsticks Studio Asakusa',labels:['관광명소']}),'workshop');
  assert.equal(attractionArtworkKey({labels:['쇼핑','피규어']}),'figure-shop');
  assert.equal(attractionArtworkKey({labels:['박물관','몰입형 전시']}),'media-art');
  assert.equal(placeArtwork({}),'/assets/attractions-v2/landmark.png');
  assert.equal(dayHeaderArtwork({zone:'ODAIBA'}),'/assets/regions-v2/odaiba.png');
});
