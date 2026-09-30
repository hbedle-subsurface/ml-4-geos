/* modules_prov.js - semi-supervised and supervised learning on the Redbud Basin sandstones.
   The field crew samples the mountains themselves, so those samples are the labeled ones. */
(function (g) {
  const { ML, DATA: D, Plot, H, MODULES: M } = g;
  const C = Plot.C;
  const TREE_NAME = ['Boomer', 'Sooner', 'Thunder', 'Red Dirt'];

  /* shared data, built once */
  const PV = D.provenance(), FB = D.fieldBank(PV), P6 = ML.pca(PV.Z), NB = 360;
  const SC = P6.scores.map(s => s.slice(0, 3));
  const toPC = z => [0, 1, 2].map(j => P6.vecs[j].reduce((a, v, i) => a + v * (z[i] - P6.mean[i]), 0));
  const FBpc = FB.Z.map(toPC);
  const tilt = 0.4, proj = (p, a) => { const x1 = p[0] * Math.cos(a) + p[2] * Math.sin(a), z1 = -p[0] * Math.sin(a) + p[2] * Math.cos(a); return [x1, p[1] * Math.cos(tilt) - z1 * Math.sin(tilt), z1]; };
  const opt = { xr: [-5.2, 5.2], yr: [-4.1, 4.1], noAxes: true, aspect: 0.8, m: { l: 3, r: 3, t: 3, b: 3 } };

  /* draw the basin samples as a turning cloud; wrong(i) rings a sample in red, mark(i) rings it in black */
  function cloud(pl, rot, colorFn, o) {
    o = o || {}; const a = rot * Math.PI / 180, c = pl.ctx;
    pl.rect(-5.2, -4.1, 5.2, 4.1, '#FBFCFC', C.GRID);
    [[4, 0, 0], [0, 4, 0], [0, 0, 4]].forEach((e, k) => { const qq = proj(e, a), org = proj([0, 0, 0], a); c.save(); c.strokeStyle = 'rgba(92,102,112,0.5)'; c.lineWidth = 1.3; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(pl.x(org[0]), pl.y(org[1])); c.lineTo(pl.x(qq[0]), pl.y(qq[1])); c.stroke(); c.restore(); pl.ptext('PC' + (k + 1), pl.x(qq[0]) + 4, pl.y(qq[1]) - 5, { color: C.SLATE, font: 'bold 12px system-ui' }); });
    const shown = SC.map((p, i) => ({ q: proj(p, a), i })).sort((u, v) => u.q[2] - v.q[2]);
    shown.forEach(s => { const d = (s.q[2] + 4) / 8, r = 3 + 1.3 * d; pl.dot(s.q[0], s.q[1], r, colorFn(s.i, 0.55 + 0.45 * d), o.wrong && o.wrong(s.i) ? C.RED : (o.mark && o.mark(s.i) ? C.INK : null), 1.8); });
    if (o.field) o.field.forEach(fi => { const q = proj(FBpc[fi], a); pl.dot(q[0], q[1], 8, D.SCOL[FB.y[fi]], '#fff', 3); pl.dot(q[0], q[1], 10.5, null, C.INK, 1.6); });
    return { a, shown };
  }
  const spinner = (st, cvs, draw) => {
    const loop = () => { if (st.auto && cvs[0].isConnected && cvs[0].clientWidth) { st.rot = (st.rot + 0.35) % 360; draw(); } requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    cvs.forEach(cv => { let drag = false, lx = 0, moved = 0; cv.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; moved = 0; if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId); }); cv.addEventListener('pointermove', e => { if (!drag) return; moved += Math.abs(e.clientX - lx); st.rot = (st.rot + (e.clientX - lx) * 0.6 + 360) % 360; lx = e.clientX; draw(); }); ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { drag = false; cv._moved = moved; })); });
  };
  const srcLegend = (sw) => D.SRC.slice(0, 4).map((n, i) => `<span>${sw(D.SCOL[i])}${n}</span>`).join('');

  /* ================= semi-supervised ================= */
  M.push({
    id: 'semi', part: 1, title: 'Semi-supervised learning: one sample per range',
    lede: '', steps: [],
    html: () => `
      <div class="row2">
        <div><h5>Each basin sample takes the label of the closest field sample</h5>${H.cv('sm2-a', 0.8)}</div>
        <div><h5>Labels also spread through the basin samples</h5>${H.cv('sm2-b', 0.8)}</div>
      </div>
      <div class="ctlrow">${H.S('sm2-n', 'Field samples per range', 1, 5, 1, 1)}${H.btn('sm2-new', 'New field trip')}<label class="chk"><input type="checkbox" id="sm2-err" checked> Ring the mistakes in red</label><label class="chk"><input type="checkbox" id="sm2-auto" checked> Keep turning</label></div>
      <div class="legend" id="sm2-leg"></div>
      <div class="readout" id="sm2-out"></div>`,
    init(root) {
      const q = id => root.querySelector('#' + id), st = { n: 1, seed: 75, rot: 25, auto: true };
      const pA = H.plot(root, 'sm2-a', opt), pB = H.plot(root, 'sm2-b', opt);
      let idx, predA, predB, avg = null; const cache = {};
      function run() {
        idx = D.fieldPick(FB, st.n, st.seed); const Zl = idx.map(i => FB.Z[i]), yl = idx.map(i => FB.y[i]);
        predA = ML.knnPredict(Zl, yl, PV.Z, 1, 4);
        const All = PV.Z.concat(Zl); predB = ML.labelProp(All, idx.map((_, k) => PV.Z.length + k), yl, 4, { k: 8, iters: 80 }).slice(0, PV.Z.length);
        if (!cache[st.n]) { let a1 = 0, a2 = 0; const R = 20; for (let t = 0; t < R; t++) { const ix = D.fieldPick(FB, st.n, 900 + t * 11), z = ix.map(i => FB.Z[i]), y = ix.map(i => FB.y[i]); const pa = ML.knnPredict(z, y, PV.Z.slice(0, NB), 1, 4), pb = ML.labelProp(PV.Z.concat(z), ix.map((_, k) => PV.Z.length + k), y, 4, { k: 8, iters: 80 }).slice(0, NB); a1 += ML.acc(pa, PV.y.slice(0, NB)) / R; a2 += ML.acc(pb, PV.y.slice(0, NB)) / R; } cache[st.n] = [a1, a2]; }
        avg = cache[st.n];
      }
      const acc = p => ML.acc(p.slice(0, NB), PV.y.slice(0, NB));
      const draw = () => {
        const err = q('sm2-err').checked;
        pA.draw(); pB.draw();
      };
      pA.onDraw = pl => cloud(pl, st.rot, (i, d) => Plot.hex2rgba(D.SCOL[predA[i]], d), { wrong: err => q('sm2-err').checked && err < NB && predA[err] !== PV.y[err], field: idx });
      pB.onDraw = pl => {
        cloud(pl, st.rot, (i, d) => Plot.hex2rgba(D.SCOL[predB[i]], d), { wrong: err => q('sm2-err').checked && err < NB && predB[err] !== PV.y[err], field: idx });
        const a1 = acc(predA), a2 = acc(predB);
        q('sm2-out').innerHTML = `This field trip has ${st.n * 4} labeled samples (the big outlined dots). Giving each basin sample the label of the closest field sample gets <b>${H.pct(a1)}</b> right. Letting the labels spread through the basin samples gets <b>${H.pct(a2)}</b> right. Over 20 different field trips with ${st.n} per range, the averages are <b>${H.pct(avg[0])}</b> and <b>${H.pct(avg[1])}</b>. Scores use the 360 samples whose main source we know. The 15 mystery samples fit none of the ranges, but both methods can only choose among the ranges we sampled, so each still gets a label.`;
      };
      q('sm2-leg').innerHTML = srcLegend(c => `<i style="background:${c}"></i>`) + '<span><i class="dotc"></i>Field sample (labeled)</span>';
      H.bind(root, 'sm2-n', v => { st.n = v; run(); draw(); }, v => v);
      q('sm2-new').addEventListener('click', () => { st.seed += 7; run(); draw(); });
      q('sm2-err').addEventListener('change', draw); q('sm2-auto').addEventListener('change', e => { st.auto = e.target.checked; });
      spinner(st, [pA.c, pB.c], draw);
      run(); draw();
    }
  });

  /* ================= supervised: decision tree and random forest ================= */
  M.push({
    id: 'sup', part: 1, title: 'Supervised learning: trees and forests',
    lede: '', steps: [],
    html: () => `
      <div class="tabs" role="tablist" id="su-tabs">
        <button type="button" class="tab on" data-s="1">1 Grow a tree</button><button type="button" class="tab" data-s="2">2 Grow a forest</button><button type="button" class="tab" data-s="3">3 How many samples?</button><button type="button" class="tab" data-s="4">4 The mystery samples</button>
      </div>
      <div class="legend" id="su-leg"></div>

      <div class="track on" data-s="1">
        ${H.look('Slide the number of field samples and the tree depth. The tree on the left is the rulebook the computer wrote from the field samples. The cloud on the right shows what it predicts for the 375 basin samples, with mistakes ringed in red.', 'A shallow tree asks only a few questions and gets many samples wrong. A deep tree can score 100% on the field samples it learned from and still miss basin samples. That gap between the two scores is overfitting.')}
        <div class="row2"><div><h5>The tree the computer grew</h5>${H.cv('su-t', 0.8)}</div><div><h5>What this tree predicts for the basin</h5>${H.cv('su-a', 0.8)}</div></div>
        <div class="ctlrow">${H.S('su-n1', 'Field samples per range', 1, 30, 1, 5)}${H.S('su-d', 'Tree depth (most questions in a row)', 1, 6, 1, 3)}${H.btn('su-new1', 'New field trip')}</div>
        <div class="readout" id="su-o1"></div>
      </div>

      <div class="track" data-s="2">
        ${H.look('Slide the number of trees from 1 up to 100. Click any sample in the cloud to see how the trees voted for it.', 'A forest grows many different trees, each from a random redraw of the field samples and a random choice of measurements to ask about. Each tree votes and the most common answer wins. One tree is jumpy. A hundred trees vote steadily, and the mistakes get rarer.')}
        <div class="row2"><div><h5>What the forest predicts (click a sample)</h5>${H.cv('su-b', 0.8)}</div><div><h5>How the trees voted for the ringed sample</h5>${H.cv('su-v', 0.8)}</div></div>
        <div class="ctlrow">${H.S('su-n2', 'Field samples per range', 1, 30, 1, 5)}${H.S('su-f', 'Number of trees', 1, 100, 1, 25)}${H.btn('su-new2', 'New field trip')}<label class="chk"><input type="checkbox" id="su-auto" checked> Keep turning</label></div>
        <div class="readout" id="su-o2"></div>
      </div>

      <div class="track" data-s="3">
        ${H.look('Each dot is one field trip: a fresh random set of field samples, used to train a tree (gray) or a forest (red), and then scored on the basin. Slide the number of samples per range and watch the dots.', 'With one or two samples per range the results are all over the place, and a single tree is the worst. More samples help both, and the forest stays higher and steadier. Past about 20 per range the gain is small.')}
        <div class="row-3d"><div>${H.cv('su-c', 0.8)}</div><div>
          ${H.S('su-n3', 'Field samples per range', 1, 30, 1, 5)}
          ${H.legend(['Single tree', 'Forest of 25 trees'], ['#5C6670', '#841617'])}
          <div class="readout" id="su-o3"></div></div></div>
      </div>

      <div class="track" data-s="4">
        ${H.look('Turn on the switch to reveal the true sources. The ringed samples are the ones that fit none of the four ranges.', 'A model can only answer with the categories it was trained on. The field crew never sampled the source of these samples, so the forest has to call them something else.')}
        <div class="row2"><div><h5>What the forest predicts</h5>${H.cv('su-e', 0.8)}</div><div><h5>The true sources</h5>${H.cv('su-g', 0.8)}</div></div>
        <div class="ctlrow st-top"><label class="switch"><input type="checkbox" id="su-true"><span class="sw"></span><b>Reveal the true sources</b></label>${H.S('su-n4', 'Field samples per range', 1, 30, 1, 10)}</div>
        <div class="readout" id="su-o4"></div>
        <div class="readout" id="su-story" hidden></div>
      </div>`,
    init(root) {
      const q = id => root.querySelector('#' + id), st = { n: 5, seed: 60, depth: 3, trees: 25, rot: 25, auto: false, step: 1, sel: 3, show: false };
      const mk = id => H.plot(root, id, opt), pT = H.plot(root, 'su-t', { xr: [0, 1], yr: [0, 1], noAxes: true, aspect: 0.8, m: { l: 4, r: 4, t: 4, b: 4 } });
      const pA = mk('su-a'), pB = mk('su-b'), pE = mk('su-e'), pG = mk('su-g');
      const pV = H.plot(root, 'su-v', { xr: [0, 100], yr: [0.5, 4.5], invY: true, nx: 5, ny: 4, xl: 'Trees voting', aspect: 0.8, fmty: v => (Number.isInteger(v) ? TREE_NAME[v - 1] : ''), m: { l: 70, r: 14, t: 12, b: 40 } });
      const pC = H.plot(root, 'su-c', { xr: [0, 31], yr: [0, 1], nx: 6, ny: 5, xl: 'Field samples per range', yl: 'Accuracy on the basin samples', aspect: 0.8, fmty: v => Math.round(v * 100) + '%' });
      let idx = [], tree = null, forest = null, forestN = 0, pred1 = [], predF = [], grid = null;
      const trainX = () => idx.map(i => FB.X[i]), trainY = () => idx.map(i => FB.y[i]);

      /* models */
      function fit(kind) {
        idx = D.fieldPick(FB, st.n, st.seed); const X = trainX(), y = trainY();
        if (kind === 'tree' || kind === 'both') { tree = ML.tree(X, y, 4, { maxDepth: st.depth, rng: ML.rng(st.seed + 1) }); pred1 = PV.X.map(x => ML.treeClass(tree, x)); }
        if (kind === 'forest' || kind === 'both') { forest = ML.forest(X, y, 4, st.trees, ML.rng(st.seed + 2)); forestN = st.trees; predF = PV.X.map(x => ML.argmax(ML.forestVotes(forest, x, 4))); }
      }
      const accN = p => ML.acc(p.slice(0, NB), PV.y.slice(0, NB));
      const trainAcc = t => ML.acc(trainX().map(x => ML.treeClass(t, x)), trainY());

      /* ---- tree diagram ---- */
      function drawTree(pl) {
        const c = pl.ctx, W = pl.W, Hh = pl.H, maxShow = 3;
        if (!tree) return;
        let leaves = 0; const place = (node, d) => { if (node.leaf || d >= maxShow) { node._x = leaves++; node._d = d; return; } place(node.left, d + 1); place(node.right, d + 1); node._x = (node.left._x + node.right._x) / 2; node._d = d; };
        place(tree, 0); const cols = Math.max(leaves, 1), cw = (W - 8) / cols, levelH = (Hh - 30) / (maxShow + 1);
        const X = n => 4 + (n._x + 0.5) * cw, Y = n => 14 + n._d * levelH;
        const vname = f => D.PSHORT[f], fmt = v => (v >= 100 ? Math.round(v) : v.toFixed(1));
        c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
        (function walk(n, d) {
          if (n.leaf || d >= maxShow) return;
          [n.left, n.right].forEach((ch, k) => { c.strokeStyle = C.SLATE; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X(n), Y(n) + 13); c.lineTo(X(ch), Y(ch) - 13); c.stroke(); c.fillStyle = C.SLATE; c.font = '11px system-ui'; c.fillText(k === 0 ? 'yes' : 'no', (X(n) + X(ch)) / 2 + (k === 0 ? -12 : 12), (Y(n) + Y(ch)) / 2); });
          walk(n.left, d + 1); walk(n.right, d + 1);
        })(tree, 0);
        (function draw(n, d) {
          const x = X(n), y = Y(n);
          if (n.leaf || d >= maxShow) {
            const cls = n.leaf ? ML.argmax(n.counts) : ML.argmax(n.counts); c.fillStyle = D.SCOL[cls]; c.strokeStyle = C.INK; c.lineWidth = n.leaf ? 1.4 : 1.4; const w = Math.min(cw - 4, 74);
            c.fillRect(x - w / 2, y - 13, w, 26); c.strokeRect(x - w / 2, y - 13, w, 26);
            c.fillStyle = cls === 2 || cls === 4 ? C.INK : '#fff'; c.font = '600 11px system-ui'; c.fillText(TREE_NAME[cls] + (n.leaf ? '' : ' …'), x, y - 3); c.font = '10px system-ui'; c.fillText(n.n + (n.leaf ? '' : ' left'), x, y + 8);
            return;
          }
          const w = Math.min(cw * 1.6, 92); c.fillStyle = '#fff'; c.strokeStyle = C.INK; c.lineWidth = 1.6; c.fillRect(x - w / 2, y - 13, w, 26); c.strokeRect(x - w / 2, y - 13, w, 26);
          c.fillStyle = C.INK; c.font = '600 12px system-ui'; c.fillText(vname(n.f) + ' ≤ ' + fmt(n.t) + '?', x, y);
          draw(n.left, d + 1); draw(n.right, d + 1);
        })(tree, 0);
        c.restore();
      }

      /* ---- step 1 ---- */
      function step1() {
        pT.draw(); pA.draw();
        const t = trainAcc(tree);
        q('su-o1').innerHTML = `${st.n * 4} field samples, and a tree that asks at most ${st.depth} question${st.depth === 1 ? '' : 's'} in a row. It is right on <b>${H.pct(t)}</b> of the field samples it learned from, and on <b>${H.pct(accN(pred1))}</b> of the 360 basin samples it has not seen.${t - accN(pred1) > 0.25 ? ' The tree knows its own field samples far better than the basin, which is overfitting.' : ''} The diagram shows the first three levels of questions.`;
      }
      pT.onDraw = drawTree;
      pA.onDraw = pl => cloud(pl, st.rot, (i, d) => Plot.hex2rgba(D.SCOL[pred1[i]], d), { wrong: i => i < NB && pred1[i] !== PV.y[i], field: idx });

      /* ---- step 2 ---- */
      const votesOf = i => ML.forestVotes(forest, PV.X[i], 4);
      pB.onDraw = pl => { const r = cloud(pl, st.rot, (i, d) => Plot.hex2rgba(D.SCOL[predF[i]], d), { wrong: i => i < NB && predF[i] !== PV.y[i], mark: i => i === st.sel, field: idx }); pB._shown = r; };
      pV.onDraw = pl => {
        pl.o.xr = [0, forestN]; pl.axes(); const v = votesOf(st.sel);
        v.forEach((n, k) => { pl.rect(0, k + 1 - 0.32, n, k + 1 + 0.32, D.SCOL[k]); pl.text(String(n), n + forestN * 0.03, k + 1, { font: 'bold 12px system-ui' }); });
        pl.ptext('Sample ' + (st.sel + 1), pl.o.m.l + 6, 12, { color: C.SLATE, font: '12px system-ui' });
      };
      function step2() {
        pB.draw(); pV.draw();
        const tr = ML.tree(trainX(), trainY(), 4, { maxDepth: 6, rng: ML.rng(st.seed + 1) }), one = ML.acc(PV.X.slice(0, NB).map(x => ML.treeClass(tr, x)), PV.y.slice(0, NB)), v = votesOf(st.sel), top = ML.argmax(v);
        q('su-o2').innerHTML = `With the same ${st.n * 4} field samples: one tree <b>${H.pct(one)}</b>, forest of ${forestN} tree${forestN === 1 ? '' : 's'} <b>${H.pct(accN(predF))}</b>. The ringed sample: ${v[top]} of ${forestN} tree${forestN === 1 ? '' : 's'} vote <b>${D.SRC[top]}</b>. Its true main source is <b>${PV.y[st.sel] < 4 ? D.SRC[PV.y[st.sel]] : 'none of the four'}</b>.`;
      }
      const pickSample = (pl, e) => {
        if (e.target._moved > 5) return; const r = e.target.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top; let best = -1, bd = 14 * 14;
        (pl._shown ? pl._shown.shown : []).forEach(s => { const dx = pl.x(s.q[0]) - mx, dy = pl.y(s.q[1]) - my, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = s.i; } });
        if (best >= 0) { st.sel = best; step2(); }
      };
      pB.c.addEventListener('click', e => pickSample(pB, e));

      /* ---- step 3: many field trips ---- */
      const NS = [1, 2, 3, 5, 10, 20, 30]; let sweep = null;
      function compute3() {
        sweep = NS.map(n => { const t = [], f = []; for (let s = 0; s < 25; s++) { const ix = D.fieldPick(FB, n, 3000 + s * 17), X = ix.map(i => FB.X[i]), y = ix.map(i => FB.y[i]), r = ML.rng(700 + s), tr = ML.tree(X, y, 4, { maxDepth: 6, rng: r }), fo = ML.forest(X, y, 4, 25, r); t.push(ML.acc(PV.X.slice(0, NB).map(x => ML.treeClass(tr, x)), PV.y.slice(0, NB))); f.push(ML.acc(PV.X.slice(0, NB).map(x => ML.argmax(ML.forestVotes(fo, x, 4))), PV.y.slice(0, NB))); } return { n, t, f }; });
      }
      pC.onDraw = pl => {
        if (!sweep) compute3(); pl.axes(); const r = ML.rng(4), mean = a => a.reduce((x, y) => x + y) / a.length;
        pl.vline(st.n, C.INK, 1.5, [5, 4]);
        pl.line(sweep.map(s => [s.n - 0.4, mean(s.t)]), C.SLATE, 2); pl.line(sweep.map(s => [s.n + 0.4, mean(s.f)]), C.RED, 2);
        sweep.forEach(s => { s.t.forEach(v => pl.dot(s.n - 0.4 + (r() - 0.5) * 0.7, v, 2.6, 'rgba(92,102,112,0.55)')); s.f.forEach(v => pl.dot(s.n + 0.4 + (r() - 0.5) * 0.7, v, 2.6, 'rgba(132,22,23,0.55)')); });
        const nearest = sweep.reduce((b, s) => (Math.abs(s.n - st.n) < Math.abs(b.n - st.n) ? s : b)), rg = a => `${Math.round(Math.min(...a) * 100)}% to ${Math.round(Math.max(...a) * 100)}%`;
        q('su-o3').innerHTML = `Near ${nearest.n} field samples per range, across 25 different field trips: a single tree scored <b>${rg(nearest.t)}</b> (average ${H.pct(mean(nearest.t))}), and the forest scored <b>${rg(nearest.f)}</b> (average ${H.pct(mean(nearest.f))}). The dots are drawn only at the sample sizes we tried.`;
      };

      /* ---- step 4: the mystery samples ---- */
      const flood = i => i >= NB;
      pE.onDraw = pl => cloud(pl, st.rot, (i, d) => Plot.hex2rgba(D.SCOL[predF[i]], d), { mark: i => st.show && flood(i), field: idx });
      pG.onDraw = pl => {
        cloud(pl, st.rot, (i, d) => (st.show ? Plot.hex2rgba(D.SCOL[PV.y[i]], d) : `rgba(92,102,112,${(d * 0.45).toFixed(2)})`), { mark: i => st.show && flood(i) });
        if (!st.show) { const c = pl.ctx; c.save(); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(pl.W / 2 - 132, pl.H / 2 - 20, 264, 40); c.restore(); pl.ptext('Sources hidden. Turn on the switch.', pl.W / 2, pl.H / 2, { align: 'center', font: '600 14px system-ui', color: C.INK }); }
      };
      function step4() {
        pE.draw(); pG.draw(); const cnt = [0, 0, 0, 0]; for (let i = NB; i < PV.n; i++) cnt[predF[i]]++;
        q('su-o4').innerHTML = `Forest of ${st.trees} trees, ${st.n * 4} field samples: <b>${H.pct(accN(predF))}</b> right on the 360 basin samples with a known main source.` + (st.show ? ` The 15 ringed mystery samples were labeled: ${cnt.map((n, k) => n ? `${n} ${D.SRCS[k]}` : '').filter(Boolean).join(', ')}.` : '');
        const sto = q('su-story'); sto.hidden = !st.show;
        sto.innerHTML = '<b>The reveal.</b> Long after the mountains were sampled, a mega flood, the Great Prairie Flood, swept through and dumped sand from a range far to the west into the Redbud Basin. Nobody took field samples there, so the forest has no category for it and has to call these samples something else. In the Unsupervised tab, k-means with 5 groups pulled the same samples into a small group of their own. A method with no labels can notice that something does not fit, and a method trained on labels cannot.';
      }

      /* ---- sliders shared across the steps ---- */
      const syncN = () => ['su-n1', 'su-n2', 'su-n3', 'su-n4'].forEach(id => { q(id).value = st.n; q(id + '-o').textContent = st.n; });
      const redo = () => { fit('both'); show(); };
      const setN = v => { st.n = v; syncN(); redo(); };
      ['su-n1', 'su-n2', 'su-n3', 'su-n4'].forEach(id => H.bind(root, id, setN, v => v));
      H.bind(root, 'su-d', v => { st.depth = v; fit('tree'); step1(); }, v => v);
      H.bind(root, 'su-f', v => { st.trees = v; fit('forest'); step2(); }, v => v);
      ['su-new1', 'su-new2'].forEach(id => q(id).addEventListener('click', () => { st.seed += 9; redo(); }));
      q('su-auto').addEventListener('change', e => { st.auto = e.target.checked; });
      q('su-true').addEventListener('change', e => { st.show = e.target.checked; step4(); });

      /* ---- tabs ---- */
      function show() { ({ 1: step1, 2: step2, 3: () => pC.draw(), 4: step4 })[st.step](); }
      root.querySelectorAll('#su-tabs .tab').forEach(b => b.addEventListener('click', () => {
        st.step = +b.dataset.s; root.querySelectorAll('#su-tabs .tab').forEach(x => x.classList.toggle('on', x === b)); root.querySelectorAll('.track[data-s]').forEach(x => x.classList.toggle('on', +x.dataset.s === st.step));
        st.auto = st.step === 4 || (st.step === 2 && q('su-auto').checked); [pT, pA, pB, pE, pG, pV, pC].forEach(p => p.fit()); show();
      }));
      q('su-leg').innerHTML = srcLegend(c => `<i style="background:${c}"></i>`) + '<span><i class="dotc"></i>Field sample (used for training)</span><span><i class="ring"></i>Red ring: wrong answer</span>';
      spinner(st, [pA.c, pB.c, pE.c, pG.c], () => { if (st.step === 1) pA.draw(); else if (st.step === 2) pB.draw(); else if (st.step === 4) { pE.draw(); pG.draw(); } });
      syncN(); fit('both'); step1();
    }
  });
})(window);
