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
      <h4>A rule a person wrote and a rule the computer learned, on the gamma ray of 300 made-up samples</h4>
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
        H.q(root, 'v-out').innerHTML = `The expert's rule (call it shale above ${RULE} API): <b>${H.pct(accAt(RULE, all))}</b> right. The rule learned from ${s.get()} samples (call it shale above ${tl.toFixed(0)} API): <b>${H.pct(accAt(tl, all))}</b> right on all 300. Purple bars are shale and gray bars are the other rocks.`;
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
      ${H.look('Slide How curvy is the line from 1 to 10. Filled dots are training samples: the computer draws the line using only these. Hollow dots are test samples: we hide them while drawing the line and use them afterward as a fair check.', 'A very straight line misses the trend. A very curvy line hugs the filled dots and can miss the hollow ones. The two numbers say how far off the line is, on average, for each set. The best line is not the curviest one.')}
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
        H.q(root, 'ty-out').innerHTML = `Average miss on the training samples: <b>${(rmse(tr) * 100).toFixed(1)}</b> porosity points (percentage points of porosity). Average miss on the test samples: <b>${(rmse(te) * 100).toFixed(1)}</b>.`;
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

  H.look = (todo, notice) => `<div class="look"><p><b>What to do.</b> ${todo}</p><p><b>What to notice.</b> ${notice}</p></div>`;
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dotv = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const unit = a => { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
  const perpTo = v => { let u = [0, 1, 0]; const d = dotv(u, v); u = [u[0] - d * v[0], u[1] - d * v[1], u[2] - d * v[2]]; if (Math.hypot(...u) < 1e-6) { u = [1, 0, 0]; const d2 = dotv(u, v); u = [u[0] - d2 * v[0], u[1] - d2 * v[1], u[2] - d2 * v[2]]; } return unit(u); };
  const dirOf = (az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)]; };
  H.dirOf = dirOf; H.unit = unit; H.perpTo = perpTo; H.cross = cross; H.dotv = dotv;

  /* ---------- 2. dimension reduction ---------- */
  M.push({
    id: 'pca', part: 1, title: 'Dimension reduction',
    lede: '', steps: [],
    html: () => `
      <div class="tabs" role="tablist" id="pc-tabs">
        <button type="button" class="tab on" data-s="1">1 Find PC1</button><button type="button" class="tab" data-s="2">2 Find PC2</button><button type="button" class="tab" data-s="3">3 Flatten</button><button type="button" class="tab" data-s="4">4 All four measurements</button>
      </div>

      <div class="track on" data-s="1">
        ${H.look('Turn the cloud with the two sliders until it looks as wide as possible from left to right. The strip under the cloud shows where every sample lands along the left-right direction, and the red bar is the spread.', 'The meter goes up when the cloud stretches out sideways and drops when we look along the long way of the cloud. The view with the most spread is the first principal component, PC1. When you are done, press the button to see what the computer found.')}
        <div class="row-3d"><div>${H.cv('pc-a', 0.8)}</div>
          <div>
            ${H.S('pc-az', 'Turn left and right', 0, 359, 1, 200)}
            ${H.S('pc-el', 'Tilt up and down', -90, 90, 1, 10)}
            <div class="meter"><div class="mbar"><i id="pc1-fill"></i><b id="pc1-best"></b></div><div class="mtxt" id="pc1-txt"></div></div>
            <div class="ctlrow">${H.btn('pc1-ans', 'Show the computer\'s answer')}${H.btn('pc1-new', 'Start over')}</div>
            <div class="readout" id="pc1-out"></div>
          </div></div>
      </div>

      <div class="track" data-s="2">
        ${H.look('PC1 is now fixed as the left-right direction. Turn the cloud around that direction with the slider until it looks as tall as possible. The strip on the right shows where every sample lands up and down.', 'We are hunting for the direction with the most spread that is also at right angles to PC1. It has to be at right angles, so it tells us something new. The best view is PC2.')}
        <div class="row-3d"><div>${H.cv('pc-b', 0.8)}</div>
          <div>
            ${H.S('pc-ps', 'Turn around PC1', 0, 359, 1, 100)}
            <div class="meter"><div class="mbar"><i id="pc2-fill"></i><b id="pc2-best"></b></div><div class="mtxt" id="pc2-txt"></div></div>
            <div class="ctlrow">${H.btn('pc2-ans', 'Show the computer\'s answer')}${H.btn('pc2-new', 'Start over')}</div>
            <div class="readout" id="pc2-out"></div>
          </div></div>
      </div>

      <div class="track" data-s="3">
        ${H.look('Slide Flatten from 0 to 100%. The cloud swings around and then lies flat, so only PC1 and PC2 are left. Then turn on the rock-type colors.', 'The flat plot still holds most of the pattern from the 3D cloud, and it is easy to read. The computer never saw the rock types, and yet they land in different parts of the plot.')}
        <div class="row-3d"><div>${H.cv('pc-c', 0.8)}</div>
          <div>
            ${H.S('pc-rot', 'Turn the cloud', 0, 360, 1, 30)}
            ${H.S('pc-flat', 'Flatten onto PC1 and PC2', 0, 100, 1, 0)}
            <div class="ctlrow">${H.chk('pc-col3', 'Color by rock type', false)}${H.chk('pc-auto', 'Keep turning', false)}</div>
            ${H.legend(D.LITH, D.LCOL)}
            <div class="readout" id="pc3-out"></div>
          </div></div>
      </div>

      <div class="track" data-s="4">
        ${H.look('Now all four measurements go in: gamma ray, density, sonic slowness and neutron porosity. Slide Components kept from 1 to 4 and watch the red bars, then turn on the rock-type colors.', 'The left plot shows every sample on PC1 and PC2. The middle bars show how much of the total spread each component holds, and the red ones are the components we keep. The right bars are the loadings: how much of each measurement goes into PC1 (red) and PC2 (gray). Two components already hold most of the spread, and PC1 is a mix in which several measurements rise and fall together.')}
        <div class="row3"><div>${H.cv('pc-d', 0.95)}</div><div>${H.cv('pc-e', 0.95)}</div><div>${H.cv('pc-f', 0.95)}</div></div>
        <div class="ctlrow">${H.S('pc-keep', 'Components kept', 1, 4, 1, 2)}${H.chk('pc-col4', 'Color by rock type', false)}</div>
        ${H.legend(D.LITH, D.LCOL)}
        <div class="readout" id="pc4-out"></div>
      </div>`,
    init(root) {
      const Z3 = R.Z.map(z => [z[0], z[1], z[2]]), P3 = ML.pca(Z3), C3 = ML.cov(Z3).C, NM = ['Gamma ray', 'Density', 'Sonic'];
      const varAlong = v => { let s = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += v[i] * C3[i][j] * v[j]; return s; };
      const opt = { xr: [-4.6, 4.6], yr: [-3.6, 3.6], noAxes: true, aspect: 0.8, m: { l: 3, r: 3, t: 3, b: 3 } };
      const angOf = v => ({ az: Math.atan2(v[2], v[0]) * 180 / Math.PI, el: Math.asin(Math.max(-1, Math.min(1, v[1]))) * 180 / Math.PI });
      const lerpAng = (a, b, t) => { let d = ((b - a + 540) % 360) - 180; return a + d * t; };
      let anim = 0, gliding = false; const stopAnim = () => { if (anim) { cancelAnimationFrame(anim); anim = 0; } gliding = false; };
      const glide = (fn, ms, done) => { stopAnim(); gliding = true; const t0 = performance.now(); const f = now => { const t = Math.min(1, (now - t0) / ms), e = t * t * (3 - 2 * t); fn(e); if (t < 1) anim = requestAnimationFrame(f); else { anim = 0; gliding = false; if (done) done(); } }; anim = requestAnimationFrame(f); };
      const meter = (fillId, bestId, txtId, pct, best, label) => { root.querySelector('#' + fillId).style.width = pct + '%'; root.querySelector('#' + bestId).style.left = best + '%'; root.querySelector('#' + txtId).innerHTML = `${label}: <b>${Math.round(pct)}%</b> of the most spread possible. Best so far: <b>${Math.round(best)}%</b>.`; };

      /* ---- step 1: find PC1 ---- */
      const p1 = H.plot(root, 'pc-a', opt);
      let best1 = 0, show1 = false;
      const az = H.bind(root, 'pc-az', () => { show1 = false; p1.draw(); }, v => v + '°'), el = H.bind(root, 'pc-el', () => { show1 = false; p1.draw(); }, v => v + '°');
      const basis1 = () => { const e1 = dirOf(az.get(), el.get()), e2 = perpTo(e1), e3 = cross(e1, e2); return { e1, e2, e3 }; };
      function drawCloud(pl, B, hiVar, opts) {
        const c = pl.ctx; pl.rect(-4.6, -3.6, 4.6, 3.6, '#FBFCFC', C.GRID);
        Z3.map((p, i) => ({ X: dotv(p, B.e1), Y: dotv(p, B.e2), Zd: dotv(p, B.e3), i })).sort((u, v) => u.Zd - v.Zd).forEach(o => { const d = (o.Zd + 3) / 6; pl.dot(o.X, o.Y, 3 + 1.4 * d, `rgba(92,102,112,${(0.5 + 0.4 * d).toFixed(2)})`); });
        return c;
      }
      p1.onDraw = pl => {
        const B = basis1(), c = drawCloud(pl, B), v = varAlong(B.e1), pct = 100 * v / P3.vals[0], sd = Math.sqrt(v);
        if (!gliding && !show1) best1 = Math.max(best1, pct);
        pl.line([[-4.6, -3.2], [4.6, -3.2]], C.GRID, 1); Z3.forEach(p => pl.dot(dotv(p, B.e1), -3.2, 2, 'rgba(92,102,112,0.5)'));
        pl.line([[-sd, -3.45], [sd, -3.45]], C.RED, 5); pl.text('spread', 0, -3.05, { align: 'center', font: '11.5px system-ui', color: C.RED });
        pl.line([[0, -3.6], [0, 3.6]], 'rgba(22,25,28,0.25)', 1, [4, 4]);
        if (show1) { pl.line([[-4.2, 0], [4.2, 0]], C.RED, 3); pl.ptext('PC1', pl.x(4.0), pl.y(0.4), { color: C.RED, font: 'bold 15px system-ui' }); }
        meter('pc1-fill', 'pc1-best', 'pc1-txt', pct, best1, 'This view holds');
        root.querySelector('#pc1-out').innerHTML = show1 ? `The computer's PC1 holds <b>${Math.round(100 * P3.frac[0])}%</b> of all the spread in the three measurements. Your own best view reached <b>${Math.round(best1)}%</b> of the most possible.` : `Look along the cloud from different sides. The wider it spreads on the strip, the higher the meter goes.`;
      };
      const start1 = () => { const a = angOf(P3.vecs[2]); az.el.value = ((Math.round(a.az) % 360) + 360) % 360; el.el.value = Math.round(a.el); az.set(az.el.value); el.set(el.el.value); best1 = 0; show1 = false; p1.draw(); };
      H.on(root, 'pc1-new', 'click', () => { stopAnim(); start1(); });
      H.on(root, 'pc1-ans', 'click', () => {
        const t = angOf(P3.vecs[0]), a0 = az.get(), e0 = el.get();
        glide(e => { const A = ((lerpAng(a0, t.az, e) % 360) + 360) % 360; az.el.value = Math.round(A); el.el.value = Math.round(e0 + (t.el - e0) * e); root.querySelector('#pc-az-o').textContent = az.el.value + '°'; root.querySelector('#pc-el-o').textContent = el.el.value + '°'; p1.draw(); }, 1400, () => { show1 = true; p1.draw(); });
      });

      /* ---- step 2: find PC2 ---- */
      const p2 = H.plot(root, 'pc-b', opt);
      const v1 = P3.vecs[0], u2 = perpTo(v1), w2 = cross(v1, u2);
      const psiOf = v => Math.atan2(dotv(v, w2), dotv(v, u2)) * 180 / Math.PI;
      let best2 = 0, show2 = false;
      const ps = H.bind(root, 'pc-ps', () => { show2 = false; p2.draw(); }, v => v + '°');
      const e2of = psi => { const a = psi * Math.PI / 180; return [0, 1, 2].map(i => Math.cos(a) * u2[i] + Math.sin(a) * w2[i]); };
      p2.onDraw = pl => {
        const e2 = e2of(ps.get()), B = { e1: v1, e2, e3: cross(v1, e2) }, c = drawCloud(pl, B), v = varAlong(e2), pct = 100 * v / P3.vals[1], sd = Math.sqrt(v);
        if (!gliding && !show2) best2 = Math.max(best2, pct);
        pl.line([[4.1, -3.6], [4.1, 3.6]], C.GRID, 1); Z3.forEach(p => pl.dot(4.1, dotv(p, e2), 2, 'rgba(92,102,112,0.5)'));
        pl.line([[4.35, -sd], [4.35, sd]], C.RED, 5);
        pl.line([[-4.6, 0], [4.6, 0]], 'rgba(22,25,28,0.25)', 1, [4, 4]);
        pl.ptext('PC1', pl.x(-4.5), pl.y(0.5), { color: C.SLATE, font: 'bold 13px system-ui' });
        if (show2) { pl.line([[0, -3.4], [0, 3.4]], C.RED, 3); pl.ptext('PC2', pl.x(0.3), pl.y(3.2), { color: C.RED, font: 'bold 15px system-ui' }); }
        meter('pc2-fill', 'pc2-best', 'pc2-txt', pct, best2, 'This view holds');
        root.querySelector('#pc2-out').innerHTML = show2 ? `The computer's PC2 holds <b>${Math.round(100 * P3.frac[1])}%</b> of the spread. Together, PC1 and PC2 hold <b>${Math.round(100 * (P3.frac[0] + P3.frac[1]))}%</b>. Your own best view reached <b>${Math.round(best2)}%</b> of the most possible.` : 'Turn the slider slowly all the way around. The tallest view is PC2.';
      };
      const start2 = () => { const a = ((Math.round(psiOf(P3.vecs[2])) % 360) + 360) % 360; ps.set(a); best2 = 0; show2 = false; p2.draw(); };
      H.on(root, 'pc2-new', 'click', () => { stopAnim(); start2(); });
      H.on(root, 'pc2-ans', 'click', () => {
        const t = psiOf(P3.vecs[1]), a0 = ps.get();
        glide(e => { const A = ((lerpAng(a0, t, e) % 360) + 360) % 360; ps.el.value = Math.round(A); root.querySelector('#pc-ps-o').textContent = ps.el.value + '°'; p2.draw(); }, 1200, () => { show2 = true; p2.draw(); });
      });

      /* ---- step 3: flatten ---- */
      const p3 = H.plot(root, 'pc-c', opt);
      const col3 = H.q(root, 'pc-col3'), auto = H.q(root, 'pc-auto');
      const rot = H.bind(root, 'pc-rot', () => p3.draw(), v => v + '°'), flat = H.bind(root, 'pc-flat', () => p3.draw(), v => v + '%');
      col3.addEventListener('change', () => p3.draw());
      const tilt = 0.4, proj = (p, a) => { const x1 = p[0] * Math.cos(a) + p[2] * Math.sin(a), z1 = -p[0] * Math.sin(a) + p[2] * Math.cos(a); return [x1, p[1] * Math.cos(tilt) - z1 * Math.sin(tilt), z1]; };
      p3.onDraw = pl => {
        const a = rot.get() * Math.PI / 180, t = flat.get() / 100, c = pl.ctx;
        pl.rect(-4.6, -3.6, 4.6, 3.6, '#FBFCFC', C.GRID);
        const pts = Z3.map((p, i) => { const q = proj(p, a), s = P3.scores[i]; return { x: (1 - t) * q[0] + t * s[0], y: (1 - t) * q[1] + t * s[1], z: (1 - t) * q[2], i }; }).sort((u, v) => u.z - v.z);
        [[3.2, 0, 0], [0, 3.2, 0], [0, 0, 3.2]].forEach((e, k) => { const q = proj(e, a), o = proj([0, 0, 0], a); c.save(); c.globalAlpha = 1 - t; c.strokeStyle = C.SLATE; c.lineWidth = 1.6; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(pl.x(o[0]), pl.y(o[1])); c.lineTo(pl.x(q[0]), pl.y(q[1])); c.stroke(); c.restore(); c.save(); c.globalAlpha = 1 - t; pl.ptext(NM[k], pl.x(q[0]) + 4, pl.y(q[1]) - 6, { color: C.SLATE, font: 'bold 13px system-ui' }); c.restore(); });
        pts.forEach(p => { const depth = 0.55 + 0.45 * (p.z + 3) / 6, r = 3 + 1.6 * (1 - t) * (p.z + 3) / 6; pl.dot(p.x, p.y, r, col3.checked ? Plot.hex2rgba(D.LCOL[R.y[p.i]], depth) : `rgba(92,102,112,${(depth * 0.8).toFixed(2)})`); });
        [0, 1].forEach(k => { const v = P3.vecs[k].map(x => x * 2.9), q = proj(v, a), end = k === 0 ? [2.9, 0] : [0, 2.9], X = (1 - t) * q[0] + t * end[0], Y = (1 - t) * q[1] + t * end[1]; c.save(); c.globalAlpha = 0.25 + 0.75 * t; c.strokeStyle = C.RED; c.lineWidth = 2.6; c.beginPath(); c.moveTo(pl.x(0), pl.y(0)); c.lineTo(pl.x(X), pl.y(Y)); c.stroke(); c.restore(); pl.ptext('PC' + (k + 1), pl.x(X) + 5, pl.y(Y) - 7, { color: C.RED, font: 'bold 15px system-ui' }); });
        root.querySelector('#pc3-out').innerHTML = t < 0.02 ? 'Each dot is one sample, placed by gamma ray, density and sonic slowness. The red lines are PC1 and PC2.' : `Flattened ${Math.round(t * 100)}%. PC1 and PC2 keep <b>${Math.round((P3.frac[0] + P3.frac[1]) * 100)}%</b> of the spread in these three measurements.`;
      };
      const spin = () => { if (auto.checked && p3.c.isConnected && p3.c.clientWidth) rot.set((rot.get() + 0.5) % 361); requestAnimationFrame(spin); };
      requestAnimationFrame(spin);

      /* ---- step 4: all four measurements ---- */
      const P4 = ML.pca(R.Z), names = D.SHORT;
      const pd = H.plot(root, 'pc-d', { xr: [-4, 4], yr: [-4, 4], xl: 'PC1', yl: 'PC2', nx: 8, ny: 8 });
      const pe = H.plot(root, 'pc-e', { xr: [0.5, 4.5], yr: [0, 100], xl: 'Component', yl: 'Share of the spread (%)', nx: 4, ny: 5, fmtx: v => (Number.isInteger(v) ? 'PC' + v : '') });
      const pf = H.plot(root, 'pc-f', { xr: [0.5, 4.5], yr: [-1, 1], xl: 'Measurement', yl: 'Loading', nx: 4, ny: 4, fmtx: v => (Number.isInteger(v) ? names[v - 1] : '') });
      const col4 = H.q(root, 'pc-col4'), keep = H.bind(root, 'pc-keep', () => { pd.draw(); pe.draw(); pf.draw(); }, v => v);
      col4.addEventListener('change', () => pd.draw());
      pd.onDraw = pl => { pl.axes(); const k = keep.get(); P4.scores.forEach((s, i) => pl.dot(s[0], k >= 2 ? s[1] : 0, 3, col4.checked ? Plot.hex2rgba(D.LCOL[R.y[i]], 0.8) : 'rgba(92,102,112,0.55)')); if (k < 2) pl.text('PC2 not kept', 0, 3.4, { align: 'center', color: C.SLATE, font: '12px system-ui' }); };
      pe.onDraw = pl => {
        pl.axes(); const k = keep.get();
        P4.frac.forEach((f, i) => { pl.rect(i + 1 - 0.32, 0, i + 1 + 0.32, f * 100, i < k ? C.RED : 'rgba(92,102,112,0.35)'); pl.text(Math.round(f * 100) + '', i + 1, f * 100 + 5, { align: 'center', font: '12px system-ui', color: C.INK }); });
        const kept = P4.frac.slice(0, k).reduce((a, b) => a + b, 0);
        root.querySelector('#pc4-out').innerHTML = `Keeping ${k} of 4 components keeps <b>${(kept * 100).toFixed(0)}%</b> of the total spread. PC1 is a mix of the four measurements: gamma ray ${P4.vecs[0][0].toFixed(2)}, density ${P4.vecs[0][1].toFixed(2)}, sonic ${P4.vecs[0][2].toFixed(2)}, neutron porosity ${P4.vecs[0][3].toFixed(2)}. Measurements with the same sign rise together, and a measurement with the opposite sign falls when they rise.`;
      };
      pf.onDraw = pl => { pl.axes(); pl.hline(0, C.SLATE, 1); for (let j = 0; j < 4; j++) { pl.rect(j + 1 - 0.35, 0, j + 1, P4.vecs[0][j], C.RED); pl.rect(j + 1, 0, j + 1 + 0.35, P4.vecs[1][j], C.SLATE); } pl.ptext('PC1', pl.x(0.6), pl.y(0.9), { color: C.RED, font: '12px system-ui' }); pl.ptext('PC2', pl.x(1.2), pl.y(0.9), { color: C.SLATE, font: '12px system-ui' }); };

      /* ---- tabs ---- */
      let step = 1; const plots = { 1: [p1], 2: [p2], 3: [p3], 4: [pd, pe, pf] };
      root.querySelectorAll('#pc-tabs .tab').forEach(b => b.addEventListener('click', () => {
        stopAnim(); step = +b.dataset.s; root.querySelectorAll('#pc-tabs .tab').forEach(x => x.classList.toggle('on', x === b));
        root.querySelectorAll('.track[data-s]').forEach(x => x.classList.toggle('on', +x.dataset.s === step));
        plots[step].forEach(p => { p.fit(); p.draw(); });
      }));
      start1(); start2(); p1.draw();
    }
  });


  /* ---------- 3. unsupervised: where did the sand come from ---------- */
  M.push({
    id: 'unsup', part: 1, title: 'Unsupervised learning: where did the sand come from?',
    lede: '', steps: [],
    html: () => `
      <div class="row2">
        <div><h5>What k-means found</h5>${H.cv('u-a', 0.8)}</div>
        <div><h5>Where the sand really came from</h5>${H.cv('u-b', 0.8)}</div>
      </div>
      <div class="ctlrow st-top">
        <label class="switch"><input type="checkbox" id="u-true"><span class="sw"></span><b>Reveal the true source of each sample</b></label>
        <label class="chk"><input type="checkbox" id="u-auto" checked> Keep turning</label>
        <div class="hintline">Drag either cloud to turn it. Six measurements cannot be drawn, so both clouds show three new axes, PC1, PC2 and PC3, built from all six (as in the Dimensions tab). k-means still uses all six measurements to make the groups.</div>
      </div>
      <div class="ctlrow">${H.S('u-k', 'Number of groups, k', 1, 8, 1, 4)}${H.btn('u-run', 'Watch it run')}${H.btn('u-new', 'New start')}</div>
      <div class="row2">
        <div><h5>How far the samples are from their group centers</h5>${H.cv('u-e', 0.8)}</div>
        <div><h5>What each group is made of</h5>${H.cv('u-g', 0.8)}</div>
      </div>
      <div class="legend" id="u-legend"></div>
      <p class="note">Clues from geology: granite sand is rich in potassium (K₂O) and zirconium (Zr). Dark volcanic rock gives sand rich in chromium (Cr) and nickel (Ni). Limestone gives calcium (CaO) and strontium (Sr). Old, recycled sandstone is rich in zircon (Zr) and poor in most other things.</p>
      <div class="readout" id="u-out"></div>`,
    init(root) {
      const PV = D.provenance(), Z = PV.Z, P6 = ML.pca(Z), SC = P6.scores.map(s => s.slice(0, 3)), n = Z.length, q = id => root.querySelector('#' + id);
      const st = { k: 4, seed: 3, rot: 25, auto: true, show: false, note: '' };
      let view = null, timer = 0;
      const rr = ML.rng(12), elbow = Array.from({ length: 8 }, (_, i) => ML.kmeansBest(Z, i + 1, rr, 6).inertia);
      const tilt = 0.4, proj = (p, a) => { const x1 = p[0] * Math.cos(a) + p[2] * Math.sin(a), z1 = -p[0] * Math.sin(a) + p[2] * Math.cos(a); return [x1, p[1] * Math.cos(tilt) - z1 * Math.sin(tilt), z1]; };
      const opt = { xr: [-5.2, 5.2], yr: [-4.1, 4.1], noAxes: true, aspect: 0.8, m: { l: 3, r: 3, t: 3, b: 3 } };
      const pA = H.plot(root, 'u-a', opt), pB = H.plot(root, 'u-b', opt);
      const pE = H.plot(root, 'u-e', { xr: [0.5, 8.5], yr: [0, 2300], nx: 8, ny: 5, xl: 'Number of groups, k', yl: 'Total distance to the centers', fmtx: v => (Number.isInteger(v) ? v : ''), aspect: 0.8 });
      const pG = H.plot(root, 'u-g', { xr: [0, 1], yr: [0, 1], noAxes: true, aspect: 0.8, m: { l: 2, r: 2, t: 2, b: 2 } });
      const toPC = c => [0, 1, 2].map(j => P6.vecs[j].reduce((a, v, i) => a + v * (c[i] - P6.mean[i]), 0));

      function order(lab, k) {
        const m = new Array(k).fill(0), cnt = new Array(k).fill(0); lab.forEach((l, i) => { m[l] += Z[i][0]; cnt[l]++; });
        const ord = m.map((v, i) => [cnt[i] ? v / cnt[i] : 1e9, i]).sort((a, b) => a[0] - b[0]), rank = new Array(k); ord.forEach((o, r) => { rank[o[1]] = r; });
        return { lab: lab.map(l => rank[l]), rank };
      }
      function compute() { const m = ML.kmeans(Z, st.k, ML.rng(st.seed)), o = order(m.labels, st.k); view = { lab: o.lab, cen: o.rank ? m.centers.map((c, j) => ({ c, r: o.rank[j] })).sort((a, b) => a.r - b.r).map(x => x.c) : m.centers, k: st.k }; st.note = ''; }
      const stop = () => { if (timer) { clearInterval(timer); timer = 0; } };

      function cloud(pl, colorFn, overlay) {
        const a = st.rot * Math.PI / 180, c = pl.ctx;
        pl.rect(-5.2, -4.1, 5.2, 4.1, '#FBFCFC', C.GRID);
        [[4, 0, 0], [0, 4, 0], [0, 0, 4]].forEach((e, k) => { const qq = proj(e, a), o = proj([0, 0, 0], a); c.save(); c.strokeStyle = 'rgba(92,102,112,0.55)'; c.lineWidth = 1.4; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(pl.x(o[0]), pl.y(o[1])); c.lineTo(pl.x(qq[0]), pl.y(qq[1])); c.stroke(); c.restore(); pl.ptext('PC' + (k + 1), pl.x(qq[0]) + 4, pl.y(qq[1]) - 5, { color: C.SLATE, font: 'bold 12px system-ui' }); });
        SC.map((p, i) => ({ q: proj(p, a), i })).sort((u, v) => u.q[2] - v.q[2]).forEach(o => { const d = (o.q[2] + 4) / 8; pl.dot(o.q[0], o.q[1], 3 + 1.3 * d, colorFn(o.i, 0.55 + 0.45 * d)); });
        if (overlay) overlay(a);
      }
      pA.onDraw = pl => cloud(pl, (i, d) => (view && view.lab ? Plot.hex2rgba(Plot.CLUSTER[view.lab[i] % 8], d) : `rgba(92,102,112,${(d * 0.75).toFixed(2)})`), a => {
        if (view && view.cen) view.cen.forEach(cn => { const p2 = proj(toPC(cn), a); pl.dot(p2[0], p2[1], 9, '#fff', C.INK, 2.6); pl.text('×', p2[0], p2[1] + 0.07, { align: 'center', font: 'bold 14px system-ui' }); });
      });
      pB.onDraw = pl => {
        cloud(pl, (i, d) => (st.show ? Plot.hex2rgba(D.SCOL[PV.y[i]], d) : `rgba(92,102,112,${(d * 0.45).toFixed(2)})`));
        if (!st.show) { const c = pl.ctx; c.save(); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(pl.W / 2 - 132, pl.H / 2 - 20, 264, 40); c.restore(); pl.ptext('Sources hidden. Turn on the switch.', pl.W / 2, pl.H / 2, { align: 'center', font: '600 14px system-ui', color: C.INK }); }
      };
      pE.onDraw = pl => {
        pl.axes(); pl.line(elbow.map((v, i) => [i + 1, v]), C.SLATE, 2); elbow.forEach((v, i) => pl.dot(i + 1, v, 3, C.SLATE)); pl.dot(st.k, elbow[st.k - 1], 7, C.RED);
        pl.ptext('The curve flattens after about k = 4.', pl.o.m.l + 12, pl.o.m.t + 16, { color: C.SLATE, font: '12.5px system-ui' });
      };
      const dominant = () => { const k = view.k, cnt = Array.from({ length: k }, () => [0, 0, 0, 0, 0]), sz = new Array(k).fill(0); view.lab.forEach((l, i) => { cnt[l][PV.y[i]]++; sz[l]++; }); return { cnt, sz, dom: cnt.map(c => c.indexOf(Math.max(...c))) }; };
      pG.onDraw = pl => {
        const c = pl.ctx; c.save();
        if (!view || !view.lab) { pl.ptext('Press Watch it run, or move the slider.', pl.W / 2, pl.H / 2, { align: 'center', color: C.SLATE, font: '14px system-ui' }); c.restore(); return; }
        const k = view.k, mean = Array.from({ length: k }, () => new Array(6).fill(0)), sz = new Array(k).fill(0);
        view.lab.forEach((l, i) => { sz[l]++; for (let v = 0; v < 6; v++) mean[l][v] += Z[i][v]; });
        const info = dominant(), lw = 78, ex = st.show ? 116 : 0, cw = (pl.W - lw - ex - 6) / 6, top = 34, rh = Math.min(40, (pl.H - top - 8) / Math.max(k, 3));
        c.font = '600 12px system-ui'; c.fillStyle = C.INK; c.textAlign = 'center'; c.textBaseline = 'middle';
        D.PSHORT.forEach((nm, v) => c.fillText(nm, lw + (v + 0.5) * cw, 16));
        if (st.show) { c.fillText('Mostly from', lw + 6 * cw + ex / 2, 16); }
        for (let g = 0; g < k; g++) {
          const y = top + g * rh; c.fillStyle = Plot.CLUSTER[g % 8]; c.beginPath(); c.arc(12, y + rh / 2, 6, 0, 6.2832); c.fill();
          c.fillStyle = C.INK; c.textAlign = 'left'; c.font = '600 12px system-ui'; c.fillText('Group ' + (g + 1), 24, y + rh / 2 - 6); c.font = '11px system-ui'; c.fillStyle = C.SLATE; c.fillText(sz[g] + ' samples', 24, y + rh / 2 + 8);
          for (let v = 0; v < 6; v++) {
            const z = sz[g] ? mean[g][v] / sz[g] : 0, t = Math.max(-1, Math.min(1, z / 1.6)), col = t >= 0 ? `rgba(132,22,23,${(0.08 + 0.8 * t).toFixed(2)})` : `rgba(59,111,182,${(0.08 - 0.8 * t).toFixed(2)})`;
            c.fillStyle = col; c.fillRect(lw + v * cw + 1, y + 1, cw - 2, rh - 2); c.fillStyle = Math.abs(t) > 0.55 ? '#fff' : C.INK; c.textAlign = 'center'; c.font = '600 12px system-ui'; c.fillText((z >= 0 ? '+' : '') + z.toFixed(1), lw + (v + 0.5) * cw, y + rh / 2);
          }
          if (st.show && sz[g]) { const d = info.dom[g], pct = Math.round(100 * info.cnt[g][d] / sz[g]); c.fillStyle = D.SCOL[d]; c.fillRect(lw + 6 * cw + 4, y + 3, 10, rh - 6); c.fillStyle = C.INK; c.textAlign = 'left'; c.font = '600 11.5px system-ui'; c.fillText(d === 4 ? 'None of them' : D.SRCS[d], lw + 6 * cw + 18, y + rh / 2 - 6); c.font = '11px system-ui'; c.fillStyle = C.SLATE; c.fillText(pct + '%', lw + 6 * cw + 18, y + rh / 2 + 8); }
        }
        c.font = '11.5px system-ui'; c.fillStyle = C.SLATE; c.textAlign = 'left'; c.fillText('Red: above the average of all samples. Blue: below. The number says how far, in units of typical spread.', 4, pl.H - 8);
        c.restore();
      };

      function legend() {
        const sw = col => `<i style="background:${col}"></i>`; let h = '';
        if (!view || !view.lab) h = `<span>${sw('#8A929A')}One sample, not grouped yet</span>`;
        else h = Array.from({ length: view.k }, (_, g) => `<span>${sw(Plot.CLUSTER[g])}Group ${g + 1}</span>`).join('') + '<span><i class="ctr">×</i>Center</span>';
        if (st.show) h += D.SRC.map((nm, i) => `<span>${sw(D.SCOL[i])}${nm} (right plot)</span>`).join('');
        q('u-legend').innerHTML = h;
      }
      function readout() {
        let t = st.note || (!view || !view.lab ? 'Nothing is grouped yet. Press Watch it run, or move the slider.' : `k-means with k = ${view.k}: ${view.k} centers. Read the table on the right: a red cell means that group is higher than average in that element.`);
        if (st.show && view && view.lab && !st.note) {
          const info = dominant(), pur = ML.purity(view.lab, PV.y, view.k, 5), realDom = new Set(info.dom.filter((d, g) => info.sz[g] > 0 && d < 4)), odd = info.dom.filter((d, g) => info.sz[g] > 0 && d === 4).length;
          t = `With the sources revealed: <b>${H.pct(pur)}</b> of the samples fall in a group dominated by their own source. ` +
            (odd ? `One group is made mostly of gray samples that fit none of the four ranges. We come back to those. ` : '') +
            (view.k < 4 ? `Fewer groups than ranges, so ${4 - view.k > 1 ? 'some ranges are' : 'two ranges are'} lumped together.` : view.k === 4 ? 'Four groups for four ranges.' : (realDom.size < 4 ? '' : `${view.k - 4 - odd > 0 ? 'The extra groups split ranges we already have.' : ''}`));
        }
        q('u-out').innerHTML = t;
      }
      function redraw() { legend(); [pA, pB, pE, pG].forEach(p => p.draw()); readout(); }
      const redrawClouds = () => { pA.draw(); pB.draw(); };

      H.bind(root, 'u-k', v => { st.k = v; stop(); compute(); redraw(); }, v => v);
      q('u-true').addEventListener('change', e => { st.show = e.target.checked; redraw(); });
      q('u-auto').addEventListener('change', e => { st.auto = e.target.checked; });
      q('u-new').addEventListener('click', () => { stop(); st.seed += 13; compute(); redraw(); });
      q('u-run').addEventListener('click', () => {
        stop(); const reduce = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches, r = ML.rng(st.seed + 5), k = st.k, frames = []; let cen = ML.kppInit(Z, k, r), lab = null;
        frames.push({ lab: null, cen, note: 'Step 1: the computer drops k centers into the data. No sample belongs to a group yet.' });
        for (let it = 1; it <= 14; it++) {
          const nl = ML.assign(Z, cen); if (lab && nl.every((v, i) => v === lab[i])) { frames.push({ lab, cen, note: `Round ${it - 1}: no sample changed groups, so k-means is finished.` }); break; }
          lab = nl; frames.push({ lab, cen, note: `Round ${it}, part 1: every sample joins its closest center (measured on all six elements).` });
          cen = ML.update(Z, lab, k, r); frames.push({ lab, cen, note: `Round ${it}, part 2: every center moves to the middle of its samples.` });
        }
        let f = 0; const step = () => { const fr = frames[Math.min(f, frames.length - 1)]; view = { lab: fr.lab ? order(fr.lab, k).lab : null, cen: fr.cen, k }; st.note = fr.note; redraw(); if (++f >= frames.length) { stop(); st.note = ''; redraw(); } };
        if (reduce) { f = frames.length - 1; step(); } else { step(); timer = setInterval(step, 850); }
      });
      const spin = () => { if (st.auto && q('u-a').isConnected && q('u-a').clientWidth) { st.rot = (st.rot + 0.35) % 360; redrawClouds(); } requestAnimationFrame(spin); };
      requestAnimationFrame(spin);
      [pA.c, pB.c].forEach(cv => { let drag = false, lx = 0; cv.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId); }); cv.addEventListener('pointermove', e => { if (!drag) return; st.rot = (st.rot + (e.clientX - lx) * 0.6 + 360) % 360; lx = e.clientX; redrawClouds(); }); ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { drag = false; })); });
      compute(); view = { lab: null, cen: null, k: st.k }; redraw();
    }
  });

})(window);
