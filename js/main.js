/* main.js - builds the page from the module list, wires the glossary, pop-out windows and the opening figure */
(function (g) {
  const { ML, DATA: D, Plot, H, MODULES: M, GLOSSARY: GL } = g;
  const params = new URLSearchParams(g.location.search);
  const soloId = params.get('m'), view = params.get('view') === 'ex' ? 'ex' : 'panel';
  const PARTS = { 1: 'Part 1. The vocabulary', 2: 'Part 2. Geophysics, then three more fields', 3: 'Part 3. Before trusting a result' };
  const SHORT = { vocab: 'Vocabulary', pca: 'Dimensions', unsup: 'Unsupervised', sup: 'Supervised', semi: 'Semi-supervised', nn: 'Neural networks', llm: 'LLMs', geo: 'Geophysics', tracks: 'Other fields', traps: 'Pitfalls', next: 'Next' };
  const main = document.getElementById('modules');

  /* ---- build ---- */
  const list = soloId ? M.filter(m => m.id === soloId) : M;
  if (soloId) document.body.classList.add('solo', 'solo-' + view);
  let lastPart = 0;
  list.forEach(m => {
    if (!soloId && m.part !== lastPart) { lastPart = m.part; main.insertAdjacentHTML('beforeend', `<h2 class="part">${PARTS[m.part]}</h2>`); }
    const hasEx = m.steps && m.steps.length;
    const sec = document.createElement('section');
    sec.className = 'module' + (hasEx ? '' : ' no-ex'); sec.id = 'm-' + m.id;
    sec.innerHTML = `
      <div class="mh"><h3>${m.title}</h3><p class="lede">${m.lede}</p></div>
      <div class="mod-grid">
        <div class="panel">${m.html()}${m.noPanel ? '' : '<div class="tools"><button type="button" class="link" data-pop="panel">Pop out this panel</button></div>'}</div>
        ${hasEx ? `<aside class="ex"><h4>Exercises</h4><ol>${m.steps.map(s => `<li>${s}</li>`).join('')}</ol><button type="button" class="link" data-pop="ex">Pop out the exercises</button></aside>` : ''}
      </div>`;
    main.appendChild(sec);
  });

  /* ---- glossary links ---- */
  const lookup = new Map(), keys = [];
  GL.forEach(e => { [e.t].concat(e.a).forEach(k => { lookup.set(k.toLowerCase(), e); keys.push(k); }); });
  keys.sort((a, b) => b.length - a.length);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(?<![\\w-])(' + keys.map(esc).join('|') + ')(?![\\w-])', 'gi');
  function linkTerms(scope) {
    const seen = new Set();
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.parentElement.closest('button,label,option,select,canvas,svg,output,summary,h3,h4,h5,.readout,.legend,.term') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
    });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      const txt = n.nodeValue; re.lastIndex = 0; let out = '', last = 0, hit = false, mt;
      while ((mt = re.exec(txt))) {
        const raw = mt[1], e = lookup.get(raw.toLowerCase());
        if (!e || seen.has(e.t)) continue;
        if (raw === raw.toUpperCase() && raw.length > 1 && !e.a.includes(raw) && raw !== e.t) continue;
        if (/^[A-Z]{2,}$/.test(e.a.find(a => a.toLowerCase() === raw.toLowerCase()) || '') && raw !== e.a.find(a => a.toLowerCase() === raw.toLowerCase())) continue;
        seen.add(e.t); hit = true;
        out += txt.slice(last, mt.index).replace(/&/g, '&amp;').replace(/</g, '&lt;') + `<button type="button" class="term" data-t="${e.t}">${raw}</button>`; last = mt.index + raw.length;
      }
      if (hit) { out += txt.slice(last).replace(/&/g, '&amp;').replace(/</g, '&lt;'); const span = document.createElement('span'); span.innerHTML = out; n.replaceWith(...span.childNodes); }
    });
  }
  const dlg = document.getElementById('gloss');
  document.addEventListener('click', e => {
    const b = e.target.closest('.term'); if (!b) return;
    const en = GL.find(x => x.t === b.dataset.t); if (!en) return;
    document.getElementById('g-t').textContent = en.t; document.getElementById('g-d').textContent = en.d;
    document.getElementById('g-g').innerHTML = '<b>Geoscience example.</b> ' + en.g;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  });
  document.getElementById('g-x').addEventListener('click', () => dlg.close ? dlg.close() : dlg.removeAttribute('open'));
  dlg.addEventListener('click', e => { if (e.target === dlg && dlg.close) dlg.close(); });

  /* ---- init modules ---- */
  list.forEach(m => {
    const sec = document.getElementById('m-' + m.id);
    m.init(sec);
    sec.querySelectorAll('.lede, .ex li, .note, .cards p, .next li').forEach(el => linkTerms(el));
  });

  /* ---- pop-out windows ---- */
  main.addEventListener('click', e => {
    const b = e.target.closest('[data-pop]'); if (!b) return;
    const sec = b.closest('.module'), id = sec.id.slice(2), v = b.dataset.pop;
    const u = new URL(g.location.href); u.search = ''; u.hash = ''; u.searchParams.set('m', id); u.searchParams.set('view', v);
    const w = g.open(u.toString(), 'ml4g-' + id + '-' + v, v === 'ex' ? 'width=460,height=720,resizable=yes,scrollbars=yes' : 'width=1120,height=820,resizable=yes,scrollbars=yes');
    if (w && v === 'ex') { sec.classList.add('ex-out'); b.textContent = 'Exercises are in another window'; b.disabled = true; setTimeout(Plot.refit, 60); }
  });

  /* ---- navigation ---- */
  const nav = document.getElementById('nav');
  if (soloId) { nav.remove(); document.getElementById('hero').remove(); document.querySelector('footer').remove(); }
  else {
    nav.innerHTML = M.map(m => `<a href="#m-${m.id}" data-id="${m.id}">${SHORT[m.id] || m.title}</a>`).join('');
    if ('IntersectionObserver' in g) {
      const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) nav.querySelectorAll('a').forEach(a => a.classList.toggle('on', a.dataset.id === en.target.id.slice(2))); }), { rootMargin: '-30% 0px -60% 0px' });
      document.querySelectorAll('.module').forEach(s => io.observe(s));
    }
  }

  /* ---- opening figure ---- */
  const hc = document.getElementById('hero-c');
  if (hc && !soloId) {
    const hp = new Plot(hc, { aspect: 0.8, xr: [0, 150], yr: [2.0, 2.9], xl: D.VARS[0], yl: D.VARS[1], nx: 6, ny: 6 });
    const Z = H.Z2, R = H.R; let lab = null, cen = null, rocks = false, timer = null;
    const toRaw = c => [c[0] * R.sd[0] + R.mean[0], c[1] * R.sd[1] + R.mean[1]];
    hp.onDraw = p => {
      p.axes();
      R.X.forEach((x, i) => p.dot(x[0], x[1], 3.8, lab ? Plot.hex2rgba(Plot.CLUSTER[lab[i]], 0.85) : 'rgba(92,102,112,0.55)', rocks ? D.LCOL[R.y[i]] : null, 1.8));
      if (cen) cen.forEach(c => { const q = toRaw(c); p.dot(q[0], q[1], 7, '#fff', C_INK, 2.2); });
    };
    const C_INK = Plot.C.INK;
    hp.draw();
    const cap = document.getElementById('h-cap');
    const reduce = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('h-group').addEventListener('click', () => {
      clearInterval(timer); const r = ML.rng(Math.floor(Math.random() * 1e6)); cen = ML.kppInit(Z, 3, r); lab = null; let steps = 0;
      const step = () => {
        const nl = ML.assign(Z, cen), same = lab && nl.every((v, i) => v === lab[i]); lab = nl;
        if (same || steps++ > 14) { clearInterval(timer); cap.textContent = 'k-means with k = 3 stopped changing. The groups came from the measurements alone.'; hp.draw(); return; }
        hp.draw(); cen = ML.update(Z, lab, 3, r);
        cap.textContent = 'k-means, step ' + steps + ': assign each sample to the nearest center, then move each center to the mean of its samples.';
        if (reduce) step();
      };
      if (reduce) { for (let i = 0; i < 20; i++) { const nl = ML.assign(Z, cen); if (lab && nl.every((v, j) => v === lab[j])) break; lab = nl; cen = ML.update(Z, lab, 3, r); } lab = ML.assign(Z, cen); cap.textContent = 'k-means with k = 3 stopped changing.'; hp.draw(); }
      else { step(); timer = setInterval(step, 800); }
    });
    document.getElementById('h-rocks').addEventListener('click', e => {
      rocks = !rocks; e.target.textContent = rocks ? 'Hide the rock types' : 'Show the rock types'; hp.draw();
      if (rocks) cap.textContent = 'Ring colors: ' + D.LITH.map((l, i) => l).join(', ') + '. The samples had these labels all along, and the method never saw them.';
    });
  }

  /* ---- visit counting (GitHub Pages only) ---- */
  if (!soloId && /github\.io$/.test(g.location.hostname)) {
    const s = document.createElement('script'); s.async = true; s.dataset.goatcounter = 'https://hbedle.goatcounter.com/count'; s.src = '//gc.zgo.at/count.js'; document.head.appendChild(s);
  }
  setTimeout(Plot.refit, 50);
})(window);
