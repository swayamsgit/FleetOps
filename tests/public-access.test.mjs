import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// Execute the actual proxy with its only TS annotation removed.
const source=readFileSync('deployment/vercel/route.ts','utf8').replace('request: Request','request');
const route=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('public API rejects all mutation methods before contacting backend',async()=>{
 for(const method of ['POST','PUT','PATCH','DELETE'])for(const path of ['tasks','tasks/example','settings','seed']){
  const r=await route[method](new Request('https://example.com/api/'+path,{method}));
  assert.equal(r.status,403);
 }
});
test('public proxy only exposes the approved read endpoints',async()=>{
 assert.equal((await route.GET(new Request('https://example.com/api/unknown'))).status,404);
 assert.equal((await route.GET(new Request('https://example.com/api/tasks'))).status,503);
});
