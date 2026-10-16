import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldGenerateFromChat } from '../src/utils/chatGeneration.js';

test('server-confirmed generation intent starts generation without a special button or local phrase matching', () => {
  assert.equal(shouldGenerateFromChat({mode:'PREFERENCE',userWantsGeneration:true},'READY_TO_GENERATE'),true);
  assert.equal(shouldGenerateFromChat({userWantsGeneration:true},'GATHERING'),true);
  assert.equal(shouldGenerateFromChat({readyToGenerate:true,userWantsGeneration:false},'READY_TO_GENERATE'),false);
  assert.equal(shouldGenerateFromChat({readyToGenerate:true},'READY_TO_GENERATE'),false);
});
test('editing, confirmed trips and responses already carrying an itinerary never trigger an additional paid generation', () => {
  assert.equal(shouldGenerateFromChat({mode:'EDIT',userWantsGeneration:true},'READY_TO_GENERATE'),false);
  assert.equal(shouldGenerateFromChat({mode:'PREFERENCE',userWantsGeneration:true,itinerary:{version:2}},'READY_TO_GENERATE'),false);
  for (const status of ['AWAITING_CONFIRMATION','GENERATED','EDITING']) assert.equal(shouldGenerateFromChat({mode:'PREFERENCE',userWantsGeneration:true},status),false);
});
