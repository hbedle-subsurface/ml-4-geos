/* homework.js - load a table (.csv, .tsv, .xlsx) and run the same workflow we used in class:
   look at the columns, PCA, k-means, and a nearest-neighbor classifier with random and blocked splits.
   Everything stays in the browser. */
(function (g) {
  const { ML, DATA: D, Plot, H, MODULES: M, TABLES: T } = g;
  const C = Plot.C;
  const LAB = ['#D9A21B', '#7A4F8F', '#1F8A84', '#C4483F', '#3B6FB6', '#6A6F7A', '#8C6D31', '#B04A9E', '#4E9F3D', '#E0703C', '#2AA6A6', '#9A94A8'];
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = (v, d) => (Math.abs(v) >= 1000 || (v !== 0 && Math.abs(v) < 0.01) ? v.toExponential(2) : (+v.toFixed(d === undefined ? 3 : d)).toString());
  const COORD = /east|north|^x$|^y$|lon|lat|utm|coord|depth|^id$|sample|index/i;

  /* ---------- two sample tables ---------- */
  function sampleStream() {
    const r = ML.rng(41), n = 320, raw = [['sample_id', 'easting_km', 'northing_km', 'Li_ppm', 'Cs_ppm', 'Rb_ppm', 'Ta_ppm', 'Sn_ppm', 'K_ppm', 'Mg_ppm', 'Ni_ppm', 'catchment']];
    for (let i = 0; i < n; i++) {
      const e = 20 * r(), nn = 20 * r();
      const inf = Math.exp(-((e - 13) ** 2 + (nn - 7) ** 2) / (2 * 2.6 * 2.6)) + 0.8 * Math.exp(-((e - 5) ** 2 + (nn - 15) ** 2) / (2 * 2.0 * 2.0));
      const peg = r() < 0.06 + 0.9 * Math.min(1, inf) ? 1 : 0, F = ML.gauss(r), Mf = ML.gauss(r), s = peg ? 0.6 + 0.8 * r() : 0, nz = sd => sd * ML.gauss(r);
      const l = [1.4 + 0.15 * F + 0.5 * s + nz(0.12), 0.7 + 0.2 * F + 0.55 * s + nz(0.12), 1.9 + 0.3 * F + 0.35 * s + nz(0.1), 0.0 + 0.15 * F + 0.5 * s + nz(0.12),
        0.45 + 0.15 * F + 0.5 * s + nz(0.12), 4.2 + 0.15 * F + nz(0.08), 3.9 - 0.15 * F + 0.2 * Mf + nz(0.1), 1.5 + 0.4 * Mf - 0.2 * F + nz(0.12)];
      const v = l.map(x => Math.round(Math.pow(10, x) * 100) / 100); if (r() < 0.04) v[3] = '';
      raw.push(['S' + (1001 + i), Math.round(e * 100) / 100, Math.round(nn * 100) / 100].concat(v, [peg ? 'pegmatite' : 'background']));
    }
    return T.fromRows(raw, 'sample stream sediments');
  }
  function sampleLogs() {
    const R = H.R, order = ML.shuffle(R.n, ML.rng(12)), r = ML.rng(13), raw = [['sample', 'GR_API', 'RHOB_gcc', 'DT_usft', 'NPHI_vv', 'lithology']];
    order.forEach((i, k) => raw.push(['L' + (101 + k), Math.round(R.X[i][0] * 10) / 10, Math.round(R.X[i][1] * 1000) / 1000, r() < 0.03 ? -999.25 : Math.round(R.X[i][2] * 10) / 10, Math.round(R.X[i][3] * 1000) / 1000, D.LITH[R.y[i]].toLowerCase()]));
    return T.fromRows(raw, 'sample well logs');
  }

  M.push({
    id: 'hw', part: 4, title: 'Homework: your own table',
    lede: '', steps: [],
    html: () => `
      <div class="hw-load">
        <div class="drop" id="hw-drop" tabindex="0">Drop a .csv or .xlsx file here, or <label class="link">choose a file<input type="file" id="hw-file" accept=".csv,.tsv,.txt,.xlsx" hidden></label></div>
        <div class="ctlrow">${H.btn('hw-s1', 'Use the sample stream-sediment table')}${H.btn('hw-s2', 'Use the sample well-log table')}</div>
        <div class="ctl" id="hw-sheetrow" hidden><label for="hw-sheet">Sheet</label><select id="hw-sheet"></select></div>
        <p class="note">The file is read inside your browser and is not uploaded anywhere. Values like -999.25 are treated as missing.</p>
        <div class="readout" id="hw-status">No table loaded yet.</div>
      </div>
      <div id="hw-body" hidden>
        <h4>Set up</h4>
        <div class="hw-setup">
          <div class="hw-cols"><table class="hw-t"><thead><tr><th>Column</th><th>Type</th><th>Missing</th><th>Feature</th></tr></thead><tbody id="hw-cols"></tbody></table></div>
          <div>
            <div class="ctl"><label for="hw-label">Label column</label><select id="hw-label"></select></div>
            <div class="ctl"><label for="hw-loc">Location column</label><select id="hw-loc"></select></div>
            <div class="ctl"><label for="hw-tf">Data used</label><select id="hw-tf"><option value="none">Raw values</option><option value="std" selected>Rescaled (each column on the same scale)</option><option value="log">Logarithms (base 10), then rescaled</option></select></div>
            <p class="note" id="hw-prep"></p>
          </div>
        </div>
        <div class="hw-prev"><table class="hw-t" id="hw-prev"></table></div>

        <div class="tabs" id="hw-tabs" role="tablist">
          <button type="button" class="tab on" data-h="1">1 Look</button><button type="button" class="tab" data-h="2">2 PCA</button><button type="button" class="tab" data-h="3">3 Clusters</button><button type="button" class="tab" data-h="4">4 Predict</button><button type="button" class="tab" data-h="5">5 Results</button>
        </div>

        <div class="track on" data-h="1">
          <div class="ctlrow"><div class="ctl"><label for="hw-col">Column</label><select id="hw-col"></select></div>${H.chk('hw-log', 'Log10 axis', false)}${H.S('hw-bins', 'Bars', 8, 60, 1, 24)}</div>
          ${H.cv('hw-h', 0.5)}
          <div class="readout" id="hw-hout"></div>
        </div>

        <div class="track" data-h="2">
          <div class="ctlrow"><div class="ctl"><label for="hw-px">Horizontal</label><select id="hw-px"></select></div><div class="ctl"><label for="hw-py">Vertical</label><select id="hw-py"></select></div>${H.chk('hw-pcol', 'Color by label', true)}</div>
          <div class="row3"><div>${H.cv('hw-pc', 0.95)}</div><div>${H.cv('hw-pl', 0.95)}</div><div>${H.cv('hw-pv', 0.95)}</div></div>
          ${H.S('hw-keep', 'Components kept', 1, 8, 1, 2)}
          <div class="readout" id="hw-pout"></div>
        </div>

        <div class="track" data-h="3">
          <div class="row2"><div>${H.cv('hw-cs', 0.95)}</div><div>${H.cv('hw-ce', 0.95)}</div></div>
          <div class="ctlrow">${H.S('hw-k', 'Number of clusters, k', 2, 8, 1, 3)}${H.btn('hw-knew', 'New start')}${H.chk('hw-cring', 'Ring the points by label', false)}</div>
          <div class="readout" id="hw-cout"></div>
        </div>

        <div class="track" data-h="4">
          <p class="note" id="hw-knote"></p>
          <div class="row2"><div>${H.cv('hw-km', 0.95)}</div><div>${H.cv('hw-kb', 0.95)}</div></div>
          <div class="ctlrow">${H.S('hw-tr', 'Share used for training', 10, 90, 5, 70)}${H.S('hw-nn', 'Number of trees in the forest', 5, 100, 5, 25)}${H.btn('hw-snew', 'New split')}</div>
          <div class="readout" id="hw-kout"></div>
        </div>

        <div class="track" data-h="5">
          <div class="readout" id="hw-res"></div>
          <div class="ctlrow">${H.btn('hw-dl', 'Download my results')}${H.btn('hw-dlt', 'Download the cleaned table')}</div>
          <h4>Questions for your write-up</h4>
          <ol class="hw-q">
            <li>How many rows and columns did you use, and how many rows were dropped for missing values?</li>
            <li>Which version of the data did you use (raw, rescaled, or log), and what changed when you tried another?</li>
            <li>What mix of measurements makes up PC1 and PC2 (the loadings)? Name one geological association you would check against your own knowledge of the area.</li>
            <li>Did the clusters line up with your label column? What k did you settle on, and why?</li>
            <li>How did accuracy change between the random and the blocked split? What does that say about your data?</li>
            <li>What one thing would change your mind about these results?</li>
          </ol>
        </div>
      </div>`,
    init(root) {
      const st = { table: null, feat: [], label: -1, loc: -1, tf: 'std', step: 1, seed: 5, splitSeed: 5, sheets: null };
      let prep = null, kmCache = {}, elbow = null, colHist = null;
      const q = id => H.q(root, id), status = q('hw-status');
      const stepNames = ['Look', 'PCA', 'Clusters', 'Predict', 'Results'];

      /* ---------- loading ---------- */
      function setTable(t) {
        st.table = t; st.label = -1; st.loc = -1;
        const numCols = t.cols.map((_, j) => j).filter(j => t.types[j] === 'num');
        st.feat = numCols.filter(j => !COORD.test(t.cols[j]));
        if (st.feat.length < 2) st.feat = numCols.slice(0, 8);
        const lab = t.cols.map((_, j) => j).find(j => labelOK(j)); st.label = lab === undefined ? -1 : lab;
        const loc = numCols.find(j => /east|^x$|lon|utm_?e/i.test(t.cols[j])); st.loc = loc === undefined ? -1 : loc;
        kmCache = {}; elbow = null;
        const miss = t.rows.reduce((s, r) => s + r.filter(v => v === null).length, 0);
        status.innerHTML = `Loaded <b>${esc(t.name)}</b>: ${t.rows.length} rows, ${t.cols.length} columns (${numCols.length} numeric).${t.sentinel ? ` ${t.sentinel} null-flag values (like -999.25) were treated as missing.` : ''} ${miss} empty cells in total.`;
        buildSetup(); q('hw-body').hidden = false; refresh();
      }
      const labelOK = j => {
        const t = st.table; if (!t) return false; const u = new Set(t.rows.map(r => r[j]).filter(v => v !== null));
        if (u.size < 2 || u.size > 12) return false;
        return t.types[j] === 'text' || [...u].every(Number.isInteger);
      };
      async function loadFile(f) {
        try {
          status.textContent = 'Reading ' + f.name + ' ...';
          if (/\.xlsx$/i.test(f.name)) {
            const wb = await T.openXLSX(await f.arrayBuffer(), f.name); st.sheets = wb;
            const sel = q('hw-sheet'); sel.innerHTML = wb.sheets.map((s, i) => `<option value="${i}">${esc(s)}</option>`).join(''); q('hw-sheetrow').hidden = wb.sheets.length < 2;
            setTable(await wb.load(0));
          } else { st.sheets = null; q('hw-sheetrow').hidden = true; setTable(T.parseCSV(await f.text(), f.name)); }
        } catch (e) { status.textContent = 'Could not read that file. ' + (e && e.message ? e.message : ''); }
      }
      q('hw-file').addEventListener('change', e => { if (e.target.files[0]) loadFile(e.target.files[0]); });
      const drop = q('hw-drop');
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
      drop.addEventListener('drop', e => { if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
      q('hw-sheet').addEventListener('change', async e => { try { setTable(await st.sheets.load(+e.target.value)); } catch (err) { status.textContent = err.message; } });
      H.on(root, 'hw-s1', 'click', () => { q('hw-sheetrow').hidden = true; setTable(sampleStream()); });
      H.on(root, 'hw-s2', 'click', () => { q('hw-sheetrow').hidden = true; setTable(sampleLogs()); });

      /* ---------- set-up controls ---------- */
      function buildSetup() {
        const t = st.table;
        q('hw-cols').innerHTML = t.cols.map((c, j) => {
          const miss = t.rows.filter(r => r[j] === null).length;
          return `<tr><td>${esc(c)}</td><td>${t.types[j] === 'num' ? 'number' : 'text'}</td><td>${miss}</td><td>${t.types[j] === 'num' ? `<input type="checkbox" data-j="${j}"${st.feat.includes(j) ? ' checked' : ''}>` : ''}</td></tr>`;
        }).join('');
        q('hw-cols').querySelectorAll('input').forEach(cb => cb.addEventListener('change', () => { st.feat = [...q('hw-cols').querySelectorAll('input:checked')].map(x => +x.dataset.j); refresh(); }));
        const lab = q('hw-label'), loc = q('hw-loc');
        lab.innerHTML = '<option value="-1">none</option>' + t.cols.map((c, j) => (labelOK(j) ? `<option value="${j}">${esc(c)}</option>` : '')).join('');
        loc.innerHTML = '<option value="-1">none</option>' + t.cols.map((c, j) => (t.types[j] === 'num' ? `<option value="${j}">${esc(c)}</option>` : '')).join('');
        lab.value = String(st.label); loc.value = String(st.loc);
        const head = t.cols.map(c => `<th>${esc(c)}</th>`).join(''), body = t.rows.slice(0, 5).map(r => `<tr>${r.map(v => `<td>${v === null ? '' : esc(typeof v === 'number' ? num(v) : v)}</td>`).join('')}</tr>`).join('');
        q('hw-prev').innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
        const cs = q('hw-col'); cs.innerHTML = t.cols.map((c, j) => (t.types[j] === 'num' ? `<option value="${j}">${esc(c)}</option>` : '')).join('');
        const fx = q('hw-px'), fy = q('hw-py');
        fx.innerHTML = fy.innerHTML = '';
      }
      q('hw-label').addEventListener('change', e => { st.label = +e.target.value; refresh(); });
      q('hw-loc').addEventListener('change', e => { st.loc = +e.target.value; refresh(); });
      q('hw-tf').addEventListener('change', e => { st.tf = e.target.value; refresh(); });

      /* ---------- prepare the numbers ---------- */
      function prepare() {
        const t = st.table, feat = st.feat.slice();
        if (feat.length < 2) return { error: 'Tick at least two numeric columns as features.' };
        let idx = [], dropped = 0;
        t.rows.forEach((r, i) => { if (feat.every(j => typeof r[j] === 'number')) idx.push(i); else dropped++; });
        if (idx.length < 10) return { error: 'Fewer than 10 complete rows are left after dropping rows with missing values.' };
        let capped = false;
        if (idx.length > 4000) { const s = ML.shuffle(idx.length, ML.rng(9)).slice(0, 4000).sort((a, b) => a - b); idx = s.map(i => idx[i]); capped = true; }
        let X = idx.map(i => feat.map(j => t.rows[i][j]));
        const notLogged = [];
        if (st.tf === 'log') {
          feat.forEach((j, c) => { if (X.some(x => x[c] <= 0)) notLogged.push(c); });
          X = X.map(x => x.map((v, c) => (notLogged.includes(c) ? v : Math.log10(v))));
        }
        const Z = st.tf === 'none' ? X : ML.standardize(X).Z, P = ML.pca(Z);
        const ranges = P.vals.map((_, k) => { const v = P.scores.map(s => s[k]); const lo = Math.min(...v), hi = Math.max(...v), pad = (hi - lo) * 0.06 || 1; return [lo - pad, hi + pad]; });
        let y = null, classes = [];
        if (st.label >= 0) {
          const vals = idx.map(i => t.rows[i][st.label]); classes = [...new Set(vals.filter(v => v !== null))].map(String).sort();
          y = vals.map(v => (v === null ? -1 : classes.indexOf(String(v))));
        }
        const loc = st.loc >= 0 ? idx.map(i => t.rows[i][st.loc]) : null;
        return { idx, X, Z, P, ranges, y, classes, loc, dropped, capped, feat, notLogged, n: idx.length };
      }

      /* ---------- refresh everything after a change ---------- */
      function refresh() {
        kmCache = {}; elbow = null; prep = prepare();
        const note = q('hw-prep');
        if (prep.error) { note.textContent = prep.error; drawStep(); return; }
        note.textContent = `${prep.n} rows used, ${prep.dropped} dropped for missing values in the chosen features.${prep.capped ? ' A random 4000 rows are used to keep things quick.' : ''}${prep.notLogged.length ? ' Columns with zeros or negatives were not logged: ' + prep.notLogged.map(c => st.table.cols[prep.feat[c]]).join(', ') + '.' : ''}`;
        const d = prep.feat.length;
        ['hw-px', 'hw-py'].forEach((id, k) => { const s = q(id), keep = s.value; s.innerHTML = Array.from({ length: d }, (_, i) => `<option value="${i}">PC${i + 1}</option>`).join(''); s.value = keep && +keep < d ? keep : String(Math.min(k, d - 1)); });
        const kp = q('hw-keep'); kp.max = d; if (+kp.value > d) kp.value = d; q('hw-keep-o').textContent = kp.value;
        drawStep();
      }

      /* ---------- plots ---------- */
      const pH = H.plot(root, 'hw-h', { xr: [0, 1], yr: [0, 1], nx: 6, ny: 5, aspect: 0.5, xl: '', yl: 'Samples' });
      const pPC = H.plot(root, 'hw-pc', { xr: [-1, 1], yr: [-1, 1], nx: 5, ny: 5 });
      const pPL = H.plot(root, 'hw-pl', { xr: [0.5, 4.5], yr: [-1, 1], nx: 4, ny: 4, yl: 'Loading' });
      const pPV = H.plot(root, 'hw-pv', { xr: [0.5, 4.5], yr: [0, 100], nx: 4, ny: 5, yl: 'Share of the spread kept (%)' });
      const pCS = H.plot(root, 'hw-cs', { xr: [-1, 1], yr: [-1, 1], nx: 5, ny: 5 });
      const pCE = H.plot(root, 'hw-ce', { xr: [0.5, 8.5], yr: [0, 1], nx: 8, ny: 5, xl: 'Number of clusters, k', yl: 'Total distance to the centers', fmtx: v => (Number.isInteger(v) ? v : '') });
      const pKM = H.plot(root, 'hw-km', { xr: [0, 1], yr: [0, 1], noAxes: true, invY: true, m: { l: 70, r: 6, t: 30, b: 4 } });
      const pKB = H.plot(root, 'hw-kb', { xr: [0.5, 2.5], yr: [0, 1], nx: 2, ny: 5, yl: 'Accuracy', fmtx: v => (v === 1 ? 'Random split' : v === 2 ? 'Blocked split' : ''), fmty: v => Math.round(v * 100) + '%' });

      const pcx = () => +q('hw-px').value || 0, pcy = () => +q('hw-py').value || 0;
      const labColor = i => LAB[i % LAB.length], ok = () => prep && !prep.error;

      // 1 look
      const hb = H.bind(root, 'hw-bins', () => pH.draw(), v => v);
      q('hw-col').addEventListener('change', () => { colHist = null; pH.draw(); }); q('hw-log').addEventListener('change', () => { colHist = null; pH.draw(); });
      pH.onDraw = pl => {
        const t = st.table; if (!t) return; const j = +q('hw-col').value;
        if (isNaN(j) || t.types[j] !== 'num') { pl.ptext('This table has no numeric column.', pl.W / 2, pl.H / 2, { align: 'center' }); return; }
        const lg = q('hw-log').checked; let v = t.rows.map(r => r[j]).filter(x => x !== null); const nOrig = v.length;
        if (lg) v = v.filter(x => x > 0).map(Math.log10);
        if (!v.length) { pl.ptext('No positive values to log.', pl.W / 2, pl.H / 2, { align: 'center' }); return; }
        const lo = Math.min(...v), hi = Math.max(...v), nb = hb.get(), w = (hi - lo) / nb || 1, bins = new Array(nb).fill(0);
        v.forEach(x => { bins[Math.min(nb - 1, Math.floor((x - lo) / w))]++; });
        pl.o.xr = [lo, hi === lo ? lo + 1 : hi]; pl.o.yr = [0, Math.max(...bins) * 1.08]; pl.o.xl = t.cols[j] + (lg ? ' (log10)' : ''); pl.axes();
        bins.forEach((c, b) => pl.rect(lo + b * w + w * 0.06, 0, lo + (b + 1) * w - w * 0.06, c, C.RED));
        const sorted = v.slice().sort((a, b) => a - b), mean = v.reduce((a, b) => a + b, 0) / v.length, med = sorted[sorted.length >> 1];
        const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length) || 1, skew = v.reduce((a, b) => a + ((b - mean) / sd) ** 3, 0) / v.length;
        q('hw-hout').innerHTML = `<b>${esc(t.cols[j])}</b>: ${nOrig} values, ${t.rows.length - nOrig} missing. Minimum ${num(Math.min(...t.rows.map(r => r[j]).filter(x => x !== null)))}, median ${num(lg ? Math.pow(10, med) : med)}, maximum ${num(Math.max(...t.rows.map(r => r[j]).filter(x => x !== null)))}. Skewness of what is plotted: <b>${skew.toFixed(2)}</b>${Math.abs(skew) > 1 ? ', a long tail on one side' : ''}.`;
      };

      // 2 PCA
      const keep = H.bind(root, 'hw-keep', () => { pPV.draw(); }, v => v);
      ['hw-px', 'hw-py'].forEach(id => q(id).addEventListener('change', () => { pPC.draw(); pPL.draw(); }));
      q('hw-pcol').addEventListener('change', () => pPC.draw());
      pPC.onDraw = pl => {
        if (!ok()) { msg(pl); return; }
        const a = pcx(), b = pcy(); pl.o.xr = prep.ranges[a]; pl.o.yr = prep.ranges[b]; pl.o.xl = 'PC' + (a + 1); pl.o.yl = 'PC' + (b + 1); pl.axes();
        const byLab = q('hw-pcol').checked && prep.y && prep.classes.length >= 2 && prep.classes.length <= 12;
        prep.P.scores.forEach((s, i) => pl.dot(s[a], s[b], 3, byLab && prep.y[i] >= 0 ? Plot.hex2rgba(labColor(prep.y[i]), 0.8) : 'rgba(92,102,112,0.5)'));
        if (byLab) prep.classes.forEach((c, k) => pl.ptext('● ' + c, pl.o.m.l + 8, pl.o.m.t + 12 + k * 15, { color: labColor(k), font: '12px system-ui' }));
      };
      pPL.onDraw = pl => {
        if (!ok()) { msg(pl); return; }
        const d = prep.feat.length, a = pcx(), b = pcy(); pl.o.xr = [0.5, d + 0.5]; pl.o.nx = d; pl.o.fmtx = v => (Number.isInteger(v) && v >= 1 && v <= d ? st.table.cols[prep.feat[v - 1]].slice(0, 6) : ''); pl.axes(); pl.hline(0, C.SLATE, 1);
        for (let j = 0; j < d; j++) { pl.rect(j + 1 - 0.36, 0, j + 1, prep.P.vecs[a][j], C.RED); pl.rect(j + 1, 0, j + 1 + 0.36, prep.P.vecs[b][j], C.SLATE); }
        pl.ptext('PC' + (a + 1), pl.x(0.6), pl.y(0.9), { color: C.RED, font: '11px system-ui' }); pl.ptext('PC' + (b + 1), pl.x(1.3), pl.y(0.9), { color: C.SLATE, font: '11px system-ui' });
      };
      pPV.onDraw = pl => {
        if (!ok()) { msg(pl); return; }
        const d = prep.feat.length, k = keep.get(); pl.o.xr = [0.5, d + 0.5]; pl.o.nx = d; pl.o.fmtx = v => (Number.isInteger(v) && v >= 1 && v <= d ? 'PC' + v : ''); pl.axes();
        prep.P.frac.forEach((f, i) => { pl.rect(i + 1 - 0.32, 0, i + 1 + 0.32, f * 100, i < k ? C.RED : 'rgba(92,102,112,0.35)'); pl.text(Math.round(f * 100) + '', i + 1, Math.min(f * 100 + 5, 96), { align: 'center', font: '11px system-ui' }); });
        const kept = prep.P.frac.slice(0, k).reduce((a, b) => a + b, 0), top = prep.P.vecs[0].reduce((bi, v, j, arr) => (Math.abs(v) > Math.abs(arr[bi]) ? j : bi), 0);
        q('hw-pout').innerHTML = `Keeping ${k} of ${d} components keeps <b>${Math.round(kept * 100)}%</b> of the spread. The largest PC1 loading is on <b>${esc(st.table.cols[prep.feat[top]])}</b>.${st.tf === 'none' ? ' With raw values the columns with the biggest numbers tend to lead.' : ''}`;
      };

      // 3 clusters
      const kk = H.bind(root, 'hw-k', () => { pCS.draw(); pCE.draw(); }, v => v);
      H.on(root, 'hw-knew', 'click', () => { st.seed += 7; kmCache = {}; elbow = null; pCS.draw(); pCE.draw(); });
      q('hw-cring').addEventListener('change', () => pCS.draw());
      const km = k => (kmCache[k] || (kmCache[k] = ML.kmeansBest(prep.Z, k, ML.rng(20 + k + st.seed), 4)));
      const getElbow = () => elbow || (elbow = Array.from({ length: 8 }, (_, i) => km(i + 1).inertia));
      pCS.onDraw = pl => {
        if (!ok()) { msg(pl); return; }
        const m = km(kk.get()), a = 0, b = Math.min(1, prep.feat.length - 1), ring = q('hw-cring').checked && prep.y;
        pl.o.xr = prep.ranges[a]; pl.o.yr = prep.ranges[b]; pl.o.xl = 'PC1'; pl.o.yl = 'PC2'; pl.axes();
        prep.P.scores.forEach((s, i) => pl.dot(s[a], s[b], ring ? 4 : 3.2, Plot.hex2rgba(Plot.CLUSTER[m.labels[i] % 8], 0.85), ring && prep.y[i] >= 0 ? labColor(prep.y[i]) : null, 1.6));
        const sizes = new Array(kk.get()).fill(0); m.labels.forEach(l => sizes[l]++);
        q('hw-cout').innerHTML = `k = ${kk.get()}. Cluster sizes: ${sizes.join(', ')}.` + (prep.y && prep.classes.length ? ` Agreement with the label column: <b>${H.pct(ML.purity(m.labels.filter((_, i) => prep.y[i] >= 0), prep.y.filter(v => v >= 0), kk.get(), prep.classes.length))}</b> of labeled samples fall in a cluster whose most common label matches theirs.` : ' Pick a label column above to compare the clusters with known classes.');
      };
      pCE.onDraw = pl => {
        if (!ok()) { msg(pl); return; }
        const e = getElbow(); pl.o.yr = [0, e[0] * 1.05]; pl.axes(); pl.line(e.map((v, i) => [i + 1, v]), C.SLATE, 2); e.forEach((v, i) => pl.dot(i + 1, v, 3, C.SLATE)); pl.dot(kk.get(), e[kk.get() - 1], 6.5, C.RED);
      };

      // 4 predict
      const trs = H.bind(root, 'hw-tr', () => { pKM.draw(); pKB.draw(); }, v => v + '%'), nns = H.bind(root, 'hw-nn', () => { pKM.draw(); pKB.draw(); }, v => v);
      H.on(root, 'hw-snew', 'click', () => { st.splitSeed += 3; pKM.draw(); pKB.draw(); });
      const pool = () => {
        const all = prep.y.map((v, i) => (v >= 0 ? i : -1)).filter(i => i >= 0);
        return all.length > 800 ? ML.shuffle(all.length, ML.rng(31)).slice(0, 800).map(i => all[i]) : all;
      };
      const knnOf = (tr, te) => { const nc = prep.classes.length, f = ML.forest(tr.map(i => prep.Z[i]), tr.map(i => prep.y[i]), nc, nns.get(), ML.rng(5), { maxDepth: 6 }); return te.map(i => ML.argmax(ML.forestVotes(f, prep.Z[i], nc))); };
      let res4 = null;
      function run4() {
        const P = pool(), nc = prep.classes.length, order = ML.shuffle(P.length, ML.rng(st.splitSeed)).map(i => P[i]), cut = Math.max(2, Math.round(trs.get() / 100 * order.length));
        const tr = order.slice(0, cut), te = order.slice(cut), pred = knnOf(tr, te), conf = Array.from({ length: nc }, () => new Array(nc).fill(0));
        let good = 0; te.forEach((i, t) => { conf[prep.y[i]][pred[t]]++; if (pred[t] === prep.y[i]) good++; });
        let rnd = null, blk = null;
        const K = 5, shuf = ML.shuffle(P.length, ML.rng(77)).map(i => P[i]);
        const cv = folds => { let c = 0, n = 0; folds.forEach(f => { const set = new Set(f), trn = P.filter(i => !set.has(i)), p = knnOf(trn, f); f.forEach((i, t) => { n++; if (p[t] === prep.y[i]) c++; }); }); return c / n; };
        rnd = cv(Array.from({ length: K }, (_, f) => shuf.filter((_, t) => t % K === f)));
        if (prep.loc) { const srt = P.slice().sort((a, b) => prep.loc[a] - prep.loc[b]), sz = Math.ceil(srt.length / K); blk = cv(Array.from({ length: K }, (_, f) => srt.slice(f * sz, (f + 1) * sz)).filter(f => f.length)); }
        res4 = { conf, acc: te.length ? good / te.length : 0, nte: te.length, ntr: tr.length, rnd, blk, pooled: P.length };
        return res4;
      }
      function usable() { return ok() && prep.y && prep.classes.length >= 2 && prep.classes.length <= 12; }
      pKM.onDraw = pl => {
        const note = q('hw-knote');
        if (!usable()) { note.textContent = ok() ? 'Pick a label column above (a text column with 2 to 12 different values) to use this step.' : ''; msg(pl, ok() ? 'No label column chosen' : null); return; }
        note.textContent = `Classifying ${prep.classes.length} classes with the ${prep.feat.length} chosen features. ${res4 && res4.pooled >= 1500 ? 'A random 1500 labeled rows are used to keep things quick.' : ''}`;
        const r = run4(), nc = prep.classes.length, c = pl.ctx, cw = (pl.W - 76) / nc, ch = (pl.H - 34) / nc;
        c.save(); c.font = '11px system-ui'; c.fillStyle = C.SLATE; c.textAlign = 'center'; c.textBaseline = 'bottom';
        prep.classes.forEach((n, j) => c.fillText(n.slice(0, 9), 70 + (j + 0.5) * cw, 26));
        c.textAlign = 'right'; c.textBaseline = 'middle'; prep.classes.forEach((n, i) => c.fillText(n.slice(0, 10), 66, 30 + (i + 0.5) * ch));
        c.restore(); pl.ptext('Predicted', 70 + nc * cw / 2, 8, { align: 'center', color: C.INK, font: '12px system-ui' });
        for (let i = 0; i < nc; i++) {
          const tot = r.conf[i].reduce((a, b) => a + b, 0);
          for (let j = 0; j < nc; j++) {
            const v = tot ? r.conf[i][j] / tot : 0; const [a1, b1] = [[244, 246, 247], [132, 22, 23]]; c.fillStyle = `rgb(${a1.map((x, k) => Math.round(x + (b1[k] - x) * v)).join(',')})`;
            c.fillRect(70 + j * cw + 1, 30 + i * ch + 1, cw - 2, ch - 2);
            if (nc <= 6) pl.ptext(tot ? Math.round(v * 100) + '%' : '-', 70 + (j + 0.5) * cw, 30 + (i + 0.5) * ch, { align: 'center', font: 'bold 12px system-ui', color: v > 0.55 ? '#fff' : C.INK });
          }
        }
        q('hw-kout').innerHTML = `${r.ntr} training and ${r.nte} test samples: <b>${H.pct(r.acc)}</b> correct.`;
      };
      pKB.onDraw = pl => {
        if (!usable() || !res4) { msg(pl); return; }
        pl.axes(); const r = res4;
        pl.rect(0.7, 0, 1.3, r.rnd, C.RED); pl.text(H.pct(r.rnd), 1, r.rnd > 0.9 ? r.rnd - 0.06 : r.rnd + 0.05, { align: 'center', font: 'bold 12px system-ui', color: r.rnd > 0.9 ? '#fff' : C.INK });
        if (r.blk !== null) { pl.rect(1.7, 0, 2.3, r.blk, C.SLATE); pl.text(H.pct(r.blk), 2, r.blk > 0.9 ? r.blk - 0.06 : r.blk + 0.05, { align: 'center', font: 'bold 12px system-ui', color: r.blk > 0.9 ? '#fff' : C.INK }); }
        else pl.ptext('choose a location column', pl.x(2), pl.y(0.5), { align: 'center', color: C.SLATE, font: '12px system-ui' });
        q('hw-kout').innerHTML += ` Five-fold check: random split <b>${H.pct(r.rnd)}</b>${r.blk !== null ? `, blocked by ${esc(st.table.cols[st.loc])} <b>${H.pct(r.blk)}</b>` : ''}.`;
      };

      // 5 results
      function summary() {
        if (!ok()) return prep && prep.error ? prep.error : 'Load a table first.';
        const t = st.table, L = [];
        L.push(`File: ${t.name}`, `Rows in file: ${t.rows.length}. Rows used: ${prep.n}. Rows dropped for missing values: ${prep.dropped}.${prep.capped ? ' (random 4000 used)' : ''}`);
        L.push(`Features (${prep.feat.length}): ${prep.feat.map(j => t.cols[j]).join(', ')}`, `Data used: ${({ none: 'raw values', std: 'rescaled', log: 'logarithms (base 10), then rescaled' })[st.tf]}`);
        L.push(`PCA share of the spread kept: ${prep.P.frac.slice(0, Math.min(4, prep.P.frac.length)).map((f, i) => 'PC' + (i + 1) + ' ' + Math.round(f * 100) + '%').join(', ')}`);
        L.push(`PC1 loadings: ${prep.feat.map((j, c) => t.cols[j] + ' ' + prep.P.vecs[0][c].toFixed(2)).join(', ')}`);
        const m = km(kk.get()); const sizes = new Array(kk.get()).fill(0); m.labels.forEach(l => sizes[l]++);
        L.push(`k-means: k = ${kk.get()}, cluster sizes ${sizes.join(', ')}` + (usable() ? `, agreement with ${t.cols[st.label]} ${Math.round(100 * ML.purity(m.labels.filter((_, i) => prep.y[i] >= 0), prep.y.filter(v => v >= 0), kk.get(), prep.classes.length))}%` : ''));
        if (usable()) { const r = run4(); L.push(`Random forest (${nns.get()} trees) on ${t.cols[st.label]}: ${Math.round(r.acc * 100)}% on the held-out ${100 - trs.get()}%. Five-fold random ${Math.round(r.rnd * 100)}%${r.blk !== null ? `, blocked by ${t.cols[st.loc]} ${Math.round(r.blk * 100)}%` : ''}.`); }
        return L.join('\n');
      }
      const showResults = () => { q('hw-res').innerHTML = esc(summary()).replace(/\n/g, '<br>'); };
      const save = (name, text) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 500); };
      H.on(root, 'hw-dl', 'click', () => save('ml-homework-results.txt', summary() + '\n'));
      H.on(root, 'hw-dlt', 'click', () => { if (st.table) save('cleaned-table.csv', T.toCSV(st.table)); });

      function msg(pl, text) { pl.ptext(text || (prep && prep.error ? prep.error : 'Load a table above.'), pl.W / 2, pl.H / 2, { align: 'center', color: C.SLATE, font: '13px system-ui' }); }

      /* ---------- steps ---------- */
      const plots = { 1: [pH], 2: [pPC, pPL, pPV], 3: [pCS, pCE], 4: [pKM, pKB] };
      function drawStep() {
        if (!st.table) return;
        if (st.step === 5) { showResults(); return; }
        (plots[st.step] || []).forEach(p => { p.fit(); p.draw(); });
      }
      root.querySelectorAll('#hw-tabs .tab').forEach(b => b.addEventListener('click', () => {
        st.step = +b.dataset.h;
        root.querySelectorAll('#hw-tabs .tab').forEach(x => x.classList.toggle('on', x === b));
        root.querySelectorAll('.track[data-h]').forEach(x => x.classList.toggle('on', +x.dataset.h === st.step));
        drawStep();
      }));
      g.HW_DEBUG = { st, get prep() { return prep; }, summary, setTable, loadFile };
    }
  });
})(window);
