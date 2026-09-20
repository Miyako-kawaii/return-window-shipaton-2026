import {assess,createItem,dayNumber} from './deadlines.mjs';
import {load,persist,parseBackup,mergeItems,backup} from './store.mjs';
import {billing,purchase,restore,hasPlus} from './billing.mjs';
import {createReminderService} from './reminder-service.mjs';
const $=id=>document.getElementById(id);
let items=[],filter='open',undo=null,toastTimer,storageOk=true;
const reminders=createReminderService({native:()=>globalThis.Capacitor?.isNativePlatform?.()===true,storage:localStorage,hasPlus,loadPlugin:()=>import('@capacitor/local-notifications')});
async function refreshReminders(){try{const r=await reminders.refresh(items);$('reminder-state').textContent=r.message;}catch{$('reminder-state').textContent='Could not update reminders. Your item list is saved; retry from settings.';}}
try{items=load(localStorage);}catch{storageOk=false;}
function localDate(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function message(text,action=null){clearTimeout(toastTimer);undo=action;$('toast').hidden=false;$('toast').querySelector('span').textContent=text;$('undo').hidden=!action;if(!action)toastTimer=setTimeout(()=>$('toast').hidden=true,6000);}
function commit(next,notice){if(next.length>1000){message('Maximum 1,000 items per device.');return false;}if(!storageOk){message('Storage could not be read. Export or recover existing data before adding items.');return false;}try{persist(localStorage,next);items=next;render();void refreshReminders();if(notice)message(notice);return true;}catch{message('Could not save. Your previous data has been kept. Check available device storage.');return false;}}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function button(text,cls,fn){const b=el('button',cls,text);b.type='button';b.onclick=fn;return b;}
function dateLabel(value){const [y,m,d]=value.split('-').map(Number);return new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric'}).format(new Date(y,m-1,d));}
function resolve(item,status){const previous=items;const next=items.map(x=>x.id===item.id?{...x,status}:x);if(commit(next))message(status==='open'?'Window reopened.':`Marked ${status}.`,()=>commit(previous,'Change undone.'));}
function remove(item){const previous=items;if(commit(items.filter(x=>x.id!==item.id)))message('Item removed.',()=>commit(previous,'Item restored.'));}
function render(){
 const today=localDate(),query=$('search').value.toLocaleLowerCase();
 $('open-count').textContent=items.filter(x=>x.status==='open').length;
 $('soon-count').textContent=items.filter(x=>x.status==='open'&&assess(x,today).remaining<=3).length;
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
 const visible=items.filter(x=>(filter==='all'||(filter==='open'?x.status==='open':x.status!=='open'))&&`${x.title} ${x.note}`.toLocaleLowerCase().includes(query)).sort((a,b)=>a.deadline.localeCompare(b.deadline)||a.title.localeCompare(b.title));
 $('items').replaceChildren();$('empty').hidden=visible.length>0;
 $('empty').querySelector('h3').textContent=items.length?'Nothing here yet.':'A fresh start.';
 $('empty').querySelector('p').textContent=items.length?'Try another filter or search, or add a new item.':'Add a purchase and the last date your store accepts a return. We’ll help you keep track.';
 $('empty-add').textContent=items.length?'Add an item':'Add your first item';$('demo').hidden=items.length>0;
 for(const item of visible){
  const s=assess(item,today),c=el('article','card'),top=el('div','card-top'),info=el('div');
  info.append(el('h3','',item.title),el('p','date',`Return by ${dateLabel(item.deadline)}`));
  const label=s.state==='overdue'?`${Math.abs(s.remaining)}d overdue`:s.state==='due-today'?'Due today':s.state==='returned'?'Returned':s.state==='kept'?'Kept':`${s.remaining} ${s.remaining===1?'day':'days'} left`;
  top.append(info,el('span',`badge ${s.state==='overdue'?'late':['due-today','due-soon'].includes(s.state)?'urgent':''}`,label));c.append(top);
  if(item.note)c.append(el('p','notes',item.note));const actions=el('div','card-actions');
  if(item.status==='open')actions.append(button('Returned','',()=>resolve(item,'returned')),button('Keep it','',()=>resolve(item,'kept')));else actions.append(button('Reopen','',()=>resolve(item,'open')));
  actions.append(button('Edit','minor',()=>edit(item)),button('Delete','danger',()=>remove(item)));c.append(actions);$('items').append(c);
 }
}
function edit(item){$('item-form').reset();$('edit-id').value=item?.id||'';$('title').value=item?.title||'';$('deadline').value=item?.deadline||localDate();$('note').value=item?.note||'';$('editor-title').textContent=item?'Edit your window':'A new window';$('form-error').textContent='';$('editor').showModal();$('title').focus();}
document.querySelectorAll('.close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('add').onclick=$('empty-add').onclick=()=>edit();
$('item-form').onsubmit=e=>{e.preventDefault();try{const id=$('edit-id').value||crypto.randomUUID(),old=items.find(x=>x.id===id),item=createItem({title:$('title').value,deadline:$('deadline').value,note:$('note').value,status:old?.status||'open'},id);if(commit(old?items.map(x=>x.id===id?item:x):[...items,item],'Item saved.'))$('editor').close();}catch(err){$('form-error').textContent=err.message;}};
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;render();});$('search').oninput=render;
$('undo').onclick=()=>{const action=undo;undo=null;$('toast').hidden=true;action?.();};
$('settings').onclick=()=>{$('runtime').textContent=globalThis.Capacitor?.isNativePlatform?.()?'Android development build':'Browser preview · Android build and purchase integration pending';$('settings-dialog').showModal();};
$('privacy').onclick=()=>$('privacy-dialog').showModal();
$('export').onclick=()=>{try{const data=storageOk?backup(items):localStorage.getItem('return-window.v1')||'',blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=`return-window-${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Backup export requested.');}catch{message('Export failed. Your data has not been changed.');}};
$('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1000000)throw new Error('Backup is too large (1 MB maximum).');const imported=parseBackup(await file.text()),next=mergeItems(items,imported);if(next.length>1000)throw new Error('Maximum 1,000 items per device.');commit(next,`${next.length-items.length} new items imported.`);}catch(err){message(`Import failed: ${err.message}`);}finally{e.target.value='';}};
$('demo').onclick=()=>{if(items.length)return;const n=dayNumber(localDate()),date=offset=>new Date((n+offset)*86400000).toISOString().slice(0,10);commit([{title:'Linen weekend shirt',deadline:date(1),note:'Sample item · Check the fit before removing the tags.'},{title:'Desk lamp',deadline:date(5),note:'Sample item · Try the warmer bulb first.'},{title:'Running shoes',deadline:date(-1),note:'Sample item · Check with the store before assuming a return is still possible.'}].map(x=>createItem(x,crypto.randomUUID())),'Sample items added.');};
let purchaseBusy=false;
async function showPlus(){if(!$('plus-dialog').open)$('plus-dialog').showModal();$('buy').disabled=true;$('billing-status').textContent='Checking availability…';const state=await billing();$('billing-status').textContent=state.message;$('buy').disabled=purchaseBusy||!state.available;$('buy').textContent=state.available?`Test unlock · ${state.price}`:state.label||'Not available in this build';}
async function purchaseAction(action){
 if(purchaseBusy)return;purchaseBusy=true;$('buy').disabled=true;
 try{const result=await action();message(({unlocked:'Test purchase confirmed.',restored:'Test purchase restored.',cancelled:'Purchase cancelled.',pending:'Purchase has not unlocked Plus yet. Try restoring later.','not-found':'No active Plus purchase found.',busy:'A purchase action is already running.'})[result.status]||'Please try again.');}
 catch{message('The purchase action could not be completed. Check your connection and retry or restore.');}
 finally{purchaseBusy=false;if($('plus-dialog').open)await showPlus();}
}
$('plus').onclick=showPlus;$('buy').onclick=()=>purchaseAction(purchase);$('restore').onclick=$('restore-plus').onclick=()=>purchaseAction(restore);
$('reminders-on').onclick=async()=>{try{$('reminder-state').textContent=(await reminders.enable(items)).message;}catch{$('reminder-state').textContent='Could not enable reminders. Check Plus access, permissions and your connection.';}};
$('reminders-off').onclick=async()=>{try{$('reminder-state').textContent=(await reminders.disable()).message;}catch{$('reminder-state').textContent='Could not turn reminders off. You can disable notifications in Android settings.';}};
document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();void refreshReminders();}});
void refreshReminders();
render();if(!storageOk)message('Existing data could not be read. It has not been overwritten. Use Settings to export a recovery copy.');
