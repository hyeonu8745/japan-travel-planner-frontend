import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { weatherArtwork } from '../src/utils/weatherPresentation.js';

test('every weather condition resolves to a deployed WebP background, including neutral fallback',async()=>{
  const conditions=['SUNNY','PARTLY_CLOUDY','CLOUDY','FOG','DRIZZLE','RAIN','SNOW','THUNDER','UNKNOWN'];
  const names=conditions.map(weatherArtwork);assert.equal(new Set(names).size,9);
  for(const name of names){const bytes=await readFile(new URL(`../public/assets/weather-v1/${name}.webp`,import.meta.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}
  assert.equal(weatherArtwork(undefined),'unknown');assert.equal(weatherArtwork('FUTURE_CONDITION'),'unknown');
});
