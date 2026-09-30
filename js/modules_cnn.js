/* modules_cnn.js - "muffin or chihuahua": what a convolutional network looks at */
(function (g) {
  const { ML, Plot, H, MODULES: M, CNNLAB: L } = g;
  const C = Plot.C, N = L.N;
  const tint = v => `rgb(${Math.min(255, Math.round(v * 300))},${Math.min(255, Math.round(v * 250))},${Math.min(255, Math.round(v * 210))})`;
  const ramp = t => { t = Math.max(0, Math.min(1, t)); const a = [244, 246, 247], b = [132, 22, 23]; return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`; };
  const FACT = [1, 2, 4, 8], RESN = ['full', 'half', 'quarter', 'eighth'];

  M.push({
    id: 'cnn', part: 1, title: 'Convolutional networks: muffin or chihuahua?',
    lede: '', steps: [],
    html: () => `
      <h4>Can we tell?</h4>
      <div class="ctlrow">${H.S('c-res', 'Resolution', 0, 3, 1, 0)}${H.btn('c-new', 'New set of eight')}</div>
      <div id="c-tiles" class="tiles"></div>
      <div class="readout" id="c-score">Answered 0 of 8.</div>
      <h4>A tiny convolutional network, filters set by hand</h4>
      <div class="row4">
        <div><h5>Picture (click one above)</h5>${H.cv('c-in', 1)}</div>
        <div><h5 id="c-h1">Layer 1: spots</h5>${H.cv('c-l1', 1)}</div>
        <div><h5>Layer 2: two spots above a third</h5>${H.cv('c-l2', 1)}</div>
        <div><h5>Score for 40 test pictures</h5>${H.cv('c-sc', 1)}</div>
      </div>
      <div class="ctlrow"><div class="ctl"><label for="c-f">Layer 1 filter to display</label><select id="c-f"><option value="spots">Spots (feeds layer 2)</option><option value="v">Vertical edges</option><option value="h">Horizontal edges</option><option value="blur">Blur</option></select></div></div>
      <div class="ctlrow">${H.S('c-rad', 'Spot size', 1, 4, 1, 2)}${H.S('c-sp', 'Eye spacing', 3, 8, 1, 5)}${H.S('c-th', 'Decision threshold', 0.05, 0.6, 0.01, 0.4)}</div>
      <div class="readout" id="c-out"></div>`,
    init(root) {
      const seedBase = { v: 300 };
      let set = [], answered = 0, right = 0, sel = 0;
      const test = L.testSet();
      const res = H.bind(root, 'c-res', () => { drawTiles(); redraw(); }, v => RESN[v]);
      const rad = H.bind(root, 'c-rad', () => redraw(), v => v), sp = H.bind(root, 'c-sp', () => redraw(), v => v), th = H.bind(root, 'c-th', () => redraw(), v => v.toFixed(2));
      const fsel = H.q(root, 'c-f'); fsel.addEventListener('change', () => redraw());
      const tiles = H.q(root, 'c-tiles');

      function newSet() {
        seedBase.v += 17; const r = ML.rng(seedBase.v), items = [];
        for (let i = 0; i < 4; i++) { items.push({ dog: false, img: L.makeMuffin(ML.rng(seedBase.v * 7 + i)) }); items.push({ dog: true, img: L.makeDog(ML.rng(seedBase.v * 11 + i)) }); }
        set = ML.shuffle(8, r).map(i => items[i]); answered = 0; right = 0; sel = 0;
        tiles.innerHTML = set.map((_, i) => `<div class="tile" data-i="${i}"><canvas width="128" height="128"></canvas><div class="tb"><button type="button" class="btn sm" data-a="muffin">Muffin</button><button type="button" class="btn sm" data-a="dog">Chihuahua</button></div><span class="tr"></span></div>`).join('');
        H.q(root, 'c-score').textContent = 'Answered 0 of 8.';
        drawTiles(); redraw();
      }
      function drawTiles() {
        tiles.querySelectorAll('.tile').forEach((t, i) => {
          const c = t.querySelector('canvas'), x = c.getContext('2d'), img = L.pixelate(set[i].img, FACT[res.get()]), k = c.width / N;
          for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) { x.fillStyle = tint(img[yy * N + xx]); x.fillRect(xx * k, yy * k, k + 0.5, k + 0.5); }
          t.classList.toggle('sel', i === sel);
        });
      }
      tiles.addEventListener('click', e => {
        const t = e.target.closest('.tile'); if (!t) return; const i = +t.dataset.i;
        const b = e.target.closest('button[data-a]');
        if (b && !t.classList.contains('done')) {
          const ok = (b.dataset.a === 'dog') === set[i].dog; t.classList.add('done', ok ? 'right' : 'wrong'); answered++; if (ok) right++;
          t.querySelector('.tr').textContent = (ok ? 'Yes: ' : 'It was a ') + (set[i].dog ? 'chihuahua' : 'muffin');
          H.q(root, 'c-score').innerHTML = `Answered ${answered} of 8, ${right} right.${answered === 8 ? ' Now slide the resolution down and press New set of eight.' : ''}`;
        }
        sel = i; drawTiles(); redraw();
      });
      H.on(root, 'c-new', 'click', newSet);

      const mk = id => H.plot(root, id, { xr: [0, N], yr: [0, N], invY: true, noAxes: true, m: { l: 2, r: 2, t: 2, b: 2 } });
      const pIn = mk('c-in'), p1 = mk('c-l1'), p2 = mk('c-l2');
      const pS = H.plot(root, 'c-sc', { xr: [0.5, 2.5], yr: [0, 0.6], nx: 2, ny: 6, yl: 'Score', fmtx: v => (v === 1 ? 'Muffins' : v === 2 ? 'Chihuahuas' : ''), m: { l: 42, r: 6, t: 8, b: 34 } });
      const cur = () => L.pixelate(set[sel].img, FACT[res.get()]);
      const layer1 = img => (fsel.value === 'v' || fsel.value === 'h' ? L.edges(img, fsel.value) : fsel.value === 'blur' ? L.blur(img) : L.spots(img, rad.get()));
      const cells = (pl, m, fn) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) pl.rect(x, y, x + 1.03, y + 1.03, fn(m[y * N + x])); };
      pIn.onDraw = pl => { const im = cur(); cells(pl, im, tint); };
      p1.onDraw = pl => { const m = layer1(cur()), hi = fsel.value === 'blur' ? 1 : fsel.value === 'spots' ? 0.8 : 0.7; H.q(root, 'c-h1').textContent = 'Layer 1: ' + ({ spots: 'spots', v: 'vertical edges', h: 'horizontal edges', blur: 'blur' })[fsel.value]; cells(pl, m, v => ramp(v / hi)); };
      p2.onDraw = pl => { const f = L.face(L.spots(cur(), rad.get()), sp.get()); cells(pl, f, v => ramp(v / 0.7)); const mx = L.maxOf(f); for (let i = 0; i < f.length; i++) if (f[i] === mx && mx > 0) { pl.dot(i % N + 0.5, Math.floor(i / N) + 0.5, 5, null, C.INK, 2); break; } };
      pS.onDraw = pl => {
        pl.axes(); const f = FACT[res.get()], sc = test.map(t => L.maxOf(L.face(L.spots(L.pixelate(t.img, f), rad.get()), sp.get()))), T = th.get();
        pl.hline(T, C.INK, 2, [6, 4]);
        let ok = 0, fp = 0, fn = 0; const r = ML.rng(4);
        test.forEach((t, i) => { const pred = sc[i] > T; if (pred === t.dog) ok++; else if (pred) fp++; else fn++; pl.dot((t.dog ? 2 : 1) + (r() - 0.5) * 0.6, sc[i], 4.2, pred === t.dog ? (t.dog ? '#B58A2B' : '#5C6670') : C.RED, '#fff', 1); });
        const mine = L.maxOf(L.face(L.spots(cur(), rad.get()), sp.get()));
        H.q(root, 'c-out').innerHTML = `The picture you clicked scores <b>${mine.toFixed(2)}</b>, so the network says <b>${mine > T ? 'chihuahua' : 'muffin'}</b>${mine > T === set[sel].dog ? ', and that is right' : ', and that is wrong'}. Across the 40 test pictures: <b>${ok}</b> right, ${fp} muffins called chihuahua, ${fn} chihuahuas called muffin (red dots). At ${RESN[res.get()]} resolution.`;
      };
      const redraw = () => { [pIn, p1, p2, pS].forEach(p => { p.fit(); p.draw(); }); };
      newSet();
    }
  });
})(window);
