/* modules1.js - helpers plus the first three modules: vocabulary, dimension reduction, unsupervised learning */
(function (g) {
  const { ML, DATA: D, Plot } = g;
  const C = Plot.C;
  const M = g.MODULES = [];
  const H = g.H = {};

  H.S = (id, label, min, max, step, val) =>
    `<div class="ctl"><label for="${id}">${label}</label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><output id="${id}-o"></output></div>`;
  H.chk = (id, label, on) => `<label class="chk"><input type="checkbox" id="${id}"${on ? ' checked' : ''}> ${label}</label>`;
  H.btn = (id, label) => `<button type="button" class="btn" id="${id}">${label}</button>`;
  H.cv = (id, aspect) => `<canvas id="${id}" data-aspect="${aspect}"></canvas>`;
  H.q = (root, id) => root.querySelector('#' + id);
  H.bind = (root, id, cb, fmt) => {
    const el = H.q(root, id), o = H.q(root, id + '-o');
    const show = () => { o.textContent = fmt ? fmt(+el.value) : el.value; };
    el.addEventListener('input', () => { show(); cb(+el.value); });
    show();
    return { el, get: () => +el.value, set: v => { el.value = v; show(); cb(+el.value); } };
  };
  H.plot = (root, id, o) => { const c = H.q(root, id); return new Plot(c, Object.assign({ aspect: +c.dataset.aspect || 0.7 }, o)); };
  H.on = (root, id, ev, fn) => H.q(root, id).addEventListener(ev, fn);
  H.pct = v => Math.round(v * 100) + '%';
  H.legend = (names, cols) => `<div class="legend">${names.map((n, i) => `<span><i style="background:${cols[i]}"></i>${n}</span>`).join('')}</div>`;

  const R = D.rocks();
  H.R = R;
  H.Z2 = R.Z.map(z => [z[0], z[1]]);

  /* ---------- 1. vocabulary ---------- */
  M.push({
    id: 'vocab', part: 1, title: 'AI, machine learning, deep learning, LLM',
    lede: 'The four terms nest inside each other. We click through the rings, then compare a hand-written rule with a rule the data can adjust.',
    steps: [
      'Click each ring, from the outside in, and read the example.',
      'Move the training samples slider from 2 up to 100. The learned threshold moves and the hand-written one stays where it was.',
      'At what number of samples does the learned threshold stop moving much?'
    ],
    html: () => `
      <div class="split">
        <svg id="v-rings" viewBox="0 0 400 400" role="group" aria-label="Nested circles: AI, machine learning, deep learning, LLM"></svg>
        <div id="v-info" class="info" aria-live="polite"></div>
      </div>
      <h4>Gamma ray of 300 synthetic samples, shale and not shale</h4>
      ${H.cv('v-c', 0.42)}
      ${H.S('v-n', 'Training samples used', 2, 100, 1, 6)}
      <div class="readout" id="v-out"></div>`,
    init(root) {
      const rings = [
        { n: 'Artificial intelligence', r: 190, f: '#EEF0F2', d: 'Any computer system that performs a task normally associated with human judgment. It includes systems built only from rules written by experts.', e: 'A rule that labels an interval as shale when gamma ray is above 90 API.' },
        { n: 'Machine learning', r: 145, f: '#DDE1E5', d: 'A program estimates its rules from example data. A person supplies the data and the method.', e: 'A random forest that learns which log combinations go with sandstone, shale, and limestone.' },
        { n: 'Deep learning', r: 100, f: '#C9CDD2', d: 'Machine learning with neural networks that have many layers.', e: 'A convolutional network trained to pick faults on seismic sections.' },
        { n: 'Large language model', r: 55, f: '#841617', d: 'A deep neural network trained on very large amounts of text to predict the next token. Chat assistants are built on these.', e: 'Drafting code to read a LAS file, summarizing a paper, translating a field description.' }
      ];
      const svg = root.querySelector('#v-rings'), info = H.q(root, 'v-info');
      const ns = 'http://www.w3.org/2000/svg';
      rings.forEach((rg, i) => {
        const c = document.createElementNS(ns, 'circle');
        c.setAttribute('cx', 200); c.setAttribute('r', rg.r);
        c.setAttribute('cy', 390 - rg.r); c.setAttribute('fill', rg.f); c.setAttribute('stroke', '#5C6670'); c.setAttribute('tabindex', 0); c.setAttribute('role', 'button');
        c.setAttribute('aria-label', rg.n); c.style.cursor = 'pointer';
        const t = document.createElementNS(ns, 'text');
        t.setAttribute('x', 200); t.setAttribute('y', 390 - 2 * rg.r + 22); t.setAttribute('text-anchor', 'middle');
        t.setAttribute('fill', i === 3 ? '#fff' : '#16191C'); t.setAttribute('font-size', i === 3 ? 13 : 14); t.style.pointerEvents = 'none';
        t.textContent = i === 3 ? 'LLM' : rg.n;
        const pick = () => {
          svg.querySelectorAll('circle').forEach(x => x.setAttribute('stroke-width', 1)); c.setAttribute('stroke-width', 3);
          info.innerHTML = `<h4>${rg.n}</h4><p>${rg.d}</p><p class="ex-line"><b>Geoscience example.</b> ${rg.e}</p>`;
        };
        c.addEventListener('click', pick); c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
        svg.appendChild(c); svg.appendChild(t);
        if (i === 0) pick();
      });

      const gr = R.X.map(x => x[0]), shale = R.y.map(y => (y === 1 ? 1 : 0));
      const order = ML.shuffle(300, ML.rng(4));
      const p = H.plot(root, 'v-c', { xr: [0, 150], yr: [0, 50], xl: 'Gamma ray (API)', yl: 'Samples per 10 API', nx: 6, ny: 5 });
      const RULE = 90;
      const accAt = (t, idx) => idx.reduce((s, i) => s + ((gr[i] > t ? 1 : 0) === shale[i] ? 1 : 0), 0) / idx.length;
      const learn = n => {
        const idx = order.slice(0, n); let best = -1, ts = [];
        for (let t = 0; t <= 150; t++) { const a = accAt(t, idx); if (a > best + 1e-9) { best = a; ts = [t]; } else if (Math.abs(a - best) < 1e-9) ts.push(t); }
        return (ts[0] + ts[ts.length - 1]) / 2;
      };
      const all = R.X.map((_, i) => i);
      const s = H.bind(root, 'v-n', () => p.draw(), v => v);
      p.onDraw = pl => {
        pl.axes();
        const bs = new Array(15).fill(0), bn = new Array(15).fill(0);
        gr.forEach((v, i) => { const b = Math.min(14, Math.floor(v / 10)); (shale[i] ? bs : bn)[b]++; });
        for (let b = 0; b < 15; b++) {
          pl.rect(b * 10 + 0.6, 0, b * 10 + 9.4, bn[b], Plot.hex2rgba('#5C6670', 0.55));
          pl.rect(b * 10 + 0.6, bn[b], b * 10 + 9.4, bn[b] + bs[b], Plot.hex2rgba(D.LCOL[1], 0.8));
        }
        const tl = learn(s.get());
        pl.vline(RULE, C.SLATE, 2, [6, 4]); pl.vline(tl, C.RED, 2.5);
        pl.text('expert rule ' + RULE, RULE + 1.5, 47, { color: C.SLATE, font: '11px system-ui' });
        pl.text('learned ' + tl.toFixed(0), tl + 1.5, 43, { color: C.RED, font: '11px system-ui' });
        H.q(root, 'v-out').innerHTML = `Expert rule (gamma ray &gt; ${RULE}): <b>${H.pct(accAt(RULE, all))}</b> correct. Learned from ${s.get()} samples (gamma ray &gt; ${tl.toFixed(0)}): <b>${H.pct(accAt(tl, all))}</b> correct on all 300. Purple bars are shale and gray bars are the other rocks.`;
      };
      p.draw();
    }
  });

  /* ---------- 2. dimension reduction ---------- */
  M.push({
    id: 'pca', part: 1, title: 'Dimension reduction',
    lede: 'Four log curves are hard to look at together. PCA finds the direction with the most spread and the next one at right angles to it.',
    steps: [
      'Choose a pair of variables. Turn the angle slider through 180°. Each sample projects onto the line, and the curve shows the variance along it.',
      'Press Go to PC1. The line moves to the angle with the most variance.',
      'In the four-variable panel, keep 1 component and then 2, 3, 4. The variance readout shows how much of the total each choice keeps.',
      'Turn on the lithology colors and compare them with the PC1 axis.'
    ],
    html: () => `
      <div class="row2">
        <div>
          <h4>Two variables, standardized</h4>
          <div class="ctl"><label for="p-pair">Pair</label><select id="p-pair"></select></div>
          ${H.cv('p-a', 0.95)}
        </div>
        <div>
          <h4>Variance along the line</h4>
          ${H.cv('p-b', 0.95)}
          ${H.S('p-ang', 'Angle of the line', 0, 180, 1, 20)}
          ${H.btn('p-go', 'Go to PC1')}
          <div class="readout" id="p-out1"></div>
        </div>
      </div>
      <h4>All four variables</h4>
      <div class="row3">
        <div>${H.cv('p-c', 0.95)}</div><div>${H.cv('p-d', 0.95)}</div><div>${H.cv('p-e', 0.95)}</div>
      </div>
      <div class="ctlrow">${H.S('p-keep', 'Components kept', 1, 4, 1, 2)}${H.chk('p-col', 'Color by lithology', false)}</div>
      ${H.legend(D.LITH, D.LCOL)}
      <div class="readout" id="p-out2"></div>`,
    init(root) {
      const names = D.SHORT, pairs = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
      const sel = H.q(root, 'p-pair');
      pairs.forEach((pr, i) => sel.insertAdjacentHTML('beforeend', `<option value="${i}">${names[pr[0]]} and ${names[pr[1]]}</option>`));
      const pa = H.plot(root, 'p-a', { xr: [-3, 3], yr: [-3, 3], nx: 6, ny: 6 });
      const pb = H.plot(root, 'p-b', { xr: [0, 180], yr: [0, 2], xl: 'Angle (degrees)', yl: 'Variance', nx: 6, ny: 4 });
      const st = () => pairs[+sel.value];
      const sub = () => R.Z.map(z => [z[st()[0]], z[st()[1]]]);
      const varAt = (X, a) => { const u = [Math.cos(a), Math.sin(a)]; let s = 0; X.forEach(x => { const t = x[0] * u[0] + x[1] * u[1]; s += t * t; }); return s / (X.length - 1); };
      const best = X => { let b = 0, bv = -1; for (let a = 0; a < 180; a += 0.5) { const v = varAt(X, a * Math.PI / 180); if (v > bv) { bv = v; b = a; } } return b; };
      const ang = H.bind(root, 'p-ang', () => { pa.draw(); pb.draw(); }, v => v + '°');
      sel.addEventListener('change', () => { pa.o.xl = D.VARS[st()[0]] + ', standardized'; pa.o.yl = D.VARS[st()[1]] + ', standardized'; pa.draw(); pb.draw(); });
      H.on(root, 'p-go', 'click', () => ang.set(Math.round(best(sub()))));
      sel.value = '1';
      pa.onDraw = pl => {
        pl.axes(); const X = sub(), a = ang.get() * Math.PI / 180, u = [Math.cos(a), Math.sin(a)];
        pl.clipStart();
        X.forEach(x => { const t = x[0] * u[0] + x[1] * u[1]; pl.line([[x[0], x[1]], [t * u[0], t * u[1]]], 'rgba(92,102,112,0.22)', 1); });
        X.forEach(x => pl.dot(x[0], x[1], 2.8, 'rgba(92,102,112,0.55)'));
        pl.line([[-5 * u[0], -5 * u[1]], [5 * u[0], 5 * u[1]]], C.RED, 2);
        X.forEach(x => { const t = x[0] * u[0] + x[1] * u[1]; pl.dot(t * u[0], t * u[1], 2.4, C.RED); });
        pl.clipEnd();
      };
      pb.onDraw = pl => {
        pl.axes(); const X = sub(), pts = []; for (let a = 0; a <= 180; a += 1) pts.push([a, varAt(X, a * Math.PI / 180)]);
        pl.line(pts, C.SLATE, 2); const b = best(X); pl.vline(b, C.SLATE, 1, [4, 4]); pl.text('PC1 at ' + b + '°', b + 3, 1.9, { color: C.SLATE, font: '11px system-ui' });
        const v = varAt(X, ang.get() * Math.PI / 180); pl.dot(ang.get(), v, 5.5, C.RED);
        H.q(root, 'p-out1').innerHTML = `Variance along the line at ${ang.get()}°: <b>${v.toFixed(2)}</b>. The maximum for this pair is <b>${varAt(X, b * Math.PI / 180).toFixed(2)}</b>.`;
      };
      sel.dispatchEvent(new Event('change'));

      // four-variable panel
      const P = ML.pca(R.Z);
      const pc = H.plot(root, 'p-c', { xr: [-4, 4], yr: [-4, 4], xl: 'PC1', yl: 'PC2', nx: 8, ny: 8 });
      const pd = H.plot(root, 'p-d', { xr: [0.5, 4.5], yr: [0, 100], xl: 'Component', yl: 'Variance explained (%)', nx: 4, ny: 5, fmtx: v => (Number.isInteger(v) ? 'PC' + v : '') });
      const pe = H.plot(root, 'p-e', { xr: [0.5, 4.5], yr: [-1, 1], xl: 'Variable', yl: 'Loading', nx: 4, ny: 4, fmtx: v => (Number.isInteger(v) ? names[v - 1] : '') });
      const keep = H.bind(root, 'p-keep', () => { pc.draw(); pd.draw(); pe.draw(); }, v => v);
      const col = H.q(root, 'p-col'); col.addEventListener('change', () => pc.draw());
      pc.onDraw = pl => {
        pl.axes(); const k = keep.get();
        P.scores.forEach((s, i) => pl.dot(s[0], k >= 2 ? s[1] : 0, 3, col.checked ? Plot.hex2rgba(D.LCOL[R.y[i]], 0.8) : 'rgba(92,102,112,0.55)'));
        if (k < 2) pl.text('PC2 not kept', 0, 3.4, { align: 'center', color: C.SLATE, font: '11px system-ui' });
      };
      pd.onDraw = pl => {
        pl.axes(); const k = keep.get();
        P.frac.forEach((f, i) => pl.rect(i + 1 - 0.32, 0, i + 1 + 0.32, f * 100, i < k ? C.RED : 'rgba(92,102,112,0.35)'));
        P.frac.forEach((f, i) => pl.text((f * 100).toFixed(0), i + 1, f * 100 + 5, { align: 'center', font: '11px system-ui', color: C.INK }));
        const kept = P.frac.slice(0, k).reduce((a, b) => a + b, 0);
        H.q(root, 'p-out2').innerHTML = `Keeping ${k} of 4 components keeps <b>${(kept * 100).toFixed(0)}%</b> of the total variance. PC1 loadings on ${names.join(', ')}: ${P.vecs[0].map(v => v.toFixed(2)).join(', ')}.`;
      };
      pe.onDraw = pl => {
        pl.axes(); pl.hline(0, C.SLATE, 1);
        for (let j = 0; j < 4; j++) {
          pl.rect(j + 1 - 0.35, 0, j + 1, P.vecs[0][j], C.RED);
          pl.rect(j + 1, 0, j + 1 + 0.35, P.vecs[1][j], C.SLATE);
        }
        pl.ptext('PC1', pl.x(0.6), pl.y(0.9), { color: C.RED, font: '11px system-ui' }); pl.ptext('PC2', pl.x(1.2), pl.y(0.9), { color: C.SLATE, font: '11px system-ui' });
      };
      pc.draw(); pd.draw(); pe.draw();
    }
  });

  /* ---------- 3. unsupervised ---------- */
  M.push({
    id: 'unsup', part: 1, title: 'Unsupervised learning',
    lede: 'The samples arrive without lithology labels. k-means groups them by how close they are in gamma ray and density.',
    steps: [
      'Set k to 1 and raise it one step at a time. Watch where the boundaries between clusters fall.',
      'Press New start a few times at k = 4. The clusters can change with the starting positions.',
      'The elbow curve shows the total distance from each sample to its cluster center. Find the k where the curve bends.',
      'Turn on the lithology check. In practice these labels are not available, and here they show how the clusters compare with the rock types.'
    ],
    html: () => `
      <div class="row2">
        <div>${H.cv('u-a', 0.85)}</div>
        <div>${H.cv('u-b', 0.85)}</div>
      </div>
      <div class="ctlrow">${H.S('u-k', 'Number of clusters, k', 1, 8, 1, 2)}${H.btn('u-new', 'New start')}${H.chk('u-lith', 'Show lithology (normally unknown)', false)}</div>
      ${H.legend(D.LITH, D.LCOL)}
      <div class="readout" id="u-out"></div>`,
    init(root) {
      const Z = H.Z2;
      const pa = H.plot(root, 'u-a', { xr: [0, 150], yr: [2.0, 2.9], xl: D.VARS[0], yl: D.VARS[1], nx: 6, ny: 6 });
      const pb = H.plot(root, 'u-b', { xr: [0.5, 8.5], yr: [0, 600], xl: 'Number of clusters, k', yl: 'Total squared distance', nx: 8, ny: 6, fmtx: v => (Number.isInteger(v) ? v : '') });
      const rr = ML.rng(12), elbow = []; for (let k = 1; k <= 8; k++) elbow.push(ML.kmeansBest(Z, k, rr, 6).inertia);
      let seed = 31, model = null;
      const fit = () => { model = ML.kmeans(Z, kk.get(), ML.rng(seed)); };
      const toRaw = c => [c[0] * R.sd[0] + R.mean[0], c[1] * R.sd[1] + R.mean[1]];
      const kk = H.bind(root, 'u-k', () => { fit(); pa.draw(); pb.draw(); }, v => v);
      const lith = H.q(root, 'u-lith'); lith.addEventListener('change', () => { pa.draw(); pb.draw(); });
      H.on(root, 'u-new', 'click', () => { seed += 17; fit(); pa.draw(); pb.draw(); });
      fit();
      pa.onDraw = pl => {
        pl.axes();
        R.X.forEach((x, i) => {
          const cc = Plot.CLUSTER[model.labels[i] % 8];
          pl.dot(x[0], x[1], lith.checked ? 4.4 : 3.6, Plot.hex2rgba(cc, 0.85), lith.checked ? D.LCOL[R.y[i]] : null, 1.6);
        });
        model.centers.forEach((c, j) => { const p = toRaw(c); pl.dot(p[0], p[1], 7, '#fff', C.INK, 2.2); pl.text('×', p[0], p[1] + 0.005, { align: 'center', font: 'bold 12px system-ui' }); });
      };
      pb.onDraw = pl => {
        pl.axes(); pl.line(elbow.map((v, i) => [i + 1, v]), C.SLATE, 2); elbow.forEach((v, i) => pl.dot(i + 1, v, 3, C.SLATE));
        pl.dot(kk.get(), model.inertia, 6, C.RED);
        H.q(root, 'u-out').innerHTML = `k = ${kk.get()}: total squared distance <b>${model.inertia.toFixed(0)}</b>.` +
          (lith.checked ? ` Agreement between clusters and lithology: <b>${H.pct(ML.purity(model.labels, R.y, kk.get(), 3))}</b> of samples fall in a cluster whose most common rock type matches theirs.` : '');
      };
      pa.draw(); pb.draw();
    }
  });
})(window);
