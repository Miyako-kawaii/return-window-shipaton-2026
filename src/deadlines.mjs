// Calendar dates are deliberately independent of timezone and DST.
export function dayNumber(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use YYYY-MM-DD');
  const [y,m,d] = value.split('-').map(Number);
  if (y < 1900 || y > 9999) throw new Error('Invalid year');
  const stamp = Date.UTC(y,m-1,d);
  const date = new Date(stamp);
  if (date.getUTCFullYear()!==y || date.getUTCMonth()!==m-1 || date.getUTCDate()!==d) throw new Error('Invalid date');
  return stamp / 86400000;
}
export function assess(item, today) {
  const remaining = dayNumber(item.deadline) - dayNumber(today);
  if (!['open','returned','kept'].includes(item.status)) throw new Error('Invalid status');
  return {remaining, state:item.status!=='open' ? item.status : remaining<0 ? 'overdue' : remaining===0 ? 'due-today' : remaining<=3 ? 'due-soon' : 'scheduled'};
}
export function createItem({title,deadline,note='',status='open'},id) {
  title = String(title ?? '').trim();
  if (!title || title.length>120) throw new Error('Title must contain 1–120 characters');
  dayNumber(deadline);
  if (!['open','returned','kept'].includes(status)) throw new Error('Invalid status');
  if (String(note).length>2000) throw new Error('Note too long');
  return {id,title,deadline,note:String(note),status};
}
