import {dayNumber} from './deadlines.mjs';

// Rebuild this app's complete schedule after edits, resolution or timezone changes.
// Calendar subtraction deliberately avoids 24-hour arithmetic across DST.
export function planReminders(items, now = new Date(), limit = 48) {
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid current time');
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error('Invalid limit');
  const reminders = [];
  for (const item of items) {
    if (item.status !== 'open') continue;
    dayNumber(item.deadline);
    const [year, month, day] = item.deadline.split('-').map(Number);
    for (const before of [3, 0]) {
      const at = new Date(year, month - 1, day - before, 9, 0, 0);
      if (at <= now) continue;
      reminders.push({itemId:item.id, before, at,
        title:'Return Window',
        body:before ? 'A saved return date is coming up. Open the app to review it.' : 'A saved return date is today. Check the store’s policy.'});
    }
  }
  reminders.sort((a,b)=>a.at-b.at || a.itemId.localeCompare(b.itemId) || a.before-b.before);
  return {notifications:reminders.slice(0,limit).map((r,index)=>({
    id:110000+index, title:r.title, body:r.body,
    // Approximate morning reminders do not need Android's special alarm access.
    // Explicitly opt out: plugin 8.3 defaults to prompting for exact alarms.
    isExactNotification:false,
    schedule:{at:r.at}, extra:{itemId:r.itemId},
  })), deferred:Math.max(0,reminders.length-limit)};
}

export async function syncReminders(plugin, items, {enabled, now=new Date()}={}) {
  const pending=await plugin.getPending();
  // Only cancel IDs owned by this feature, never unrelated notifications.
  const owned=pending.notifications.filter(n=>n.id>=110000 && n.id<111000);
  if (owned.length) await plugin.cancel({notifications:owned.map(({id})=>({id}))});
  if (!enabled) return {scheduled:0, deferred:0};
  const permission=await plugin.checkPermissions();
  if (permission.display!=='granted') return {scheduled:0,deferred:0,permissionRequired:true};
  const plan=planReminders(items,now);
  if (plan.notifications.length) await plugin.schedule({notifications:plan.notifications});
  return {scheduled:plan.notifications.length,deferred:plan.deferred};
}
