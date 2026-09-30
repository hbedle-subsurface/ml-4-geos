/* modules_geo.js - the geophysics demo: synthetic seismic, attributes, SOM, which attributes matter, wells */
(function (g) {
  const { ML, DATA: D, Plot, H, MODULES: M, SEIS: S } = g;
  const C = Plot.C, N = S.N;
  const ramp = t => { t = Math.max(0, Math.min(1, t)); const a = [244, 246, 247], b = [132, 22, 23]; return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`; };
  const MAPO = { m: { l: 3, r: 3, t: 3, b: 3 }, xr: [0, N], yr: [0, N], invY: true, noAxes: true };

  M.push({
    id: 'geo', part: 2, title: 'Geophysics: from a seismic section to a facies map',
    lede: 'A synthetic channel system, five steps. We start from the seismic, measure attributes, let a self-organizing map group them, test which attributes the map relies on, and finish with wells.',
    steps: [
      'The seismic. Move the line slider and follow the channel on the section. Lower the wavelet frequency and watch the thin edges of the channel lose detail.',
      'The attributes. Change the window length and compare the four maps. Use the checkboxes to pick the attributes that go forward.',
      'The SOM. Choose the number of neurons and the number of facies. Turn on the true facies to compare.',
      'Which attributes matter. Shuffle one attribute across the map and see how much of the facies map changes.',
      'Wells. Add wells and follow the supervised map. Note which facies the first wells never cut.'
    ],
    html: () => `
      <div class="tabs" role="tablist" id="gs-tabs">
        <button type="button" class="tab on" data-s="1" role="tab">1 Seismic</button>
        <button type="button" class="tab" data-s="2" role="tab">2 Attributes</button>
        <button type="button" class="tab" data-s="3" role="tab">3 SOM</button>
        <button type="button" class="tab" data-s="4" role="tab">4 What matters</button>
        <button type="button" class="tab" data-s="5" role="tab">5 Wells</button>
      </div>
      ${H.legend(S.FAC, S.FCOL)}

      <div class="track on" data-s="1">
        <p class="note">The section is a synthetic seismic line across the map on the right. The colored strip above it is the geology along the line, and the dotted lines carry each boundary down through the section.</p>
        <div class="row-sec">
          <div>${H.cv('gs-a', 0.78)}</div>
          <div><h5>RMS amplitude map, line in red (click to move it)</h5>${H.cv('gs-b', 1)}</div>
        </div>
        <div class="ctlrow">${H.S('gs-f', 'Wavelet frequency', 10, 70, 1, 30)}${H.S('gs-n', 'Noise', 0, 40, 1, 10)}${H.S('gs-l', 'Line position', 0, 63, 1, 32)}</div>
        <div class="ctlrow">${H.btn('gs-play', 'Play the line across the map')}</div>
      </div>

      <div class="track" data-s="2">
        <div class="row-att">
          <div class="maps4">
            ${[0, 1, 2, 3].map(a => `<div><h5>${S.ANAMES[a]}</h5>${H.cv('ga-' + a, 1)}<label class="chk"><input type="checkbox" data-a="${a}" checked> use in the analysis</label></div>`).join('')}
          </div>
          <div>
            <h5>Crossplot of two attributes</h5>
            <div class="ctlrow"><div class="ctl"><label for="ga-x">Horizontal</label><select id="ga-x"></select></div><div class="ctl"><label for="ga-y">Vertical</label><select id="ga-y"></select></div></div>
            ${H.cv('ga-c', 0.95)}
            ${H.chk('ga-t', 'Color by true facies', false)}
          </div>
        </div>
        ${H.S('ga-w', 'Window length around the target (ms)', 20, 120, 4, 60)}
        <div class="cards">
          <details><summary>RMS amplitude</summary><p class="note">Measures the square root of the average squared amplitude in the window, so it tracks how strong the reflections are. Strong values often go with sandstone bodies that contrast with the shale around them, and weak values often go with uniform shale.</p></details>
          <details><summary>Peak envelope</summary><p class="note">Measures the largest value of the envelope in the window. The envelope is the instantaneous strength of the trace whatever the polarity. High values often mark strong impedance contrasts, such as channel fill against shale.</p></details>
          <details><summary>Mean frequency</summary><p class="note">Measures the average frequency of the amplitude spectrum in the window, from 0 to 100 Hz. Lower values often go with attenuation and thick beds. In this model the channel sand lowers the frequency by construction.</p></details>
          <details><summary>Local variability</summary><p class="note">Measures the standard deviation of RMS amplitude in each 3 × 3 block of neighboring traces. High values mark places where amplitude changes quickly from trace to trace, such as the edges of bodies.</p></details>
        </div>
      </div>

      <div class="track" data-s="3">
        <p class="note" id="g3-note"></p>
        <div class="row3">
          <div><h5>The self-organizing map</h5>${H.cv('g3-a', 1)}</div>
          <div><h5>Facies from the map</h5>${H.cv('g3-b', 1)}</div>
          <div><h5 id="g3-h">True facies</h5>${H.cv('g3-c', 1)}</div>
        </div>
        <div class="ctlrow">${H.S('g3-s', 'Neurons per side', 2, 8, 1, 4)}${H.S('g3-k', 'Facies (groups of neurons)', 2, 6, 1, 3)}</div>
        <div class="ctlrow">${H.btn('g3-train', 'Watch the map train')}${H.btn('g3-new', 'New start')}${H.chk('g3-t', 'Show the true facies', false)}</div>
        <div class="readout" id="g3-out"></div>
      </div>

      <div class="track" data-s="4">
        <p class="note">Two tests. Shuffling an attribute among the traces removes its link to location and leaves the others alone, and the share of traces that change facies measures how much the trained map relies on it. Refitting the SOM without an attribute shows how much the result depends on having it at all. Attributes that carry the same information cover for each other.</p>
        <div class="row3">
          <div><h5>Facies map with one attribute shuffled</h5>${H.cv('g4-a', 1)}</div>
          <div><h5>Traces that change facies after a full shuffle</h5>${H.cv('g4-b', 1)}</div>
          <div><h5>SOM refit without that attribute</h5>${H.cv('g4-c', 1)}</div>
        </div>
        <div class="ctlrow"><div class="ctl"><label for="g4-attr">Attribute to shuffle</label><select id="g4-attr"></select></div>${H.S('g4-f', 'Share of traces shuffled', 0, 100, 5, 0)}</div>
        <div class="readout" id="g4-out"></div>
      </div>

      <div class="track" data-s="5">
        <p class="note">Wells give the facies at a few locations. Each trace takes the facies of the well with the most similar attributes (nearest neighbor). Clicking the map adds a well.</p>
        <div class="row2">
          <div><h5>Supervised facies map, wells marked</h5>${H.cv('g5-a', 1)}</div>
          <div><h5>True facies</h5>${H.cv('g5-b', 1)}</div>
        </div>
        <div class="ctlrow">${H.S('g5-n', 'Wells (random locations)', 1, 40, 1, 6)}${H.btn('g5-clr', 'Remove added wells')}</div>
        <div class="readout" id="g5-out"></div>
      </div>`,
    init(root) {
      const st = { f: 30, noise: 10, half: 15, line: 32, inc: [true, true, true, true], side: 4, k: 3, seed: 3, attr: 0, frac: 0, wells: 6, extra: [], step: 1 };
      let tr, A, cols, Xz, P, cls, protoCls, imp, bmuAll, loo, full;
      const order = ML.shuffle(N * N, ML.rng(8)), perm = ML.shuffle(N * N, ML.rng(15)), u = Array.from({ length: N * N }, ((r) => () => r())(ML.rng(16)));
      const gray = v => { const x = Math.round(255 * (0.5 - 0.5 * Math.max(-1, Math.min(1, v / 0.3)))); return `rgb(${x},${x},${x})`; };
      const cell = (pl, fn) => { for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) pl.rect(i, j, i + 1.03, j + 1.03, fn(j * N + i)); };
      const noteEl = H.q(root, 'g3-note');

      /* ---------- computation ---------- */
      function calcAll(level) {           // 0 traces, 1 attributes, 2 features and SOM, 3 SOM only
        if (level <= 0) tr = S.synth(st.f, st.noise);
        if (level <= 1) A = S.attributes(tr, st.half);
        if (level <= 2) {
          cols = [0, 1, 2, 3].filter(i => st.inc[i]);
          if (!cols.length) { cols = [0]; st.inc[0] = true; root.querySelector('input[data-a="0"]').checked = true; }
          const raw = Array.from({ length: N * N }, (_, t) => cols.map(c => A[c][t]));
          Xz = ML.standardize(raw).Z;
          fillAttrSelect();
        }
        P = S.som(Xz, st.side, st.seed); finishSom();
      }
      function classify() {
        const side = st.side, k = Math.min(st.k, side * side);
        const b = S.bmu(Xz, P), km = ML.kmeansBest(P, k, ML.rng(1), 4);
        const mean = new Array(k).fill(0), cnt = new Array(k).fill(0);
        P.forEach((p, i) => { mean[km.labels[i]] += p[0]; cnt[km.labels[i]]++; });
        const ord = mean.map((m, i) => [cnt[i] ? m / cnt[i] : 1e9, i]).sort((x, y) => x[0] - y[0]), rank = new Array(k); ord.forEach((o, r) => { rank[o[1]] = r; });
        protoCls = km.labels.map(l => rank[l]); bmuAll = b; cls = b.map(x => protoCls[x]);
      }
      function finishSom() {
        classify();
        const side = st.side, k = Math.min(st.k, side * side);
        full = ML.purity(cls, Array.from(S.fac), k, 3);
        loo = cols.length < 2 ? null : cols.map((_, q) => {
          const X2 = Xz.map(x => x.filter((_, i) => i !== q)), P2 = S.som(X2, side, st.seed), b2 = S.bmu(X2, P2), km2 = ML.kmeansBest(P2, k, ML.rng(1), 4);
          return ML.purity(b2.map(x => km2.labels[x]), Array.from(S.fac), k, 3);
        });
        imp = cols.map((_, q) => { const X2 = Xz.map((x, t) => { const y = x.slice(); y[q] = Xz[perm[t]][q]; return y; }); const c2 = S.bmu(X2, P).map(x => protoCls[x]); return c2.reduce((s, v, t) => s + (v !== cls[t] ? 1 : 0), 0) / c2.length; });
      }
      const fillAttrSelect = () => {
        const sel = H.q(root, 'g4-attr'), keep = sel.value;
        sel.innerHTML = cols.map((c, q) => `<option value="${q}">${S.ANAMES[c]}</option>`).join('');
        if (keep && +keep < cols.length) sel.value = keep;
      };
      const wellList = () => order.slice(0, st.wells).concat(st.extra);
      const wellPred = () => { const w = wellList(); return ML.knnPredict(w.map(t => Xz[t]), w.map(t => S.fac[t]), Xz, 1, 3); };

      /* ---------- plots ---------- */
      const pA = H.plot(root, 'gs-a', { xr: [0, N], yr: [40, 200], invY: true, xl: 'Trace along the line', yl: 'Two-way time (ms)', nx: 8, ny: 8, m: { l: 50, r: 10, t: 34, b: 38 }, aspect: 0.78 });
      const pB = H.plot(root, 'gs-b', MAPO);
      pA.onDraw = pl => {
        pl.axes(); const j = st.line, W = pl.pw / N;
        for (let i = 0; i < N; i++) for (let s = 20; s < 100; s++) pl.rect(i, s * S.DT, i + 1.03, (s + 1) * S.DT + 0.4, gray(tr[(j * N + i) * S.NS + s]));
        // geology strip and guide lines
        const c = pl.ctx; let i0 = 0;
        for (let i = 1; i <= N; i++) {
          if (i === N || S.fac[j * N + i] !== S.fac[j * N + i0]) {
            const f = S.fac[j * N + i0], x0 = pl.x(i0), x1 = pl.x(i);
            c.fillStyle = S.FCOL[f]; c.fillRect(x0, 8, x1 - x0, 14);
            if (x1 - x0 > 46) pl.ptext(f === 0 ? 'Floodplain' : S.FAC[f].split(' ')[0], (x0 + x1) / 2, 15, { align: 'center', font: '11px system-ui', color: f === 1 ? C.INK : '#fff' });
            if (i0 > 0) { c.save(); c.setLineDash([2, 3]); c.strokeStyle = 'rgba(132,22,23,0.75)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, 22); c.lineTo(x0, pl.y(200)); c.stroke(); c.restore(); }
            i0 = i;
          }
        }
        const lo = (S.C0 - st.half) * S.DT, hi = (S.C0 + st.half) * S.DT;
        pl.hline(lo, C.RED, 1.5, [6, 4]); pl.hline(hi, C.RED, 1.5, [6, 4]);
        pl.text('attribute window', 1, lo - 4, { color: C.RED, font: '11px system-ui' });
      };
      pB.onDraw = pl => {
        cell(pl, t => ramp(A[0][t] / S.ARANGE[0][1]));
        pl.rect(0, st.line, N, st.line + 1, null, C.RED); pl.line([[0, st.line + 0.5], [N, st.line + 0.5]], C.RED, 2);
      };
      pB.c.addEventListener('click', e => { const r = pB.c.getBoundingClientRect(), y = pB.iy(e.clientY - r.top); ln.set(Math.max(0, Math.min(N - 1, Math.floor(y)))); });
      const mkStd = (id) => { const p = H.plot(root, id, MAPO); return p; };

      // step 2
      const pa = [0, 1, 2, 3].map(a => { const p = mkStd('ga-' + a); p.onDraw = pl => { const [lo, hi] = S.ARANGE[a]; cell(pl, t => ramp((A[a][t] - lo) / (hi - lo))); if (!st.inc[a]) { pl.ctx.fillStyle = 'rgba(255,255,255,0.7)'; pl.ctx.fillRect(0, 0, pl.W, pl.H); } }; return p; });
      const xs = H.q(root, 'ga-x'), ys = H.q(root, 'ga-y');
      [xs, ys].forEach((s, k) => { S.ANAMES.forEach((n, i) => s.insertAdjacentHTML('beforeend', `<option value="${i}">${n}</option>`)); s.value = k === 0 ? '0' : '2'; s.addEventListener('change', () => pc.draw()); });
      const pc = H.plot(root, 'ga-c', { xr: [0, 1], yr: [0, 1], nx: 5, ny: 5, aspect: 0.95 });
      const ct = H.q(root, 'ga-t'); ct.addEventListener('change', () => pc.draw());
      pc.onDraw = pl => {
        const a = +xs.value, b = +ys.value; pl.o.xr = S.ARANGE[a]; pl.o.yr = S.ARANGE[b]; pl.o.xl = S.ANAMES[a]; pl.o.yl = S.ANAMES[b]; pl.axes();
        for (let t = 0; t < N * N; t++) pl.dot(A[a][t], A[b][t], 2.2, ct.checked ? Plot.hex2rgba(S.FCOL[S.fac[t]], 0.75) : 'rgba(92,102,112,0.4)');
      };
      root.querySelectorAll('input[data-a]').forEach(cb => cb.addEventListener('change', () => { st.inc[+cb.dataset.a] = cb.checked; calcAll(2); drawStep(); }));
      H.bind(root, 'ga-w', v => { st.half = Math.round(v / 4); calcAll(1); drawStep(); }, v => v + ' ms');

      // step 3
      const p3a = H.plot(root, 'g3-a', { xr: [0, 1], yr: [0, 1], invY: true, noAxes: true, m: { l: 4, r: 4, t: 4, b: 4 } });
      const p3b = mkStd('g3-b'), p3c = mkStd('g3-c');
      const t3 = H.q(root, 'g3-t'); t3.addEventListener('change', () => { p3c.draw(); readout3(); });
      p3a.onDraw = pl => {
        const side = st.side, hits = new Array(side * side).fill(0); bmuAll.forEach(b => hits[b]++);
        const mx = Math.max(...hits), cw = 1 / side;
        for (let k = 0; k < side * side; k++) {
          const i = k % side, j = Math.floor(k / side), cx = (i + 0.5) * cw, cy = (j + 0.5) * cw, col = Plot.CLUSTER[protoCls[k] % 8];
          pl.rect(i * cw + 0.004, j * cw + 0.004, (i + 1) * cw - 0.004, (j + 1) * cw - 0.004, Plot.hex2rgba(col, hits[k] ? 0.3 : 0.08));
          if (hits[k]) pl.dot(cx, cy, Math.max(3, 0.42 * cw * pl.pw * Math.sqrt(hits[k] / mx)), col, '#fff', 1);
        }
        pl.rect(0, 0, 1, 1, null, C.SLATE);
      };
      p3b.onDraw = pl => cell(pl, t => Plot.CLUSTER[cls[t] % 8]);
      p3c.onDraw = pl => { if (t3.checked) cell(pl, t => S.FCOL[S.fac[t]]); else { pl.rect(0, 0, N, N, '#F4F6F7', C.GRID); pl.ptext('hidden', pl.W / 2, pl.H / 2, { align: 'center', color: C.SLATE }); } };
      const readout3 = () => {
        const k = Math.min(st.k, st.side * st.side);
        noteEl.innerHTML = `${cols.length} attribute${cols.length > 1 ? 's' : ''} in: ${cols.map(c => S.ANAMES[c]).join(', ')}. Each dot in the map is a neuron, sized by the number of traces that fall on it and colored by the facies group it belongs to.${st.side * st.side < st.k ? ' There are fewer neurons than facies, so the number of groups is capped.' : ''}`;
        H.q(root, 'g3-out').innerHTML = `${st.side * st.side} neurons in ${k} groups.` + (t3.checked ? ` Agreement with the true facies: <b>${H.pct(ML.purity(cls, Array.from(S.fac), k, 3))}</b> of traces fall in a group whose most common true facies matches theirs.` : ' The true facies are hidden.');
      };
      H.bind(root, 'g3-s', v => { stopTrain(); st.side = v; calcAll(3); drawStep(); }, v => v);
      H.bind(root, 'g3-k', v => { stopTrain(); st.k = v; calcAll(3); drawStep(); }, v => v);
      H.on(root, 'g3-new', 'click', () => { stopTrain(); st.seed += 11; calcAll(3); drawStep(); });
      let trainRaf = 0;
      const stopTrain = () => { if (trainRaf) { cancelAnimationFrame(trainRaf); trainRaf = 0; } };
      H.on(root, 'g3-train', 'click', () => {
        stopTrain(); const state = S.somInit(Xz, st.side, st.seed); let last = 0;
        P = state.P; classify();
        const tick = now => {
          if (now - last > 80) {
            last = now; const done = S.somAdvance(state, 60); classify();
            if (st.step === 3) { p3a.draw(); p3b.draw(); }
            if (done) { trainRaf = 0; finishSom(); if (st.step === 3) { p3a.draw(); p3b.draw(); readout3(); } return; }
            H.q(root, 'g3-out').innerHTML = `Training: ${Math.round(state.t / state.T * 100)}% of the updates done. Each update pulls the closest neuron and its neighbors toward one trace.`;
          }
          trainRaf = requestAnimationFrame(tick);
        };
        trainRaf = requestAnimationFrame(tick);
      });

      // step 4
      const p4a = mkStd('g4-a');
      const p4b = H.plot(root, 'g4-b', { xr: [0.5, 4.5], yr: [0, 100], nx: 4, ny: 5, yl: 'Traces that change facies (%)' });
      p4b.o.fmtx = v => (Number.isInteger(v) && cols[v - 1] !== undefined ? S.ASHORT[cols[v - 1]] : '');
      const shuffled = () => {
        const q = +H.q(root, 'g4-attr').value || 0, f = st.frac / 100;
        const X2 = Xz.map((x, t) => { if (u[t] >= f) return x; const y = x.slice(); y[q] = Xz[perm[t]][q]; return y; });
        return S.bmu(X2, P).map(x => protoCls[x]);
      };
      H.on(root, 'g4-attr', 'change', () => drawStep());
      H.bind(root, 'g4-f', v => { st.frac = v; drawStep(); }, v => v + '%');
      let c4 = null;
      p4a.onDraw = pl => { c4 = shuffled(); cell(pl, t => Plot.CLUSTER[c4[t] % 8]); };
      p4b.onDraw = pl => {
        pl.o.xr = [0.5, cols.length + 0.5]; pl.o.nx = cols.length; pl.axes();
        imp.forEach((v, q) => pl.rect(q + 1 - 0.3, 0, q + 1 + 0.3, v * 100, q === (+H.q(root, 'g4-attr').value || 0) ? C.RED : 'rgba(92,102,112,0.55)'));
        imp.forEach((v, q) => pl.text(Math.round(v * 100) + '%', q + 1, Math.min(v * 100 + 6, 96), { align: 'center', font: 'bold 12px system-ui' }));
        const changed = c4.reduce((s, v, t) => s + (v !== cls[t] ? 1 : 0), 0) / c4.length, q = +H.q(root, 'g4-attr').value || 0;
        H.q(root, 'g4-out').innerHTML = `Shuffling <b>${st.frac}%</b> of the traces for ${S.ANAMES[cols[q]]} changes the facies of <b>${H.pct(changed)}</b> of all traces. A full shuffle changes <b>${H.pct(imp[q])}</b>.`;
      };

      const p4c = H.plot(root, 'g4-c', { xr: [0.5, 4.5], yr: [0, 100], nx: 4, ny: 5, yl: 'Agreement with true facies (%)' });
      p4c.onDraw = pl => {
        pl.o.xr = [0.5, cols.length + 0.5]; pl.o.nx = cols.length; pl.o.fmtx = v => (Number.isInteger(v) && cols[v - 1] !== undefined ? 'no ' + S.ASHORT[cols[v - 1]] : ''); pl.axes();
        pl.hline(full * 100, C.RED, 1.5, [6, 4]); pl.text('all attributes ' + Math.round(full * 100) + '%', pl.o.xr[0] + 0.05, Math.min(full * 100 + 5, 97), { color: C.RED, font: '11px system-ui' });
        if (!loo) { pl.text('only one attribute is in use', cols.length / 2 + 0.5, 50, { align: 'center', color: C.SLATE }); return; }
        loo.forEach((v, q) => { pl.rect(q + 1 - 0.3, 0, q + 1 + 0.3, v * 100, 'rgba(92,102,112,0.55)'); pl.text(Math.round(v * 100) + '%', q + 1, Math.max(v * 100 - 7, 5), { align: 'center', font: 'bold 12px system-ui', color: '#fff' }); });
      };
      // step 5
      const p5a = mkStd('g5-a'), p5b = mkStd('g5-b');
      let pred5 = null;
      p5a.onDraw = pl => {
        pred5 = wellPred(); cell(pl, t => S.FCOL[pred5[t]]);
        wellList().forEach(t => pl.dot(t % N + 0.5, Math.floor(t / N) + 0.5, 5.5, S.FCOL[S.fac[t]], C.INK, 2));
        const w = wellList(), cut = [...new Set(w.map(t => S.fac[t]))].sort(), acc = ML.acc(pred5, Array.from(S.fac));
        H.q(root, 'g5-out').innerHTML = `${w.length} well${w.length > 1 ? 's' : ''}. Wells cut: <b>${cut.map(f => S.FAC[f]).join(', ')}</b>${cut.length < 3 ? '; the map cannot show ' + [0, 1, 2].filter(f => !cut.includes(f)).map(f => S.FAC[f]).join(' or ') + ', because no well has seen it' : ''}. Correct on all ${N * N} traces: <b>${H.pct(acc)}</b>.`;
      };
      p5b.onDraw = pl => cell(pl, t => S.FCOL[S.fac[t]]);
      p5a.c.addEventListener('click', e => { const r = p5a.c.getBoundingClientRect(), x = Math.floor(p5a.ix(e.clientX - r.left)), y = Math.floor(p5a.iy(e.clientY - r.top)); if (x >= 0 && y >= 0 && x < N && y < N) { st.extra.push(y * N + x); drawStep(); } });
      H.bind(root, 'g5-n', v => { st.wells = v; drawStep(); }, v => v);
      H.on(root, 'g5-clr', 'click', () => { st.extra = []; drawStep(); });

      /* ---------- controls of step 1 ---------- */
      let pending = null, raf = 0;
      const later = lvl => { pending = pending === null ? lvl : Math.min(pending, lvl); if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const l = pending; pending = null; calcAll(l); drawStep(); }); };
      H.bind(root, 'gs-f', v => { st.f = v; later(0); }, v => v + ' Hz');
      H.bind(root, 'gs-n', v => { st.noise = v; later(0); }, v => v + '%');
      const ln = H.bind(root, 'gs-l', v => { st.line = v; drawStep(); }, v => v);
      let playing = false, playRaf = 0, lastPlay = 0;
      const playBtn = H.q(root, 'gs-play');
      const playTick = now => {
        if (!playing) return;
        if (root.isConnected && pA.c.clientWidth && now - lastPlay > 110) { lastPlay = now; ln.set((ln.get() + 1) % N); }
        playRaf = requestAnimationFrame(playTick);
      };
      playBtn.addEventListener('click', () => {
        playing = !playing; playBtn.textContent = playing ? 'Pause' : 'Play the line across the map';
        if (playing) playRaf = requestAnimationFrame(playTick); else cancelAnimationFrame(playRaf);
      });

      /* ---------- steps ---------- */
      const plots = { 1: [pA, pB], 2: pa.concat([pc]), 3: [p3a, p3b, p3c], 4: [p4a, p4b, p4c], 5: [p5a, p5b] };
      function drawStep() { plots[st.step].forEach(p => { p.fit(); p.draw(); }); if (st.step === 3) readout3(); }
      root.querySelectorAll('#gs-tabs .tab').forEach(b => b.addEventListener('click', () => {
        st.step = +b.dataset.s;
        root.querySelectorAll('#gs-tabs .tab').forEach(x => x.classList.toggle('on', x === b));
        root.querySelectorAll('.track[data-s]').forEach(x => x.classList.toggle('on', +x.dataset.s === st.step));
        drawStep();
      }));
      calcAll(0); drawStep();
    }
  });
})(window);
