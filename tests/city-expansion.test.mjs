import test from 'node:test';
import assert from 'node:assert/strict';
import { changeRegion, changeBaseCity, toggleDayTrip, validateDestination, shortTrip, isDayTrip, dayTripLabel } from '../src/utils/regionSelection.js';
import { tripFormValues, requiresRegeneration } from '../src/utils/tripEditing.js';
import { travelMapsUrl, stationName } from '../src/utils/travelPresentation.js';
import { buildMapDay } from '../src/utils/itineraryMapData.js';
import { mealStop } from '../src/utils/budgetPresentation.js';
import { passRecommendation } from '../src/utils/transportBudget.js';

const trips=[{city:'KYOTO',label:'교토',toStation:'교토역'}];
const catalogue=[{code:'KANSAI',airports:[{code:'KIX'}],cities:[{code:'OSAKA',dayTrips:trips},{code:'KYOTO',dayTrips:[]}]}];

test('destinations have no default region and restore response day-trip objects in order',()=>{
 assert.equal(tripFormValues().region,'');
 assert.deepEqual(tripFormValues({region:'KANSAI',baseCity:'OSAKA',dayTripCities:trips}).dayTripCities,['KYOTO']);
 const next=changeRegion({...tripFormValues(),arrivalAirport:'NRT',arrivalFlightTime:'12:00',dayTripCities:['KYOTO']},catalogue[0]);
 assert.equal(next.baseCity,'OSAKA');
 assert.equal(next.arrivalAirport,'');assert.equal(next.arrivalFlightTime,'');assert.deepEqual(next.dayTripCities,[]);
 assert.deepEqual(changeBaseCity({...next,dayTripCities:['KYOTO']},'KYOTO').dayTripCities,[]);
});
test('day trips preserve priorities, allow removing selections at the limit, and validate server choices',()=>{
 let values={...tripFormValues(),region:'KANSAI',baseCity:'OSAKA'};
 assert.doesNotThrow(()=>validateDestination(values,catalogue));
 assert.throws(()=>validateDestination({...values,arrivalAirport:'NRT'},catalogue),/권역의 공항/);
 assert.throws(()=>validateDestination({...values,dayTripCities:['SAPPORO']},catalogue),/갈 수 있는/);
 for(const code of ['A','B','C','D'])values=toggleDayTrip(values,code);
 assert.deepEqual(values.dayTripCities,['A','B','C']);
 values=toggleDayTrip(values,'B');values=toggleDayTrip(values,'D');
 assert.deepEqual(values.dayTripCities,['A','C','D']);
 assert.throws(()=>validateDestination({...values,region:''},catalogue),/권역을/);
});
test('city changes and ordered day-trip changes regenerate, and explicit empty arrays clear day trips',()=>{
 const before={...tripFormValues(),region:'KANSAI',baseCity:'OSAKA',dayTripCities:['KYOTO','NARA']};
 for(const change of [{region:'KANTO'},{baseCity:'KYOTO'},{dayTripCities:[]},{dayTripCities:['NARA','KYOTO']}]) assert.equal(requiresRegeneration(before,{...before,...change}),true);
 assert.equal(requiresRegeneration(before,{...before}),false);
 assert.deepEqual(tripFormValues({...before,dayTripCities:[]}).dayTripCities,[]);
 assert.equal(shortTrip('2026-12-01','2026-12-02'),true);
 assert.equal(shortTrip('2026-12-01','2026-12-03'),false);
});
test('day trips use transfers and server labels, and their maps do not draw a fake hotel-to-city segment',()=>{
 const day={dayNumber:2,transfers:[{kind:'DAY_TRIP_GO',label:'숙소 → 오사카역 → 교토역',position:'BEFORE'}],stops:[{type:'ATTRACTION',order:1,name:'명소',lat:35,lng:135,travel:{mode:'TRANSIT',minutes:10,mapsUrl:'https://www.google.com/maps/dir/?origin=station'}}]};
 assert.equal(isDayTrip(day),true);assert.equal(dayTripLabel(day,trips),'교토 당일치기');
 const map=buildMapDay({name:'숙소',lat:34,lng:135},day);
 assert.equal(map.segments.length,0);
 assert.equal(map.points.length,1);
 assert.equal(map.points[0].directionsUrl,day.stops[0].travel.mapsUrl);
 assert.equal(isDayTrip({}),false);
});
test('server directions override a computed origin, explicit null stays absent, and legacy links work',()=>{
 const from={lat:34,lng:135},to={lat:35,lng:135};
 assert.equal(travelMapsUrl({mode:'TRANSIT',mapsUrl:'https://www.google.com/maps/dir/?origin=station'},from,to),'https://www.google.com/maps/dir/?origin=station');
 assert.equal(travelMapsUrl({mode:'TRANSIT',mapsUrl:null},from,to),null);
 assert.equal(travelMapsUrl({mode:'TRANSIT',mapsUrl:'javascript:alert(1)'},from,to),null);
 assert.match(travelMapsUrl({mode:'WALK'},from,to),/travelmode=walking/);
 assert.equal(stationName('博多','하카타'),'하카타(博多)');assert.equal(stationName('大濠公園',null),'大濠公園');
});
test('estimated meals never link to a real dinner and named passes retain older unnamed formatting',()=>{
 const itinerary={days:[{dayNumber:2,stops:[{type:'DINNER',name:'식당',order:3}]}]};
 assert.equal(mealStop(itinerary,2,{type:'DINNER',name:'오사카에서 저녁 (예상)',estimated:true}),null);
 assert.equal(passRecommendation({fromDay:1,toDay:1,hours:24,name:'엔조이 에코 카드'},0),'1일차 엔조이 에코 카드 · 1일 추천');
 assert.equal(passRecommendation({fromDay:1,toDay:3,hours:72},200),'1~3일차 72시간권 추천 · 200엔 절약');
});
