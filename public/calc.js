/*
 * Pizzateig-Berechnung – 1:1 übernommen aus dem Original-Rechner
 * (pizzapastabros.ch/pizzateig-rechner, Calculated Fields Form #7).
 *
 * Original-Felder:
 *   fieldname28 Art der Pizza      1 = Napoletana, 2 = Romana in Teglia
 *   fieldname3  Ofentyp            1 = Pizzaofen (~450°), 2 = Haushaltsbackofen (~250°)
 *   fieldname6  Anzahl Pizzen      (Napoletana)
 *   fieldname4  Gewicht Kugel (g)  (Napoletana)
 *   fieldname5  Hydratation (%)    (Napoletana, Standard 65)
 *   fieldname21 Breite Blech (cm)  (Romana)
 *   fieldname22 Länge Blech (cm)   (Romana)
 *   fieldname27 Hydratation (%)    (Romana, Standard 80)
 *   fieldname12 Hefe               0.002 = frisch, 0.001 = trocken
 *   fieldname17 Kühlschrank        24 = 24 Stunden, 99 = ohne
 *   fieldname18 Zimmertemperatur   6 = 6 Stunden, 2 = 2 Stunden
 */
(function (root) {
  'use strict';

  // CFF PREC(num, pr): Math.round auf pr Stellen, Ausgabe via toFixed(pr)
  function prec(num, pr) {
    var f = Math.pow(10, pr);
    return (Math.round(num * f) / f).toFixed(pr);
  }

  var DEFAULTS = {
    type: 1, oven: 2,
    count: 1, weight: 280, hydNap: 65,
    width: 20, length: 40, hydRom: 80,
    yeast: 0.002, fridge: 24, room: 6,
  };

  function calculate(i) {
    var napoli = Number(i.type) === 1;
    var hyd = napoli ? Number(i.hydNap) : Number(i.hydRom);

    // Mehl (fieldname7)
    var mehl = napoli
      ? Math.floor((i.count * (i.weight + 10)) / (100 + hyd + 3 + 0.2) * 100)
      : Math.floor(((i.width * i.length) / 2) / (100 + hyd + 3 + 0.2) * 100);

    // Wasser (fieldname8)
    var wasser = Math.floor(mehl * (hyd / 100));

    // Salz (fieldname9)
    var salz = prec(mehl * 0.03, 1);

    // Hefe (fieldname13)
    var factor;
    if (i.fridge == 24 && i.room == 6) factor = 1;
    else if (i.fridge == 99 && i.room == 6) factor = 2;
    else if (i.fridge == 24 && i.room == 2) factor = 3;
    else if (i.fridge == 99 && i.room == 2) factor = 4;
    var hefe = factor ? prec(mehl * i.yeast * factor, 2) : undefined;

    // Olivenöl (fieldname31) – sichtbar bei Romana ODER Haushaltsbackofen
    var oelSichtbar = !napoli || Number(i.oven) === 2;
    var oel = napoli ? prec(wasser * 0.03125, 1) : prec(wasser * 0.0625, 1);

    return {
      mehl: mehl,
      wasser: wasser,
      salz: salz,
      hefe: hefe,
      oel: oelSichtbar ? oel : null,
      hydratation: hyd,
    };
  }

  var api = { calculate: calculate, prec: prec, DEFAULTS: DEFAULTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PizzaCalc = api;
})(this);
