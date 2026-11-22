import test from 'node:test';
import assert from 'node:assert/strict';
import { transitGeometry, buildMapDay } from '../src/utils/itineraryMapData.js';
const route = {mode:'TRANSIT',route:{segments:[{line:'A',colour:'#123456',path:[{name:'역A',lat:35,lng:135},{name:'환승역',lat:35.1,lng:135.1}]},{line:'B',colour:null,path:[{name:'환승역',lat:35.1,lng:135.1},{name:'역B',lat:35.2,lng:135.2}]}]}};
test('경로의 정차역 좌표와 노선 색을 보존하고 null 색은 회색으로 표시한다',()=>{
 const legs=transitGeometry(route);assert.equal(legs.length,2);assert.equal(legs[0].color,'#123456');assert.equal(legs[1].color,'#788695');assert.deepEqual(legs[0].points[0],{lat:35,lng:135});
});
test('누락·잘못된 좌표는 기존 경로 표시로 돌아간다',()=>{
 assert.equal(transitGeometry({mode:'TRANSIT',route:null}),null);assert.equal(transitGeometry({mode:'TRANSIT',route:{segments:[{path:[{lat:0,lng:0},{lat:999,lng:0}]}]}}),null);
});
test('일정 지도 구간에 서버 경로와 길찾기 주소를 전달한다',()=>{
 const day={dayNumber:1,stops:[{id:3,order:1,name:'장소',type:'ATTRACTION',lat:35.3,lng:135.3,travel:{...route,mapsUrl:'https://www.google.com/maps/dir/?api=1'}}]};
 const result=buildMapDay({name:'호텔',lat:34.9,lng:134.9},day);assert.equal(result.segments[0].transitLegs.length,2);assert.equal(result.segments[0].directionsUrl,'https://www.google.com/maps/dir/?api=1');
});
