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
      'Move the training samples slider from 2 up to 100. The learned threshold moves and the hand-written one stays where it was.',
      'Find the number of samples where the learned threshold stops moving much.'
    ],
    html: () => `
      <h4>A hand-written rule and a learned threshold, gamma ray of 300 synthetic samples</h4>
      ${H.cv('v-c', 0.42)}
      ${H.S('v-n', 'Training samples used', 2, 100, 1, 6)}
      <div class="readout" id="v-out"></div>`,
    init(root) {
      const rings = [
        { n: 'Artificial intelligence', r: 190, f: '#EEF0F2', d: 'Any computer program that does something we would normally expect a person to judge. A program made only of rules that a person wrote down counts.', e: 'A rule that calls a log interval shale when gamma ray is above 90 API.' },
        { n: 'Machine learning', r: 145, f: '#DDE1E5', d: 'A program that works out its own rules from examples. We give it data, and it finds the pattern.', e: 'A program that studies logs from cored wells and learns which readings go with sandstone, shale and limestone.' },
        { n: 'Deep learning', r: 100, f: '#C9CDD2', d: 'Machine learning built on neural networks with many layers. Each layer takes the numbers from the layer before and builds something more detailed from them.', e: 'A network trained to pick faults on seismic sections.' },
        { n: 'Large language model', r: 55, f: '#841617', d: 'A deep learning program trained on a huge amount of text to predict the next word. Chat assistants are built on these.', e: 'Writing a script to read a well-log file, or summarizing a paper.' }
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


  /* ---------- 1a. types of machine learning ---------- */
  M.push({
    id: 'types', part: 1, title: 'Types of machine learning',
    lede: '',
    steps: [],
    html: () => `
      <h4>Regression: a line through the dots</h4>
      <div class="row-reg">
        <div>${H.cv('ty-a', 0.62)}</div>
        <div>
          ${H.S('ty-d', 'How curvy is the line', 1, 10, 1, 1)}
          <div class="readout" id="ty-out"></div>
          ${H.legend(['Training samples', 'Test samples'], ['#5C6670', '#FFFFFF'])}
        </div>
      </div>`,
    init(root) {
      const r = ML.rng(14), all = [];
      for (let i = 0; i < 44; i++) { const z = 0.2 + 3.6 * r(); all.push([z, 0.34 * Math.exp(-0.5 * z) + 0.022 * ML.gauss(r)]); }
      const tr = all.slice(0, 30), te = all.slice(30), sx = z => z / 2 - 1;
      const pl = H.plot(root, 'ty-a', { xr: [0, 4], yr: [0, 0.4], xl: 'Depth (km)', yl: 'Porosity (fraction)', nx: 4, ny: 4, aspect: 0.62 });
      let co;
      const dd = H.bind(root, 'ty-d', () => { fit(); pl.draw(); }, v => v);
      const fit = () => { co = ML.polyfit(tr.map(p => sx(p[0])), tr.map(p => p[1]), dd.get()); };
      const rmse = set => Math.sqrt(set.reduce((s, p) => s + (ML.polyval(co, sx(p[0])) - p[1]) ** 2, 0) / set.length);
      fit();
      pl.onDraw = p => {
        p.axes(); p.clipStart();
        const pts = []; for (let z = 0.05; z <= 3.95; z += 0.04) pts.push([z, ML.polyval(co, sx(z))]);
        p.line(pts, C.RED, 2.6);
        tr.forEach(q => p.dot(q[0], q[1], 4, 'rgba(92,102,112,0.85)'));
        te.forEach(q => p.dot(q[0], q[1], 4.2, '#fff', C.SLATE, 1.8));
        p.clipEnd();
        H.q(root, 'ty-out').innerHTML = `Typical miss on the training samples: <b>${(rmse(tr) * 100).toFixed(1)}</b> porosity points. On the test samples: <b>${(rmse(te) * 100).toFixed(1)}</b>.`;
      };
      pl.draw();
    }
  });

  /* ---------- 1b. when machine learning fits ---------- */
  M.push({
    id: 'fit', part: 1, title: 'When machine learning fits',
    lede: '',
    steps: [
      'Read each situation and choose Good fit, Depends, or Poor fit. The reason appears after each choice.',
      'Finish all six and read the score.'
    ],
    html: () => `<div id="f-list"></div><div class="readout" id="f-out">Answered 0 of 6.</div>`,
    init(root) {
      const items = [
        { t: 'Picking faults on 3,000 line-km of seismic when a few hundred line-km are already interpreted.', a: 'good', r: 'Many samples and a set of known answers to learn from. Deep learning gets used on this a lot.' },
        { t: 'Predicting lithology in a new well from its logs, with core and logs from ten nearby wells.', a: 'good', r: 'Labeled examples from the same area and the same measurements. Facies prediction from logs is a standard case.' },
        { t: 'Dating one ash bed from a single sample.', a: 'poor', r: 'One sample gives nothing to learn from, and radiometric dating already has a physical equation.' },
        { t: 'Calculating travel time through a layered model with known velocities and thicknesses.', a: 'poor', r: 'The physics gives the exact answer. A learned model would approximate an equation that is already known.' },
        { t: 'Grouping 50,000 stream-sediment samples by geochemical signature with no classes defined yet.', a: 'good', r: 'Many samples and no labels. Clustering and dimension reduction suit this case, and the groups then need a geological interpretation.' },
        { t: 'Predicting where a deposit type occurs in a region with four known deposits.', a: 'depends', r: 'Four examples are very few. The result can still guide a search, and the uncertainty is large.' }
      ];
      const list = H.q(root, 'f-list'), lab = { good: 'Good fit', depends: 'Depends', poor: 'Poor fit' };
      list.innerHTML = items.map((it, i) => `<div class="ref" data-i="${i}"><p>${it.t}</p><div class="ref-b">${['good', 'depends', 'poor'].map(k => `<button type="button" class="btn sm" data-a="${k}">${lab[k]}</button>`).join('')}<span class="res"></span></div></div>`).join('');
      let done = 0, score = 0;
      list.addEventListener('click', e => {
        const b = e.target.closest('button[data-a]'); if (!b) return;
        const box = b.closest('.ref'), it = items[+box.dataset.i]; if (box.classList.contains('done')) return;
        const ok = b.dataset.a === it.a; box.classList.add('done', ok ? 'right' : 'wrong'); done++; if (ok) score++;
        box.querySelector('.res').textContent = (ok ? 'Agreed. ' : 'Most people would say ' + lab[it.a].toLowerCase() + '. ') + it.r;
        H.q(root, 'f-out').innerHTML = `Answered ${done} of 6, ${score} matching. Several of these can be argued both ways, so compare the reasons behind each answer.`;
      });
    }
  });

  /* ---------- 2. dimension reduction ---------- */
  M.push({
    id: 'pca', part: 1, title: 'Dimension reduction',
    lede: 'Four log curves are hard to look at together. PCA finds the direction with the most spread and the next one at right angles to it.',
    steps: [
      'Turn the three-variable cloud, then move the flatten slider to bring it down onto the first two components.',
      'Choose a pair of measurements. Turn the angle slider through 180°. Each sample projects onto the line, and the curve shows how spread out the samples are along it.',
      'Press Go to PC1. The line moves to the angle with the most spread.',
      'In the four-variable panel, keep 1 component and then 2, 3, 4. The readout shows how much of the spread each choice keeps.',
      'Turn on the lithology colors and compare them with the PC1 axis.'
    ],
    html: () => `
      <h4>Three measurements, plotted as a cloud of samples</h4>
      <div class="row-3d">
        <div>${H.cv('p-3', 0.76)}</div>
        <div>
          ${H.S('p-rot', 'Turn the cloud', 0, 360, 1, 30)}
          ${H.S('p-flat', 'Flatten onto PC1 and PC2', 0, 100, 1, 0)}
          <div class="ctlrow">${H.chk('p-auto', 'Keep turning', true)}${H.chk('p-col3', 'Color by lithology', false)}</div>
          <div class="readout" id="p-out0"></div>
        </div>
      </div>
      <div class="row2">
        <div>
          <h4>Two measurements, each rescaled to the same range</h4>
          <div class="ctl"><label for="p-pair">Pair</label><select id="p-pair"></select></div>
          ${H.cv('p-a', 0.95)}
        </div>
        <div>
          <h4>Spread along the line</h4>
          ${H.cv('p-b', 0.95)}
          ${H.S('p-ang', 'Angle of the line', 0, 180, 1, 20)}
          ${H.btn('p-go', 'Go to PC1')}
          <div class="readout" id="p-out1"></div>
        </div>
      </div>
      <h4>All four measurements</h4>
      <div class="row3">
        <div>${H.cv('p-c', 0.95)}</div><div>${H.cv('p-d', 0.95)}</div><div>${H.cv('p-e', 0.95)}</div>
      </div>
      <div class="ctlrow">${H.S('p-keep', 'Components kept', 1, 4, 1, 2)}${H.chk('p-col', 'Color by lithology', false)}</div>
      ${H.legend(D.LITH, D.LCOL)}
      <div class="readout" id="p-out2"></div>`,
    init(root) {
      /* three-variable cloud: turn it, then flatten it onto the first two components */
      (function () {
        const Z3 = R.Z.map(z => [z[0], z[1], z[2]]), P3 = ML.pca(Z3), nm = ['GR', 'Density', 'Sonic'];
        const p3 = H.plot(root, 'p-3', { xr: [-4.5, 4.5], yr: [-3.4, 3.4], noAxes: true, aspect: 0.76, m: { l: 6, r: 6, t: 6, b: 6 } });
        const col3 = H.q(root, 'p-col3'), auto = H.q(root, 'p-auto');
        const rot = H.bind(root, 'p-rot', () => p3.draw(), v => v + '°'), flat = H.bind(root, 'p-flat', () => p3.draw(), v => v + '%');
        col3.addEventListener('change', () => p3.draw());
        const tilt = 0.4;
        const proj = (p, a) => { const x1 = p[0] * Math.cos(a) + p[2] * Math.sin(a), z1 = -p[0] * Math.sin(a) + p[2] * Math.cos(a); return [x1, p[1] * Math.cos(tilt) - z1 * Math.sin(tilt), z1]; };
        p3.onDraw = pl => {
          const a = rot.get() * Math.PI / 180, t = flat.get() / 100, c = pl.ctx;
          // frame
          pl.rect(-4.5, -3.4, 4.5, 3.4, '#FBFCFC', C.GRID);
          const pts = Z3.map((p, i) => { const q = proj(p, a), s = P3.scores[i]; return { x: (1 - t) * q[0] + t * s[0], y: (1 - t) * q[1] + t * s[1], z: (1 - t) * q[2], i }; });
          pts.sort((u, v) => u.z - v.z);
          // variable axes (fade out as the cloud flattens)
          [[3.0, 0, 0], [0, 3.0, 0], [0, 0, 3.0]].forEach((e, k) => {
            const q = proj(e, a), o = proj([0, 0, 0], a); c.save(); c.globalAlpha = 1 - t; c.strokeStyle = C.SLATE; c.lineWidth = 1.6; c.setLineDash([5, 4]);
            c.beginPath(); c.moveTo(pl.x(o[0]), pl.y(o[1])); c.lineTo(pl.x(q[0]), pl.y(q[1])); c.stroke(); c.restore();
            c.save(); c.globalAlpha = 1 - t; pl.ptext(nm[k], pl.x(q[0]) + 4, pl.y(q[1]) - 6, { color: C.SLATE, font: 'bold 13px system-ui' }); c.restore();
          });
          pts.forEach(p => {
            const depth = 0.55 + 0.45 * (p.z + 3) / 6, r = 3 + 1.6 * (1 - t) * (p.z + 3) / 6;
            pl.dot(p.x, p.y, r, col3.checked ? Plot.hex2rgba(D.LCOL[R.y[p.i]], depth) : `rgba(92,102,112,${depth * 0.8})`);
          });
          // principal component arrows (appear as the cloud flattens)
          [0, 1].forEach(k => {
            const v = P3.vecs[k].map(x => x * 2.9), q = proj(v, a), end = k === 0 ? [2.9, 0] : [0, 2.9];
            const X = (1 - t) * q[0] + t * end[0], Y = (1 - t) * q[1] + t * end[1];
            c.save(); c.globalAlpha = 0.25 + 0.75 * t; c.strokeStyle = C.RED; c.lineWidth = 2.6;
            c.beginPath(); c.moveTo(pl.x(0), pl.y(0)); c.lineTo(pl.x(X), pl.y(Y)); c.stroke(); c.restore();
            pl.ptext('PC' + (k + 1), pl.x(X) + 5, pl.y(Y) - 7, { color: C.RED, font: 'bold 14px system-ui' });
          });
          H.q(root, 'p-out0').innerHTML = t < 0.02 ? `Each dot is one sample, placed by gamma ray, density and sonic slowness. The red lines are the first two principal components.` : `Flattened ${Math.round(t * 100)}%. The first two components keep <b>${Math.round((P3.frac[0] + P3.frac[1]) * 100)}%</b> of the spread in these three measurements.`;
        };
        p3.draw();
        const spin = () => { if (auto.checked && p3.c.isConnected && p3.c.clientWidth) rot.set((rot.get() + 0.5) % 361); requestAnimationFrame(spin); };
        requestAnimationFrame(spin);
      })();

      const names = D.SHORT, pairs = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
      const sel = H.q(root, 'p-pair');
      pairs.forEach((pr, i) => sel.insertAdjacentHTML('beforeend', `<option value="${i}">${names[pr[0]]} and ${names[pr[1]]}</option>`));
      const pa = H.plot(root, 'p-a', { xr: [-3, 3], yr: [-3, 3], nx: 6, ny: 6 });
      const pb = H.plot(root, 'p-b', { xr: [0, 180], yr: [0, 2], xl: 'Angle (degrees)', yl: 'Spread', nx: 6, ny: 4 });
      const st = () => pairs[+sel.value];
      const sub = () => R.Z.map(z => [z[st()[0]], z[st()[1]]]);
      const varAt = (X, a) => { const u = [Math.cos(a), Math.sin(a)]; let s = 0; X.forEach(x => { const t = x[0] * u[0] + x[1] * u[1]; s += t * t; }); return s / (X.length - 1); };
      const best = X => { let b = 0, bv = -1; for (let a = 0; a < 180; a += 0.5) { const v = varAt(X, a * Math.PI / 180); if (v > bv) { bv = v; b = a; } } return b; };
      const ang = H.bind(root, 'p-ang', () => { pa.draw(); pb.draw(); }, v => v + '°');
      sel.addEventListener('change', () => { pa.o.xl = D.VARS[st()[0]] + ', rescaled'; pa.o.yl = D.VARS[st()[1]] + ', rescaled'; pa.draw(); pb.draw(); });
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
        H.q(root, 'p-out1').innerHTML = `Spread along the line at ${ang.get()}°: <b>${v.toFixed(2)}</b>. The most for this pair is <b>${varAt(X, b * Math.PI / 180).toFixed(2)}</b>.`;
      };
      sel.dispatchEvent(new Event('change'));

      // four-variable panel
      const P = ML.pca(R.Z);
      const pc = H.plot(root, 'p-c', { xr: [-4, 4], yr: [-4, 4], xl: 'PC1', yl: 'PC2', nx: 8, ny: 8 });
      const pd = H.plot(root, 'p-d', { xr: [0.5, 4.5], yr: [0, 100], xl: 'Component', yl: 'Share of the spread kept (%)', nx: 4, ny: 5, fmtx: v => (Number.isInteger(v) ? 'PC' + v : '') });
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
        H.q(root, 'p-out2').innerHTML = `Keeping ${k} of 4 components keeps <b>${(kept * 100).toFixed(0)}%</b> of the total spread. PC1 loadings on ${names.join(', ')}: ${P.vecs[0].map(v => v.toFixed(2)).join(', ')}.`;
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
      'Press Watch it run. Each round the samples join the nearest center, then each center moves to the middle of its samples.',
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
      <div class="ctlrow">${H.S('u-k', 'Number of clusters, k', 1, 8, 1, 3)}${H.btn('u-run', 'Watch it run')}${H.btn('u-new', 'New start')}${H.chk('u-lith', 'Show lithology (normally unknown)', false)}</div>
      ${H.legend(D.LITH, D.LCOL)}
      <div class="readout" id="u-out"></div>`,
    init(root) {
      const Z = H.Z2;
      const pa = H.plot(root, 'u-a', { xr: [0, 150], yr: [2.0, 2.9], xl: D.VARS[0], yl: D.VARS[1], nx: 6, ny: 6 });
      const pb = H.plot(root, 'u-b', { xr: [0.5, 8.5], yr: [0, 600], xl: 'Number of clusters, k', yl: 'Total distance to the centers', nx: 8, ny: 6, fmtx: v => (Number.isInteger(v) ? v : '') });
      const rr = ML.rng(12), elbow = []; for (let k = 1; k <= 8; k++) elbow.push(ML.kmeansBest(Z, k, rr, 6).inertia);
      let seed = 31, model = null, view = null, raf = 0, note = '';
      const toRaw = c => [c[0] * R.sd[0] + R.mean[0], c[1] * R.sd[1] + R.mean[1]];
      const inertiaOf = (lab, cen) => lab ? Z.reduce((s, x, i) => s + ML.d2(x, cen[lab[i]]), 0) : null;
      const fit = () => { model = ML.kmeans(Z, kk.get(), ML.rng(seed)); view = { lab: model.labels, cen: model.centers }; note = ''; };
      const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
      const kk = H.bind(root, 'u-k', () => { stop(); fit(); pa.draw(); pb.draw(); }, v => v);
      const lith = H.q(root, 'u-lith'); lith.addEventListener('change', () => { pa.draw(); pb.draw(); });
      H.on(root, 'u-new', 'click', () => { stop(); seed += 17; fit(); pa.draw(); pb.draw(); });
      H.on(root, 'u-run', 'click', () => {
        stop(); const r = ML.rng(seed + 5), k = kk.get(); let cen = ML.kppInit(Z, k, r), lab = null, phase = 'assign', t0 = performance.now(), from = null, to = null, round = 0;
        view = { lab: null, cen }; note = 'Starting positions chosen. No sample belongs to a cluster yet.'; pa.draw(); pb.draw();
        const step = now => {
          if (!root.isConnected) return;
          if (phase === 'assign' && now - t0 > 900) {
            const nl = ML.assign(Z, cen);
            if (lab && nl.every((v, i) => v === lab[i])) { note = `Round ${round}: no sample changed cluster, so k-means has converged.`; view = { lab: nl, cen }; raf = 0; pa.draw(); pb.draw(); return; }
            lab = nl; round++; view = { lab, cen }; note = `Round ${round}: each sample joins the nearest center.`;
            from = cen; to = ML.update(Z, lab, k, r); phase = 'move'; t0 = now; pa.draw(); pb.draw();
          } else if (phase === 'move' && now - t0 > 700) {
            const p = Math.min(1, (now - t0 - 700) / 700), e = p * p * (3 - 2 * p);
            view = { lab, cen: from.map((c, j) => c.map((v, d) => v + (to[j][d] - v) * e)) };
            note = `Round ${round}: each center moves to the mean of its samples.`;
            if (p >= 1) { cen = to; phase = 'assign'; t0 = now; }
            pa.draw(); pb.draw();
          }
          raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      });
      fit();
      pa.onDraw = pl => {
        pl.axes();
        R.X.forEach((x, i) => {
          const cc = view.lab ? Plot.CLUSTER[view.lab[i] % 8] : '#5C6670';
          pl.dot(x[0], x[1], lith.checked ? 4.4 : 3.8, Plot.hex2rgba(cc, view.lab ? 0.85 : 0.5), lith.checked ? D.LCOL[R.y[i]] : null, 1.6);
        });
        view.cen.forEach(c => { const p = toRaw(c); pl.dot(p[0], p[1], 8, '#fff', C.INK, 2.4); pl.text('×', p[0], p[1] + 0.005, { align: 'center', font: 'bold 13px system-ui' }); });
      };
      pb.onDraw = pl => {
        pl.axes(); pl.line(elbow.map((v, i) => [i + 1, v]), C.SLATE, 2); elbow.forEach((v, i) => pl.dot(i + 1, v, 3, C.SLATE));
        const cur = view.lab ? inertiaOf(view.lab, view.cen) : null;
        if (cur !== null) pl.dot(kk.get(), Math.min(cur, 600), 6.5, C.RED);
        H.q(root, 'u-out').innerHTML = (note ? note + ' ' : '') + (cur !== null ? `Total distance to the centers now <b>${cur.toFixed(0)}</b>.` : '') +
          (lith.checked && view.lab ? ` Match with the rock types: <b>${H.pct(ML.purity(view.lab, R.y, kk.get(), 3))}</b> of samples fall in a cluster whose most common rock type matches theirs.` : '');
      };
      pa.draw(); pb.draw();
    }
  });
})(window);
