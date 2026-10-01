/* modules_cnn.js - a convolutional network reading a made-up LiDAR scene: bare soil, grass, shrubs, trees, roofs */
(function (g) {
  const { ML, Plot, H, MODULES: M, LIDARLAB: L } = g;
  const C = Plot.C, N = L.N;
  const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const CC = L.CCOL.map(hex), RES = ['full', 'half', 'quarter'], FACT = [1, 2, 4];
  const retColor = v => { const t = Math.max(0, Math.min(1, (v - 1) / 2)), a = [244, 246, 247], b = [110, 40, 120]; return a.map((c, i) => c + (b[i] - c) * t); };
  const T0 = { a: 0.25, b: 0.9, c: 3.5, q: 1.8 };

  M.push({
    id: 'cnn', part: 1, title: 'Convolutional networks: reading a LiDAR scene',
    lede: '', steps: [],
    html: () => `
      <div class="tabs" role="tablist" id="cn-tabs">
        <button type="button" class="tab on" data-s="1">1 Can we tell?</button><button type="button" class="tab" data-s="2">2 A tiny convolutional network</button>
      </div>

      <div class="track on" data-s="1">
        ${H.look('Label the eight patches. The crosshair marks the spot to label. Start with the Photo view, then switch to LiDAR heights to see the same eight patches again. Then lower the point density and try once more.', 'In the photo, bare soil and dry grass are nearly the same color, and shrubs look like small trees, so we make the same kind of mistakes as with the muffin and the chihuahua. Heights separate them: soil is flat, grass is a few decimeters tall, shrubs one to two and a half meters, trees eight meters or more, and roofs are tall and flat. With few LiDAR points per square meter the heights get noisy, and the small differences disappear.')}
        <div class="ctlrow"><div class="ctl"><label for="c-view">View</label><select id="c-view"><option value="photo">Aerial photo</option><option value="lidar">LiDAR heights</option></select></div>${H.S('c-res', 'Resolution', 0, 2, 1, 0)}${H.S('c-den', 'LiDAR points per m²', 1, 16, 1, 16)}${H.btn('c-new', 'New set of eight')}</div>
        <div id="c-tiles" class="tiles"></div>
        <div class="readout" id="c-score"></div>
        <div class="legend" id="c-leg1"></div>
      </div>

      <div class="track" data-s="2">
        ${H.look('Slide the filter size and the point density and watch the two feature maps. Then set the four thresholds by hand until the land-cover map matches the true one (turn on the reveal switch), and press Auto-tune.', 'Layer 1 makes new pictures from the LiDAR: the typical height in each window and the average number of returns. Layer 2 combines them with the four thresholds. A small filter is noisy, and a large filter smears the edges of trees and buildings. In a real CNN the computer learns the filters from labeled pictures. Here the filters are fixed and Auto-tune learns the thresholds.')}
        <div class="row4">
          <div><h5>Input: height above ground</h5>${H.cv('c-in', 1)}</div>
          <div><h5>Input: returns per pulse</h5>${H.cv('c-ir', 1)}</div>
          <div><h5>Layer 1: typical height</h5>${H.cv('c-fh', 1)}</div>
          <div><h5>Layer 1: average returns</h5>${H.cv('c-fr', 1)}</div>
        </div>
        <div class="row3">
          <div><h5>Layer 2: land cover from your thresholds</h5>${H.cv('c-pr', 1)}</div>
          <div><h5>True land cover</h5>${H.cv('c-tr', 1)}</div>
          <div><h5>Where the mistakes are (true classes down the side)</h5>${H.cv('c-cf', 1)}</div>
        </div>
        <div class="ctlrow st-top"><label class="switch"><input type="checkbox" id="c-true"><span class="sw"></span><b>Reveal the true land cover</b></label>${H.btn('c-tune', 'Auto-tune the thresholds')}${H.btn('c-reset', 'Reset the thresholds')}</div>
        <div class="ctlrow">${H.S('c-fs', 'Filter size (cells)', 3, 9, 2, 5)}${H.S('c-den2', 'LiDAR points per m²', 1, 16, 1, 4)}</div>
        <div class="ctlrow">${H.S('c-a', 'Grass starts at (m)', 0.05, 0.6, 0.01, 0.25)}${H.S('c-b', 'Shrubs start at (m)', 0.4, 2.0, 0.02, 0.9)}</div>
        <div class="ctlrow">${H.S('c-c', 'Tall things start at (m)', 2, 8, 0.1, 3.5)}${H.S('c-q', 'Roofs have fewer returns than', 1.1, 2.4, 0.02, 1.8)}</div>
        <div class="legend" id="c-leg2"></div>
        <div class="readout" id="c-out"></div>
      </div>`,
    init(root) {
      const q = id => root.querySelector('#' + id), sc = L.scene(11);
      const sw = c => `<i style="background:${c}"></i>`, legend = L.CLS.map((n, i) => `<span>${sw(L.CCOL[i])}${n}</span>`).join('');
      q('c-leg1').innerHTML = `<span>Answer choices: ${L.SHORT.join(', ')}</span>`; q('c-leg2').innerHTML = legend;
      const off = document.createElement('canvas'); off.width = N; off.height = N;
      const paint = (pl, fn) => { const c = off.getContext('2d'), id = c.createImageData(N, N), d = id.data; for (let i = 0; i < N * N; i++) { const p = fn(i); d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255; } c.putImageData(id, 0, 0); const k = pl.ctx; k.save(); k.imageSmoothingEnabled = false; k.drawImage(off, pl.o.m.l, pl.o.m.t, pl.pw, pl.ph); k.restore(); };
      const opt = { xr: [0, N], yr: [0, N], invY: true, noAxes: true, m: { l: 2, r: 2, t: 2, b: 2 } };

      /* ================= step 1: the labeling game ================= */
      const tiles = q('c-tiles'), view = q('c-view');
      const res = H.bind(root, 'c-res', () => drawTiles(), v => RES[v]), den = H.bind(root, 'c-den', () => { obs1 = L.observe(sc, den.get()); drawTiles(); }, v => v);
      let obs1 = L.observe(sc, 16), patches = [], answers = [], seed = 20, best = { photo: null, lidar: null };
      function newSet() {
        seed += 13; const r = ML.rng(seed), want = ML.shuffle(8, r).map(i => [0, 1, 1, 2, 3, 3, 4, [0, 1, 2, 3, 4][Math.floor(r() * 5)]][i]);
        patches = want.map(c => L.pickPatch(sc, c, r)).filter(Boolean); answers = patches.map(() => null); best = { photo: null, lidar: null };
        tiles.innerHTML = patches.map((_, i) => `<div class="tile" data-i="${i}"><canvas width="128" height="128"></canvas><div class="tb five">${L.SHORT.map((n, k) => `<button type="button" class="btn sm" data-a="${k}">${n}</button>`).join('')}</div><span class="tr"></span></div>`).join('');
        drawTiles(true);
      }
      function tileColor(x, y) {
        const f = FACT[res.get()], bx = x - (x % f), by = y - (y % f); let s = [0, 0, 0], n = 0;
        for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) { const xx = Math.min(N - 1, bx + i), yy = Math.min(N - 1, by + j), k = yy * N + xx; let c; if (view.value === 'photo') c = [sc.img[k * 3], sc.img[k * 3 + 1], sc.img[k * 3 + 2]]; else { const hc = L.heightColor(obs1.h[k]), sh = L.shade(obs1.h, xx, yy); c = hc.map(v => v * sh); } s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; n++; }
        return s.map(v => Math.max(0, Math.min(255, v / n)));
      }
      function drawTiles(fresh) {
        if (!fresh) { answers = answers.map(() => null); }
        tiles.querySelectorAll('.tile').forEach((t, i) => {
          const cv = t.querySelector('canvas'), x = cv.getContext('2d'), p = patches[i], k = cv.width / 16;
          for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) { const c = tileColor(p.x - 8 + xx, p.y - 8 + yy); x.fillStyle = `rgb(${c.map(Math.round).join(',')})`; x.fillRect(xx * k, yy * k, k + 0.5, k + 0.5); }
          x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.moveTo(64 - 10, 64); x.lineTo(64 + 10, 64); x.moveTo(64, 64 - 10); x.lineTo(64, 64 + 10); x.stroke(); x.strokeStyle = '#16191C'; x.lineWidth = 1.2; x.stroke();
          t.classList.remove('done', 'right', 'wrong'); t.querySelector('.tr').textContent = '';
        });
        score();
      }
      function score() {
        const n = answers.filter(a => a !== null).length, ok = answers.filter((a, i) => a === patches[i].c).length;
        if (n === patches.length) best[view.value] = ok;
        q('c-score').innerHTML = `${view.value === 'photo' ? 'Aerial photo' : 'LiDAR heights'}: answered ${n} of ${patches.length}, ${ok} right. ` + `Same eight patches so far: photo ${best.photo === null ? '-' : best.photo + ' of ' + patches.length}, LiDAR ${best.lidar === null ? '-' : best.lidar + ' of ' + patches.length}.`;
      }
      tiles.addEventListener('click', e => {
        const b = e.target.closest('button[data-a]'), t = e.target.closest('.tile'); if (!b || !t || t.classList.contains('done')) return;
        const i = +t.dataset.i, a = +b.dataset.a, ok = a === patches[i].c; answers[i] = a; t.classList.add('done', ok ? 'right' : 'wrong'); t.querySelector('.tr').textContent = ok ? 'Yes: ' + L.CLS[patches[i].c].toLowerCase() : 'It was ' + L.CLS[patches[i].c].toLowerCase(); score();
      });
      view.addEventListener('change', () => drawTiles());
      q('c-new').addEventListener('click', newSet);

      /* ================= step 2: the tiny network ================= */
      const pIn = H.plot(root, 'c-in', opt), pIr = H.plot(root, 'c-ir', opt), pFh = H.plot(root, 'c-fh', opt), pFr = H.plot(root, 'c-fr', opt), pPr = H.plot(root, 'c-pr', opt), pTr = H.plot(root, 'c-tr', opt);
      const pCf = H.plot(root, 'c-cf', { xr: [0, 1], yr: [0, 1], noAxes: true, aspect: 1, m: { l: 2, r: 2, t: 2, b: 2 } });
      const idx = ML.shuffle(N * N, ML.rng(5)).slice(0, 600), inIdx = new Set(idx), rest = []; for (let i = 0; i < N * N; i++) if (!inIdx.has(i)) rest.push(i);
      const T = Object.assign({}, T0); let obs, hm, rm, pred, cf, tuneNote = '';
      const fs = H.bind(root, 'c-fs', () => { calc(); drawAll(); }, v => v + ' × ' + v), den2 = H.bind(root, 'c-den2', () => { calc(); drawAll(); }, v => v);
      const sl = { a: H.bind(root, 'c-a', v => { T.a = v; classify(); drawAll(); }, v => v.toFixed(2)), b: H.bind(root, 'c-b', v => { T.b = v; classify(); drawAll(); }, v => v.toFixed(2)), c: H.bind(root, 'c-c', v => { T.c = v; classify(); drawAll(); }, v => v.toFixed(1)), q: H.bind(root, 'c-q', v => { T.q = v; classify(); drawAll(); }, v => v.toFixed(2)) };
      const setT = t => { Object.assign(T, t); ['a', 'b', 'c', 'q'].forEach(k => { q('c-' + k).value = T[k]; q('c-' + k + '-o').textContent = k === 'c' ? T[k].toFixed(1) : T[k].toFixed(2); }); };
      function calc() { obs = L.observe(sc, den2.get()); hm = L.median(obs.h, fs.get()); rm = L.smooth(obs.ret, fs.get()); classify(); }
      function classify() { pred = L.classify(hm, rm, T); cf = L.confusion(pred, sc.cls); }
      q('c-tune').addEventListener('click', () => { const t = L.tune(hm, rm, sc.cls, idx, T); setT(t); classify(); tuneNote = `Auto-tune looked at 600 labeled pixels: ${H.pct(L.accuracy(pred, sc.cls, idx))} right on those, and ${H.pct(L.accuracy(pred, sc.cls, rest))} right on all the others. `; drawAll(); });
      q('c-reset').addEventListener('click', () => { setT(T0); tuneNote = ''; classify(); drawAll(); });
      q('c-true').addEventListener('change', () => pTr.draw());
      pIn.onDraw = pl => paint(pl, i => { const hc = L.heightColor(obs.h[i]), sh = L.shade(obs.h, i % N, Math.floor(i / N)); return hc.map(v => Math.min(255, v * sh)); });
      pIr.onDraw = pl => paint(pl, i => retColor(obs.ret[i]));
      pFh.onDraw = pl => paint(pl, i => L.heightColor(hm[i]));
      pFr.onDraw = pl => paint(pl, i => retColor(rm[i]));
      pPr.onDraw = pl => paint(pl, i => CC[pred[i]]);
      pTr.onDraw = pl => {
        if (q('c-true').checked) paint(pl, i => CC[sc.cls[i]]);
        else { paint(pl, i => [244, 246, 247]); const c = pl.ctx; c.save(); c.fillStyle = 'rgba(255,255,255,0.92)'; c.fillRect(pl.W / 2 - 110, pl.H / 2 - 20, 220, 40); c.restore(); pl.ptext('Hidden. Turn on the switch.', pl.W / 2, pl.H / 2, { align: 'center', font: '600 14px system-ui', color: C.INK }); }
      };
      pCf.onDraw = pl => {
        const c = pl.ctx, W = pl.W, lw = 48, top = 34, cw = (W - lw - 4) / 5, ch = (pl.H - top - 4) / 5;
        c.save(); c.font = '600 11px system-ui'; c.fillStyle = C.INK; c.textAlign = 'center'; c.textBaseline = 'middle'; L.SHORT.forEach((n, k) => c.fillText(n, lw + (k + 0.5) * cw, top - 10)); c.textAlign = 'right'; L.SHORT.forEach((n, k) => c.fillText(n, lw - 4, top + (k + 0.5) * ch)); c.textAlign = 'left'; c.font = '11px system-ui'; c.fillStyle = C.SLATE; c.fillText('predicted', lw, 8);
        for (let i = 0; i < 5; i++) { const tot = cf[i].reduce((a, b) => a + b, 0) || 1; for (let j = 0; j < 5; j++) { const v = cf[i][j] / tot, a = [244, 246, 247], b = [132, 22, 23]; c.fillStyle = `rgb(${a.map((x, k) => Math.round(x + (b[k] - x) * v)).join(',')})`; c.fillRect(lw + j * cw + 1, top + i * ch + 1, cw - 2, ch - 2); c.fillStyle = v > 0.55 ? '#fff' : C.INK; c.textAlign = 'center'; c.font = '600 12px system-ui'; c.fillText(Math.round(v * 100) + '%', lw + (j + 0.5) * cw, top + (i + 0.5) * ch); } }
        c.restore();
      };
      function drawAll() {
        [pIn, pIr, pFh, pFr, pPr, pTr, pCf].forEach(p => p.draw());
        const acc = L.accuracy(pred, sc.cls), col = L.accuracy(L.colorOnly(sc, idx), sc.cls);
        q('c-out').innerHTML = `${tuneNote}Land cover right with these thresholds: <b>${H.pct(acc)}</b> of the 9,216 cells (${fs.get()} × ${fs.get()} filters, ${den2.get()} LiDAR points per m²). Using only the photo colors, a classifier trained on the same 600 pixels gets <b>${H.pct(col)}</b>.`;
      }

      /* ---- tabs ---- */
      let step = 1;
      root.querySelectorAll('#cn-tabs .tab').forEach(b => b.addEventListener('click', () => {
        step = +b.dataset.s; root.querySelectorAll('#cn-tabs .tab').forEach(x => x.classList.toggle('on', x === b)); root.querySelectorAll('.track[data-s]').forEach(x => x.classList.toggle('on', +x.dataset.s === step));
        if (step === 2) { [pIn, pIr, pFh, pFr, pPr, pTr, pCf].forEach(p => p.fit()); drawAll(); }
      }));
      newSet(); calc();
    }
  });
})(window);
