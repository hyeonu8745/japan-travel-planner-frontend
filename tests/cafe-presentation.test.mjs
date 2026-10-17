import test from 'node:test';
import assert from 'node:assert/strict';
import { stopKindLabel, cafeBudgetText, cafeBudgetLabel } from '../src/utils/stopPresentation.js';
import { placeArtwork } from '../src/utils/placeArtwork.js';

test('cafe has a distinct break label and coffee artwork without changing existing types',()=>{
 assert.equal(stopKindLabel('CAFE'),'쉬는 시간 카페');
 assert.equal(stopKindLabel('DINNER'),'저녁');
 assert.equal(stopKindLabel('LUNCH'),'점심');
 assert.equal(stopKindLabel('ATTRACTION'),'관광지');
 assert.equal(placeArtwork({genreLabels:['케이크']},'CAFE'),'/assets/food-v2/coffee.png');
});
test('cafe reads the server-selected restaurant.budget and formats an upper-only amount',()=>{
 const stop={type:'CAFE',restaurant:{budget:'～￥999'}};
 assert.equal(cafeBudgetText(stop.restaurant),'~999엔');
 assert.equal(cafeBudgetLabel(stop.restaurant),'1인 ~999엔');
 assert.equal(cafeBudgetLabel({budget:'～￥999',budgetLunch:'￥2,000～￥2,999',budgetDinner:'￥3,000～￥3,999'}),'1인 ~999엔');
 assert.equal(cafeBudgetLabel({budget:'～￥1,999'}),'1인 ~1,999엔');
});
test('cafe keeps range text and missing budgets without inferring a minimum',()=>{
 const range='￥1,000～￥1,999';
 assert.equal(cafeBudgetText({budget:range}),range);
 assert.equal(cafeBudgetLabel({budget:range}),`1인 ${range}`);
 for(const budget of [null,undefined,'','-',' — ','－']) {
  assert.equal(cafeBudgetText({budget}),'예산 정보 없음');
  assert.equal(cafeBudgetLabel({budget}),'예산 정보 없음');
 }
 assert.equal(cafeBudgetText({budget:null,budgetLunch:'￥999'}),'예산 정보 없음');
});
