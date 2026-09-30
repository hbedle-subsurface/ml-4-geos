/* tables.js - read a CSV/TSV or an Excel .xlsx file in the browser, with no library and no upload.
   An .xlsx file is a zip of XML files, so we read the zip directory, inflate the parts we need
   (DecompressionStream, built into current browsers), and pull the cell values out of the sheet XML. */
(function (g) {
  const T = {};
  const NULLS = new Set(['', 'na', 'n/a', 'nan', 'null', 'none', '-', '--', '#n/a', '#div/0!', '#value!']);
  const SENTINELS = new Set([-999.25, -999, -9999, -99999]);
  const NUM = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

  function cell(v, stats) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') { if (!isFinite(v)) return null; if (SENTINELS.has(v)) { stats.sentinel++; return null; } return v; }
    const s = String(v).trim();
    if (NULLS.has(s.toLowerCase())) return null;
    if (NUM.test(s)) { const x = parseFloat(s); if (SENTINELS.has(x)) { stats.sentinel++; return null; } return x; }
    if (stats.decComma && /^[+-]?\d+,\d+$/.test(s)) { const x = parseFloat(s.replace(',', '.')); if (SENTINELS.has(x)) { stats.sentinel++; return null; } return x; }
    return s;
  }

  /* raw: array of rows (arrays of strings or numbers); the first row holds the column names */
  T.fromRows = function (raw, name, opts) {
    const stats = { sentinel: 0, decComma: !!(opts && opts.decComma) };
    raw = raw.filter(r => r && r.some(v => v !== null && v !== undefined && String(v).trim() !== ''));
    if (raw.length < 2) throw new Error('The table needs a header row and at least one row of data.');
    const nc = Math.max(...raw.map(r => r.length));
    const seen = new Set(), cols = [];
    for (let j = 0; j < nc; j++) {
      let n = String(raw[0][j] === undefined || raw[0][j] === null ? '' : raw[0][j]).trim() || 'column ' + (j + 1);
      while (seen.has(n)) n += '_';
      seen.add(n); cols.push(n);
    }
    const rows = raw.slice(1).map(r => cols.map((_, j) => cell(r[j], stats)));
    const types = cols.map((_, j) => {
      let num = 0, tot = 0; rows.forEach(r => { if (r[j] !== null) { tot++; if (typeof r[j] === 'number') num++; } });
      return tot && num / tot >= 0.8 ? 'num' : 'text';
    });
    rows.forEach(r => types.forEach((t, j) => { if (t === 'num' && typeof r[j] === 'string') r[j] = null; if (t === 'text' && typeof r[j] === 'number') r[j] = String(r[j]); }));
    return { name: name || 'table', cols, types, rows, sentinel: stats.sentinel };
  };

  /* ---------- CSV / TSV ---------- */
  T.parseCSV = function (text, name) {
    text = text.replace(/^\uFEFF/, '');
    const first = text.split(/\r?\n/, 1)[0] || '';
    const cand = [',', ';', '\t'], counts = cand.map(d => first.split(d).length);
    const delim = cand[counts.indexOf(Math.max(...counts))];
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === delim) { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return T.fromRows(rows, name, { decComma: delim === ';' });
  };

  /* ---------- XLSX ---------- */
  const u16 = (b, o) => b[o] | (b[o + 1] << 8), u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  async function inflate(bytes) {
    const ds = new DecompressionStream('deflate-raw');
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer());
  }
  async function unzip(buf) {
    const b = new Uint8Array(buf); let eocd = -1;
    for (let i = b.length - 22; i >= Math.max(0, b.length - 66000); i--) if (u32(b, i) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('This does not look like an .xlsx file.');
    const n = u16(b, eocd + 10); let p = u32(b, eocd + 16); const files = {};
    for (let k = 0; k < n; k++) {
      if (u32(b, p) !== 0x02014b50) break;
      const method = u16(b, p + 10), csize = u32(b, p + 20), nl = u16(b, p + 28), el = u16(b, p + 30), cl = u16(b, p + 32), lho = u32(b, p + 42);
      const nm = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nl));
      files[nm] = { method, csize, lho }; p += 46 + nl + el + cl;
    }
    const read = async nm => {
      const f = files[nm]; if (!f) return null;
      const o = f.lho, start = o + 30 + u16(b, o + 26) + u16(b, o + 28), data = b.subarray(start, start + f.csize);
      return new TextDecoder().decode(f.method === 0 ? data : await inflate(data));
    };
    return { has: nm => !!files[nm], read, names: Object.keys(files) };
  }
  const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&amp;/g, '&');
  const colIndex = ref => { const m = /^([A-Z]+)/.exec(ref); let n = 0; for (const ch of m[1]) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  const textOf = xml => { let s = '', m; const re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g; while ((m = re.exec(xml))) s += m[1]; return unesc(s); };

  T.openXLSX = async function (buf, name) {
    const z = await unzip(buf);
    const wb = await z.read('xl/workbook.xml'); if (!wb) throw new Error('No workbook found inside this .xlsx file.');
    const rels = (await z.read('xl/_rels/workbook.xml.rels')) || '';
    const relMap = {}; let m; const rr = /<Relationship\b[^>]*>/g;
    while ((m = rr.exec(rels))) { const id = /\bId="([^"]+)"/.exec(m[0]), tg = /\bTarget="([^"]+)"/.exec(m[0]); if (id && tg) relMap[id[1]] = tg[1]; }
    const sheets = []; const sr = /<sheet\b[^>]*>/g;
    while ((m = sr.exec(wb))) {
      const nm = /\bname="([^"]*)"/.exec(m[0]), id = /\br:id="([^"]+)"/.exec(m[0]);
      let tg = id && relMap[id[1]] ? relMap[id[1]] : 'worksheets/sheet' + (sheets.length + 1) + '.xml';
      tg = tg.replace(/^\/?(xl\/)?/, 'xl/'); sheets.push({ name: nm ? unesc(nm[1]) : 'Sheet ' + (sheets.length + 1), path: tg });
    }
    const sst = []; const sx = await z.read('xl/sharedStrings.xml');
    if (sx) { const re = /<si\b[^>]*>([\s\S]*?)<\/si>/g; while ((m = re.exec(sx))) sst.push(textOf(m[1])); }
    return {
      sheets: sheets.map(s => s.name),
      async load(i) {
        const xml = await z.read(sheets[i].path); if (!xml) throw new Error('Could not read the sheet "' + sheets[i].name + '".');
        const raw = []; const rre = /<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g; let rm;
        while ((rm = rre.exec(xml))) {
          const row = []; const body = rm[1] || ''; const cre = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g; let cm;
          while ((cm = cre.exec(body))) {
            const at = cm[1], inner = cm[2] || '', ref = /\br="([A-Z]+\d+)"/.exec(at), t = /\bt="([^"]+)"/.exec(at), v = /<v>([\s\S]*?)<\/v>/.exec(inner);
            const j = ref ? colIndex(ref[1]) : row.length; let val = null;
            if (t && t[1] === 'inlineStr') val = textOf(inner);
            else if (v) { const raw_ = unesc(v[1]); if (t && t[1] === 's') val = sst[+raw_]; else if (t && (t[1] === 'str' || t[1] === 'e')) val = raw_; else if (t && t[1] === 'b') val = raw_ === '1' ? 'TRUE' : 'FALSE'; else val = parseFloat(raw_); }
            row[j] = val;
          }
          for (let q = 0; q < row.length; q++) if (row[q] === undefined) row[q] = null;
          raw.push(row);
        }
        return T.fromRows(raw, name + (sheets.length > 1 ? ' (' + sheets[i].name + ')' : ''));
      }
    };
  };

  T.toCSV = function (t) {
    const q = v => { if (v === null || v === undefined) return ''; const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return [t.cols.map(q).join(',')].concat(t.rows.map(r => r.map(q).join(','))).join('\n') + '\n';
  };

  g.TABLES = T;
  if (typeof module !== 'undefined') module.exports = T;
})(typeof window !== 'undefined' ? window : globalThis);
