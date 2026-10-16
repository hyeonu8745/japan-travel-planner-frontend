import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { forecastRainProbability, temperature, weatherForDay, canApplyRainPlan } from '../src/utils/weatherPresentation.js';

test('historical weather is never presented with a forecast probability; zero and unknown temperatures differ',()=>{
  assert.equal(forecastRainProbability({source:'FORECAST',rainProbability:0}),'강수 0%');
  assert.equal(forecastRainProbability({source:'LAST_YEAR',rainProbability:80}),null);
  assert.equal(forecastRainProbability({source:'FORECAST',rainProbability:null}),null);
  assert.equal(temperature(0),'0°');assert.equal(temperature(null),'—');
  const weather={days:[{dayNumber:1,date:'2026-11-01'}]};
  assert.equal(weatherForDay(weather,{dayNumber:1,date:'2026-12-01'}),undefined);
});
test('unchanged or unversioned rain previews cannot be applied',()=>{
  assert.equal(canApplyRainPlan({changed:false,version:8}),false);
  assert.equal(canApplyRainPlan({changed:true}),false);
  assert.equal(canApplyRainPlan({changed:true,version:8}),true);
});
test('weather/rain APIs authenticate, preview without mutation, and apply the preview version while preserving conflicts',async()=>{
  const text=await readFile(new URL('../src/api/client.js',import.meta.url),'utf8');
  const client=text.replace('import { clearAuth, getToken } from "../auth/token";','const getToken=()=>"fixture-token";const clearAuth=()=>{};').replace('import.meta.env.VITE_API_BASE_URL','"https://fixture.invalid"');
  const clientUrl=`data:text/javascript;base64,${Buffer.from(client).toString('base64')}`;
  const source=(await readFile(new URL('../src/api/weather.js',import.meta.url),'utf8')).replace("'./client'",JSON.stringify(clientUrl));
  const api=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const originalFetch=globalThis.fetch;const calls=[];
  try{
    globalThis.fetch=async(url,options)=>{calls.push({url,...options});return new Response('{}');};
    await api.getTripWeather(9);await api.getRainPlan(9,2);await api.applyRainPlan(9,2,17);
    assert.deepEqual(calls.map(call=>[call.url,call.method]),[['https://fixture.invalid/api/trips/9/weather','GET'],['https://fixture.invalid/api/trips/9/itinerary/days/2/rain-plan','GET'],['https://fixture.invalid/api/trips/9/itinerary/days/2/rain-plan','POST']]);
    assert.equal(calls[1].cache,'no-store');assert.equal(calls[1].body,undefined);
    assert.deepEqual(JSON.parse(calls[2].body),{version:17});assert.equal(calls[2].headers.Authorization,'Bearer fixture-token');
    for(const status of [400,409]){globalThis.fetch=async()=>new Response(JSON.stringify({message:'일정이 바뀌었어요.'}),{status});await assert.rejects(api.applyRainPlan(9,2,17),error=>error.status===status&&error.message==='일정이 바뀌었어요.');}
  }finally{globalThis.fetch=originalFetch;}
});
