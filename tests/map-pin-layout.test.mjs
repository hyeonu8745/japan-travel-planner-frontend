import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutMapPins, clusterMapPins, mapClusterLabel } from '../src/utils/mapPinLayout.js';

test('nearby stops group together without swallowing the hotel or distant pins', () => {
  assert.deepEqual(clusterMapPins([{x:0,y:0,clusterable:false},{x:1,y:1},{x:20,y:20},{x:200,y:200}]),[[0],[1,2],[3]]);
  assert.deepEqual(clusterMapPins([]),[]);
  assert.equal(mapClusterLabel([8,4,6,5,7]),'4–8');
  assert.equal(mapClusterLabel([4,8]),'4·8');
});

test('isolated markers keep their geographic display positions', () => {
  assert.deepEqual(layoutMapPins([{x:20,y:30},{x:150,y:30}]),[{dx:0,dy:0},{dx:0,dy:0}]);
});
test('eight crowded badges are separated while anchor coordinates remain unchanged', () => {
  const points=Array.from({length:8},(_,i)=>({x:200+i%2,y:100+i%3}));
  const snapshot=structuredClone(points), offsets=layoutMapPins(points);
  assert.deepEqual(points,snapshot);
  offsets.forEach((offset,i)=>{
    assert.ok(Math.hypot(offset.dx,offset.dy)<=140.01);
    for(let j=0;j<i;j++) assert.ok(Math.hypot(points[i].x+offset.dx-points[j].x-offsets[j].dx,points[i].y+offset.dy-points[j].y-offsets[j].dy)>=55.99);
  });
  assert.deepEqual(layoutMapPins(points),offsets);
});
test('empty maps and identical locations produce finite deterministic offsets', () => {
  assert.deepEqual(layoutMapPins([]),[]);
  const offsets=layoutMapPins(Array.from({length:9},()=>({x:0,y:0})));
  assert.ok(offsets.every(p=>Number.isFinite(p.dx)&&Number.isFinite(p.dy)));
  assert.equal(new Set(offsets.map(p=>`${p.dx}:${p.dy}`)).size,9);
});
