import {createPurchaseController} from './purchase-controller.mjs';
import {TEST_STORE_PUBLIC_KEY} from './public-config.mjs';

export function createBillingService({isNative,publicKey,loadSDK}) {
  let initializing, controller, selected;
  async function ready() {
    if (!isNative()) throw new Error('Use the Android app to test purchases.');
    // This project is a sandbox demo. Production keys are deliberately rejected.
    if (!/^test_[A-Za-z0-9]+$/.test(publicKey)) throw new Error('Test Store configuration is missing.');
    if (!initializing) initializing=(async()=>{
      const sdk=await loadSDK();
      await sdk.configure({apiKey:publicKey});
      controller=createPurchaseController(sdk);
      return controller;
    })().catch(error=>{initializing=null;throw error;});
    return initializing;
  }
  return {
    async view() {
      selected=null;
      if(!isNative()) return {available:false,message:'Purchases are available in the Android app. This browser preview cannot charge you.'};
      try {
        const c=await ready();
        if(await c.status()) return {available:false,active:true,message:'Window Plus is active in this test account.',label:'Already unlocked'};
        const offer=await c.offer();
        if(!offer) return {available:false,message:'The one-time test product is not available. Please try again later.'};
        selected=offer.package;
        return {available:true,active:false,price:offer.price,message:'Test Store demo — simulated purchase, no real charge.'};
      } catch {return {available:false,message:'Test purchases are unavailable. Check the native configuration and connection, then retry.'};}
    },
    async purchase() {
      const c=await ready();
      if(!selected) throw new Error('Load the one-time offer before purchasing.');
      return c.buy(selected);
    },
    async restore() {return (await ready()).restore();},
    async active() {return (await ready()).status();},
  };
}

const service=createBillingService({
  isNative:()=>globalThis.Capacitor?.isNativePlatform?.()===true,
  publicKey:TEST_STORE_PUBLIC_KEY,
  loadSDK:async()=> (await import('@revenuecat/purchases-capacitor')).Purchases,
});
export const billing=()=>service.view();
export const purchase=()=>service.purchase();
export const restore=()=>service.restore();
export const hasPlus=()=>service.active();
