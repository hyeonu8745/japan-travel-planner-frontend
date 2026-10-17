import test from 'node:test';
import assert from 'node:assert/strict';
import { flightRequestFields, dayTransfers, normalizeFlightTime } from '../src/utils/airportTransfers.js';
import { tripFormValues, requiresRegeneration } from '../src/utils/tripEditing.js';

test('flight inputs restore server times, allow airport without time, and explicitly clear saved flights', () => {
  assert.equal(tripFormValues({arrivalAirport:'HND',arrivalFlightTime:'10:30:00'}).arrivalFlightTime,'10:30');
  assert.deepEqual(flightRequestFields(tripFormValues()),{arrivalAirport:null,arrivalFlightTime:null,departureAirport:null,departureFlightTime:null});
  assert.deepEqual(flightRequestFields({arrivalAirport:'NRT',departureAirport:'HND',departureFlightTime:'19:25'}),{arrivalAirport:'NRT',arrivalFlightTime:null,departureAirport:'HND',departureFlightTime:'19:25'});
  for (const direction of ['arrival','departure']) {
    assert.throws(()=>flightRequestFields({[`${direction}FlightTime`]:'10:30'}),/공항도 함께/);
    assert.throws(()=>flightRequestFields({[`${direction}Airport`]:'KIX'}),/나리타 또는 하네다/);
    assert.throws(()=>flightRequestFields({[`${direction}Airport`]:'NRT',[`${direction}FlightTime`]:'25:00'}),/HH:mm/);
  }
});
test('adding, changing, and removing each airport condition requests regeneration; legacy empty fields do not', () => {
  const base = tripFormValues({});
  assert.equal(requiresRegeneration({},base),false);
  assert.equal(requiresRegeneration(base,{...base,arrivalAirport:null,arrivalFlightTime:null}),false);
  for (const [field,value] of Object.entries({arrivalAirport:'NRT',arrivalFlightTime:'10:30',departureAirport:'HND',departureFlightTime:'19:00'})) {
    assert.equal(requiresRegeneration(base,{...base,[field]:value}),true);
    assert.equal(requiresRegeneration({...base,[field]:value},base),true);
  }
  assert.equal(requiresRegeneration({...base,arrivalFlightTime:'10:30:00'},{...base,arrivalFlightTime:'10:30'}),false);
});
test('transfer rows retain server order, exact labels, and both sides on a single day; missing or empty fields render none', () => {
  const before = [{time:'10:30',kind:'FLIGHT_ARRIVAL',label:'ハネダ到着',position:'BEFORE'},{time:'11:30',kind:'AIRPORT_TO_HOTEL',label:'하네다 공항 → 숙소 (입국·짐 찾기 후, 대중교통 약 45분)',position:'BEFORE'},{time:'12:15',kind:'HOTEL_DROP',label:'숙소에 짐 맡기기',position:'BEFORE'}];
  const after = [{time:'17:00',kind:'HOTEL_PICKUP',label:'숙소에서 짐 찾기',position:'AFTER'},{time:'17:20',kind:'HOTEL_TO_AIRPORT',label:'숙소 → 공항 (약 45분)',position:'AFTER'},{time:'20:00',kind:'FLIGHT_DEPARTURE',label:'비행기 출발',position:'AFTER'}];
  const day = {transfers:[...before,...after]};
  assert.deepEqual(dayTransfers(day,'BEFORE'),before);assert.deepEqual(dayTransfers(day,'AFTER'),after);
  assert.deepEqual(dayTransfers({},'BEFORE'),[]);assert.deepEqual(dayTransfers({transfers:[]},'AFTER'),[]);
});

test('typed flight times normalize without accepting invalid or incomplete times', () => {
  for (const [typed,expected] of [['0930','09:30'],['930','09:30'],['9:30','09:30'],['00:00','00:00'],['2359','23:59'],['',''],['09:','09:']]) {
    assert.equal(normalizeFlightTime(typed),expected);
  }
  assert.equal(flightRequestFields({arrivalAirport:'HND',arrivalFlightTime:'930'}).arrivalFlightTime,'09:30');
  for (const invalid of ['09:','24:00','2360','9:3','abcd']) assert.throws(()=>flightRequestFields({arrivalAirport:'HND',arrivalFlightTime:invalid}),/HH:mm/);
});
