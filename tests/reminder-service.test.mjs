import test from 'node:test';
import assert from 'node:assert/strict';
import {createReminderService} from '../src/reminder-service.mjs';
function fixture({value='off',plus=true,permission='granted'}={}){
 const calls=[];let pref=value;
 const plugin={getPending:async()=>({notifications:[{id:110000}]}),cancel:async()=>calls.push('cancel'),checkPermissions:async()=>({display:permission}),requestPermissions:async()=>{calls.push('request');return {display:permission};},schedule:async()=>calls.push('schedule')};
 const service=createReminderService({native:()=>true,storage:{getItem:()=>pref,setItem:(_,v)=>{pref=v;}},hasPlus:async()=>plus,loadPlugin:async()=>plugin});
 return {service,calls,pref:()=>pref};
}
test('refresh does not request notification permission',async()=>{
 const f=fixture({value:'on'});await f.service.refresh([]);assert.ok(!f.calls.includes('request'));
});
test('without entitlement enabling never asks permission or saves enabled flag',async()=>{
 const f=fixture({plus:false});await f.service.enable([]);assert.deepEqual(f.calls,[]);assert.equal(f.pref(),'off');
});
test('permission denial leaves preference disabled',async()=>{
 const f=fixture({permission:'denied'});await f.service.enable([]);assert.equal(f.pref(),'off');assert.deepEqual(f.calls,['request']);
});
test('enable and disable requests are serialized so last action wins',async()=>{
 const f=fixture();await Promise.all([f.service.enable([]),f.service.disable()]);assert.equal(f.pref(),'off');assert.equal(f.calls.at(-1),'cancel');
});
test('revoked entitlement cancels old reminders',async()=>{
 const f=fixture({value:'on',plus:false});await f.service.refresh([]);assert.deepEqual(f.calls,['cancel']);
});
