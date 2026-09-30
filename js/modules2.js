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
    lede: 'A neural network draws the same kind of boundary as before. Hidden layers and neurons let the boundary bend.',
    steps: [
      'Choose the mineralized zone with a ring-shaped contact aureole. Set 0 hidden layers and press Train. A straight boundary cannot follow a ring.',
      'Raise the neurons and layers and train again.',
      'Move the cursor over the map and watch which neurons light up in the network diagram. Watch the training and test accuracy. Compare them after 1000 epochs for the small and the large network.',
      'Switch to the lithology data and repeat.'
    ],
    html: () => `
      <div class="row2">
        <div>${H.cv('n-a', 0.95)}</div>
        <div>${H.cv('n-b', 0.95)}</div>
      </div>
      <div class="ctlrow">
        <div class="ctl"><label for="n-data">Data</label><select id="n-data"><option value="ring">Map: mineralized ring around an intrusion</option><option value="lith">Logs: three lithologies</option></select></div>
      </div>
      <h4>The network, lit up by the point under the cursor on the map</h4>
      ${H.cv('n-d', 0.36)}
      <div class="ctlrow">${H.S('n-h', 'Hidden layers', 0, 3, 1, 1)}${H.S('n-u', 'Neurons per layer', 1, 8, 1, 3)}</div>
      <div class="ctlrow">${H.btn('n-go', 'Train')}${H.btn('n-stop', 'Pause')}${H.btn('n-reset', 'Reset')}</div>
      <div class="readout" id="n-out"></div>`,
    init(root) {
      const mk = kind => {
        const r = ML.rng(9), X = [], y = [], raw = [];
        if (kind === 'ring') {
          for (let i = 0; i < 320; i++) { const a = r() * 10, b = r() * 10, d = Math.hypot(a - 5, b - 5); raw.push([a, b]); X.push([(a - 5) / 3, (b - 5) / 3]); y.push(d > 1.4 && d < 3.2 ? 1 : 0); }
          return { X, y, raw, nc: 2, cols: ['#C9CDD2', '#841617'], names: ['barren', 'mineralized'], xr: [0, 10], yr: [0, 10], xl: 'Easting (km)', yl: 'Northing (km)', toIn: (a, b) => [(a - 5) / 3, (b - 5) / 3] };
        }
        for (let i = 0; i < 300; i++) { raw.push(R.X[i].slice(0, 2)); X.push(Z[i]); y.push(R.y[i]); }
        return { X, y, raw, nc: 3, cols: D.LCOL, names: D.LITH, xr: XR, yr: YR, xl: D.VARS[0], yl: D.VARS[1], toIn: toZ };
      };
      const pa = H.plot(root, 'n-a', { xr: [0, 10], yr: [0, 10], nx: 5, ny: 5 });
      const pb = H.plot(root, 'n-b', { xr: [0, 1000], yr: [0, 1], xl: 'Epoch', yl: 'Loss (how far off)', nx: 4, ny: 5 });
      const pd = H.plot(root, 'n-d', { xr: [0, 1], yr: [0, 1], noAxes: true, aspect: 0.36, m: { l: 10, r: 60, t: 12, b: 22 } });
      let probe = null, dq = 0;
      const mix = (v) => { const t = Math.min(1, Math.abs(v)), b = v >= 0 ? [132, 22, 23] : [92, 102, 112]; return `rgb(${[255, 255, 255].map((w, i) => Math.round(w + (b[i] - w) * t)).join(',')})`; };
      let data, tr, te, net, hist, running = false, raf = 0, epoch = 0, gridCache = null, frame = 0;
      const sel = H.q(root, 'n-data');
      const build = () => {
        cancelAnimationFrame(raf); running = false;
        data = mk(sel.value);
        const s = ML.shuffle(data.X.length, ML.rng(3)), cut = Math.round(0.7 * s.length); tr = s.slice(0, cut); te = s.slice(cut);
        pa.o.xr = data.xr; pa.o.yr = data.yr; pa.o.xl = data.xl; pa.o.yl = data.yl;
        const sizes = [2]; for (let l = 0; l < hh.get(); l++) sizes.push(uu.get()); sizes.push(data.nc);
        net = new ML.MLP(sizes, ML.rng(2)); hist = []; epoch = 0; gridCache = null; pa.draw(); pb.draw(); pd.draw();
      };
      const hh = H.bind(root, 'n-h', build, v => v), uu = H.bind(root, 'n-u', build, v => v);
      sel.addEventListener('change', build);
      const acc = idx => ML.acc(idx.map(i => net.predict(data.X[i])), idx.map(i => data.y[i]));
      const loop = () => {
        if (!running) return;
        for (let s = 0; s < 8 && epoch < 1000; s++) { hist.push(net.step(tr.map(i => data.X[i]), tr.map(i => data.y[i]), 0.03)); epoch++; }
        if (++frame % 2 === 0 || epoch >= 1000) { gridCache = null; pa.draw(); pb.draw(); pd.draw(); }
        if (epoch >= 1000) { running = false; return; }
        raf = requestAnimationFrame(loop);
      };
      H.on(root, 'n-go', 'click', () => { if (!running && epoch < 1000) { running = true; loop(); } });
      H.on(root, 'n-stop', 'click', () => { running = false; });
      H.on(root, 'n-reset', 'click', build);
      pa.onDraw = pl => {
        pl.axes(); pl.clipStart();
        const nx = 32, ny = 32;
        regions(pl, (x, y) => net.predict(data.toIn(x, y)), nx, ny, data.cols);
        tr.forEach(i => pl.dot(data.raw[i][0], data.raw[i][1], 3, data.cols[data.y[i]] === '#C9CDD2' ? '#8A929A' : data.cols[data.y[i]], '#fff', 0.8));
        te.forEach(i => pl.dot(data.raw[i][0], data.raw[i][1], 3.2, '#fff', data.cols[data.y[i]] === '#C9CDD2' ? '#5C6670' : data.cols[data.y[i]], 1.6));
        pl.clipEnd();
      };
      pb.onDraw = pl => {
        pl.axes(); if (hist.length > 1) pl.line(hist.map((v, i) => [i + 1, Math.min(v, 1)]), C.RED, 2);
        H.q(root, 'n-out').innerHTML = `Epoch <b>${epoch}</b>. Loss <b>${hist.length ? hist[hist.length - 1].toFixed(3) : '-'}</b>. Training accuracy <b>${H.pct(acc(tr))}</b>, test accuracy <b>${H.pct(acc(te))}</b>. Network: ${net.s.join(' → ')} (${net.s.slice(1, -1).reduce((a, b) => a + b, 0)} hidden neurons). Filled dots are training samples and hollow dots are test samples.`;
      };
      pd.onDraw = pl => {
        const sz = net.s, L = sz.length, c = pl.ctx, pt = probe || [(data.xr[0] + data.xr[1]) / 2, (data.yr[0] + data.yr[1]) / 2];
        const f = net.forward(data.toIn(pt[0], pt[1])), pos = (l, i) => [(l + 0.5) / L, 1 - (i + 0.5) / sz[l]];
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
      build();
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
      <div id="l-game"></div>
      <h4>If there is time: how a language model picks its next word</h4>
      <p class="note">The next token after "The Cretaceous–Paleogene boundary is dated at about ___ million years ago"</p>
      <p class="note">These probabilities are a toy distribution written for this page. They show the mechanism and are not output from a real model.</p>
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
        o.innerHTML = counts ? `20 samples: ${toks.map((t, i) => (counts[i] ? `<b>${t}</b> × ${counts[i]}` : '')).filter(Boolean).join(', ')}. The accepted age is about 66 Ma; the model has no step that checks a value against a source.` : `At temperature ${tt.get().toFixed(2)} the most likely token, 66, has probability <b>${p[0].toFixed(2)}</b>.`;
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
