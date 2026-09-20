import test from 'node:test';
import assert from 'node:assert/strict';
import {createBillingService} from '../src/billing.mjs';
const pack={packageType:'LIFETIME',product:{priceString:'€2.99'}};
test('browser preview never loads SDK or accepts purchases',async()=>{
 const s=createBillingService({isNative:()=>false,publicKey:'test_demo',loadSDK:()=>{throw new Error('Must not load');}});
 assert.equal((await s.view()).available,false);await assert.rejects(s.purchase(),/Android/);
});
test('production key rejected before SDK initialization',async()=>{
 const s=createBillingService({isNative:()=>true,publicKey:'goog_example',loadSDK:()=>{throw new Error('Must not load');}});
 assert.equal((await s.view()).available,false);await assert.rejects(s.restore(),/configuration/);
});
test('configured native service preserves offer price and initializes once',async()=>{
 let configurations=0,purchased;
 const sdk={configure:async()=>{configurations++;},getCustomerInfo:async()=>({customerInfo:{}}),getOfferings:async()=>({current:{availablePackages:[pack]}}),purchasePackage:async options=>{purchased=options;return {customerInfo:{}};}};
 const s=createBillingService({isNative:()=>true,publicKey:'test_demo',loadSDK:async()=>sdk});
 assert.equal((await s.view()).price,'€2.99');await s.view();
 assert.equal(configurations,1);assert.equal((await s.purchase()).status,'pending');assert.deepEqual(purchased,{aPackage:pack});
});
test('failed initialization can retry without granting access',async()=>{
 let attempts=0;
 const sdk={configure:async()=>{if(++attempts===1)throw new Error('offline');},getCustomerInfo:async()=>({customerInfo:{entitlements:{active:{window_plus:{isActive:true}}}}})};
 const s=createBillingService({isNative:()=>true,publicKey:'test_demo',loadSDK:async()=>sdk});
 assert.equal((await s.view()).available,false);assert.equal((await s.view()).active,true);assert.equal(attempts,2);
});
