import test from 'node:test';
import assert from 'node:assert/strict';
import {planReminders,syncReminders} from '../src/reminders.mjs';
import {createPurchaseController} from '../src/purchase-controller.mjs';
const item={id:'demo',status:'open',deadline:'2026-03-10',title:'Private purchase',note:'Private order'};
test('calendar reminders preserve local 9am across a DST boundary',()=>{
  const plan=planReminders([item],new Date(2026,2,1));
  assert.deepEqual(plan.notifications.map(n=>[n.schedule.at.getDate(),n.schedule.at.getHours()]),[[7,9],[10,9]]);
  assert.ok(!JSON.stringify(plan).includes('Private'));
});
test('past reminders and resolved items are excluded; IDs remain unique',()=>{
  assert.equal(planReminders([{...item,status:'kept'}],new Date(2026,2,1)).notifications.length,0);
  assert.equal(planReminders([item],new Date(2026,2,10,10)).notifications.length,0);
  const plan=planReminders([item,{...item,id:'other'}],new Date(2026,2,1),3);
  assert.equal(new Set(plan.notifications.map(n=>n.id)).size,3);assert.equal(plan.deferred,1);
});
test('disabling removes only owned reminders and schedules nothing',async()=>{
  let cancelled;
  const plugin={getPending:async()=>({notifications:[{id:110001},{id:8}]}),cancel:async v=>cancelled=v};
  assert.equal((await syncReminders(plugin,[item],{enabled:false})).scheduled,0);
  assert.deepEqual(cancelled,{notifications:[{id:110001}]});
});
test('notification permission denial never schedules or requests permission implicitly',async()=>{
  const plugin={getPending:async()=>({notifications:[]}),checkPermissions:async()=>({display:'denied'})};
  assert.equal((await syncReminders(plugin,[item],{enabled:true})).permissionRequired,true);
});
const pack={packageType:'LIFETIME',product:{priceString:'$2.99'}};
const info={entitlements:{active:{window_plus:{isActive:true}}}};
test('only lifetime package is offered; SDK price is retained',async()=>{
  const c=createPurchaseController({getOfferings:async()=>({current:{availablePackages:[{packageType:'MONTHLY'},pack]}})});
  assert.deepEqual(await c.offer(),{package:pack,price:'$2.99'});
});
test('purchase without entitlement remains pending; cancellation never unlocks',async()=>{
  const c=createPurchaseController({purchasePackage:async()=>({customerInfo:{}})});
  assert.deepEqual(await c.buy(pack),{status:'pending',active:false});
  const cancelled=createPurchaseController({purchasePackage:async()=>{throw {userCancelled:true};}});
  assert.equal((await cancelled.buy(pack)).status,'cancelled');
});
test('restoration checks authoritative entitlement and rejects other package types',async()=>{
  const c=createPurchaseController({restorePurchases:async()=>({customerInfo:info})});
  assert.equal((await c.restore()).active,true);
  await assert.rejects(c.buy({packageType:'MONTHLY'}),/one-time/);
});
test('duplicate purchase presses issue only one SDK call',async()=>{
  let finish,calls=0;
  const c=createPurchaseController({purchasePackage:()=>{calls++;return new Promise(resolve=>finish=resolve);}});
  const first=c.buy(pack);
  assert.equal((await c.buy(pack)).status,'busy');assert.equal(calls,1);
  finish({customerInfo:info});assert.equal((await first).active,true);
});
