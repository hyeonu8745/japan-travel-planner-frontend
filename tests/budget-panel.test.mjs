import test from 'node:test';
import assert from 'node:assert/strict';
import { mealStop } from '../src/utils/budgetPresentation.js';
test('meal details select the matching day and current stop instead of the meal list index',()=>{
 const day1={dayNumber:1,stops:[{order:3,type:'LUNCH',name:'店A'},{order:6,type:'DINNER',name:'店B'}]};
 const day2={dayNumber:2,stops:[{order:5,type:'LUNCH',name:'店A'}]};
 assert.equal(mealStop({days:[day1,day2]},2,{type:'LUNCH',name:'店A'}).order,5);
 assert.equal(mealStop({days:[day1]},1,{type:'DINNER',name:'店B'}).order,6);
});
test('ambiguous meals never open a guessed restaurant',()=>{
 const itinerary={days:[{dayNumber:1,stops:[{type:'LUNCH',name:'A'},{type:'LUNCH',name:'B'}]}]};
 assert.equal(mealStop(itinerary,1,{type:'LUNCH',name:'C'}),null);
 assert.equal(mealStop(itinerary,3,{type:'LUNCH',name:'A'}),null);
 assert.equal(mealStop(itinerary,1,{type:'LUNCH',name:'B'}).name,'B');
});
