const assert = require('assert');
const { calculate, DEFAULTS } = require('../public/calc.js');

// Referenz: exakt die Original-Gleichungen aus dem CFF-Formular (Strings unverändert übernommen)
function prec(num, pr) { const f = Math.pow(10, pr); num = Math.round(num * f) / f; return num.toFixed(pr); }
const floor = Math.floor;
const AND = (...a) => a.every(Boolean);
function original(i) {
  const fieldname28 = i.type, fieldname6 = i.count, fieldname4 = i.weight, fieldname5 = i.hydNap,
    fieldname21 = i.width, fieldname22 = i.length, fieldname27 = i.hydRom,
    fieldname12 = i.yeast, fieldname17 = i.fridge, fieldname18 = i.room;
  const fieldname7 = (function(){
    if(fieldname28 == 1) return floor((fieldname6*(fieldname4+10))/(100+fieldname5+3+0.2)*100);
    if(fieldname28 == 2) return floor(((fieldname21*fieldname22)/2)/(100+fieldname27+3+0.2)*100);
  })();
  const fieldname8 = (function(){
    if(fieldname28 == 1) return floor(fieldname7*(fieldname5/100));
    if(fieldname28 == 2) return floor(fieldname7*(fieldname27/100));
  })();
  const fieldname9 = prec((fieldname7*0.03),1);
  const fieldname13 = (function(){
    if (AND(fieldname17 == 24,fieldname18 == 6)) return prec((fieldname7*fieldname12),2);
    if (AND(fieldname17 == 99,fieldname18 == 6)) return prec((fieldname7*fieldname12*2),2);
    if (AND(fieldname17 == 24,fieldname18 == 2)) return prec((fieldname7*fieldname12*3),2);
    if (AND(fieldname17 == 99,fieldname18 == 2)) return prec((fieldname7*fieldname12*4),2);
  })();
  const fieldname31 = (function(){
    if(fieldname28 == 1) return prec((fieldname8*0.03125),1);
    if(fieldname28 == 2) return prec((fieldname8*0.0625),1);
  })();
  return { mehl: fieldname7, wasser: fieldname8, salz: fieldname9, hefe: fieldname13, oel: fieldname31 };
}

// Bekannter Standardfall
const d = calculate(DEFAULTS);
assert.deepStrictEqual([d.mehl, d.wasser, d.salz, d.hefe, d.oel], [172, 111, '5.2', '0.34', '3.5']);

let n = 0;
for (const type of [1, 2]) for (const oven of [1, 2]) for (const yeast of [0.002, 0.001])
for (const fridge of [24, 99]) for (const room of [6, 2])
for (let k = 0; k < 120; k++) {
  const i = { type, oven, yeast, fridge, room,
    count: 1 + (k % 12), weight: 180 + k * 3, hydNap: 50 + (k % 51),
    width: 10 + (k % 50), length: 20 + ((k * 7) % 60), hydRom: 50 + ((k * 3) % 51) };
  const a = calculate(i), b = original(i);
  assert.strictEqual(a.mehl, b.mehl); assert.strictEqual(a.wasser, b.wasser);
  assert.strictEqual(a.salz, b.salz); assert.strictEqual(a.hefe, b.hefe);
  assert.strictEqual(a.oel, (type === 2 || oven === 2) ? b.oel : null);
  n++;
}
console.log(`OK – ${n} Kombinationen identisch mit dem Original.`);
