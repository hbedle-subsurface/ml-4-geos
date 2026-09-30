/* modules2.js - supervised, semi-supervised, neural network playground, LLMs in research */
(function (g) {
  const { ML, DATA: D, Plot, H, MODULES: M } = g;
  const C = Plot.C, R = H.R, Z = H.Z2;
  const XR = [0, 150], YR = [2.0, 2.9];
  const toZ = (x, y) => [(x - R.mean[0]) / R.sd[0], (y - R.mean[1]) / R.sd[1]];

  /* decision-region shading on a grid; predictor takes a standardized point */
  function regions(pl, pred, nx, ny, cols) {
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const x0 = pl.o.xr[0] + (i / nx) * (pl.o.xr[1] - pl.o.xr[0]), x1 = pl.o.xr[0] + ((i + 1) / nx) * (pl.o.xr[1] - pl.o.xr[0]);
      const y0 = pl.o.yr[0] + (j / ny) * (pl.o.yr[1] - pl.o.yr[0]), y1 = pl.o.yr[0] + ((j + 1) / ny) * (pl.o.yr[1] - pl.o.yr[0]);
      const c = pred((x0 + x1) / 2, (y0 + y1) / 2);
      pl.rect(x0, y0, x1, y1, Plot.hex2rgba(cols[c], 0.2));
    }
  }

  /* ---------- 6. neural network ---------- */
  M.push({
    id: 'nn', part: 1, title: 'Neural networks',
    lede: '', steps: [],
    html: () => `
      <div class="tabs" role="tablist" id="nn-tabs">
        <button type="button" class="tab on" data-s="1">1 One measurement: siltstone</button><button type="button" class="tab" data-s="2">2 A map: the ore shell</button>
      </div>

      <div class="track on" data-s="1">
        ${H.look('First, set two cuts by hand (step A) so the window covers the red dots and leaves out the others. Then, in step B, set Hidden neurons to 0 and press Train. Try 1, then 2, then 4.', 'Siltstone reads in the middle on gamma ray, between sandstone and shale. One cut can only say above or below, so it cannot pick out the middle. Each hidden neuron makes one cut, and the output neuron combines them. A window takes two cuts, so it takes at least two hidden neurons. With 0 or 1, the network does no better than calling every sample not siltstone.')}
        <h4>A. Set the cuts by hand</h4>
        ${H.cv('nn1-a', 0.42)}
        <div class="ctlrow">${H.S('nn1-lo', 'Lower cut (gamma ray)', 5, 145, 1, 45)}${H.S('nn1-hi', 'Upper cut (gamma ray)', 5, 145, 1, 135)}</div>
        ${H.legend(['Sandstone', 'Siltstone', 'Shale'], ['#D9A21B', '#841617', '#7A4F8F'])}
        <div class="readout" id="nn1-ha"></div>
        <h4>B. Let a network find the cuts</h4>
        ${H.cv('nn1-b', 0.5)}
        <div class="ctlrow">${H.S('nn1-h', 'Hidden neurons', 0, 4, 1, 0)}${H.btn('nn1-go', 'Train')}${H.btn('nn1-reset', 'Reset')}</div>
        <div class="readout" id="nn1-out"></div>
      </div>

      <div class="track" data-s="2">
        ${H.look('Choose the ore shell data, set 0 hidden layers and press Train. Then add neurons and train again. Look at the small maps: each one is a single first-layer neuron.', 'Each first-layer neuron draws one soft straight edge, and the output combines the edges. Three edges can enclose a triangle, and six to eight make a rounder blob. Cutting the barren core out of the middle takes more edges still, or a second layer that builds shapes out of the first layer\'s shapes. Move the cursor over the map to see which neurons switch on. The lithology data needs no hidden layer, because straight lines already do a decent job of separating three rock types.')}
        <div class="row2"><div>${H.cv('n-a', 0.95)}</div><div>${H.cv('n-b', 0.95)}</div></div>
        <div class="ctlrow"><div class="ctl"><label for="n-data">Data</label><select id="n-data"><option value="ring">Map: an ore shell around a barren core</option><option value="lith">Logs: three lithologies</option></select></div></div>
        <div class="ctlrow">${H.S('n-h', 'Hidden layers', 0, 3, 1, 1)}${H.S('n-u', 'Neurons per layer', 1, 8, 1, 4)}</div>
        <div class="ctlrow">${H.btn('n-go', 'Train')}${H.btn('n-stop', 'Pause')}${H.btn('n-reset', 'Reset')}</div>
        <div class="readout" id="n-out"></div>
        <h4>What each first-layer neuron sees</h4>
        ${H.cv('n-t', 0.2)}
        <h4>The whole network, lit up by the point under the cursor on the map</h4>
        ${H.cv('n-d', 0.36)}
      </div>`,
    init(root) {
      /* ================= step 1: one measurement ================= */
      const ROCKC = ['#D9A21B', '#841617', '#7A4F8F'], ROCKN = ['Sandstone', 'Siltstone', 'Shale'];
      const S1 = (() => { const r = ML.rng(5), gr = [], lab = [], jit = []; [[40, 13, 0], [75, 10, 1], [112, 13, 2]].forEach(([m, sd, c]) => { for (let i = 0; i < 100; i++) { gr.push(Math.max(5, Math.min(148, m + sd * ML.gauss(r)))); lab.push(c); jit.push((r() - 0.5) * 0.14); } }); return { gr, lab, jit, y: lab.map(c => (c === 1 ? 1 : 0)), X: gr.map(v => [(v - 75) / 40]) }; })();
      const axOpt = { xr: [0, 150], yr: [-0.22, 1.18], xl: 'Gamma ray (API)', nx: 6, ny: 6, fmty: v => (v === 1 ? 'siltstone' : v === 0 ? 'other' : ''), m: { l: 74, r: 10, t: 8, b: 40 } };
      const p1a = H.plot(root, 'nn1-a', Object.assign({ aspect: 0.42 }, axOpt)), p1b = H.plot(root, 'nn1-b', Object.assign({ aspect: 0.5 }, axOpt));
      const dots1 = (pl, wrongFn) => S1.gr.forEach((g, i) => { const yy = S1.y[i] + S1.jit[i]; pl.dot(g, yy, 3.6, Plot.hex2rgba(ROCKC[S1.lab[i]], 0.85), wrongFn && wrongFn(i) ? C.INK : null, 1.6); });
      const lo = H.bind(root, 'nn1-lo', () => p1a.draw(), v => v), hi = H.bind(root, 'nn1-hi', () => p1a.draw(), v => v);
      p1a.onDraw = pl => {
        pl.axes(); const a = Math.min(lo.get(), hi.get()), b = Math.max(lo.get(), hi.get());
        pl.rect(a, -0.22, b, 1.18, 'rgba(132,22,23,0.10)'); pl.vline(a, C.RED, 2, [6, 4]); pl.vline(b, C.RED, 2, [6, 4]);
        pl.text('window', (a + b) / 2, 1.1, { align: 'center', color: C.RED, font: '12px system-ui' });
        const wrong = i => (S1.gr[i] > a && S1.gr[i] < b ? 1 : 0) !== S1.y[i]; dots1(pl, wrong);
        const ok = S1.gr.filter((_, i) => !wrong(i)).length;
        H.q(root, 'nn1-ha').innerHTML = `Inside your window we call the sample siltstone, and outside it we do not. <b>${ok}</b> of 300 samples are right (<b>${H.pct(ok / 300)}</b>). Samples we get wrong have a dark outline. Calling everything not siltstone scores 67%.`;
      };
      let net1, hist1 = [], ep1 = 0, run1 = false, raf1 = 0;
      const hn = H.bind(root, 'nn1-h', () => build1(), v => v);
      const build1 = () => { cancelAnimationFrame(raf1); run1 = false; const h = hn.get(); net1 = new ML.MLP(h === 0 ? [1, 2] : [1, h, 2], ML.rng(2)); hist1 = []; ep1 = 0; p1b.draw(); };
      const loop1 = () => { if (!run1) return; for (let k = 0; k < 10 && ep1 < 800; k++) { hist1.push(net1.step(S1.X, S1.y, 0.05)); ep1++; } p1b.draw(); if (ep1 >= 800) { run1 = false; return; } raf1 = requestAnimationFrame(loop1); };
      H.on(root, 'nn1-go', 'click', () => { if (!run1 && ep1 < 800) { run1 = true; loop1(); } });
      H.on(root, 'nn1-reset', 'click', build1);
      p1b.onDraw = pl => {
        pl.axes(); const h = hn.get(), curve = [], hid = Array.from({ length: h }, () => []);
        for (let g = 0; g <= 150; g += 2) { const f = net1.forward([(g - 75) / 40]); curve.push([g, f.p[1]]); for (let j = 0; j < h; j++) hid[j].push([g, (f.a[1][j] + 1) / 2]); }
        pl.hline(0.5, C.GRID, 1.5, [5, 4]);
        if (ep1 > 0) {
          hid.forEach((pts, j) => pl.line(pts, Plot.hex2rgba(Plot.CLUSTER[j], 0.85), 1.8));
          pl.line(curve, C.RED, 3.4);
          curve.forEach(([g, p], k) => { if (p > 0.5 && k < curve.length - 1) pl.rect(g, -0.22, g + 2, -0.15, C.RED); });
          pl.text('network says siltstone', 2, -0.185, { color: '#fff', font: '11px system-ui' });
        } else { pl.line(curve, '#9AA1A8', 2.5, [6, 4]); pl.text('untrained: random cuts', 112, 0.72, { align: 'center', color: C.SLATE, font: '12px system-ui' }); }
        dots1(pl, i => ep1 > 0 && (net1.forward(S1.X[i]).p[1] > 0.5 ? 1 : 0) !== S1.y[i]);
        const acc = S1.X.filter((x, i) => (net1.forward(x).p[1] > 0.5 ? 1 : 0) === S1.y[i]).length / 300;
        let msg = ep1 === 0 ? 'Press Train. The red curve is the network\'s probability that a sample is siltstone.' : `Epoch <b>${ep1}</b>. <b>${H.pct(acc)}</b> right.`;
        if (ep1 > 0) msg += h === 0 ? ' With no hidden neuron there is one cut, so the curve can only rise once or fall once.' : h === 1 ? ' One hidden neuron makes one cut, so the curve still cannot come back down.' : acc > 0.88 ? ' Two or more cuts let the curve rise and then fall again: a bump around siltstone.' : '';
        if (h > 0) msg += ' Thin colored lines: what each hidden neuron reports.';
        H.q(root, 'nn1-out').innerHTML = msg;
      };

      /* ================= step 2: a map ================= */
      const mk = kind => {
        const r = ML.rng(9), X = [], y = [], raw = [];
        if (kind === 'ring') {
          for (let i = 0; i < 320; i++) { const a = r() * 10, b = r() * 10, d = Math.hypot(a - 5, b - 5); raw.push([a, b]); X.push([(a - 5) / 3, (b - 5) / 3]); y.push(d > 1.8 && d < 3.5 ? 1 : 0); }
          return { X, y, raw, nc: 2, cols: ['#C9CDD2', '#841617'], names: ['barren', 'ore shell'], xr: [0, 10], yr: [0, 10], xl: 'Easting (km)', yl: 'Northing (km)', toIn: (a, b) => [(a - 5) / 3, (b - 5) / 3] };
        }
        for (let i = 0; i < 300; i++) { raw.push(R.X[i].slice(0, 2)); X.push(Z[i]); y.push(R.y[i]); }
        return { X, y, raw, nc: 3, cols: D.LCOL, names: D.LITH, xr: XR, yr: YR, xl: D.VARS[0], yl: D.VARS[1], toIn: toZ };
      };
      const pa = H.plot(root, 'n-a', { xr: [0, 10], yr: [0, 10], nx: 5, ny: 5 });
      const pb = H.plot(root, 'n-b', { xr: [0, 1000], yr: [0, 1], xl: 'Epoch', yl: 'Loss (how far off)', nx: 4, ny: 5 });
      const pt = H.plot(root, 'n-t', { xr: [0, 1], yr: [0, 1], noAxes: true, aspect: 0.2, m: { l: 4, r: 4, t: 4, b: 4 } });
      const pd = H.plot(root, 'n-d', { xr: [0, 1], yr: [0, 1], noAxes: true, aspect: 0.36, m: { l: 10, r: 60, t: 12, b: 22 } });
      let probe = null, dq = 0;
      const mix = (v) => { const t = Math.min(1, Math.abs(v)), b = v >= 0 ? [132, 22, 23] : [92, 102, 112]; return `rgb(${[255, 255, 255].map((w, i) => Math.round(w + (b[i] - w) * t)).join(',')})`; };
      let data, tr, te, net, hist, running = false, raf = 0, epoch = 0, frame = 0;
      const sel = H.q(root, 'n-data');
      const hh = H.bind(root, 'n-h', () => build(), v => v), uu = H.bind(root, 'n-u', () => build(), v => v);
      const build = () => {
        cancelAnimationFrame(raf); running = false;
        data = mk(sel.value);
        const s = ML.shuffle(data.X.length, ML.rng(3)), cut = Math.round(0.7 * s.length); tr = s.slice(0, cut); te = s.slice(cut);
        pa.o.xr = data.xr; pa.o.yr = data.yr; pa.o.xl = data.xl; pa.o.yl = data.yl;
        const sizes = [2]; for (let l = 0; l < hh.get(); l++) sizes.push(uu.get()); sizes.push(data.nc);
        net = new ML.MLP(sizes, ML.rng(2)); hist = []; epoch = 0; draw2();
      };
      const draw2 = () => { pa.draw(); pb.draw(); pt.draw(); pd.draw(); };
      sel.addEventListener('change', build);
      const acc = idx => ML.acc(idx.map(i => net.predict(data.X[i])), idx.map(i => data.y[i]));
      const loop = () => {
        if (!running) return;
        for (let s = 0; s < 8 && epoch < 1000; s++) { hist.push(net.step(tr.map(i => data.X[i]), tr.map(i => data.y[i]), 0.03)); epoch++; }
        if (++frame % 2 === 0 || epoch >= 1000) draw2();
        if (epoch >= 1000) { running = false; return; }
        raf = requestAnimationFrame(loop);
      };
      H.on(root, 'n-go', 'click', () => { if (!running && epoch < 1000) { running = true; loop(); } });
      H.on(root, 'n-stop', 'click', () => { running = false; });
      H.on(root, 'n-reset', 'click', build);
      pa.onDraw = pl => {
        pl.axes(); pl.clipStart();
        regions(pl, (x, y) => net.predict(data.toIn(x, y)), 32, 32, data.cols);
        tr.forEach(i => pl.dot(data.raw[i][0], data.raw[i][1], 3, data.cols[data.y[i]] === '#C9CDD2' ? '#8A929A' : data.cols[data.y[i]], '#fff', 0.8));
        te.forEach(i => pl.dot(data.raw[i][0], data.raw[i][1], 3.2, '#fff', data.cols[data.y[i]] === '#C9CDD2' ? '#5C6670' : data.cols[data.y[i]], 1.6));
        pl.clipEnd();
      };
      pb.onDraw = pl => {
        pl.axes(); if (hist.length > 1) pl.line(hist.map((v, i) => [i + 1, Math.min(v, 1)]), C.RED, 2);
        H.q(root, 'n-out').innerHTML = (epoch === 0 ? 'Untrained network, so the map colors are random. Press Train. ' : '') + `Epoch <b>${epoch}</b>. Loss <b>${hist.length ? hist[hist.length - 1].toFixed(3) : 'not measured yet'}</b>. Training accuracy <b>${H.pct(acc(tr))}</b>, test accuracy <b>${H.pct(acc(te))}</b>. Network: ${net.s.join(' → ')} (${net.s.slice(1, -1).reduce((a, b) => a + b, 0)} hidden neurons). Filled dots are training samples and hollow dots are test samples.`;
      };
      pt.onDraw = pl => {
        const c = pl.ctx;
        if (net.s.length < 3) { pl.ptext('No hidden neurons, so no small maps: one straight boundary only.', pl.W / 2, pl.H / 2, { align: 'center', font: '13px system-ui', color: C.SLATE }); return; }
        const U = net.s[1], G = 14, size = Math.min((pl.W - 8) / U - 8, pl.H - 26), acts = [];
        for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) { const x = data.xr[0] + (gx + 0.5) / G * (data.xr[1] - data.xr[0]), y = data.yr[1] - (gy + 0.5) / G * (data.yr[1] - data.yr[0]); acts.push(net.forward(data.toIn(x, y)).a[1]); }
        const total = U * (size + 8) - 8, x0 = (pl.W - total) / 2;
        for (let j = 0; j < U; j++) {
          const ox = x0 + j * (size + 8), cs = size / G;
          for (let k = 0; k < G * G; k++) { c.fillStyle = mix(acts[k][j]); c.fillRect(ox + (k % G) * cs, 4 + Math.floor(k / G) * cs, cs + 0.6, cs + 0.6); }
          c.strokeStyle = C.SLATE; c.lineWidth = 1; c.strokeRect(ox, 4, size, size); pl.ptext('neuron ' + (j + 1), ox + size / 2, size + 16, { align: 'center', font: '11.5px system-ui', color: C.SLATE });
        }
      };
      pd.onDraw = pl => {
        const sz = net.s, L = sz.length, c = pl.ctx, pt2 = probe || [(data.xr[0] + data.xr[1]) / 2, (data.yr[0] + data.yr[1]) / 2];
        const f = net.forward(data.toIn(pt2[0], pt2[1])), pos = (l, i) => [(l + 0.5) / L, 1 - (i + 0.5) / sz[l]];
        for (let l = 0; l < L - 1; l++) for (let j = 0; j < sz[l + 1]; j++) for (let i = 0; i < sz[l]; i++) {
          const w = net.W[l][j][i], a = Math.min(1, Math.abs(w) / 2.2), p0 = pos(l, i), p1 = pos(l + 1, j);
          pl.line([p0, p1], w > 0 ? `rgba(132,22,23,${0.12 + 0.75 * a})` : `rgba(92,102,112,${0.12 + 0.75 * a})`, 0.6 + 2.6 * a);
        }
        for (let l = 0; l < L; l++) for (let i = 0; i < sz[l]; i++) {
          const p = pos(l, i), out = l === L - 1, v = out ? f.p[i] : f.a[l][i];
          const fill = out ? Plot.hex2rgba(data.cols[i], 0.25 + 0.75 * f.p[i]) : mix(l === 0 ? Math.max(-1, Math.min(1, v / 1.5)) : v);
          c.beginPath(); c.arc(pl.x(p[0]), pl.y(p[1]), out ? 4 + 9 * f.p[i] : 9, 0, 6.2832); c.fillStyle = fill; c.fill(); c.strokeStyle = C.INK; c.lineWidth = 1.2; c.stroke();
          if (out) pl.ptext(data.names[i] + ' ' + Math.round(f.p[i] * 100) + '%', pl.x(p[0]) + 16, pl.y(p[1]), { font: '12px system-ui' });
        }
        const lab = sz.map((_, l) => (l === 0 ? 'inputs' : l === L - 1 ? 'outputs' : 'hidden ' + l));
        lab.forEach((t, l) => pl.ptext(t, pl.x((l + 0.5) / L), pl.H - 8, { align: 'center', font: '12px system-ui', color: C.SLATE }));
      };
      pa.c.addEventListener('mousemove', e => { const r = pa.c.getBoundingClientRect(); probe = [pa.ix(e.clientX - r.left), pa.iy(e.clientY - r.top)]; if (!dq) dq = requestAnimationFrame(() => { dq = 0; pd.draw(); }); });

      /* ---- tabs ---- */
      let step = 1;
      root.querySelectorAll('#nn-tabs .tab').forEach(b => b.addEventListener('click', () => {
        step = +b.dataset.s; root.querySelectorAll('#nn-tabs .tab').forEach(x => x.classList.toggle('on', x === b)); root.querySelectorAll('.track[data-s]').forEach(x => x.classList.toggle('on', +x.dataset.s === step));
        [p1a, p1b, pa, pb, pt, pd].forEach(p => p.fit()); if (step === 1) { p1a.draw(); p1b.draw(); } else draw2();
      }));
      build(); build1(); p1a.draw();
    }
  });

  /* ---------- 7. LLMs in research ---------- */
  M.push({
    id: 'llm', part: 1, title: 'Large language models in research',
    lede: 'A language model writes the continuation that is likely given its training text. The slider shows what that looks like for a number, and the game shows what it looks like for a reference.',
    steps: [
      'Go through the eight references and mark each one real or made up. Four are real and four were written for this page.',
      'If there is time, set the temperature low and press Sample 20 answers. Raise the temperature and sample again.'
    ],
    html: () => `
      <h4>Real or made up?</h4>
      ${H.look('Mark each of the eight references Real or Made up. Four are real and four were written for this page.', 'All eight are formatted the same way, with authors, year, journal, volume and pages. A reference that looks complete tells us nothing about whether the paper exists. We have to look it up in the journal or a database.')}
      <div id="l-game"></div>
      <h4>If there is time: how a language model picks its next word</h4>
      ${H.look('The bars show how likely each possible next number is, after the words "The Cretaceous–Paleogene boundary is dated at about ___ million years ago". Slide Randomness, then press Sample 20 answers.', 'At low randomness the model picks 66 almost every time. At high randomness it spreads its picks around, so the same question gets different answers. The model picks likely-sounding numbers. It does not look the age up. These probabilities are a toy example written for this page, not output from a real model.')}
      ${H.cv('l-a', 0.5)}
      <div class="ctlrow">${H.S('l-t', 'Randomness (temperature)', 0.1, 2, 0.05, 0.5)}${H.btn('l-go', 'Sample 20 answers')}</div>
      <div class="readout" id="l-out"></div>
`,
    init(root) {
      const toks = ['66', '65', '67', '64', '70', '56'], logit = [4.0, 3.0, 2.4, 1.6, 1.0, 0.8];
      const pl = H.plot(root, 'l-a', { xr: [0.5, 6.5], yr: [0, 1], xl: 'Next token (million years)', yl: 'Probability', nx: 6, ny: 5, fmtx: v => (Number.isInteger(v) ? toks[v - 1] : '') });
      let counts = null;
      const probs = t => { const e = logit.map(l => Math.exp(l / t)), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); };
      const tt = H.bind(root, 'l-t', () => { counts = null; pl.draw(); }, v => v.toFixed(2));
      H.on(root, 'l-go', 'click', () => {
        const p = probs(tt.get()), r = ML.rng(Math.floor(Math.random() * 1e9)); counts = new Array(6).fill(0);
        for (let i = 0; i < 20; i++) { let u = r(), k = 0; while (k < 5 && u > p[k]) { u -= p[k]; k++; } counts[k]++; }
        pl.draw();
      });
      pl.onDraw = c => {
        c.axes(); const p = probs(tt.get());
        p.forEach((v, i) => { c.rect(i + 1 - 0.33, 0, i + 1 + 0.33, v, i === 0 ? C.RED : 'rgba(92,102,112,0.5)'); c.text(v.toFixed(2), i + 1, Math.min(v + 0.05, 0.97), { align: 'center', font: '11px system-ui' }); });
        if (counts) counts.forEach((n, i) => { if (n) c.dot(i + 1, n / 20, 6, '#fff', C.INK, 2); });
        const o = H.q(root, 'l-out');
        o.innerHTML = counts ? `20 samples: ${toks.map((t, i) => (counts[i] ? `<b>${t}</b> × ${counts[i]}` : '')).filter(Boolean).join(', ')}. The accepted age is about 66 Ma; the model has no step that checks a value against a source.` : `At randomness ${tt.get().toFixed(2)} the most likely answer, 66, has a probability of <b>${p[0].toFixed(2)}</b>.`;
      };
      pl.draw();

      // citation game
      const refs = [
        { t: 'Breiman, L., 2001, Random forests: Machine Learning, v. 45, no. 1, p. 5–32.', real: true },
        { t: 'Marlowe, D. T., and Kessinger, A. R., 2019, Deep convolutional networks for automatic fault throw estimation from seismic amplitudes: Geophysics, v. 84, no. 5, p. IM31–IM47.', real: false },
        { t: 'Bergen, K. J., Johnson, P. A., de Hoop, M. V., and Beroza, G. C., 2019, Machine learning for data-driven discovery in solid Earth geoscience: Science, v. 363, eaau0323.', real: true },
        { t: 'Adeyemi, O. K., Lindqvist, S., and Rao, P. V., 2020, Random forest prediction of porosity from core photographs in carbonate reservoirs: AAPG Bulletin, v. 104, no. 8, p. 1723–1745.', real: false },
        { t: 'Hall, B., 2016, Facies classification using machine learning: The Leading Edge, v. 35, no. 10, p. 906–909.', real: true },
        { t: 'Vasquez-Tran, M., and Holloway, E. J., 2018, Unsupervised classification of geochemical anomalies for porphyry exploration in the Andean belt: Economic Geology, v. 113, no. 6, p. 1301–1322.', real: false },
        { t: 'Kohonen, T., 1982, Self-organized formation of topologically correct feature maps: Biological Cybernetics, v. 43, p. 59–69.', real: true },
        { t: 'Brennan, C. L., Osei, F., and Nakamura, H., 2021, Neural network estimation of paleotemperature from foraminifera assemblages: Paleoceanography and Paleoclimatology, v. 36, no. 2.', real: false }
      ];
      const game = H.q(root, 'l-game'); let score = 0, done = 0;
      game.innerHTML = refs.map((r, i) => `<div class="ref" data-i="${i}"><p>${r.t}</p><div class="ref-b"><button type="button" class="btn sm" data-a="1">Real</button><button type="button" class="btn sm" data-a="0">Made up</button><span class="res"></span></div></div>`).join('') + `<div class="readout" id="l-score">Answered 0 of 8.</div>`;
      game.addEventListener('click', e => {
        const b = e.target.closest('button[data-a]'); if (!b) return;
        const box = b.closest('.ref'), r = refs[+box.dataset.i]; if (box.classList.contains('done')) return;
        const ok = (b.dataset.a === '1') === r.real; box.classList.add('done', ok ? 'right' : 'wrong'); done++; if (ok) score++;
        box.querySelector('.res').textContent = (ok ? 'Correct. ' : 'Not quite. ') + (r.real ? 'This reference is real.' : 'This reference was written for this page and does not correspond to a real paper.');
        H.q(root, 'l-score').innerHTML = `Answered ${done} of 8, ${score} correct. ${done === 8 ? 'Every reference here is formatted the same way, so the format alone did not separate the two groups. A reference from an assistant is checked against the journal or a database before it is cited.' : ''}`;
      });
    }
  });
})(window);
