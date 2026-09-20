// SDK adapter: supplied by the native entrypoint after configuration.
// This controller never uses local flags as proof of an entitlement.
export function createPurchaseController(sdk, entitlement='window_plus') {
  let busy=false;
  const active=info=>Boolean(info?.entitlements?.active?.[entitlement]?.isActive);
  async function exclusive(fn) {
    if (busy) return {status:'busy',active:false};
    busy=true;
    try {return await fn();} finally {busy=false;}
  }
  return {
    async status() {const {customerInfo}=await sdk.getCustomerInfo();return active(customerInfo);},
    async offer() {
      const offerings=await sdk.getOfferings();
      const pack=offerings.current?.availablePackages?.find(p=>p.packageType==='LIFETIME');
      if (!pack?.product?.priceString) return null;
      return {package:pack,price:pack.product.priceString};
    },
    buy(pack) {return exclusive(async()=>{
      if (pack?.packageType!=='LIFETIME') throw new Error('Only the one-time unlock is supported.');
      try {
        const {customerInfo}=await sdk.purchasePackage({aPackage:pack});
        const unlocked=active(customerInfo);
        return {status:unlocked?'unlocked':'pending',active:unlocked};
      } catch(error) {
        if(error?.userCancelled===true) return {status:'cancelled',active:false};
        throw error;
      }
    });},
    restore() {return exclusive(async()=>{
      const {customerInfo}=await sdk.restorePurchases();
      const unlocked=active(customerInfo);
      return {status:unlocked?'restored':'not-found',active:unlocked};
    });},
  };
}
