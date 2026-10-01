/* modules3.js - discipline tracks, pitfalls, next steps */
(function (g) {
  const { ML, DATA: D, Plot, H, MODULES: M } = g;
  const C = Plot.C, R = H.R;

  const ramp = t => {   // light gray to deep red, t in 0..1
    t = Math.max(0, Math.min(1, t)); const a = [244, 246, 247], b = [132, 22, 23];
    return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
  };
  const std = v => { const m = v.reduce((a, b) => a + b, 0) / v.length, s = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length) || 1; return v.map(x => (x - m) / s); };

  /* ---------- 8. in your discipline ---------- */
  M.push({
    id: 'tracks', part: 2, title: 'Sedimentology, igneous rocks, minerals, and paleontology',
    lede: 'Each tab uses synthetic data shaped like a problem from one field, with sliders that change what the method can see.',
    steps: [
      'Sedimentology: with only gamma ray checked, find where sandstone and limestone are confused. Add density, then sonic and neutron porosity. Move the start of the core and see which facies the core has to contain.',
      'Igneous rocks: check only SiO₂ and see which rock types are confused, then add the alkalis. Slide the number of labeled samples per rock type.',
      'Geochemistry: run PCA on raw ppm, then rescaled ppm, then log10 rescaled. Follow the largest loading each time, then color the pegmatite-influenced catchments.',
      'Prospectivity: raise the number of known deposits and count how many of the others land in the top 10% of the map.',
      'Paleontology: raise the range of growth stages and watch which axis separates the species.'
    ],
    html: () => `
      <div class="tabs" role="tablist">
        <button type="button" class="tab on" data-t="sed" role="tab">Sedimentology</button>
        <button type="button" class="tab" data-t="ign" role="tab">Igneous rocks</button>
        <button type="button" class="tab" data-t="min" role="tab">Geochemistry and critical minerals</button>
        <button type="button" class="tab" data-t="pal" role="tab">Paleontology</button>
      </div>

      <div class="track" data-t="ign">
        ${H.look('Check only SiO₂ (silica) and read the right-hand plot, where a dark ring marks a wrong answer. Then add the alkalis. Then slide the number of labeled samples per rock type.', 'Silica alone separates basalt from rhyolite and mixes up rocks with about the same silica. A trachyte has about the silica of an andesite or a dacite and far more alkalis, so it needs the second measurement. Geologists draw this split on a total alkali versus silica (TAS) diagram, and here the computer learns the boundaries from labeled examples. MgO and CaO fall as silica rises, so they add little once silica and the alkalis are in.')}
        <p class="note">A made-up set of 300 volcanic rock analyses, 60 of each of five rock types. Each dot is one lava sample, analyzed for four oxides in percent by weight. In the left plot, dots with a black outline are the labeled samples the computer learns from.</p>
        <div class="row2"><div><h5>The true rock types</h5>${H.cv('ig-a', 0.8)}</div><div><h5>What the computer calls them</h5>${H.cv('ig-b', 0.8)}</div></div>
        <div class="ctlrow">${H.S('ig-m', 'Labeled samples per rock type', 1, 30, 1, 8)}</div>
        <div class="ctlrow" id="ig-curves">${['SiO₂', 'Na₂O + K₂O', 'MgO', 'CaO'].map((n, i) => H.chk('ig-c' + i, n, i === 0)).join('')}</div>
        ${H.legend(['Basalt', 'Andesite', 'Dacite', 'Rhyolite', 'Trachyte'], ['#3E4A56', '#1F8A84', '#D9A21B', '#C86F8F', '#841617'])}
        <div class="row2"><div><h5>True rock type (rows) and what the computer called it (columns)</h5>${H.cv('ig-m2', 0.7)}</div><div class="readout" id="ig-out"></div></div>
      </div>

      <div class="track" data-t="pal">
        ${H.look('Slide the range of growth stages from small to large, and look at the plot of PC1 against PC2.', 'A shell grows, so a bigger shell is bigger in every measurement at once. That shared growth becomes PC1. The differences between species show up in the next directions. With a wide range of growth stages, PC1 is mostly size, and the species are harder to see on it.')}
        <p class="note">Four measurements (each converted to logarithms, so that growth shows up as even steps) on made-up, brachiopod-like shells of three species.</p>
        <div class="row2"><div>${H.cv('p2-a', 0.9)}</div><div>${H.cv('p2-b', 0.9)}</div></div>
        <div class="ctlrow">${H.S('p2-s', 'Range of growth stages', 0, 0.5, 0.01, 0.35)}</div>
        ${H.legend(['Species A, elongate', 'Species B, wide hinge', 'Species C, inflated'], Plot.CLUSTER.slice(0, 3))}
        <div class="readout" id="p2-out"></div>
      </div>

      <div class="track on" data-t="sed">
        ${H.look('Check only gamma ray, then add curves one at a time. Then slide the length of the cored interval and where it starts.', 'The computer learns from the cored interval only, where we know the rock, and then predicts the rest of the well. Gamma ray alone mixes up two rock types. More curves help. A core that misses one of the rock types can never teach the computer about it.')}
        <p class="note">A made-up 200 m well with four log curves.</p>
        ${H.cv('sd-a', 0.8)}
        <div class="ctlrow">${H.S('sd-l', 'Cored interval length (m)', 5, 100, 1, 5)}${H.S('sd-s', 'Core starts at (m)', 0, 100, 1, 0)}</div>
        <div class="ctlrow" id="sd-curves">${D.SHORT.map((n, i) => H.chk('sd-c' + i, n, i < 2)).join('')}</div>
        ${H.legend(D.LITH, D.LCOL)}
        <div class="row2"><div><h5>Below and above the core: true facies (rows) and predicted facies (columns)</h5>${H.cv('sd-m', 0.62)}</div><div class="readout" id="sd-out"></div></div>
      </div>

      <div class="track" data-t="min">
        <h4>Geochemistry: the transform decides what PCA finds</h4>
        ${H.look('Try the three choices under Data used: raw values, rescaled values, and logarithms then rescaled. Turn on the color for catchments that drain pegmatites.', 'PCA follows spread. With raw values, the element with the biggest numbers (potassium and magnesium, which are measured in percent) has the biggest spread and takes over PC1, while the pegmatite elements (measured in ppm) barely register. Rescaling puts every element on equal footing. Logarithms tame elements whose values range over several orders of magnitude. The pegmatite catchments only stand out once the data are rescaled.')}
        <p class="note">400 made-up stream-sediment samples with eight elements, measured in ppm (parts per million). Some catchments drain pegmatites rich in lithium, cesium and tantalum, which raise Li, Cs, Rb, Ta and Sn together.</p>
        <div class="row2"><div>${H.cv('gc-a', 0.9)}</div><div>${H.cv('gc-b', 0.9)}</div></div>
        <div class="ctlrow"><div class="ctl"><label for="gc-t">Data used</label><select id="gc-t"><option value="raw">Raw ppm</option><option value="std">Rescaled ppm (each element on the same scale)</option><option value="log">Log10, then rescaled</option></select></div>${H.S('gc-p', 'Catchments with pegmatite influence', 2, 40, 1, 12)}</div>
        ${H.chk('gc-h', 'Color pegmatite-influenced catchments', false)}
        <div class="readout" id="gc-out"></div>
        <h4>Prospectivity: few known deposits</h4>
        ${H.look('Slide the number of known deposits used for training from a few to many. Count how many of the other deposits fall inside the deep red areas.', 'Only a handful of deposits are known, and the map has a lot of empty cells. The model learns what the known deposits have in common (near a fault, a magnetic high, lithium in the streams) and ranks every cell by how much it resembles them. The readout counts how many of the deposits the model did not see fall in the top tenth of the map. Picking a tenth of the map at random would find about a tenth of them.')}
        <p class="note">A made-up 40 × 40 map with three layers of evidence: distance to a fault, magnetics, and lithium in stream sediment.</p>
        <div class="row2"><div>${H.cv('mn-a', 1)}</div><div id="mn-side"></div></div>
        ${H.S('mn-m', 'Known deposits used for training', 3, 35, 1, 5)}
        <div class="readout" id="mn-out"></div>
      </div>`,
    init(root) {
      root.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
        root.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === b));
        root.querySelectorAll('.track').forEach(x => x.classList.toggle('on', x.dataset.t === b.dataset.t));
        Plot.refit();
      }));

      /* igneous rocks */
      (function () {
        const NM = ['Basalt', 'Andesite', 'Dacite', 'Rhyolite', 'Trachyte'], AB = ['Bas', 'And', 'Dac', 'Rhy', 'Tra'], COL = ['#3E4A56', '#1F8A84', '#D9A21B', '#C86F8F', '#841617'];
        const VN = ['SiO₂', 'Na₂O + K₂O', 'MgO', 'CaO'], SC = [10, 3, 3, 3];
        const MU = [[49, 3.6, 8, 10.5], [58.5, 5.0, 3.5, 6.8], [66, 6.2, 1.6, 3.6], [73, 8.0, 0.4, 1.0], [62, 11.0, 1.0, 2.6]];
        const SD = [[2.0, 0.9, 2.0, 1.2], [2.2, 1.0, 1.0, 1.0], [2.0, 1.0, 0.6, 0.8], [2.2, 1.0, 0.25, 0.5], [2.0, 1.3, 0.5, 0.7]];
        const r = ML.rng(31), X = [], y = [], ord = [];
        for (let c = 0; c < 5; c++) { const o = ML.shuffle(60, r); for (let i = 0; i < 60; i++) { X.push(MU[c].map((m, j) => Math.max(0.05, m + SD[c][j] * ML.gauss(r)))); y.push(c); } ord.push(o.map(i => c * 60 + i)); }
        const pa = H.plot(root, 'ig-a', { xr: [40, 80], yr: [0, 16], xl: 'SiO₂ (wt%)', yl: 'Na₂O + K₂O (wt%)', nx: 4, ny: 4 });
        const pb = H.plot(root, 'ig-b', { xr: [40, 80], yr: [0, 16], xl: 'SiO₂ (wt%)', yl: 'Na₂O + K₂O (wt%)', nx: 4, ny: 4 });
        const pm = H.plot(root, 'ig-m2', { xr: [0, 5], yr: [0, 5], invY: true, noAxes: true, m: { l: 40, r: 6, t: 26, b: 4 }, aspect: 0.7 });
        const used = () => { const u = [0, 1, 2, 3].filter(i => H.q(root, 'ig-c' + i).checked); return u.length ? u : [0]; };
        let pred, tr, conf, ok, ntest, cols;
        const calc = () => {
          cols = used(); const m = mm.get(); tr = []; ord.forEach(o => o.slice(0, m).forEach(i => tr.push(i)));
          const F = X.map(x => cols.map(c => x[c] / SC[c]));
          pred = ML.knnPredict(tr.map(i => F[i]), tr.map(i => y[i]), F, Math.min(3, tr.length), 5);
          const isTr = new Set(tr); conf = Array.from({ length: 5 }, () => new Array(5).fill(0)); ok = 0; ntest = 0;
          X.forEach((_, i) => { if (isTr.has(i)) return; ntest++; conf[y[i]][pred[i]]++; if (pred[i] === y[i]) ok++; });
        };
        const mm = H.bind(root, 'ig-m', () => { calc(); draw(); }, v => v);
        root.querySelectorAll('#ig-curves input').forEach(cb => cb.addEventListener('change', () => { calc(); draw(); }));
        const draw = () => { pa.draw(); pb.draw(); pm.draw(); };
        pa.onDraw = p => {
          p.axes(); const isTr = new Set(tr);
          X.forEach((x, i) => { if (!isTr.has(i)) p.dot(x[0], x[1], 3.4, Plot.hex2rgba(COL[y[i]], 0.75)); });
          X.forEach((x, i) => { if (isTr.has(i)) p.dot(x[0], x[1], 4.6, COL[y[i]], C.INK, 1.8); });
        };
        pb.onDraw = p => {
          p.axes(); const isTr = new Set(tr);
          X.forEach((x, i) => { p.dot(x[0], x[1], 3.4, Plot.hex2rgba(COL[pred[i]], 0.75)); if (!isTr.has(i) && pred[i] !== y[i]) p.dot(x[0], x[1], 6.2, null, C.INK, 1.4); });
          const worst = (() => { let b = [0, 0, 0]; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if (i !== j && conf[i][j] > b[2]) b = [i, j, conf[i][j]]; return b; })();
          H.q(root, 'ig-out').innerHTML = `Measurements used: <b>${cols.map(k => VN[k]).join(', ')}</b>. With <b>${mm.get()}</b> labeled sample${mm.get() === 1 ? '' : 's'} of each rock type, the computer names <b>${ok}</b> of the other ${ntest} samples correctly (<b>${H.pct(ok / ntest)}</b>).` + (worst[2] ? ` The most common mistake is calling ${NM[worst[0]].toLowerCase()} ${NM[worst[1]].toLowerCase()}, ${worst[2]} times.` : ' It makes no mistakes.');
        };
        pm.onDraw = p => {
          const c = p.ctx, cw = (p.W - 46) / 5, ch = (p.H - 30) / 5;
          for (let i = 0; i < 5; i++) {
            const tot = conf[i].reduce((a, b) => a + b, 0);
            p.ptext(AB[i], 36, 26 + (i + 0.5) * ch, { align: 'right', font: '11px system-ui' }); p.ptext(AB[i], 40 + (i + 0.5) * cw, 16, { align: 'center', font: '11px system-ui' });
            for (let j = 0; j < 5; j++) {
              const v = tot ? conf[i][j] / tot : 0; c.fillStyle = ramp(v); c.fillRect(40 + j * cw + 1, 26 + i * ch + 1, cw - 2, ch - 2);
              p.ptext(tot ? Math.round(v * 100) + '%' : '-', 40 + (j + 0.5) * cw, 26 + (i + 0.5) * ch, { align: 'center', font: 'bold 11.5px system-ui', color: v > 0.55 ? '#fff' : C.INK });
            }
          }
        };
        calc(); draw();
      })();

      /* paleontology */
      (function () {
        const r = ML.rng(8), mu = [[3.0, 2.7, 2.2, 2.4], [2.9, 3.0, 2.3, 2.9], [2.9, 2.8, 2.7, 2.5]], sp = [], sz = [], nz = [];
        for (let c = 0; c < 3; c++) for (let i = 0; i < 60; i++) { sp.push(c); sz.push(ML.gauss(r)); nz.push([0, 0, 0, 0].map(() => ML.gauss(r))); }
        const vn = ['Length', 'Width', 'Thickness', 'Hinge'];
        const pa = H.plot(root, 'p2-a', { xr: [-2.4, 2.4], yr: [-2.4, 2.4], xl: 'PC1', yl: 'PC2', nx: 6, ny: 6 });
        const pb = H.plot(root, 'p2-b', { xr: [0.5, 4.5], yr: [-1, 1], xl: 'Measurement', yl: 'Loading', nx: 4, ny: 4, fmtx: v => (Number.isInteger(v) ? vn[v - 1] : '') });
        let P;
        const s = H.bind(root, 'p2-s', () => { calc(); pa.draw(); pb.draw(); }, v => v.toFixed(2));
        const calc = () => { const X = sp.map((c, i) => mu[c].map((m, j) => m + s.get() * sz[i] + 0.06 * nz[i][j])); P = ML.pca(X); };
        calc();
        pa.onDraw = pl => {
          pl.axes(); P.scores.forEach((q, i) => pl.dot(q[0], q[1], 3.4, Plot.hex2rgba(Plot.CLUSTER[sp[i]], 0.8)));
          H.q(root, 'p2-out').innerHTML = `PC1 holds <b>${(P.frac[0] * 100).toFixed(0)}%</b> of the spread and PC2 holds <b>${(P.frac[1] * 100).toFixed(0)}%</b>. The four numbers in PC1 are ${P.vecs[0].map(v => v.toFixed(2)).join(', ')}. When they are all about the same, PC1 is overall size.`;
        };
        pb.onDraw = pl => {
          pl.axes(); pl.hline(0, C.SLATE, 1);
          for (let j = 0; j < 4; j++) { pl.rect(j + 1 - 0.35, 0, j + 1, P.vecs[0][j], C.RED); pl.rect(j + 1, 0, j + 1 + 0.35, P.vecs[1][j], C.SLATE); }
          pl.ptext('PC1', pl.x(0.6), pl.y(0.9), { color: C.RED, font: '11px system-ui' }); pl.ptext('PC2', pl.x(1.2), pl.y(0.9), { color: C.SLATE, font: '11px system-ui' });
        };
        pa.draw(); pb.draw();
      })();

      /* sedimentology */
      (function () {
        const W = D.well(), SC = [40, 0.1, 8, 0.05], NAMES = D.SHORT, RG = D.RANGE, AB = ['Sand', 'Shale', 'Lime'];
        const pl = H.plot(root, 'sd-a', { xr: [0, 1], yr: [0, 200], invY: true, noAxes: true, m: { l: 44, r: 8, t: 26, b: 8 }, aspect: 0.8 });
        const pm = H.plot(root, 'sd-m', { xr: [0, 3], yr: [0, 3], invY: true, noAxes: true, m: { l: 56, r: 6, t: 26, b: 4 }, aspect: 0.62 });
        const used = () => { const u = [0, 1, 2, 3].filter(i => H.q(root, 'sd-c' + i).checked); return u.length ? u : [0]; };
        const Ls = H.bind(root, 'sd-l', () => { clampStart(); calc(); pl.draw(); pm.draw(); }, v => v + ' m');
        const Ss = H.bind(root, 'sd-s', () => { calc(); pl.draw(); pm.draw(); }, v => v + ' m');
        const clampStart = () => { const mx = 200 - Ls.get(); H.q(root, 'sd-s').max = mx; if (Ss.get() > mx) Ss.el.value = mx; H.q(root, 'sd-s-o').textContent = Ss.el.value + ' m'; };
        let pred, n0, n1, conf, out;
        const calc = () => {
          const cols = used(); n0 = Math.round(Number(Ss.el.value) / 0.5); n1 = Math.min(400, n0 + Math.round(Ls.get() / 0.5));
          const F = W.X.map(x => cols.map(c => x[c] / SC[c])), tr = []; for (let i = n0; i < n1; i++) tr.push(i);
          pred = ML.knnPredict(tr.map(i => F[i]), tr.map(i => W.fac[i]), F, Math.min(5, tr.length), 3);
          conf = [0, 1, 2].map(() => [0, 0, 0]); let ok = 0, m = 0;
          for (let i = 0; i < 400; i++) { if (i >= n0 && i < n1) continue; m++; conf[W.fac[i]][pred[i]]++; if (pred[i] === W.fac[i]) ok++; }
          out = { ok: ok / m, m, present: [...new Set(tr.map(i => W.fac[i]))].map(i => D.LITH[i]), cols };
        };
        root.querySelectorAll('#sd-curves input').forEach(cb => cb.addEventListener('change', () => { calc(); pl.draw(); pm.draw(); }));
        pl.onDraw = p => {
          const c = p.ctx, cols = out.cols, ncol = 6, gap = 6, tw = (p.W - 44 - 8 - (ncol - 1) * gap) / ncol, x0 = i => 44 + i * (tw + gap), yy = d => p.y(d);
          c.save(); c.font = '11px system-ui'; c.fillStyle = C.SLATE; c.textAlign = 'right'; c.textBaseline = 'middle';
          for (let d = 0; d <= 200; d += 25) c.fillText(d + ' m', 38, yy(d));
          c.textAlign = 'center'; c.textBaseline = 'bottom'; c.font = '10.5px system-ui';
          const heads = NAMES.concat(['True', 'Predicted']); heads.forEach((h, i) => c.fillText(h, x0(i) + tw / 2, p.o.m.t - 3));
          for (let i = 0; i < ncol; i++) { c.strokeStyle = C.GRID; c.strokeRect(x0(i) + 0.5, yy(0), tw, yy(200) - yy(0)); }
          const colr = ['#16191C', C.RED, '#1F5F8A', '#4E7F3D'];
          for (let k = 0; k < 4; k++) {
            c.beginPath(); c.strokeStyle = cols.includes(k) ? colr[k] : '#C9CDD2'; c.lineWidth = 1.2;
            W.X.forEach((v, i) => { const px = x0(k) + (v[k] - RG[k][0]) / (RG[k][1] - RG[k][0]) * tw; if (i) c.lineTo(px, yy(W.depth[i])); else c.moveTo(px, yy(W.depth[i])); }); c.stroke();
          }
          for (let k = 0; k < 400; k++) {
            const y0 = yy(k * 0.5), h = yy(0.5) - yy(0) + 0.6;
            c.fillStyle = D.LCOL[W.fac[k]]; c.fillRect(x0(4), y0, tw, h); c.fillStyle = D.LCOL[pred[k]]; c.fillRect(x0(5), y0, tw, h);
          }
          const yt = yy(n0 * 0.5), yb = yy(n1 * 0.5);
          c.fillStyle = 'rgba(132,22,23,0.12)'; c.fillRect(44, yt, p.W - 52, yb - yt);
          c.strokeStyle = C.RED; c.lineWidth = 1.5; c.beginPath(); c.moveTo(44, yt); c.lineTo(p.W - 8, yt); c.moveTo(44, yb); c.lineTo(p.W - 8, yb); c.stroke();
          p.ptext('cored', 48, Math.min(yt + 10, p.H - 14), { color: C.RED, font: '11px system-ui' });
          c.restore();
          H.q(root, 'sd-out').innerHTML = `Core from ${(n0 * 0.5).toFixed(0)} to ${(n1 * 0.5).toFixed(0)} m contains: <b>${out.present.join(', ')}</b>. Curves used: <b>${cols.map(k => NAMES[k]).join(', ')}</b>. Right outside the core: <b>${H.pct(out.ok)}</b> of the ${out.m} samples there.`;
        };
        pm.onDraw = p => {
          const c = p.ctx, cw = (p.W - 62) / 3, ch = (p.H - 30) / 3;
          for (let i = 0; i < 3; i++) {
            const tot = conf[i].reduce((a, b) => a + b, 0);
            p.ptext(AB[i], 52, 26 + (i + 0.5) * ch, { align: 'right', font: '12px system-ui' }); p.ptext(AB[i], 56 + (i + 0.5) * cw, 16, { align: 'center', font: '12px system-ui' });
            for (let j = 0; j < 3; j++) {
              const v = tot ? conf[i][j] / tot : 0; c.fillStyle = ramp(v); c.fillRect(56 + j * cw + 1, 26 + i * ch + 1, cw - 2, ch - 2);
              p.ptext(tot ? Math.round(v * 100) + '%' : '-', 56 + (j + 0.5) * cw, 26 + (i + 0.5) * ch, { align: 'center', font: 'bold 13px system-ui', color: v > 0.55 ? '#fff' : C.INK });
            }
          }
        };
        clampStart(); calc(); pl.draw(); pm.draw();
      })();

      /* critical minerals */
      (function () {
        const G = 40, r = ML.rng(31), rg = 0.22, nb = D.fieldCount(rg);
        const fs = [0, 1, 2].map(() => D.field(r, rg, nb));
        const raw = fs.map(f => { const a = []; for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) a.push(f((i + 0.5) / G, (j + 0.5) / G)); return a; });
        const L = raw.map(std), F = Array.from({ length: G * G }, (_, i) => L.map(l => l[i]));
        const lat = std(F.map(f => 1.2 * f[0] + 1.0 * f[1] + 0.8 * f[2]));
        const dep = []; lat.forEach((z, i) => { if (r() < 1 / (1 + Math.exp(-(6 * z - 8.4)))) dep.push(i); });
        const order = ML.shuffle(dep.length, ML.rng(4)).map(i => dep[i]);
        const bg = ML.shuffle(G * G, ML.rng(6)).slice(0, 260);
        const pl = H.plot(root, 'mn-a', { xr: [0, G], yr: [0, G], invY: true, noAxes: true, m: { l: 3, r: 3, t: 3, b: 3 } });
        const mm = H.bind(root, 'mn-m', () => { calc(); pl.draw(); }, v => v);
        let prob, top, tr;
        const calc = () => {
          const m = Math.min(mm.get(), order.length - 1); tr = order.slice(0, m);
          const idx = tr.concat(bg), y = tr.map(() => 1).concat(bg.map(() => 0));
          const model = ML.logistic(idx.map(i => F[i]), y, { iters: 300, cw: [1, Math.max(1, bg.length / tr.length)] });
          prob = F.map(f => model.prob(f)); const sorted = prob.slice().sort((a, b) => b - a); const cut = sorted[Math.floor(0.1 * prob.length)];
          top = prob.map(p => p >= cut);
        };
        calc();
        H.q(root, 'mn-side').innerHTML = `<p class="note">Color is the model's estimate of how likely a deposit is, from 0 (light) to 1 (deep red). Filled black dots are the deposits used for training. Hollow dots are the other deposits on the map, which the model has not seen.</p><div class="legend"><span><i style="background:${ramp(0)};border:1px solid #C9CDD2"></i>0</span><span><i style="background:${ramp(0.5)}"></i>0.5</span><span><i style="background:${ramp(1)}"></i>1</span></div>`;
        pl.onDraw = p => {
          p.axes();
          for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) p.rect(i, j, i + 1.02, j + 1.02, ramp(prob[j * G + i]));
          order.forEach((c, k) => { const x = (c % G) + 0.5, y = Math.floor(c / G) + 0.5; if (k < tr.length) p.dot(x, y, 4.4, '#16191C', '#fff', 1.4); else p.dot(x, y, 4.4, null, '#16191C', 1.6); });
          const held = order.slice(tr.length), hit = held.filter(c => top[c]).length;
          H.q(root, 'mn-out').innerHTML = `Trained on <b>${tr.length}</b> deposits. Of the <b>${held.length}</b> other deposits, <b>${hit}</b> (${H.pct(hit / held.length)}) fall in the top 10% of the map by predicted probability. Picking 10% of the map at random would find about 10%.`;
        };
        pl.draw();
      })();

      /* geochemistry */
      (function () {
        const EL = ['Li', 'Cs', 'Rb', 'Ta', 'Sn', 'K', 'Mg', 'Ni'], n = 400, r = ML.rng(5), rows = [];
        for (let i = 0; i < n; i++) {
          const F = ML.gauss(r), Mf = ML.gauss(r), up = r(), s = 0.6 + 0.8 * r(), nz = sd => sd * ML.gauss(r);
          rows.push({ up, l: [1.4 + 0.15 * F + nz(0.12), 0.7 + 0.2 * F + nz(0.12), 1.9 + 0.3 * F + nz(0.1), 0.0 + 0.15 * F + nz(0.12), 0.45 + 0.15 * F + nz(0.12), 4.2 + 0.15 * F + nz(0.08), 3.9 - 0.15 * F + 0.2 * Mf + nz(0.1), 1.5 + 0.4 * Mf - 0.2 * F + nz(0.12)], s });
        }
        const RNG = { raw: [[-30000, 30000], [-30000, 30000]], std: [[-6, 14], [-4, 12]], log: [[-7, 7], [-4, 5]] };
        const pa = H.plot(root, 'gc-a', { xr: [-7, 7], yr: [-4, 5], xl: 'PC1', yl: 'PC2', nx: 6, ny: 6, aspect: 0.9 });
        const pb = H.plot(root, 'gc-b', { xr: [0.5, 8.5], yr: [-1, 1], xl: 'Element', yl: 'Loading', nx: 8, ny: 4, aspect: 0.9, fmtx: v => (Number.isInteger(v) ? EL[v - 1] : '') });
        const sel = H.q(root, 'gc-t'), hi = H.q(root, 'gc-h'); let P, peg;
        const calc = () => {
          const share = pcs.get() / 100; peg = rows.map(o => o.up < share);
          let X = rows.map(o => o.l.map((v, j) => Math.pow(10, v + (j < 5 && o.up < share ? [0.5, 0.55, 0.35, 0.5, 0.5][j] * o.s : 0))));
          const mode = sel.value;
          if (mode === 'std') X = ML.standardize(X).Z; else if (mode === 'log') X = ML.standardize(X.map(x => x.map(Math.log10))).Z;
          P = ML.pca(X); pa.o.xr = RNG[mode][0]; pa.o.yr = RNG[mode][1];
          pa.o.fmtx = pa.o.fmty = mode === 'raw' ? (v => (v / 1000) + 'k') : null;
        };
        const pcs = H.bind(root, 'gc-p', () => { calc(); pa.draw(); pb.draw(); }, v => v + '%');
        sel.addEventListener('change', () => { calc(); pa.draw(); pb.draw(); }); hi.addEventListener('change', () => pa.draw());
        pa.onDraw = pl => {
          pl.axes(); pl.clipStart();
          P.scores.forEach((q, i) => pl.dot(q[0], q[1], 3, hi.checked ? (peg[i] ? C.RED : 'rgba(92,102,112,0.45)') : 'rgba(92,102,112,0.55)'));
          pl.clipEnd();
          H.q(root, 'gc-out').innerHTML = `PC1 holds <b>${Math.round(P.frac[0] * 100)}%</b> of the spread and PC2 holds <b>${Math.round(P.frac[1] * 100)}%</b>. The element with the biggest say in PC1 is <b>${EL[P.vecs[0].reduce((b, v, j, a) => (Math.abs(v) > Math.abs(a[b]) ? j : b), 0)]}</b>. Points outside the fixed axes are cut off at the edge.`;
        };
        pb.onDraw = pl => {
          pl.axes(); pl.hline(0, C.SLATE, 1);
          for (let j = 0; j < 8; j++) { pl.rect(j + 1 - 0.36, 0, j + 1, P.vecs[0][j], C.RED); pl.rect(j + 1, 0, j + 1 + 0.36, P.vecs[1][j], C.SLATE); }
          pl.ptext('PC1', pl.x(0.6), pl.y(0.9), { color: C.RED, font: '11px system-ui' }); pl.ptext('PC2', pl.x(1.3), pl.y(0.9), { color: C.SLATE, font: '11px system-ui' });
        };
        calc(); pa.draw(); pb.draw();
      })();
    }
  });

  /* ---------- 9. pitfalls ---------- */
  M.push({
    id: 'traps', part: 3, title: 'Pitfalls that come with geoscience data',
    lede: 'Small samples, neighbors that resemble each other, and rare targets each change what a test score means.',
    steps: [
      'Small samples: lower the number of training samples and read the spread of the 40 dots.',
      'Spatial: raise the correlation length. Compare the random split with the blocked split.',
      'Rare targets: lower the share of positives. Compare accuracy with recall, then turn on equal class weights.'
    ],
    html: () => `
      <h4>Small samples</h4>
      ${H.look('Slide the number of training samples down from 100 toward 2 and watch how spread out the dots become.', 'Each dot is one random choice of training samples (from 300 made-up rocks), scored on the same 100 samples that were held out and never used for training. With only a few training samples, a lucky draw scores well and an unlucky draw scores badly. One test score from a small sample can be far from the typical score.')}
      ${H.cv('t-a', 0.5)}
      ${H.S('t-n', 'Training samples', 3, 150, 1, 8)}
      <div class="readout" id="t-out"></div>
      <h4>Neighbors look alike (spatial autocorrelation)</h4>
      ${H.look('Raise how far the pattern extends across the map, then press New map a few times. Compare the two scores.', 'The three measurement layers have nothing to do with the label except through location. A random split puts neighbors of every test sample into the training set, so the model can score well just by copying nearby values. The blocked split holds out whole strips of the map, so the model has to predict somewhere new, and its score falls toward 50%, which is chance. Any score above 50% here comes from neighbors resembling each other.')}
      <div class="row2"><div>${H.cv('t-b', 0.95)}</div><div>${H.cv('t-c', 0.95)}</div></div>
      <div class="ctlrow">${H.S('t-r', 'How far the pattern extends across the map', 0.03, 0.3, 0.01, 0.1)}${H.btn('t-new', 'New map')}</div>
      <div class="readout" id="t-out2"></div>
      <h4>Rare targets</h4>
      ${H.look('Slide the share of positive samples down toward 1%, and compare accuracy with recall. Then turn on Weight classes equally.', 'Suppose only a few samples are the thing we are looking for, such as a rare mineral. A model that says no to everything is right almost every time, so its accuracy looks great, and it finds nothing. Recall is the share of the real positives that we found. Weighting the classes equally tells the model that missing a rare positive matters as much as a mistake on a common sample.')}
      <div class="row2"><div>${H.cv('t-d', 0.95)}</div><div>${H.cv('t-e', 0.95)}</div></div>
      <div class="ctlrow">${H.S('t-f', 'Share of positive samples', 1, 50, 1, 20)}${H.chk('t-w', 'Weight classes equally (count a rare positive as much as a common negative)', false)}</div>
      <div class="readout" id="t-out3"></div>`,
    init(root) {
      const Z2 = H.Z2;
      /* small samples */
      (function () {
        const ns = [3, 5, 8, 12, 20, 30, 50, 80, 120, 150];
        const draw = n => Array.from({ length: 40 }, (_, t) => {
          const idx = ML.shuffle(300, ML.rng(500 + t)), te = idx.slice(0, 100), tr = idx.slice(100).slice(0, n);
          return ML.acc(ML.knnPredict(tr.map(i => Z2[i]), tr.map(i => R.y[i]), te.map(i => Z2[i]), Math.min(3, n), 3), te.map(i => R.y[i]));
        });
        const env = ns.map(n => { const a = draw(n); return [n, Math.min(...a), a.reduce((s, v) => s + v, 0) / a.length, Math.max(...a)]; });
        const pl = H.plot(root, 't-a', { xr: [0, 150], yr: [0.2, 1], xl: 'Training samples', yl: 'Test accuracy', nx: 6, ny: 4, fmty: v => Math.round(v * 100) + '%' });
        const nn = H.bind(root, 't-n', () => pl.draw(), v => v);
        pl.onDraw = p => {
          p.axes(); p.line(env.map(e => [e[0], e[1]]), C.GRID, 2); p.line(env.map(e => [e[0], e[3]]), C.GRID, 2); p.line(env.map(e => [e[0], e[2]]), C.SLATE, 2);
          const a = draw(nn.get()), r = ML.rng(2);
          p.vline(nn.get(), C.RED, 1, [4, 4]); a.forEach(v => p.dot(nn.get() + (r() - 0.5) * 3, v, 3.2, Plot.hex2rgba(C.RED, 0.7)));
          H.q(root, 't-out').innerHTML = `With <b>${nn.get()}</b> training samples the 40 test accuracies run from <b>${H.pct(Math.min(...a))}</b> to <b>${H.pct(Math.max(...a))}</b>, and they average <b>${H.pct(a.reduce((s, v) => s + v, 0) / 40)}</b>. Gray lines are the lowest and highest values over 40 draws at each size, and the dark line is the average.`;
        };
        pl.draw();
      })();

      /* spatial */
      (function () {
        const pm = H.plot(root, 't-b', { xr: [0, 1], yr: [0, 1], xl: 'Easting', yl: 'Northing', nx: 4, ny: 4 });
        const pbar = H.plot(root, 't-c', { xr: [0.5, 2.5], yr: [0, 1], yl: 'Accuracy', nx: 2, ny: 5, fmtx: v => (v === 1 ? 'Random split' : v === 2 ? 'Blocked split' : ''), fmty: v => Math.round(v * 100) + '%' });
        let seed = 11, cur, avg;
        const make = (range, sd) => {
          const r = ML.rng(sd), N = 300, P = Array.from({ length: N }, () => [r(), r()]), nb = D.fieldCount(range);
          const V = [0, 1, 2, 3].map(() => { const f = D.field(r, range, nb); return P.map(p => f(p[0], p[1])); });
          const med = V[3].slice().sort((a, b) => a - b)[N >> 1], y = V[3].map(v => (v > med ? 1 : 0));
          const Fz = [0, 1, 2].map(j => std(V[j])), X = P.map((_, i) => Fz.map(f => f[i]));
          const K = 4, fr = ML.shuffle(N, r); let aR = 0, aB = 0;
          for (let f = 0; f < K; f++) {
            const te = fr.filter((_, t) => t % K === f), tr = fr.filter((_, t) => t % K !== f);
            aR += ML.acc(ML.knnPredict(tr.map(i => X[i]), tr.map(i => y[i]), te.map(i => X[i]), 5, 2), te.map(i => y[i])) / K;
            const all = P.map((_, i) => i), te2 = all.filter(i => Math.floor(P[i][0] * K) === f), tr2 = all.filter(i => Math.floor(P[i][0] * K) !== f);
            aB += ML.acc(ML.knnPredict(tr2.map(i => X[i]), tr2.map(i => y[i]), te2.map(i => X[i]), 5, 2), te2.map(i => y[i])) / K;
          }
          return { P, y, aR, aB };
        };
        const run = () => { cur = make(rr.get(), seed); let a = 0, b = 0; for (let s = 0; s < 6; s++) { const m = make(rr.get(), 50 + s * 7); a += m.aR / 6; b += m.aB / 6; } avg = [a, b]; };
        const rr = H.bind(root, 't-r', () => { run(); pm.draw(); pbar.draw(); }, v => v.toFixed(2));
        H.on(root, 't-new', 'click', () => { seed += 5; run(); pm.draw(); pbar.draw(); });
        run();
        pm.onDraw = p => {
          p.axes(); [0.25, 0.5, 0.75].forEach(x => p.vline(x, C.SLATE, 1, [5, 4]));
          cur.P.forEach((q, i) => p.dot(q[0], q[1], 3.4, cur.y[i] ? Plot.hex2rgba(C.RED, 0.85) : Plot.hex2rgba('#5C6670', 0.6)));
        };
        pbar.onDraw = p => {
          p.axes(); p.hline(0.5, C.SLATE, 1, [5, 4]); p.text('chance', 2.42, 0.53, { align: 'right', color: C.SLATE, font: '11px system-ui' });
          p.rect(0.7, 0, 1.3, avg[0], C.RED); p.rect(1.7, 0, 2.3, avg[1], C.SLATE);
          p.text(H.pct(avg[0]), 1, avg[0] + 0.05, { align: 'center', font: 'bold 12px system-ui' }); p.text(H.pct(avg[1]), 2, avg[1] + 0.05, { align: 'center', font: 'bold 12px system-ui' });
          H.q(root, 't-out2').innerHTML = `Average over 6 maps: the random split scores <b>${H.pct(avg[0])}</b>, and the blocked split (whole vertical strips held out) scores <b>${H.pct(avg[1])}</b>. The dashed lines on the map mark the four blocks. Red dots are one label and gray dots are the other.`;
        };
        pm.draw(); pbar.draw();
      })();

      /* imbalance */
      (function () {
        const ps = H.plot(root, 't-d', { xr: [-4, 6], yr: [-4, 6], xl: 'Feature 1', yl: 'Feature 2', nx: 5, ny: 5 });
        const pb = H.plot(root, 't-e', { xr: [0.5, 3.5], yr: [0, 1], nx: 3, ny: 5, fmtx: v => (v === 1 ? 'Accuracy' : v === 2 ? 'Recall' : v === 3 ? 'Precision' : ''), fmty: v => Math.round(v * 100) + '%' });
        let tr, res, model;
        const run = () => {
          const f = ff.get() / 100, r = ML.rng(3);
          const gen = (n, pos) => { const X = [], y = []; for (let i = 0; i < n; i++) { const p = i < pos ? 1 : 0; X.push([ML.gauss(r) + p * 1.6, ML.gauss(r) + p * 1.6]); y.push(p); } return { X, y }; };
          tr = gen(600, Math.max(3, Math.round(f * 600)));
          const npos = tr.y.filter(v => v).length, w = H.q(root, 't-w').checked ? [1, (600 - npos) / npos] : [1, 1];
          model = ML.logistic(tr.X, tr.y, { cw: w, iters: 400 });
          const te = gen(5000, Math.round(f * 5000)); let tp = 0, fp = 0, fn = 0, tn = 0;
          te.X.forEach((x, i) => { const p = model.prob(x) > 0.5 ? 1 : 0; if (p && te.y[i]) tp++; else if (p) fp++; else if (te.y[i]) fn++; else tn++; });
          res = { acc: (tp + tn) / 5000, rec: tp / Math.max(1, tp + fn), pre: tp + fp ? tp / (tp + fp) : 0, base: 1 - Math.round(f * 5000) / 5000 };
        };
        const ff = H.bind(root, 't-f', () => { run(); ps.draw(); pb.draw(); }, v => v + '%');
        H.q(root, 't-w').addEventListener('change', () => { run(); ps.draw(); pb.draw(); });
        run();
        ps.onDraw = p => {
          p.axes(); tr.X.forEach((x, i) => p.dot(x[0], x[1], tr.y[i] ? 3.6 : 2.6, tr.y[i] ? C.RED : 'rgba(92,102,112,0.4)'));
          const [a, b] = model.w, c = model.b; p.clipStart();
          if (Math.abs(b) > 1e-6) p.line([[-4, -(a * -4 + c) / b], [6, -(a * 6 + c) / b]], C.INK, 2);
          p.clipEnd();
        };
        pb.onDraw = p => {
          p.axes(); [res.acc, res.rec, res.pre].forEach((v, i) => { p.rect(i + 1 - 0.3, 0, i + 1 + 0.3, v, i === 1 ? C.RED : 'rgba(92,102,112,0.6)'); p.text(H.pct(v), i + 1, Math.min(v + 0.05, 0.97), { align: 'center', font: 'bold 12px system-ui' }); });
          p.line([[0.6, res.base], [1.4, res.base]], C.INK, 2, [5, 4]);
          H.q(root, 't-out3').innerHTML = `Positives are <b>${ff.get()}%</b> of the samples. A model that says "negative" for everything scores <b>${H.pct(res.base)}</b> accuracy (dashed line) and finds none of the positives. This model has accuracy <b>${H.pct(res.acc)}</b>. Recall (the share of the real positives it finds) is <b>${H.pct(res.rec)}</b>. Precision (the share of its positive calls that are right) is <b>${H.pct(res.pre)}</b>.`;
        };
        ps.draw(); pb.draw();
      })();
    }
  });

  /* ---------- 10. next ---------- */
  M.push({
    id: 'next', part: 3, title: 'Where to go from here', noPanel: true,
    lede: 'Everything on this page runs in the browser on synthetic data. The same steps run on real data in a few lines of Python.',
    steps: [],
    html: () => `
      <div class="next">
        <div>
          <h4>Tools</h4>
          <ul>
            <li><a href="https://scikit-learn.org" target="_blank" rel="noopener">scikit-learn</a> for PCA, k-means, random forests and the other methods from class, plus tools for checking a model on data it has not seen (cross-validation).</li>
            <li><a href="https://colab.research.google.com" target="_blank" rel="noopener">Google Colab</a> for running notebooks in a browser with no installation.</li>
            <li><a href="https://softwareunderground.org" target="_blank" rel="noopener">Software Underground</a>: an open community of geoscientists who write code.</li>
          </ul>
        </div>
        <div>
          <h4>A first project</h4>
          <ol>
            <li>Pick a table of measurements from your own thesis area, with a column you would like to predict or group.</li>
            <li>Rescale the columns so each is on the same scale, and run PCA. Plot the first two components.</li>
            <li>Run k-means for several k and look at the elbow.</li>
            <li>Train a classifier, such as a random forest, on part of the data. Hold out a whole block of the map or well for testing, and compare with a random split.</li>
            <li>Record which rows went into training, the software versions, and any use of a language model.</li>
          </ol>
        </div>
      </div>
      <p class="closer">I always like to end by asking for one thing. Take a table of measurements from your own project, run PCA on it this week, and see what shows up. Then go and try a method you haven't used before.</p>`,
    init() {}
  });

  /* ---------- geophysics: a pointer to the full guided exercise ---------- */
  M.push({
    id: 'geo', part: 2, title: 'Geophysics: attributes, a SOM and SHAP on a real seismic line', noPanel: true,
    lede: '', steps: [],
    html: () => `
      <div class="open-out">
        <h4>The full exercise is on its own page</h4>
        <p>It uses SCAN029, an open 2D seismic line from the geothermal exploration program in the Netherlands, and the geothermal wells at Californië. The steps are to pick the target, compute attributes along the pick, build a self-organizing map, read SHAP values, build a second map with a different set of attributes, and then compare everything with a well that stays hidden until the last step. It runs in the browser, and it opens in a new tab so this page stays where it is.</p>
        <p><a class="btn primary" href="https://hbedle-subsurface.github.io/scan-lecture/" target="_blank" rel="noopener">Open the SCAN029 exercise in a new tab</a></p>
        <p class="note">For a SEG-Y line of our own, <a href="https://hbedle-subsurface.github.io/analyze-2d/" target="_blank" rel="noopener">Analyze 2D</a> runs the same workflow.</p>
      </div>`,
    init() { /* concept band, link and quiz only */ }
  });
})(window);
