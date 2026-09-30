/* plot.js - minimal canvas plotting. Axis ranges are fixed by the caller and never rescale to the data. */
(function (g) {
  const INK = '#16191C', SLATE = '#5C6670', GRID = '#C9CDD2', RED = '#841617';
  const registry = [];

  class Plot {
    constructor(canvas, o) {
      this.c = canvas;
      this.o = Object.assign({ xr: [0, 1], yr: [0, 1], xl: '', yl: '', m: { l: 48, r: 12, t: 10, b: 38 }, aspect: 0.72, nx: 5, ny: 5, invY: false, fmtx: null, fmty: null, noAxes: false }, o || {});
      this.ctx = canvas.getContext('2d');
      this.onDraw = null;
      registry.push(this);
      this.fit();
    }
    fit() {
      const w = this.c.clientWidth || (this.c.parentElement && this.c.parentElement.clientWidth) || 420;
      const dpr = g.devicePixelRatio || 1;
      this.W = w; this.H = Math.round(w * this.o.aspect);
      this.c.style.height = this.H + 'px';
      this.c.width = Math.round(w * dpr); this.c.height = Math.round(this.H * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    get pw() { return this.W - this.o.m.l - this.o.m.r; }
    get ph() { return this.H - this.o.m.t - this.o.m.b; }
    x(v) { const [a, b] = this.o.xr; return this.o.m.l + (v - a) / (b - a) * this.pw; }
    y(v) {
      const [a, b] = this.o.yr, t = (v - a) / (b - a);
      return this.o.invY ? this.o.m.t + t * this.ph : this.o.m.t + (1 - t) * this.ph;
    }
    ix(px) { const [a, b] = this.o.xr; return a + (px - this.o.m.l) / this.pw * (b - a); }
    iy(py) { const [a, b] = this.o.yr; const t = this.o.invY ? (py - this.o.m.t) / this.ph : 1 - (py - this.o.m.t) / this.ph; return a + t * (b - a); }
    clear() { this.ctx.clearRect(0, 0, this.W, this.H); }
    ticks(a, b, n) {
      const span = b - a, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => s >= raw) || raw;
      const out = []; for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(10));
      return out;
    }
    fmt(v) { const a = Math.abs(v); return a >= 100 || Number.isInteger(v) ? String(Math.round(v * 100) / 100) : (+v.toFixed(2)).toString(); }
    axes() {
      const c = this.ctx, m = this.o.m;
      c.save(); c.font = '11px system-ui, sans-serif'; c.lineWidth = 1;
      if (!this.o.noAxes) {
        c.strokeStyle = GRID; c.fillStyle = SLATE; c.textAlign = 'center'; c.textBaseline = 'top';
        for (const v of this.ticks(this.o.xr[0], this.o.xr[1], this.o.nx)) {
          const X = Math.round(this.x(v)) + 0.5;
          c.beginPath(); c.moveTo(X, m.t); c.lineTo(X, m.t + this.ph); c.stroke();
          c.fillText(this.o.fmtx ? this.o.fmtx(v) : this.fmt(v), X, m.t + this.ph + 4);
        }
        c.textAlign = 'right'; c.textBaseline = 'middle';
        for (const v of this.ticks(this.o.yr[0], this.o.yr[1], this.o.ny)) {
          const Y = Math.round(this.y(v)) + 0.5;
          c.beginPath(); c.moveTo(m.l, Y); c.lineTo(m.l + this.pw, Y); c.stroke();
          c.fillText(this.o.fmty ? this.o.fmty(v) : this.fmt(v), m.l - 5, Y);
        }
        c.strokeStyle = SLATE; c.strokeRect(m.l + 0.5, m.t + 0.5, this.pw, this.ph);
        c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'bottom';
        if (this.o.xl) c.fillText(this.o.xl, m.l + this.pw / 2, this.H - 2);
        if (this.o.yl) { c.save(); c.translate(11, m.t + this.ph / 2); c.rotate(-Math.PI / 2); c.textBaseline = 'top'; c.textAlign = 'center'; c.fillText(this.o.yl, 0, -4); c.restore(); }
      }
      c.restore();
    }
    clipStart() { const c = this.ctx, m = this.o.m; c.save(); c.beginPath(); c.rect(m.l, m.t, this.pw, this.ph); c.clip(); }
    clipEnd() { this.ctx.restore(); }
    dot(x, y, r, fill, stroke, lw) {
      const c = this.ctx; c.beginPath(); c.arc(this.x(x), this.y(y), r, 0, 6.2832);
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1.2; c.stroke(); }
    }
    line(pts, color, w, dash) {
      const c = this.ctx; c.save(); c.beginPath(); c.strokeStyle = color; c.lineWidth = w || 1.5; if (dash) c.setLineDash(dash);
      pts.forEach((p, i) => { const X = this.x(p[0]), Y = this.y(p[1]); if (i) c.lineTo(X, Y); else c.moveTo(X, Y); });
      c.stroke(); c.restore();
    }
    vline(x, color, w, dash) { this.line([[x, this.o.yr[0]], [x, this.o.yr[1]]], color, w, dash); }
    hline(y, color, w, dash) { this.line([[this.o.xr[0], y], [this.o.xr[1], y]], color, w, dash); }
    rect(x0, y0, x1, y1, fill, stroke) {
      const c = this.ctx, X0 = this.x(x0), X1 = this.x(x1), Y0 = this.y(y0), Y1 = this.y(y1);
      if (fill) { c.fillStyle = fill; c.fillRect(Math.min(X0, X1), Math.min(Y0, Y1), Math.abs(X1 - X0), Math.abs(Y1 - Y0)); }
      if (stroke) { c.strokeStyle = stroke; c.strokeRect(Math.min(X0, X1), Math.min(Y0, Y1), Math.abs(X1 - X0), Math.abs(Y1 - Y0)); }
    }
    text(s, x, y, o) {
      const c = this.ctx; o = o || {}; c.save(); c.font = (o.font || '12px system-ui, sans-serif'); c.fillStyle = o.color || INK;
      c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'middle'; c.fillText(s, this.x(x), this.y(y)); c.restore();
    }
    /* pixel-space text, for labels that stay put */
    ptext(s, px, py, o) {
      const c = this.ctx; o = o || {}; c.save(); c.font = (o.font || '12px system-ui, sans-serif'); c.fillStyle = o.color || INK;
      c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'middle'; c.fillText(s, px, py); c.restore();
    }
    draw() { this.clear(); if (this.onDraw) this.onDraw(this); }
  }

  Plot.refit = function () { registry.forEach(p => { if (p.c.isConnected && p.c.clientWidth) { p.fit(); p.draw(); } }); };
  let tm; g.addEventListener('resize', () => { clearTimeout(tm); tm = setTimeout(Plot.refit, 120); });

  Plot.hex2rgba = function (h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  Plot.C = { INK, SLATE, GRID, RED };
  Plot.CLUSTER = ['#3B6FB6', '#E0703C', '#4E9F3D', '#B04A9E', '#8C6D31', '#2AA6A6', '#C4483F', '#6A6F7A'];
  g.Plot = Plot;
})(typeof window !== 'undefined' ? window : globalThis);
