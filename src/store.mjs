import {createItem} from './deadlines.mjs';
export const STORAGE_KEY='return-window.v1';
export function parseBackup(text){
  if(text.length>1000000) throw new Error('Backup is too large (1 MB maximum).');
  const data=JSON.parse(text);
  if(data?.version!==1 || !Array.isArray(data.items) || data.items.length>1000) throw new Error('Not a Return Window backup.');
  const ids=new Set();
  return data.items.map(item=>{if(!item || typeof item.id!=='string' || !/^[a-zA-Z0-9-]{1,80}$/.test(item.id) || ids.has(item.id)) throw new Error('Invalid or duplicate item ID.');ids.add(item.id);return createItem(item,item.id);});
}
export function mergeItems(existing,incoming){const ids=new Set(existing.map(x=>x.id));return [...existing,...incoming.filter(x=>!ids.has(x.id))];}
export function backup(items){return JSON.stringify({version:1,items},null,2);}
export function load(storage){const value=storage.getItem(STORAGE_KEY);return value ? parseBackup(value):[];}
export function persist(storage,items){storage.setItem(STORAGE_KEY,backup(items));}
