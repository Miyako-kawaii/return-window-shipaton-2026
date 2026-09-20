import test from 'node:test';import assert from 'node:assert/strict';import{parseBackup,backup,mergeItems,load,persist,STORAGE_KEY}from'../src/store.mjs';
const item={id:'test-1',title:'Shoes',deadline:'2026-10-01',note:'',status:'open'};
test('backup round trip keeps state',()=>assert.deepEqual(parseBackup(backup([item])),[item]));
test('reject duplicate IDs, invalid dates and unknown versions',()=>{assert.throws(()=>parseBackup(backup([item,item])));assert.throws(()=>parseBackup(backup([{...item,deadline:'2026-02-30'}])));assert.throws(()=>parseBackup('{"version":2,"items":[]}'));});
test('import cannot overwrite an existing item',()=>assert.deepEqual(mergeItems([item],[{...item,title:'Overwrite'}]),[item]));
test('malformed existing data is never silently replaced',()=>{let writes=0;assert.throws(()=>load({getItem:()=>'{broken',setItem:()=>writes++}));assert.equal(writes,0);});
test('storage failure is observable to the UI',()=>assert.throws(()=>persist({setItem:()=>{throw new Error('QuotaExceeded');}},[item])));
test('notes retain text rather than html conversion',()=>{const input={...item,note:'<img src=x onerror=alert(1)>'};assert.equal(parseBackup(backup([input]))[0].note,input.note);});
test('reject oversized backup',()=>assert.throws(()=>parseBackup(' '.repeat(1000001))));
