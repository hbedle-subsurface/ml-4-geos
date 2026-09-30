/* main.js - builds the lesson from the module list. One tab is visible at a time. Each tab has a talk band at the top
   (what the instructor covers) and a try-it band below it (a one to two minute activity). */
(function (g) {
  const { ML, DATA: D, Plot, H, MODULES: M, GLOSSARY: GL } = g;
  const params = new URLSearchParams(g.location.search);
  const soloId = params.get('m'), view = params.get('view') === 'ex' ? 'ex' : 'panel';
  const SHORT = { vocab: 'Vocabulary', types: 'Types of ML', fit: 'When ML fits', hw: 'Homework', pca: 'Dimensions', unsup: 'Unsupervised', sup: 'Supervised', semi: 'Semi-supervised', nn: 'Neural networks', cnn: 'CNN', sam: 'Segment Anything', llm: 'LLMs', geo: 'Geophysics', tracks: 'Other fields', traps: 'Pitfalls', next: 'Next steps' };
  const main = document.getElementById('modules');
  const ORDER = ['vocab', 'types', 'fit', 'pca', 'unsup', 'sup', 'semi', 'nn', 'cnn', 'sam', 'llm', 'geo', 'tracks', 'traps', 'next', 'hw'];
  M.sort((a, b) => (ORDER.indexOf(a.id) < 0 ? 99 : ORDER.indexOf(a.id)) - (ORDER.indexOf(b.id) < 0 ? 99 : ORDER.indexOf(b.id)));

  /* ---- build the sections ---- */
  const list = soloId ? M.filter(m => m.id === soloId) : M;
  if (soloId) { document.body.classList.add('solo', 'solo-' + view); const st = document.getElementById('m-start'); if (st) st.remove(); }
  const TK = g.TALK || {}, TR = g.TRY || {}, QZ = g.QUIZ || {};
  const quizHtml = id => (QZ[id] ? `<div class="check"><h5>Check yourself</h5>${QZ[id].map((q, i) => `<div class="qz" data-q="${id}:${i}"><p>${q.q}</p><div class="qo">${q.o.map((o, k) => `<button type="button" class="btn sm" data-k="${k}">${o}</button>`).join('')}</div><p class="qw" hidden></p></div>`).join('')}</div>` : '');
  list.forEach(m => {
    const tr = TR[m.id] || {}, steps = tr.steps || m.steps || [], hasEx = steps.length, tk = TK[m.id];
    const cards = tk && tk.cards ? `<div class="tcards">${tk.cards.map(c => `<div class="tc"><h5>${c.h}</h5><p>${c.t}</p></div>`).join('')}</div>` : '';
    const talk = tk ? `<div class="talk"><h4 class="band">Concept</h4>${tk.html || ''}${cards}</div>` : '';
    const tryLab = m.noPanel ? '' : `<h4 class="band">Try it Out!</h4>${tr.hook ? `<p class="hook">${tr.hook}</p>` : ''}`;
    const sec = document.createElement('section');
    sec.className = 'module lesson' + (hasEx ? '' : ' no-ex') + (soloId ? ' on' : ''); sec.id = 'm-' + m.id;
    sec.innerHTML = `
      <div class="mh"><h3>${m.title}</h3></div>
      ${talk}
      <div class="try">${tryLab}
      <div class="mod-grid">
        ${hasEx ? `<aside class="ex"><h4>What to do</h4><ol>${steps.map(t => `<li>${t}</li>`).join('')}</ol><button type="button" class="link" data-pop="ex">Pop out these steps</button></aside>` : ''}
        <div class="panel">${m.html()}${quizHtml(m.id)}${m.noPanel ? '' : '<div class="tools"><button type="button" class="link" data-pop="panel">Pop out this panel</button></div>'}</div>
      </div></div>
      ${soloId ? '' : '<div class="lesson-nav"><button type="button" class="btn" data-go="prev"></button><button type="button" class="btn primary" data-go="next"></button></div>'}`;
    main.appendChild(sec);
  });

  /* quizzes and the map-of-machine-learning cards */
  document.addEventListener('click', e => {
    const q = e.target.closest('.qz button[data-k]');
    if (q) {
      const box = q.closest('.qz'); if (box.classList.contains('done')) return;
      const [id, i] = box.dataset.q.split(':'), item = QZ[id][+i], ok = +q.dataset.k === item.a;
      box.classList.add('done', ok ? 'right' : 'wrong');
      box.querySelectorAll('button').forEach((b, k) => { if (k === item.a) b.classList.add('key'); });
      const w = box.querySelector('.qw'); w.hidden = false; w.textContent = (ok ? 'Yes. ' : 'Not quite. ') + item.why;
      return;
    }
    const c = e.target.closest('.mcard');
    if (c) { const open = c.getAttribute('aria-expanded') === 'true'; c.setAttribute('aria-expanded', open ? 'false' : 'true'); }
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
      acceptNode: n => (n.parentElement.closest('a,button,label,option,select,canvas,svg,output,summary,h3,h4,h5,.readout,.legend,.term,.qz,.mcard') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
    });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      const txt = n.nodeValue; re.lastIndex = 0; let out = '', last = 0, hit = false, mt;
      while ((mt = re.exec(txt))) {
        const raw = mt[1], e = lookup.get(raw.toLowerCase());
        if (!e || seen.has(e.t)) continue;
        if (raw === raw.toUpperCase() && raw.length > 1 && !e.a.includes(raw) && raw !== e.t) continue;
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
  document.getElementById('g-x').addEventListener('click', () => (dlg.close ? dlg.close() : dlg.removeAttribute('open')));
  dlg.addEventListener('click', e => { if (e.target === dlg && dlg.close) dlg.close(); });

  /* ---- pop-out windows ---- */
  main.addEventListener('click', e => {
    const b = e.target.closest('[data-pop]'); if (!b) return;
    const sec = b.closest('.module'), id = sec.id.slice(2), v = b.dataset.pop;
    const u = new URL(g.location.href); u.search = ''; u.hash = ''; u.searchParams.set('m', id); u.searchParams.set('view', v);
    const w = g.open(u.toString(), 'ml4g-' + id + '-' + v, v === 'ex' ? 'width=460,height=720,resizable=yes,scrollbars=yes' : 'width=1120,height=820,resizable=yes,scrollbars=yes');
    if (w && v === 'ex') { sec.classList.add('ex-out'); b.textContent = 'Exercises are in another window'; b.disabled = true; setTimeout(Plot.refit, 60); }
  });

  /* ---- solo (pop-out) windows stop here ---- */
  if (soloId) {
    const nav = document.getElementById('nav'); if (nav) nav.remove();
    const ft = document.querySelector('footer'); if (ft) ft.remove();
    list.forEach(m => { const sec = document.getElementById('m-' + m.id); m.init(sec); sec.querySelectorAll('.ex li, .note, .tc p, .pc li, .hint, .hook, .next li, .closer').forEach(linkTerms); });
    setTimeout(Plot.refit, 50);
    return;
  }

  /* ---- lesson navigation ---- */
  const lessons = [{ id: 'start', title: 'Start', part: 0 }].concat(M);
  const nav = document.getElementById('nav');
  const inited = new Set(['start']);
  let current = 0;
  nav.innerHTML = lessons.map((l, i) => {
    const sep = i > 0 && l.part !== lessons[i - 1].part ? '<span class="sep" aria-hidden="true"></span>' : '';
    return sep + `<button type="button" class="lt" data-i="${i}"><span>${l.id === 'start' ? 'Start' : (SHORT[l.id] || l.title)}</span></button>`;
  }).join('');
  const tabs = nav.querySelectorAll('.lt');
  const secOf = i => document.getElementById('m-' + lessons[i].id);
  const nameOf = i => (i === 0 ? 'the start' : (SHORT[lessons[i].id] || lessons[i].title));
  lessons.forEach((l, i) => {
    const sec = secOf(i), prev = sec.querySelector('[data-go="prev"]'), next = sec.querySelector('[data-go="next"]');
    if (prev) { prev.hidden = i === 0; prev.textContent = i > 0 ? 'Back to ' + nameOf(i - 1) : ''; }
    if (next) { if (i >= lessons.length - 1) next.hidden = true; else next.textContent = 'Next: ' + nameOf(i + 1); }
  });
  function show(i, fromHash) {
    if (i < 0 || i >= lessons.length) return;
    current = i;
    document.querySelectorAll('.lesson').forEach(s => s.classList.remove('on'));
    const sec = secOf(i); sec.classList.add('on');
    if (!inited.has(lessons[i].id)) {
      inited.add(lessons[i].id);
      lessons[i].init(sec); sec.querySelectorAll('.ex li, .note, .tc p, .pc li, .hint, .hook, .next li, .closer').forEach(linkTerms);
    }
    tabs.forEach((t, k) => t.classList.toggle('on', k === i));
    if (tabs[i].scrollIntoView) tabs[i].scrollIntoView({ block: 'nearest', inline: 'center' });
    if (!fromHash) { try { history.replaceState(null, '', '#' + lessons[i].id); } catch (e) { /* file:// may refuse */ } g.scrollTo(0, 0); }
    Plot.refit();
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => show(i)));
  main.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    show(current + (b.dataset.go === 'next' ? 1 : -1));
  });
  g.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,select,textarea')) return;
    if (e.key === 'ArrowRight' && !e.altKey && !e.metaKey) show(current + 1);
    if (e.key === 'ArrowLeft' && !e.altKey && !e.metaKey) show(current - 1);
  });

  /* ---- opening activity ---- */
  if (g.initStart) g.initStart(document.getElementById('m-start'));
  document.querySelector('#m-start .panel').insertAdjacentHTML('beforeend', quizHtml('start'));

  /* ---- open the tab named in the address, if any ---- */
  const h0 = lessons.findIndex(l => '#' + l.id === g.location.hash);
  if (h0 > 0) show(h0, true);

  /* ---- visit counting (GitHub Pages only) ---- */
  if (/github\.io$/.test(g.location.hostname)) {
    const s = document.createElement('script'); s.async = true; s.dataset.goatcounter = 'https://hbedle.goatcounter.com/count'; s.src = '//gc.zgo.at/count.js'; document.head.appendChild(s);
  }
  setTimeout(Plot.refit, 50);
})(window);
