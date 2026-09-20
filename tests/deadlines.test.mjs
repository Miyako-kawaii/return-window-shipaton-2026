import test from 'node:test';
import assert from 'node:assert/strict';
import {dayNumber,assess,createItem} from '../src/deadlines.mjs';
test('leap day validation',()=>{assert.equal(dayNumber('2028-03-01')-dayNumber('2028-02-28'),2);assert.throws(()=>dayNumber('2027-02-29'));});
test('reject calendar rollover and non ISO input',()=>{for(const value of ['2026-13-01','2026-04-31','2026-00-10','2026-9-2','']) assert.throws(()=>dayNumber(value));});
test('deadline remains actionable on final day',()=>{assert.equal(assess({deadline:'2026-09-20',status:'open'},'2026-09-20').state,'due-today');assert.equal(assess({deadline:'2026-09-19',status:'open'},'2026-09-20').state,'overdue');});
test('resolved items do not resurface as overdue',()=>{for(const status of ['kept','returned']) assert.equal(assess({deadline:'2026-01-01',status},'2026-09-20').state,status);});
test('DST transition is one calendar day',()=>assert.equal(dayNumber('2026-03-09')-dayNumber('2026-03-08'),1));
test('validate user supplied records',()=>{assert.throws(()=>createItem({title:' ',deadline:'2026-09-20'},'1'));assert.throws(()=>createItem({title:'A',deadline:'2026-09-20',status:'paid'},'1'));assert.equal(createItem({title:' Shoes ',deadline:'2026-09-20'},'1').title,'Shoes');});
