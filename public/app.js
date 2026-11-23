(function () {
  'use strict';
  var Calc = window.PizzaCalc;
  var STORE = 'pizzateig.v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var state = load();
  var done = {};
  var last = {};

  function load() {
    var s = Object.assign({}, Calc.DEFAULTS);
    try {
      var saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (saved) Object.keys(s).forEach(function (k) { if (typeof saved[k] === 'number' && isFinite(saved[k])) s[k] = saved[k]; });
    } catch (e) {}
    return s;
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }

  // Deutsche Zahlendarstellung, Werte selbst bleiben exakt wie berechnet
  function de(v) { return String(v).replace('.', ','); }
  function haptic() { if (navigator.vibrate) navigator.vibrate(8); }

  // ---------- Segmented & Chips ----------
  $$('.segmented[data-key]').forEach(function (seg) {
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var key = seg.dataset.key, val = Number(b.dataset.value);
      if (state[key] === val) return;
      state[key] = val; haptic(); if (key === 'type') done = {};
      render();
    });
  });
  $$('.chips[data-key]').forEach(function (c) {
    c.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      state[c.dataset.key] = Number(b.dataset.value); haptic(); render();
    });
  });

  // ---------- Stepper (mit Gedrückthalten) ----------
  $$('.stepper').forEach(function (st) {
    var key = st.dataset.key, min = +st.dataset.min, max = +st.dataset.max, step = +st.dataset.step;
    var input = $('.step-val', st), timer, rep;
    function clamp(v) { return Math.min(max, Math.max(min, v)); }
    function bump(dir) {
      var v = state[key];
      var next = dir > 0 ? Math.floor(v / step) * step + step : Math.ceil(v / step) * step - step;
      next = clamp(next);
      if (next !== v) { state[key] = next; haptic(); render(); }
    }
    function stop() { clearTimeout(timer); clearInterval(rep); }
    $$('.step', st).forEach(function (b) {
      var dir = Number(b.dataset.dir);
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault(); bump(dir);
        timer = setTimeout(function () { rep = setInterval(function () { bump(dir); }, 80); }, 400);
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, stop); });
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });
    input.addEventListener('focus', function () { input.value = state[key]; setTimeout(function () { input.select(); }, 0); });
    input.addEventListener('input', function () {
      var v = parseInt(input.value.replace(/\D/g, ''), 10);
      if (!isNaN(v) && v >= min && v <= max) { state[key] = v; render(true); }
    });
    function commit() {
      var v = parseInt(input.value.replace(/\D/g, ''), 10);
      state[key] = isNaN(v) ? state[key] : clamp(v);
      render();
    }
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') input.blur(); });
  });

  // ---------- Slider ----------
  var slider = $('#hydSlider');
  slider.addEventListener('input', function () {
    state[state.type === 1 ? 'hydNap' : 'hydRom'] = Number(slider.value); render();
  });

  // ---------- Abhaken ----------
  $('#ingredients').addEventListener('click', function (e) {
    var li = e.target.closest('li'); if (!li) return;
    done[li.dataset.ing] = !done[li.dataset.ing]; haptic(); paintDone();
  });
  $('.hero').addEventListener('click', function () { done.mehl = !done.mehl; haptic(); paintDone(); });
  function paintDone() {
    $('.hero').classList.toggle('done', !!done.mehl);
    $$('#ingredients li').forEach(function (li) { li.classList.toggle('done', !!done[li.dataset.ing]); });
  }

  // ---------- Reset ----------
  $('#resetBtn').addEventListener('click', function () {
    state = Object.assign({}, Calc.DEFAULTS); done = {}; render(); toast('Zurückgesetzt');
  });

  // ---------- Teilen ----------
  $('#shareBtn').addEventListener('click', function () {
    var r = Calc.calculate(state);
    var lines = [
      'Pizzateig – ' + (state.type === 1 ? 'Napoletana' : 'Romana in Teglia'),
      subtitle(),
      '',
      'Mehl: ' + r.mehl + ' g',
      'Sprudel: ' + r.wasser + ' ml',
      'Salz: ' + de(r.salz) + ' g',
      (state.yeast === 0.002 ? 'Frische Hefe' : 'Trockenhefe') + ': ' + de(r.hefe) + ' g',
    ];
    if (r.oel !== null) lines.push('Olivenöl: ' + de(r.oel) + ' g');
    lines.push('', 'Hydratation ' + r.hydratation + ' % · ' + garText());
    var text = lines.join('\n');
    if (navigator.share) {
      navigator.share({ title: 'Pizzateig', text: text }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () { toast('Rezept kopiert'); }, function () { toast('Kopieren nicht möglich'); });
    }
  });

  var toastT;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 1600);
  }

  function subtitle() {
    if (state.type === 1) return state.count + (state.count === 1 ? ' Pizza' : ' Pizzen') + ' à ' + state.weight + ' g';
    return 'Blech ' + state.width + ' × ' + state.length + ' cm';
  }
  function garText() {
    var parts = [];
    if (state.fridge === 24) parts.push('24 h Kühlschrank');
    parts.push(state.room + ' h Zimmertemperatur');
    return parts.join(' + ');
  }

  // ---------- Render ----------
  function setVal(id, v) {
    var el = document.getElementById(id), s = String(v);
    if (el.textContent !== s) {
      el.textContent = s;
      if (last[id] !== undefined) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
      last[id] = s;
    }
  }

  function render(typing) {
    var napoli = state.type === 1;
    var r = Calc.calculate(state);

    // Steuerelemente spiegeln
    $$('.segmented[data-key]').forEach(function (seg) {
      $$('button', seg).forEach(function (b) {
        var on = Number(b.dataset.value) === state[seg.dataset.key];
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      });
    });
    $$('.chips[data-key]').forEach(function (c) {
      $$('button', c).forEach(function (b) { b.classList.toggle('on', Number(b.dataset.value) === state[c.dataset.key]); });
    });
    $$('.stepper').forEach(function (st) {
      var key = st.dataset.key, input = $('.step-val', st);
      if (!(typing && document.activeElement === input)) {
        input.value = state[key] + (st.dataset.unit && document.activeElement !== input ? ' ' + st.dataset.unit : '');
      }
      $$('.step', st).forEach(function (b) {
        b.disabled = b.dataset.dir === '-1' ? state[key] <= +st.dataset.min : state[key] >= +st.dataset.max;
      });
    });

    $('#groupNap').hidden = !napoli;
    $('#groupRom').hidden = napoli;

    var hyd = r.hydratation;
    slider.value = hyd;
    slider.style.setProperty('--p', ((hyd - 50) / 50 * 100) + '%');
    $('#hydVal').textContent = hyd;
    $('#hydHint').textContent = 'Empfohlen ' + (napoli ? 65 : 80) + ' %';

    // Durchmesser-Schätzung (280 g ≈ 32 cm laut Original)
    var d = Math.round(32 * Math.sqrt(state.weight / 280));
    $('#weightHint').textContent = 'ca. ' + d + ' cm Durchmesser';


    // Ergebnis
    $('#resultSub').textContent = subtitle();
    setVal('vMehl', r.mehl);
    setVal('vWasser', r.wasser);
    setVal('vSalz', de(r.salz));
    setVal('vHefe', de(r.hefe));
    $('#hefeName').textContent = state.yeast === 0.002 ? 'Frische Hefe' : 'Trockenhefe';
    $('#oelRow').hidden = r.oel === null;
    if (r.oel !== null) setVal('vOel', de(r.oel));

    // Minibar
    var mb = [['Mehl', r.mehl + ' g', true], ['Sprudel', r.wasser + ' ml'], ['Salz', de(r.salz) + ' g'], ['Hefe', de(r.hefe) + ' g']];
    if (r.oel !== null) mb.push(['Öl', de(r.oel) + ' g']);
    $('#minibarItems').innerHTML = mb.map(function (m) {
      return '<div class="mb-item' + (m[2] ? ' main' : '') + '"><span>' + m[0] + '</span><b>' + m[1] + '</b></div>';
    }).join('');

    $('#gareNote').textContent = '· ' + ((state.fridge === 24 ? 24 : 0) + state.room) + ' h gesamt';

    $('#tip').textContent = napoli
      ? 'Mit 280 g pro Teigkugel formst du eine Pizza von ca. 32 cm. Tippe oben eine Zutat an, um sie abzuhaken.'
      : 'Gib die Grösse deines Backblechs ein, der Rest wird berechnet. Tippe oben eine Zutat an, um sie abzuhaken.';

    save();
  }

  // Minibar ein-/ausblenden
  // Mengenleiste oben: sichtbar, sobald man scrollt und die Zutaten-Karte nicht im Bild ist
  var mbShown = false;
  function checkMinibar() {
    var r = $('#result').getBoundingClientRect();
    var resultVisible = r.top < window.innerHeight - 80 && r.bottom > 80;
    var show = window.scrollY > 40 && !resultVisible;
    if (show !== mbShown) {
      mbShown = show;
      $('#minibar').classList.toggle('show', show);
      $('#minibar').setAttribute('aria-hidden', String(!show));
    }
  }
  window.addEventListener('scroll', checkMinibar, { passive: true });
  window.addEventListener('resize', checkMinibar);
  checkMinibar();
  $('#minibar').addEventListener('click', function () {
    $('#resultGroup').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Hell / Dunkel
  var THEME = 'pizzateig.theme';
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light');
  }
  function paintThemeColor() {
    var dark = currentTheme() === 'dark';
    $$('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', dark ? '#000000' : '#EDEDEA'); m.setAttribute('media', 'all'); });
    $('#themeBtn').setAttribute('aria-label', dark ? 'Hellmodus einschalten' : 'Dunkelmodus einschalten');
  }
  $('#themeBtn').addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME, next); } catch (e) {}
    haptic(); paintThemeColor();
  });
  if (mq.addEventListener) mq.addEventListener('change', paintThemeColor);
  paintThemeColor();

  render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
