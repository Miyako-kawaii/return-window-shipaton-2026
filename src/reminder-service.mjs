import {syncReminders} from './reminders.mjs';
const KEY='return-window.reminders.v1';
export function createReminderService({native,storage,loadPlugin,hasPlus}) {
 let queue=Promise.resolve();
 const serial=fn=>{const result=queue.then(fn,fn);queue=result.catch(()=>{});return result;};
 async function refresh(items) {
  if(!native()) return {message:'On-device reminders need the Android app.'};
  const {LocalNotifications:plugin}=await loadPlugin(),enabled=storage.getItem(KEY)==='on';
  let entitled=false;
  if(enabled){try{entitled=await hasPlus();}catch{
   await syncReminders(plugin,[],{enabled:false});
   return {message:'Could not verify Plus. Reminders are paused; open the app online to retry.'};
  }}
  const state=await syncReminders(plugin,items,{enabled:enabled&&entitled});
  if(!enabled)return {message:'Reminders are off.'};
  if(!entitled)return {message:'Unlock Window Plus to enable reminders.'};
  if(state.permissionRequired)return {message:'Notifications are not allowed. Enable them in Android settings, then return here.'};
  return {message:`${state.scheduled} reminders scheduled.${state.deferred?' Open the app regularly to schedule later dates.':''}`};
 }
 return {
  refresh:items=>serial(()=>refresh(items)),
  enable:items=>serial(async()=>{
   if(!native())return {message:'On-device reminders need the Android app.'};
   if(!await hasPlus())return {message:'Unlock Window Plus first.'};
   const {LocalNotifications:plugin}=await loadPlugin();
   const permission=await plugin.requestPermissions();
   if(permission.display!=='granted')return {message:'Permission was not granted. Reminders remain off.'};
   storage.setItem(KEY,'on');return refresh(items);
  }),
  disable:()=>serial(async()=>{
   // Cancel first, then save: a storage failure must not leave unwanted alarms running.
   if(native())await syncReminders((await loadPlugin()).LocalNotifications,[],{enabled:false});
   storage.setItem(KEY,'off');return {message:'Reminders are off.'};
  }),
 };
}
