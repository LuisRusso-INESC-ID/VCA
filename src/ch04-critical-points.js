const { C, num, deg, row } = VCA;
const P = VCA.page({
  id: "ch04-critical-points",
  kicker: 'At a critical point the amplitwist breaks down: angles are multiplied. Drag the direction dots.',
  planes: [{ R: 2, title: "z-plane" }, { R: 3, title: "w = f(z)" }],
  explain: `
  <h2>Where f′ = 0</h2>
  <p>Conformality needs <i>f′</i>(<i>c</i>) ≠ 0. At a <b>critical point</b>, where <i>f′</i>(<i>c</i>) = 0, the first nonzero term in the Taylor expansion is of order <i>m</i> ≥ 2:</p>
  <p style="text-align:center"><i>f</i>(<i>c</i> + ε) ≈ <i>f</i>(<i>c</i>) + <i>a</i> ε<sup><i>m</i></sup>.</p>
  <p>Locally the map behaves like <i>z<sup>m</sup></i>: angles at <i>c</i> are multiplied by <i>m</i>, and a small circle around <i>c</i> is wrapped <i>m</i> times around <i>f</i>(<i>c</i>). Move <i>c</i> slightly away from the critical point and the angle is preserved again. Very close by, though, the image of a small circle still makes a tight loop.</p>`,
});
const [zp, wp] = P.planes, ui = P.ui;
const F = {
  sq: ["z²", z => C.mul(z, z), [C.ZERO], 3],
  cube: ["z³", z => C.ipow(z, 3), [C.ZERO], 3],
  cos: ["cos z", C.cos, [C.ZERO, { x: Math.PI, y: 0 }], 2.5],
  cub: ["z³ − 3z", z => C.sub(C.ipow(z, 3), C.scale(z, 3)), [C.ONE, { x: -1, y: 0 }], 4],
};
const sel = ui.select("f(z)", Object.keys(F).map(k => [k, F[k][0]]), "sq", k => { wp.setView(F[k][3]); snap(); });
const circ = ui.check("Small circle and its image", true);
zp.handle("c", C.ZERO, { color: "c3", label: "c" });
zp.handle("d1", { x: 0.9, y: 0.25 }, { color: "c1" });
zp.handle("d2", { x: 0.45, y: 0.85 }, { color: "c2" });
let prevC = C.ZERO;
zp.onGrab = () => { prevC = zp.get("c"); };
zp.onDrag = n => {
  if (n !== "c") return;
  const c = zp.get("c"), dv = C.sub(c, prevC); prevC = c;
  zp.set("d1", C.add(zp.get("d1"), dv)); zp.set("d2", C.add(zp.get("d2"), dv));
};
function snap() { const c0 = F[sel.value][2][0], dv = C.sub(c0, zp.get("c")); zp.set("c", c0); zp.set("d1", C.add(zp.get("d1"), dv)); zp.set("d2", C.add(zp.get("d2"), dv)); }
ui.buttons([["Snap to critical point", snap], ["Nudge off", () => { const dv = { x: 0.25, y: 0.1 }; ["c", "d1", "d2"].forEach(n => zp.set(n, C.add(zp.get(n), dv))); }]]);

VCA.run(() => {
  const [name, f, crit] = F[sel.value], c = zp.get("c"), fc = f(c);
  crit.forEach(p => zp.cross(p, { color: "c5" }));
  const u1 = C.sub(zp.get("d1"), c), u2 = C.sub(zp.get("d2"), c);
  const ray = (u, col) => {
    zp.line(c, C.add(c, C.scale(u, 1.4)), { color: col, width: 2.5 });
    wp.curve(t => f(C.add(c, C.scale(u, t))), 0, 1.4, { color: col, width: 2.5, n: 200 });
  };
  ray(u1, "c1"); ray(u2, "c2");
  const angZ = Math.abs(C.arg(C.div(u2, u1)));
  const dir = u => { const h = 1e-3; return C.sub(f(C.add(c, C.scale(C.unit(u), h))), fc); };
  const angW = Math.abs(C.arg(C.div(dir(u2), dir(u1))));
  zp.arcPx(c, 34, C.arg(u1), C.arg(u1) + C.arg(C.div(u2, u1)), { color: "c3", width: 2 });
  const a1 = C.arg(dir(u1)), a2 = a1 + C.arg(C.div(dir(u2), dir(u1)));
  wp.arcPx(fc, 34, a1, a2, { color: "c3", width: 2 });
  if (circ.value) {
    const r = 0.3;
    zp.circle(c, r, { color: "c6", width: 1.5, dash: "4 3" });
    wp.curve(t => f(C.add(c, C.polar(r, t))), 0, VCA.TAU, { color: "c6", width: 1.5, n: 400 });
  }
  wp.dot(fc, { color: "c3", r: 5 });
  wp.label(fc, "f(c)", "c3", 18, C.add(fc, { x: 1, y: -1 }), { size: 16 });
  const d1 = C.deriv(f, c);
  const m = Math.round(angW / Math.max(angZ, 1e-6));
  P.read(row("f", "", `<span class="big">${name}</span>`) + row("c", "c3", C.fmt(c)) + row("f′(c)", "", C.fmt(d1, 3)) +
    `<hr><div>Angle at c: ${deg(angZ)}</div><div>Angle at f(c): ${deg(angW)}</div>` +
    `<div class="${C.abs(d1) < 0.02 ? "bad" : "ok"}">${C.abs(d1) < 0.02 ? `Critical point: angles multiplied (×${m} here, modulo 360°)` : "f′(c) ≠ 0: angle preserved"}</div>`);
});
