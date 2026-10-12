import test from 'node:test';
import assert from 'node:assert/strict';
import { HAS_ITINERARY, statusAfterEdit } from '../src/utils/tripStatus.js';
import { exchangeRateText, krwRange } from '../src/utils/budgetPresentation.js';
import { printPosterPages } from '../src/utils/posterPrint.js';
import { readFile } from 'node:fs/promises';
test('pending confirmation stays editable but does not become confirmed on edit',()=>{
  assert.ok(HAS_ITINERARY.includes('AWAITING_CONFIRMATION'));
  assert.equal(statusAfterEdit('AWAITING_CONFIRMATION'),'AWAITING_CONFIRMATION');
  assert.equal(statusAfterEdit('GENERATED'),'EDITING');assert.equal(statusAfterEdit('EDITING'),'EDITING');
});
test('version rate uses 100 yen, preserves business date, and handles legacy fixed rate',()=>{
  assert.equal(exchangeRateText({krwPerYen:8.4542,date:'2026-10-12',sourceLabel:'한국수출입은행'}),'기준 환율 100엔 = 845원 (2026-10-12, 한국수출입은행)');
  assert.equal(exchangeRateText(null,9.5),'기준 환율 100엔 = 950원 (고정 환율)');
  assert.equal(exchangeRateText(null,null),null);
});
test('unknown prices are not presented as zero; total ranges keep units',()=>{
  assert.equal(krwRange(null,null),'확인 어려움');assert.equal(krwRange(190000,250000),'19만~25만 원');
  assert.equal(krwRange(3000,9000),'3,000~9,000 원');
});
test('print waits for loaded images, orders pages, uses zero margins and contain, and releases its frame',async()=>{
  const order=[], listeners={};let printed=0,removed=0,html='';
  const doc={open(){},close(){},write(value){html=value;},body:{append(sheet){order.push(sheet.children[0]);}},createElement(tag){
    if(tag==='img')return {set src(value){this.url=value;queueMicrotask(()=>this.onload());}};
    return {children:[],append(child){this.children.push(child);}};
  }};
  globalThis.document={body:{append(){}},createElement(){return {style:{},contentDocument:doc,remove(){removed++;},contentWindow:{addEventListener(name,fn){listeners[name]=fn;},focus(){},print(){printed++;}}};}};
  try {
    await printPosterPages([{pageNo:2,url:'blob:second'},{pageNo:1,url:'blob:first'}]);
    assert.equal(printed,1);assert.deepEqual(order.map(x=>x.url),['blob:first','blob:second']);
    assert.match(html,/@page\{size:A4 portrait;margin:0\}/);assert.match(html,/object-fit:contain/);assert.match(html,/page-break-after:always/);
    listeners.afterprint();assert.equal(removed,1);
  }finally{delete globalThis.document;}
});
test('authenticated API handles PNG blobs, 204, and original server error messages',async()=>{
  const text=await readFile(new URL('../src/api/client.js',import.meta.url),'utf8');
  const code=text.replace('import { clearAuth, getToken } from "../auth/token";','const getToken=()=>"fixture-token"; const clearAuth=()=>{};').replace('import.meta.env.VITE_API_BASE_URL','"https://fixture.invalid"');
  const {apiRequest}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const oldFetch=globalThis.fetch;globalThis.window={location:{href:''}};
  try{
    let options;
    globalThis.fetch=async(_url,opts)=>{options=opts;return new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'image/png'}});};
    const blob=await apiRequest('/image',{responseType:'blob'});
    assert.equal(blob.size,3);assert.equal(options.headers.Authorization,'Bearer fixture-token');
    globalThis.fetch=async()=>new Response(null,{status:204});assert.equal(await apiRequest('/excluded',{method:'DELETE'}),null);
    for(const status of [401,409,429,503]){
      const message=`서버 원문 ${status}`;globalThis.fetch=async()=>new Response(JSON.stringify({message}),{status});
      await assert.rejects(apiRequest('/test'),err=>err.status===status&&err.message===message);
    }
  }finally{globalThis.fetch=oldFetch;delete globalThis.window;}
});
