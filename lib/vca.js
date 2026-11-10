/* vca.js — shared library for interactive illustrations of
   Needham's "Visual Complex Analysis".  No dependencies.
   Complex numbers are plain objects {x, y}. */
(function (global) {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const TAU = 2 * Math.PI;

  // ------------------------------------------------------------------
  // Complex arithmetic
  // ------------------------------------------------------------------
  const C = {
    of: (x, y = 0) => ({ x, y }),
    ZERO: { x: 0, y: 0 }, ONE: { x: 1, y: 0 }, I: { x: 0, y: 1 },
    add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
    sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
    mul: (a, b) => ({ x: a.x * b.x - a.y * b.y, y: a.x * b.y + a.y * b.x }),
    div: (a, b) => { const d = b.x * b.x + b.y * b.y; return { x: (a.x * b.x + a.y * b.y) / d, y: (a.y * b.x - a.x * b.y) / d }; },
    scale: (a, k) => ({ x: a.x * k, y: a.y * k }),
    neg: a => ({ x: -a.x, y: -a.y }),
    conj: a => ({ x: a.x, y: -a.y }),
    abs: a => Math.hypot(a.x, a.y),
    abs2: a => a.x * a.x + a.y * a.y,
    arg: a => Math.atan2(a.y, a.x),
    arg0: a => { const t = Math.atan2(a.y, a.x); return t < 0 ? t + TAU : t; },
    polar: (r, t) => ({ x: r * Math.cos(t), y: r * Math.sin(t) }),
    unit: a => { const r = Math.hypot(a.x, a.y) || 1; return { x: a.x / r, y: a.y / r }; },
    exp: a => { const r = Math.exp(a.x); return { x: r * Math.cos(a.y), y: r * Math.sin(a.y) }; },
    log: a => ({ x: Math.log(Math.hypot(a.x, a.y)), y: Math.atan2(a.y, a.x) }),
    pow: (a, n) => { if (a.x === 0 && a.y === 0) return { x: 0, y: 0 }; const r = Math.pow(Math.hypot(a.x, a.y), n), t = n * Math.atan2(a.y, a.x); return { x: r * Math.cos(t), y: r * Math.sin(t) }; },
    ipow: (a, n) => { let r = { x: 1, y: 0 }; for (let k = 0; k < Math.abs(n); k++) r = C.mul(r, a); return n < 0 ? C.div({ x: 1, y: 0 }, r) : r; },
    cpow: (a, b) => C.exp(C.mul(b, C.log(a))),
    sqrt: a => C.pow(a, 0.5),
    sin: a => ({ x: Math.sin(a.x) * Math.cosh(a.y), y: Math.cos(a.x) * Math.sinh(a.y) }),
    cos: a => ({ x: Math.cos(a.x) * Math.cosh(a.y), y: -Math.sin(a.x) * Math.sinh(a.y) }),
    inv: a => C.div({ x: 1, y: 0 }, a),
    rot: (a, t) => C.mul(a, C.polar(1, t)),
    lerp: (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }),
    dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    dot: (a, b) => a.x * b.x + a.y * b.y,
    cross: (a, b) => a.x * b.y - a.y * b.x,
    ok: a => a && isFinite(a.x) && isFinite(a.y),
    // derivative of an analytic f by central difference
    deriv: (f, z, h = 1e-5) => C.scale(C.sub(f({ x: z.x + h, y: z.y }), f({ x: z.x - h, y: z.y })), 1 / (2 * h)),
    // partial derivatives (for non-analytic maps)
    dx: (f, z, h = 1e-5) => C.scale(C.sub(f({ x: z.x + h, y: z.y }), f({ x: z.x - h, y: z.y })), 1 / (2 * h)),
    dy: (f, z, h = 1e-5) => C.scale(C.sub(f({ x: z.x, y: z.y + h }), f({ x: z.x, y: z.y - h })), 1 / (2 * h)),
    // circumcentre of three points (null if collinear)
    circumcenter: (a, b, c) => {
      const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
      if (Math.abs(d) < 1e-12) return null;
      const A = C.abs2(a), B = C.abs2(b), Cc = C.abs2(c);
      return { x: (A * (b.y - c.y) + B * (c.y - a.y) + Cc * (a.y - b.y)) / d, y: (A * (c.x - b.x) + B * (a.x - c.x) + Cc * (b.x - a.x)) / d };
    },
  };
  const num = (v, d = 2) => { if (!isFinite(v)) return v > 0 ? "∞" : v < 0 ? "−∞" : "—"; const s = v.toFixed(d); return (/^-0\.?0*$/.test(s) ? s.slice(1) : s).replace("-", "−"); };
  C.fmt = (a, d = 2) => {
    if (!C.ok(a)) return "∞";
    const re = num(a.x, d), imAbs = num(Math.abs(a.y), d);
    const neg = a.y < 0 && imAbs !== num(0, d);
    return `${re} ${neg ? "−" : "+"} ${imAbs}i`;
  };
  C.fmtPolar = (a, d = 2) => `${num(C.abs(a), d)} · e<sup>i ${num(C.arg(a) * 180 / Math.PI, 1)}°</sup>`;
  const deg = (t, d = 1) => num(t * 180 / Math.PI, d) + "°";

  // ------------------------------------------------------------------
  // SVG helpers
  // ------------------------------------------------------------------
  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const NAMED = /^(c[1-6]|f[1-6]|ink|muted|axis|grid|paper|bg|border)$/;
  const col = c => (c == null ? c : NAMED.test(c) ? `var(--${c})` : c);
  const f2 = v => (Math.round(v * 100) / 100).toString();

  // ------------------------------------------------------------------
  // Plane: an SVG view of a region of the complex plane
  // ------------------------------------------------------------------
  class Plane {
    constructor(host, o = {}) {
      this.size = 600;
      this.R = o.R || 3;
      this.cx = (o.center && o.center.x) || 0;
      this.cy = (o.center && o.center.y) || 0;
      this.o = Object.assign({ grid: true, axes: true, unit: true, ticks: true, one: false }, o);
      const box = document.createElement("div");
      box.className = "planebox";
      host.appendChild(box);
      this.box = box;
      this.svg = el("svg", { viewBox: `0 0 ${this.size} ${this.size}`, class: "plane" }, box);
      if (o.title) { const t = document.createElement("div"); t.className = "ptitle"; t.innerHTML = o.title; box.appendChild(t); }
      this.gGrid = el("g", null, this.svg);
      this.gBack = el("g", null, this.svg);
      this.gMain = el("g", null, this.svg);
      this.gFront = el("g", null, this.svg);
      this.gHand = el("g", null, this.svg);
      this.handles = {};
      this.dragging = null;
      this.onFree = null;    // callback(type, worldPoint) for drags that miss every handle
      this._bindPointer();
      this.drawGrid();
    }
    get k() { return this.size / 2 / this.R; }
    X(x) { return this.size / 2 + (x - this.cx) * this.k; }
    Y(y) { return this.size / 2 - (y - this.cy) * this.k; }
    S(p) { return [this.X(p.x), this.Y(p.y)]; }
    W(sx, sy) { return { x: this.cx + (sx - this.size / 2) / this.k, y: this.cy - (sy - this.size / 2) / this.k }; }
    get bounds() { return { x0: this.cx - this.R, x1: this.cx + this.R, y0: this.cy - this.R, y1: this.cy + this.R }; }
    setView(R, center) {
      if (R) this.R = R;
      if (center) { this.cx = center.x; this.cy = center.y; }
      this.drawGrid();
    }
    drawGrid() {
      const g = this.gGrid; g.innerHTML = "";
      const o = this.o, s = this.size;
      if (o.grid) {
        const major = [0.25, 0.5, 1, 2, 5, 10, 20, 50].find(v => v >= this.R / 4) || 100;
        const minor = major / 2;
        const b = this.bounds;
        for (let v = Math.ceil(b.x0 / minor) * minor; v <= b.x1 + 1e-9; v += minor) {
          const isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6;
          el("line", { x1: this.X(v), y1: 0, x2: this.X(v), y2: s, stroke: col("grid"), "stroke-width": isMaj ? 1.2 : 0.6 }, g);
        }
        for (let v = Math.ceil(b.y0 / minor) * minor; v <= b.y1 + 1e-9; v += minor) {
          const isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6;
          el("line", { x1: 0, y1: this.Y(v), x2: s, y2: this.Y(v), stroke: col("grid"), "stroke-width": isMaj ? 1.2 : 0.6 }, g);
        }
        if (o.axes) {
          el("line", { x1: 0, y1: this.Y(0), x2: s, y2: this.Y(0), stroke: col("axis"), "stroke-width": 1.3 }, g);
          el("line", { x1: this.X(0), y1: 0, x2: this.X(0), y2: s, stroke: col("axis"), "stroke-width": 1.3 }, g);
        }
        if (o.ticks) {
          const lab = v => { const t = Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : String(+v.toFixed(2)); return t.replace("-", "−"); };
          for (let v = Math.ceil(b.x0 / major) * major; v <= b.x1 + 1e-9; v += major) {
            if (Math.abs(v) < 1e-9) continue;
            const t = el("text", { x: this.X(v), y: Math.min(s - 4, Math.max(14, this.Y(0) + 16)), "text-anchor": "middle", "font-size": 13, fill: col("muted") }, g);
            t.textContent = lab(v);
          }
          for (let v = Math.ceil(b.y0 / major) * major; v <= b.y1 + 1e-9; v += major) {
            if (Math.abs(v) < 1e-9) continue;
            const x = Math.min(s - 4, Math.max(30, this.X(0) - 6));
            const t = el("text", { x, y: this.Y(v) + 4, "text-anchor": "end", "font-size": 13, fill: col("muted"), "font-style": "italic" }, g);
            const L = lab(v); t.textContent = o.realY ? L : (L === "1" ? "" : L === "−1" ? "−" : L) + "i";
          }
        }
      }
      if (o.unit) el("circle", { cx: this.X(0), cy: this.Y(0), r: this.k, fill: "none", stroke: col("axis"), "stroke-width": 1, "stroke-dasharray": "4 4" }, g);
      if (o.one) {
        el("circle", { cx: this.X(1), cy: this.Y(0), r: 3.5, fill: col("ink") }, g);
        const t = el("text", { x: this.X(1) + 5, y: this.Y(0) - 7, "font-size": 16, "font-weight": 600, fill: col("ink") }, g); t.textContent = "1";
      }
    }
    clear() { this.gBack.innerHTML = ""; this.gMain.innerHTML = ""; this.gFront.innerHTML = ""; }
    _layer(s) { return s && s.layer === "back" ? this.gBack : s && s.layer === "front" ? this.gFront : this.gMain; }
    _st(s = {}, fillDefault = "none") {
      return {
        stroke: s.stroke === undefined ? col(s.color || "ink") : col(s.stroke),
        "stroke-width": s.width == null ? 2 : s.width,
        fill: s.fill === undefined ? fillDefault : col(s.fill),
        "stroke-dasharray": s.dash, opacity: s.opacity,
        "stroke-linecap": "round", "stroke-linejoin": "round",
      };
    }
    // ---- screen-space primitives ----
    spath(d, s) { return el("path", Object.assign({ d }, this._st(s)), this._layer(s)); }
    // world polyline that breaks at non-finite points and big jumps (poles, branch cuts)
    _d(pts, close, jump) {
      const lim = this.size * 6, J = jump == null ? this.size * 0.35 : jump;
      let d = "", pen = false, px = 0, py = 0;
      for (const p of pts) {
        if (!C.ok(p)) { pen = false; continue; }
        const X = this.X(p.x), Y = this.Y(p.y);
        if (Math.abs(X) > lim || Math.abs(Y) > lim) { pen = false; continue; }
        if (pen && Math.hypot(X - px, Y - py) > J) pen = false;
        d += (pen ? "L" : "M") + f2(X) + "," + f2(Y);
        pen = true; px = X; py = Y;
      }
      if (close && d) d += "Z";
      return d;
    }
    path(pts, s = {}) { return this.spath(this._d(pts, s.close, s.jump), s); }
    poly(pts, s = {}) { return this.spath(this._d(pts, true, Infinity), Object.assign({ fill: "none" }, s)); }
    curve(f, t0, t1, s = {}) {
      const n = s.n || 240, pts = [];
      for (let i = 0; i <= n; i++) pts.push(f(t0 + (t1 - t0) * i / n));
      return this.path(pts, s);
    }
    // many segments [[p,q],...] in one path element; optional map applied to each point
    segs(list, s = {}, map) {
      let d = "";
      const lim = this.size * 6, J = s.jump == null ? this.size * 0.35 : s.jump;
      for (const [p0, q0] of list) {
        const p = map ? map(p0) : p0, q = map ? map(q0) : q0;
        if (!C.ok(p) || !C.ok(q)) continue;
        const X1 = this.X(p.x), Y1 = this.Y(p.y), X2 = this.X(q.x), Y2 = this.Y(q.y);
        if (Math.abs(X1) > lim || Math.abs(Y1) > lim || Math.abs(X2) > lim || Math.abs(Y2) > lim) continue;
        if (Math.hypot(X2 - X1, Y2 - Y1) > J) continue;
        d += `M${f2(X1)},${f2(Y1)}L${f2(X2)},${f2(Y2)}`;
      }
      return this.spath(d, s);
    }
    line(p, q, s = {}) { return this.path([p, q], Object.assign({ jump: Infinity }, s)); }
    // infinite line through p in direction v
    fullLine(p, v, s = {}) { const L = this.R * 6 / (C.abs(v) || 1); return this.line(C.sub(p, C.scale(v, L)), C.add(p, C.scale(v, L)), s); }
    circle(c, r, s = {}) {
      return el("circle", Object.assign({ cx: f2(this.X(c.x)), cy: f2(this.Y(c.y)), r: f2(Math.abs(r) * this.k) }, this._st(s)), this._layer(s));
    }
    dot(p, s = {}) {
      if (!C.ok(p)) return;
      return el("circle", Object.assign({ cx: f2(this.X(p.x)), cy: f2(this.Y(p.y)), r: s.r || 4 }, this._st(Object.assign({ width: s.width || 0, fill: s.fill || s.color || "ink" }, s), col(s.color || "ink"))), this._layer(s));
    }
    cross(p, s = {}) {
      const [X, Y] = this.S(p), r = s.r || 6;
      return this.spath(`M${X - r},${Y - r}L${X + r},${Y + r}M${X - r},${Y + r}L${X + r},${Y - r}`, Object.assign({ width: 2.5 }, s));
    }
    arrow(p, q, s = {}) {
      if (!C.ok(p) || !C.ok(q)) return;
      const [X1, Y1] = this.S(p), [X2, Y2] = this.S(q);
      const len = Math.hypot(X2 - X1, Y2 - Y1);
      if (len < 1.5) return;
      const ux = (X2 - X1) / len, uy = (Y2 - Y1) / len;
      const h = Math.min(s.head || 11, len * 0.45), w = h * 0.45;
      const bx = X2 - ux * h, by = Y2 - uy * h;
      const L = this._layer(s), c = col(s.color || "ink");
      el("line", { x1: f2(X1), y1: f2(Y1), x2: f2(bx), y2: f2(by), stroke: c, "stroke-width": s.width || 2.4, "stroke-linecap": "round", opacity: s.opacity, "stroke-dasharray": s.dash }, L);
      el("polygon", { points: `${f2(X2)},${f2(Y2)} ${f2(bx - uy * w)},${f2(by + ux * w)} ${f2(bx + uy * w)},${f2(by - ux * w)}`, fill: c, opacity: s.opacity }, L);
    }
    vec(q, s) { return this.arrow(C.ZERO, q, s); }
    text(p, str, s = {}) {
      if (!C.ok(p)) return;
      const t = el("text", {
        x: f2(this.X(p.x) + (s.dx || 0)), y: f2(this.Y(p.y) + (s.dy || 0)),
        "text-anchor": s.anchor || "middle", "font-size": s.size || 17,
        "font-style": s.italic === false ? "normal" : "italic", "font-weight": s.bold ? 600 : 400,
        fill: col(s.color || "ink"), stroke: s.halo === false ? null : col("paper"), "stroke-width": s.halo === false ? null : 4, "paint-order": "stroke",
        opacity: s.opacity,
      }, this._layer(Object.assign({ layer: "front" }, s)));
      t.innerHTML = str;
      return t;
    }
    // label placed just outside p, away from `from` (default origin)
    label(p, str, color, off = 18, from = C.ZERO, s = {}) {
      if (!C.ok(p)) return;
      let v = C.sub(p, from); const L = C.abs(v);
      v = L < 1e-9 ? { x: 0.7, y: 0.7 } : C.scale(v, 1 / L);
      return this.text(p, str, Object.assign({ color, dx: v.x * off, dy: -v.y * off + 6, size: 21, bold: true }, s));
    }
    // arc with world radius
    arc(c, r, t0, t1, s = {}) { return this.curve(t => C.add(c, C.polar(r, t)), t0, t1, Object.assign({ n: Math.max(12, Math.ceil(Math.abs(t1 - t0) / 0.03)), jump: Infinity }, s)); }
    // arc with screen radius (px); grow = px added per full turn (spiral)
    arcPx(c, rpx, t0, t1, s = {}) {
      const [X, Y] = this.S(c), grow = s.grow || 0;
      const n = Math.max(8, Math.ceil(Math.abs(t1 - t0) / 0.04));
      let d = "";
      for (let i = 0; i <= n; i++) {
        const t = t0 + (t1 - t0) * i / n, r = rpx + grow * (t / TAU);
        d += (i ? "L" : "M") + f2(X + r * Math.cos(t)) + "," + f2(Y - r * Math.sin(t));
      }
      return this.spath(d, s);
    }
    // ---- draggable handles ----
    handle(name, p, o = {}) {
      this.handles[name] = { p: { x: p.x, y: p.y }, color: o.color || "c1", r: o.r || 8, constrain: o.constrain, label: o.label, hidden: false };
      return this.handles[name];
    }
    get(name) { return this.handles[name].p; }
    set(name, p) { const h = this.handles[name]; h.p = h.constrain ? h.constrain({ x: p.x, y: p.y }) : { x: p.x, y: p.y }; }
    drawHandles() {
      const g = this.gHand; g.innerHTML = "";
      for (const name in this.handles) {
        const h = this.handles[name]; if (h.hidden) continue;
        const [X, Y] = this.S(h.p);
        el("circle", { cx: f2(X), cy: f2(Y), r: h.r + 1, fill: col(h.color), stroke: col("paper"), "stroke-width": 2.5, style: "cursor:grab" }, g);
        if (h.label) {
          const t = el("text", { x: f2(X + 12), y: f2(Y - 10), "font-size": 20, "font-style": "italic", "font-weight": 600, fill: col(h.color), stroke: col("paper"), "stroke-width": 4, "paint-order": "stroke" }, g);
          t.innerHTML = h.label;
        }
      }
    }
    _svgPoint(e) {
      const pt = this.svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(this.svg.getScreenCTM().inverse());
    }
    _bindPointer() {
      const svg = this.svg;
      let free = false;
      svg.addEventListener("pointerdown", e => {
        const sp = this._svgPoint(e);
        let best = null, bd = 30;
        for (const name in this.handles) {
          const h = this.handles[name]; if (h.hidden) continue;
          const [X, Y] = this.S(h.p), d = Math.hypot(X - sp.x, Y - sp.y);
          if (d < bd) { bd = d; best = name; }
        }
        if (best) { this.dragging = best; if (this.onGrab) this.onGrab(best); }
        else if (this.onFree) { free = true; this.onFree("down", this.W(sp.x, sp.y)); VCA.update(); }
        else return;
        svg.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      svg.addEventListener("pointermove", e => {
        if (!this.dragging && !free) return;
        const sp = this._svgPoint(e);
        const w = this.W(Math.max(0, Math.min(this.size, sp.x)), Math.max(0, Math.min(this.size, sp.y)));
        if (this.dragging) {
          let p = w;
          if (VCA.snap) p = { x: Math.round(p.x / VCA.snap) * VCA.snap, y: Math.round(p.y / VCA.snap) * VCA.snap };
          this.set(this.dragging, p);
          if (this.onDrag) this.onDrag(this.dragging);
        } else this.onFree("move", w);
        VCA.update();
      });
      const end = () => {
        if (free && this.onFree) { this.onFree("up"); VCA.update(); }
        this.dragging = null; free = false;
      };
      svg.addEventListener("pointerup", end);
      svg.addEventListener("pointercancel", end);
    }
  }

  // ------------------------------------------------------------------
  // Contours of a real function on a grid (marching squares)
  // returns list of segments [[p,q],...]
  // ------------------------------------------------------------------
  function contours(fn, b, nx, ny, levels, maxJump = Infinity, mask) {
    const dx = (b.x1 - b.x0) / nx, dy = (b.y1 - b.y0) / ny;
    const V = new Float64Array((nx + 1) * (ny + 1));
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const p = { x: b.x0 + i * dx, y: b.y0 + j * dy };
      V[j * (nx + 1) + i] = mask && mask(p) ? NaN : fn(p);
    }
    const out = [];
    const interp = (p, q, vp, vq, L) => { const t = (L - vp) / (vq - vp); return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }; };
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = V[j * (nx + 1) + i], bb = V[j * (nx + 1) + i + 1], c = V[(j + 1) * (nx + 1) + i + 1], d = V[(j + 1) * (nx + 1) + i];
      if (!(isFinite(a) && isFinite(bb) && isFinite(c) && isFinite(d))) continue;
      const mx = Math.max(a, bb, c, d), mn = Math.min(a, bb, c, d);
      if (mx - mn > maxJump) continue;
      const P = [{ x: b.x0 + i * dx, y: b.y0 + j * dy }, { x: b.x0 + (i + 1) * dx, y: b.y0 + j * dy }, { x: b.x0 + (i + 1) * dx, y: b.y0 + (j + 1) * dy }, { x: b.x0 + i * dx, y: b.y0 + (j + 1) * dy }];
      const v = [a, bb, c, d];
      for (const L of levels) {
        if (L < mn || L > mx) continue;
        const pts = [];
        for (let e = 0; e < 4; e++) {
          const v0 = v[e], v1 = v[(e + 1) % 4];
          if ((v0 < L) !== (v1 < L)) pts.push(interp(P[e], P[(e + 1) % 4], v0, v1, L));
        }
        if (pts.length === 2) out.push([pts[0], pts[1]]);
        else if (pts.length === 4) { out.push([pts[0], pts[1]]); out.push([pts[2], pts[3]]); }
      }
    }
    return out;
  }

  // winding number of a closed polyline around p
  function winding(pts, p) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = C.sub(pts[i], p), b = C.sub(pts[(i + 1) % pts.length], p);
      s += Math.atan2(C.cross(a, b), C.dot(a, b));
    }
    return Math.round(s / TAU);
  }

  // ------------------------------------------------------------------
  // Controls
  // ------------------------------------------------------------------
  class UI {
    constructor(host) { this.host = host; }
    _add(html, tag = "div", cls) { const d = document.createElement(tag); if (cls) d.className = cls; d.innerHTML = html; this.host.appendChild(d); return d; }
    heading(text) { this._add(text, "h2"); }
    note(html) { return this._add(html, "div", "note"); }
    check(label, v = false, onChange) {
      const d = this._add(`<input type="checkbox"${v ? " checked" : ""}> <span>${label}</span>`, "label", "chk");
      const inp = d.querySelector("input"), o = { get value() { return inp.checked; }, set value(x) { inp.checked = !!x; } };
      inp.addEventListener("change", () => { if (onChange) onChange(inp.checked); VCA.update(); });
      return o;
    }
    slider(label, min, max, step, v, fmt, onChange) {
      const d = this._add(`<span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${v}"><span class="v"></span>`, "div", "sl");
      const inp = d.querySelector("input"), out = d.querySelector(".v");
      const show = () => { out.textContent = fmt ? fmt(+inp.value) : (+inp.value).toString(); };
      show();
      const o = { get value() { return +inp.value; }, set value(x) { inp.value = x; show(); } };
      inp.addEventListener("input", () => { show(); if (onChange) onChange(+inp.value); VCA.update(); });
      return o;
    }
    select(label, options, v, onChange) {
      const opts = options.map(o => Array.isArray(o) ? o : [o, o]);
      const d = this._add(`<span>${label}</span><select>${opts.map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select>`, "div", "sel");
      const s = d.querySelector("select"); if (v !== undefined) s.value = v;
      const o = { get value() { return s.value; }, set value(x) { s.value = x; } };
      s.addEventListener("change", () => { if (onChange) onChange(s.value); VCA.update(); });
      return o;
    }
    buttons(list) {
      const d = this._add("", "div", "btns");
      return list.map(([text, fn]) => {
        const b = document.createElement("button"); b.innerHTML = text;
        b.addEventListener("click", () => { fn(b); VCA.update(); });
        d.appendChild(b); return b;
      });
    }
    // play/pause button bound to an animation
    toggle(text, anim) {
      const [b] = this.buttons([["▶ " + text, () => { anim.running ? anim.stop() : anim.start(); }]]);
      anim._btn = b; anim._text = text;
      return b;
    }
  }

  // animation: step(dt, t) is called every frame while running
  const anims = [];
  function anim(step, group) {
    const a = {
      running: false, t: 0, step, group,
      start() {
        if (group) anims.forEach(o => { if (o !== a && o.group === group) o.stop(); });
        if (a.running) return; a.running = true; let last = null;
        if (a._btn) { a._btn.classList.add("on"); a._btn.innerHTML = "❚❚ " + a._text; }
        const tick = ts => {
          if (!a.running) return;
          const dt = last == null ? 0 : Math.min(0.05, (ts - last) / 1000); last = ts; a.t += dt;
          a.step(dt, a.t); VCA.update(true);
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      stop() { a.running = false; if (a._btn) { a._btn.classList.remove("on"); a._btn.innerHTML = "▶ " + a._text; } },
    };
    anims.push(a);
    return a;
  }

  // ------------------------------------------------------------------
  // Site index
  // ------------------------------------------------------------------
  const CHAPTERS = [
    [1, "Geometry and Complex Arithmetic"],
    [2, "Complex Functions as Transformations"],
    [3, "Möbius Transformations and Inversion"],
    [4, "Differentiation: The Amplitwist Concept"],
    [5, "Further Geometry of Differentiation"],
    [6, "Non-Euclidean Geometry"],
    [7, "Winding Numbers and Topology"],
    [8, "Complex Integration: Cauchy's Theorem"],
    [9, "Cauchy's Formula and Its Applications"],
    [10, "Vector Fields: Physics and Topology"],
    [11, "Vector Fields and Complex Integration"],
    [12, "Flows and Harmonic Functions"],
  ];
  const PAGES = [
    ["ch01-multiplication", 1, "Multiplication as rotation and scaling", "Lengths multiply, angles add; the similar-triangle construction."],
    ["ch01-quadrilateral", 1, "Squares on a quadrilateral", "Centres of opposite squares: equal, perpendicular segments (cf. Fig. 1.12)."],
    ["ch01-euler", 1, "Euler's formula as a limit", "(1 + iθ/n)ⁿ spirals onto the unit circle at e^{iθ}."],
    ["ch01-powers-roots", 1, "Powers, spirals and roots", "Integer powers trace an equiangular spiral; n-th roots form a regular polygon."],
    ["ch02-mapper", 2, "Functions as transformations", "Watch z², 1/z, e^z, sin z … warp a grid."],
    ["ch02-multifunctions", 2, "Multifunctions and branch points", "Loop around 0 and √z, ∛z or log z changes branch."],
    ["ch02-power-series", 2, "Power series as spirals of vectors", "Partial sums head to tail; the disc of convergence."],
    ["ch03-inversion", 3, "Inversion in a circle", "Circles and lines go to circles and lines."],
    ["ch03-riemann-sphere", 3, "The Riemann sphere", "Stereographic projection sends circles to circles."],
    ["ch03-mobius-flows", 3, "Möbius transformations: the four types", "Elliptic, hyperbolic, loxodromic flows and Steiner circles."],
    ["ch03-mobius-three-points", 3, "A Möbius map from three points", "Send 0, 1, ∞ anywhere; see the grid follow."],
    ["ch04-amplitwist", 4, "The amplitwist", "Locally, an analytic map is a rotation and a scaling."],
    ["ch04-critical-points", 4, "Critical points", "Where f′ = 0, angles are multiplied."],
    ["ch05-kasner-arnold", 5, "Hooke meets Kepler", "z² carries centred ellipses to ellipses with a focus at 0."],
    ["ch05-analytic-continuation", 5, "Analytic continuation", "A chain of discs carries log around 0 and up by 2πi."],
    ["ch06-hyperbolic-triangles", 6, "Hyperbolic triangles", "Poincaré disc and half-plane; angle sum and area."],
    ["ch07-winding-number", 7, "Winding numbers", "Draw a loop; the plane is coloured by winding number."],
    ["ch07-argument-principle", 7, "The argument principle", "The image loop winds once per root inside."],
    ["ch08-riemann-sums", 8, "Complex integration as Riemann sums", "f(z)Δz arrows head to tail; path (in)dependence."],
    ["ch09-cauchy-formula", 9, "Cauchy's integral formula", "Values on a circle determine the inside."],
    ["ch09-taylor-radius", 9, "Radius of convergence", "Why 1/(1+x²) has radius 1: the hidden poles at ±i."],
    ["ch10-vector-field-index", 10, "Index of a vector field", "Zeros of a field and the winding of the field along a loop."],
    ["ch11-polya-field", 11, "The Pólya vector field", "∮ f dz = work + i·flux."],
    ["ch12-flows", 12, "Ideal fluid flows", "Complex potentials: sources, vortices, flow past a cylinder."],
    ["ch12-joukowski", 12, "The Joukowski airfoil", "z + 1/z maps a circle to a wing, with Kutta flow."],
  ];

  const REPO = "https://github.com/LuisRusso-INESC-ID/VCA";

  // ------------------------------------------------------------------
  // Page scaffold
  // ------------------------------------------------------------------
  const planes = [];
  let drawFn = null, pending = false;
  const VCA = {
    C, TAU, num, deg, el, col, Plane, UI, anim, contours, winding, CHAPTERS, PAGES, snap: 0,
    update(sync) {
      if (sync === true) return VCA._render();
      if (pending) return; pending = true;
      requestAnimationFrame(() => { pending = false; VCA._render(); });
    },
    _render() {
      if (!drawFn) return;
      planes.forEach(p => p.clear());
      drawFn();
      planes.forEach(p => p.drawHandles());
    },
    run(fn) { drawFn = fn; VCA._render(); },
    // html helpers for readouts
    row: (lab, k, html) => `<div class="row"><span class="lab ${k ? "k" + k.slice(1) : ""}">${lab}</span><span>${html}</span></div>`,
    page(cfg) {
      const idx = PAGES.findIndex(p => p[0] === cfg.id);
      const info = PAGES[idx] || [cfg.id, 0, cfg.title || "", ""];
      const ch = CHAPTERS.find(c => c[0] === info[1]);
      const title = cfg.title || info[2];
      document.title = `${title} — Visual Complex Analysis`;
      const prev = PAGES[idx - 1], next = PAGES[idx + 1];
      const link = (p, t) => p ? `<a href="${p[0]}.html">${t}</a>` : "<span></span>";
      const navHtml = `${link(prev, "← " + (prev ? prev[2] : ""))}<a href="index.html">Contents</a>${link(next, (next ? next[2] : "") + " →")}`;
      const main = document.createElement("main");
      main.innerHTML = `
        <nav class="top">${link(prev, "← Prev")}<span class="mid">Chapter ${info[1]}${ch ? " · " + ch[1] : ""}</span><span><a href="index.html">Contents</a>${next ? " · " + link(next, "Next →") : ""}</span></nav>
        <header><h1>${title}</h1><p class="kicker">${cfg.kicker || info[3]}</p></header>
        <div class="layout${(cfg.planes || []).length > 1 ? " wide" : ""}">
          <div class="stage${(cfg.planes || []).length > 1 ? " two" : ""}"></div>
          <aside><div class="panel"><div class="readout"></div></div><div class="panel controls"></div></aside>
        </div>
        <section class="explain">${cfg.explain || ""}</section>
        <footer><nav>${navHtml}</nav>Interactive illustration after T. Needham, <i>Visual Complex Analysis</i> (Oxford University Press), Chapter ${info[1]}. <a href="${REPO}">Source on GitHub</a>.</footer>`;
      document.body.appendChild(main);
      const stage = main.querySelector(".stage");
      const ps = (cfg.planes || [{}]).map(o => { const p = new Plane(stage, o); planes.push(p); return p; });
      const ro = main.querySelector(".readout");
      if (cfg.noReadout) ro.parentElement.style.display = "none";
      try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { ps.forEach(p => p.drawGrid()); VCA.update(); }); } catch (e) {}
      return { planes: ps, ui: new UI(main.querySelector(".controls")), read: html => { ro.innerHTML = html; }, main };
    },
    contents() {
      const main = document.createElement("main");
      let html = `<header><h1>Visual Complex Analysis — interactive illustrations</h1>
        <p class="kicker">Drag the coloured dots on each page. Built on one small shared library (lib/vca.js), following the chapters of Tristan Needham's book.</p></header><div class="toc">`;
      for (const [n, t] of CHAPTERS) {
        const ps = PAGES.filter(p => p[1] === n);
        html += `<section><h2><span>${n}.</span> ${t}</h2><ul>${ps.map(p => `<li><a href="${p[0]}.html">${p[2]}</a><br><span class="d">${p[3]}</span></li>`).join("")}</ul></section>`;
      }
      html += `</div><footer>Concept illustrations after T. Needham, <i>Visual Complex Analysis</i> (Oxford University Press). Figure references are approximate. <a href="${REPO}">Source on GitHub</a>.</footer>`;
      main.innerHTML = html;
      document.body.appendChild(main);
    },
  };
  global.VCA = VCA;
})(window);
