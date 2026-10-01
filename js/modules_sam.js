/* modules_sam.js - promptable segmentation on a synthetic thin section */
(function (g) {
  const { ML, Plot, H, MODULES: M, SAMLAB: S } = g;
  const C = Plot.C, W = S.W, HH = S.H;
  const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const MRGB = S.MCOL.map(hex);
  const hue = i => { const h = (i * 137.5) % 360, c = 0.62, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = 0.28, [r, gg, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [(r + m) * 255, (gg + m) * 255, (b + m) * 255]; };

  M.push({
    id: 'sam', part: 1, title: 'Segment Anything: minerals in a thin section',
    lede: '', steps: [],
    html: () => `
      <div class="tabs" role="tablist" id="sm-tabs">
        <button type="button" class="tab on" data-s="1">1 Click</button><button type="button" class="tab" data-s="2">2 Segment everything</button><button type="button" class="tab" data-s="3">3 Name the masks</button>
      </div>
      ${H.legend(S.MIN, S.MCOL)}

      <div class="track on" data-s="1">
        ${H.look('Click a grain in the thin section. Then slide Mask size from 1 to 3 to see the three masks that one click gives: a part of the grain, the whole grain, and the grain together with touching neighbors that look like it.', 'Plagioclase has twin stripes and biotite has cleavage, so a click is ambiguous: the model cannot know whether we mean a stripe or the whole grain. That is why it offers several masks. The overlap score in the readout tells us how well the mask on screen matches the true grain.')}
        <div class="row-sec"><div>${H.cv('sm-a', 0.75)}</div><div id="sm-side1"></div></div>
        ${H.S('sm-lv', 'Mask size (1 part, 2 grain, 3 grain and look-alike neighbors)', 1, 3, 1, 2)}
        <div class="ctlrow">${H.btn('sm-new', 'New thin section')}</div>
        <div class="readout" id="sm-out1"></div>
      </div>

      <div class="track" data-s="2">
        ${H.look('Slide Color sensitivity from low to high and watch the number of masks against the 70 real grains. Try turning on the grid of clicks, and widen the click spacing.', 'Each color is one mask, and black is uncovered. At low sensitivity, striped grains are cut into pieces. At high sensitivity, a mask leaks across grain boundaries and swallows its neighbors. A wide click spacing skips small grains.')}
        <div class="row-sec"><div>${H.cv('sm-b', 0.75)}</div><div id="sm-side2"></div></div>
        <div class="ctlrow">${H.S('sm-tol', 'Color sensitivity', 20, 140, 2, 56)}${H.S('sm-st', 'Click spacing (pixels)', 6, 28, 2, 8)}${H.S('sm-min', 'Smallest mask (pixels)', 10, 200, 5, 25)}</div>
        ${H.chk('sm-pts', 'Show the grid of clicks', false)}
        <div class="readout" id="sm-out2"></div>
      </div>

      <div class="track" data-s="3">
        ${H.look('The computer groups the masks by their average color and texture. Slide the number of groups, and pick a mineral name for each group from its menu. The computer suggests names by comparing each group with a reference color for every mineral. Then turn on Show the true minerals.', 'The chart compares our mineral percentages (red) with the true ones (gray). This is the same kind of answer that counting 300 points by hand gives. A group that mixes two minerals, or a mask that swallowed several grains, pushes the difference up.')}
        <div class="row-sec"><div>${H.cv('sm-c', 0.75)}</div><div><div id="sm-names"></div>${H.cv('sm-d', 0.7)}</div></div>
        <div class="ctlrow">${H.S('sm-k', 'Number of groups (k)', 3, 8, 1, 6)}${H.chk('sm-true', 'Show the true minerals', false)}</div>
        <div class="readout" id="sm-out3"></div>
      </div>`,
    init(root) {
      const st = { step: 1, seed: 11, x: 0, y: 0, lv: 2, tol: 56, spacing: 8, minA: 25, k: 6 };
      let sec, seg0, three, seg, ev, names = [], cl = null, refs;
      const off = document.createElement('canvas'); off.width = W; off.height = HH;
      const mkSec = () => {
        sec = S.build(st.seed); seg0 = S.segmentAll(sec, 8, 56, 25, 0);
        const gi = sec.mineral.findIndex(m => m === 1); st.x = Math.min(W - 1, Math.max(0, Math.round(sec.pts[gi][0]))); st.y = Math.min(HH - 1, Math.max(0, Math.round(sec.pts[gi][1])));
        // reference key: mean color and texture of the masks that fall on each true mineral
        const dom = seg0.mean.map(() => new Array(6).fill(0)); for (let i = 0; i < W * HH; i++) { const m = seg0.map[i]; if (m >= 0) dom[m][sec.mmap[i]]++; }
        const acc = S.MIN.map(() => ({ c: [0, 0, 0], t: 0, a: 0 }));
        dom.forEach((d, m) => { const mi = d.indexOf(Math.max(...d)), a = seg0.area[m]; for (let c = 0; c < 3; c++) acc[mi].c[c] += seg0.mean[m][c] * a; acc[mi].t += seg0.tex[m] * a; acc[mi].a += a; });
        refs = acc.map(o => ({ c: o.c.map(v => v / Math.max(1, o.a)), t: o.t / Math.max(1, o.a) }));
        three = S.threeMasks(sec, st.x, st.y, { seg: seg0 }); runSeg(); cluster();
      };
      const runSeg = () => { seg = S.segmentAll(sec, st.spacing, st.tol, st.minA, 0); ev = S.evaluate(sec, seg); };

      /* paint the section, with an optional per-pixel override returning [r, g, b, alpha] or null */
      function paint(pl, over) {
        const ctx = off.getContext('2d'), id = ctx.createImageData(W, HH), d = id.data;
        for (let i = 0; i < W * HH; i++) {
          let r = sec.rgb[i * 3], gg = sec.rgb[i * 3 + 1], b = sec.rgb[i * 3 + 2];
          const o = over ? over(i) : null; if (o) { r = r * (1 - o[3]) + o[0] * o[3]; gg = gg * (1 - o[3]) + o[1] * o[3]; b = b * (1 - o[3]) + o[2] * o[3]; }
          d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
        }
        ctx.putImageData(id, 0, 0);
        const c = pl.ctx; c.save(); c.imageSmoothingEnabled = false; c.drawImage(off, pl.o.m.l, pl.o.m.t, pl.pw, pl.ph); c.restore();
      }
      const opt = { xr: [0, W], yr: [0, HH], invY: true, noAxes: true, m: { l: 2, r: 2, t: 2, b: 2 }, aspect: 0.75 };
      const pA = H.plot(root, 'sm-a', opt), pB = H.plot(root, 'sm-b', opt), pC = H.plot(root, 'sm-c', opt);
      const pD = H.plot(root, 'sm-d', { xr: [0.5, 6.5], yr: [0, 50], nx: 6, ny: 5, yl: 'Area (%)', aspect: 0.7, fmtx: v => (Number.isInteger(v) ? ['Quartz', 'Plag.', 'K-feld.', 'Biotite', 'Amph.', 'Opaque'][v - 1] : ''), m: { l: 46, r: 8, t: 8, b: 34 } });

      /* step 1 */
      const lv = H.bind(root, 'sm-lv', v => { st.lv = v; pA.draw(); }, v => ['', 'part', 'grain', 'grain and look-alikes'][v]);
      pA.c.addEventListener('click', e => {
        const r = pA.c.getBoundingClientRect(), x = Math.floor(pA.ix(e.clientX - r.left)), y = Math.floor(pA.iy(e.clientY - r.top));
        if (x < 0 || y < 0 || x >= W || y >= HH) return; st.x = x; st.y = y; three = S.threeMasks(sec, x, y, { seg: seg0 }); pA.draw();
      });
      H.on(root, 'sm-new', 'click', () => { st.seed += 5; mkSec(); redraw(); });
      pA.onDraw = pl => {
        const m = three[st.lv - 1];
        paint(pl, i => (m.mask[i] ? [132, 22, 23, 0.5] : null));
        // outline of the mask
        const c = pl.ctx; c.save(); c.strokeStyle = '#FFE600'; c.lineWidth = 1.4; const k = pl.pw / W;
        for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!m.mask[i]) continue; const edge = x === 0 || y === 0 || x === W - 1 || y === HH - 1 || !m.mask[i - 1] || !m.mask[i + 1] || !m.mask[i - W] || !m.mask[i + W]; if (edge) c.strokeRect(pl.o.m.l + x * k, pl.o.m.t + y * k, k, k); }
        c.restore(); pl.dot(st.x + 0.5, st.y + 0.5, 6, '#fff', C.INK, 2.4);
        const gi = sec.grain[st.y * W + st.x], mi = sec.mineral[gi], garea = sec.grain.filter(v => v === gi).length;
        let inter = 0; for (let i = 0; i < W * HH; i++) if (m.mask[i] && sec.grain[i] === gi) inter++;
        const iou = inter / (m.area + garea - inter);
        H.q(root, 'sm-out1').innerHTML = `We clicked ${S.MIN[mi].toLowerCase()}. The three masks cover <b>${three.map(t => t.area).join('</b>, <b>')}</b> pixels. The grain itself is ${garea} pixels. The mask now showing matches the true grain with an overlap score of <b>${iou.toFixed(2)}</b> (1 is a perfect match).`;
        H.q(root, 'sm-side1').innerHTML = `<div class="samcards">${three.map((t, i) => `<div class="sc${i === st.lv - 1 ? ' on' : ''}"><b>${['Part', 'Grain', 'Grain and look-alikes'][i]}</b><br>${t.area} px</div>`).join('')}</div>`;
      };

      /* step 2 */
      const upd = () => { runSeg(); cluster(); pB.draw(); };
      H.bind(root, 'sm-tol', v => { st.tol = v; upd(); }, v => v); H.bind(root, 'sm-st', v => { st.spacing = v; upd(); }, v => v); H.bind(root, 'sm-min', v => { st.minA = v; upd(); }, v => v);
      H.q(root, 'sm-pts').addEventListener('change', () => pB.draw());
      pB.onDraw = pl => {
        paint(pl, i => { const m = seg.map[i]; return m >= 0 ? [...hue(m), 0.55] : [0, 0, 0, 0.75]; });
        if (H.q(root, 'sm-pts').checked) for (let y = Math.floor(st.spacing / 2); y < HH; y += st.spacing) for (let x = Math.floor(st.spacing / 2); x < W; x += st.spacing) pl.dot(x + 0.5, y + 0.5, 2, '#fff', C.INK, 1);
        H.q(root, 'sm-out2').innerHTML = `<b>${seg.n}</b> masks for <b>${sec.n}</b> real grains. <b>${ev.merged}</b> grains ended up inside a mask that mixes grains, <b>${ev.split}</b> grains are cut into pieces, and <b>${Math.round(ev.covered * 100)}%</b> of the section is covered (black is uncovered).`;
        H.q(root, 'sm-side2').innerHTML = `<p class="note">Each color is one mask.</p>`;
      };

      /* step 3 */
      function cluster() {
        const F = seg.mean.map((m, i) => [m[0], m[1], m[2], seg.tex[i]]);
        if (seg.n < 3) { cl = null; return; }
        const z = ML.standardize(F).Z, k = Math.min(st.k, seg.n), km = ML.kmeansBest(z, k, ML.rng(3), 6);
        const grp = Array.from({ length: k }, () => ({ n: 0, area: 0, c: [0, 0, 0] }));
        km.labels.forEach((l, i) => { const a = seg.area[i]; grp[l].area += a; for (let c = 0; c < 3; c++) grp[l].c[c] += seg.mean[i][c] * a; });
        km.labels.forEach((l, i) => { grp[l].t = (grp[l].t || 0) + seg.tex[i] * seg.area[i]; });
        grp.forEach(o => { o.c = o.c.map(v => v / Math.max(1, o.area)); o.t = (o.t || 0) / Math.max(1, o.area); });
        const sug = grp.map(o => { let b = 0, bd = 1e9; refs.forEach((r, mi) => { const d = Math.hypot(o.c[0] - r.c[0], o.c[1] - r.c[1], o.c[2] - r.c[2], 5 * (o.t - r.t)); if (d < bd) { bd = d; b = mi; } }); return b; });
        cl = { labels: km.labels, grp, k };
        names = sug.slice();
      }
      function drawNames() {
        if (!cl) { H.q(root, 'sm-names').innerHTML = ''; return; }
        const tot = cl.grp.reduce((a, o) => a + o.area, 0);
        H.q(root, 'sm-names').innerHTML = cl.grp.map((o, i) => `<div class="nm"><i style="background:rgb(${o.c.map(Math.round).join(',')})"></i><span>Group ${i + 1}, ${Math.round(o.area / tot * 100)}% of the section</span><select data-i="${i}">${S.MIN.map((m, mi) => `<option value="${mi}"${names[i] === mi ? ' selected' : ''}>${m}</option>`).join('')}<option value="-1"${names[i] === -1 ? ' selected' : ''}>Unnamed</option></select></div>`).join('');
        H.q(root, 'sm-names').querySelectorAll('select').forEach(s => s.addEventListener('change', () => { names[+s.dataset.i] = +s.value; pC.draw(); pD.draw(); }));
      }
      H.bind(root, 'sm-k', v => { st.k = v; names = []; cluster(); drawNames(); pC.draw(); pD.draw(); }, v => v);
      H.q(root, 'sm-true').addEventListener('change', () => pC.draw());
      const mineralOf = i => { const m = seg.map[i]; return m < 0 || !cl ? -1 : names[cl.labels[m]]; };
      pC.onDraw = pl => {
        const tr = H.q(root, 'sm-true').checked;
        paint(pl, i => { const mi = tr ? sec.mmap[i] : mineralOf(i); return mi >= 0 ? [...MRGB[mi], 0.8] : [90, 90, 90, 0.75]; });
        drawNames(); pD.draw();
      };
      pD.onDraw = pl => {
        pl.axes(); if (!cl) return;
        const mm = new Int8Array(W * HH); for (let i = 0; i < mm.length; i++) mm[i] = mineralOf(i);
        const mine = S.modal(mm, 6), truth = S.modal(sec.mmap, 6);
        for (let m = 0; m < 6; m++) { pl.rect(m + 1 - 0.36, 0, m + 1, mine[m], C.RED); pl.rect(m + 1, 0, m + 1 + 0.36, truth[m], C.SLATE); }
        pl.ptext('yours', pl.x(0.6), pl.y(47), { color: C.RED, font: '12px system-ui' }); pl.ptext('true', pl.x(1.5), pl.y(47), { color: C.SLATE, font: '12px system-ui' });
        const diff = mine.reduce((a, v, m) => a + Math.abs(v - truth[m]), 0) / 6;
        H.q(root, 'sm-out3').innerHTML = `Our mineral percentages are off from the true ones by <b>${diff.toFixed(1)}</b> percentage points per mineral on average. Groups that mix two minerals, or masks that swallowed several grains, push this number up.`;
      };

      /* tabs */
      const plots = { 1: [pA], 2: [pB], 3: [pC] };
      const redraw = () => { plots[st.step].forEach(p => { p.fit(); p.draw(); }); if (st.step === 3) { pD.fit(); pD.draw(); } };
      root.querySelectorAll('#sm-tabs .tab').forEach(b => b.addEventListener('click', () => {
        st.step = +b.dataset.s; root.querySelectorAll('#sm-tabs .tab').forEach(x => x.classList.toggle('on', x === b));
        root.querySelectorAll('.track[data-s]').forEach(x => x.classList.toggle('on', +x.dataset.s === st.step));
        if (st.step === 3) { drawNames(); } redraw();
      }));
      mkSec(); redraw();
    }
  });
})(window);
