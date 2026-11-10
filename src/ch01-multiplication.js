const { C, deg, num, row } = VCA;
const P = VCA.page({
  id: "ch01-multiplication",
  kicker: 'Drag <span class="k1">a</span> and <span class="k2">b</span> and watch <span class="k3">ab</span> follow.',
  planes: [{ R: 3.2, one: true }],
  explain: `
  <h2>The picture</h2>
  <p>Write <span class="m k1">a</span> = <span class="m">r e<sup>iθ</sup></span> and <span class="m k2">b</span> = <span class="m">ρ e<sup>iφ</sup></span>. Then <span class="m k3">ab</span> = <span class="m">rρ e<sup>i(θ+φ)</sup></span>: <b>lengths multiply and angles add.</b></p>
  <h2>The similar triangles</h2>
  <p>Multiplying by <span class="m k2">b</span> rotates the whole plane by φ and stretches it by ρ. It sends 1 to <span class="m k2">b</span> and <span class="m k1">a</span> to <span class="m k3">ab</span>, so the triangle 0, 1, <span class="m k1">a</span> lands on the triangle 0, <span class="m k2">b</span>, <span class="m k3">ab</span>. The two shaded triangles are always similar, which gives a ruler-and-compass construction of the product.</p>
  <h2>Things to notice</h2>
  <p>With <span class="m k1">a</span> = <i>i</i>, spinning <span class="m k2">b</span> keeps <span class="m k3">ab</span> a quarter turn ahead. On the unit circle only rotation is left; on the real axis only stretching. With <span class="m k2">b</span> = <span class="m k1">a</span> you are squaring: the angle doubles, and the arc winds a second time once it passes 2π.</p>`,
});
const [pl] = P.planes, ui = P.ui;
const A0 = { x: 1.4, y: 0.7 }, B0 = { x: 0.9, y: 1.1 };
pl.handle("a", A0, { color: "c1", label: "a" });
pl.handle("b", B0, { color: "c2", label: "b" });

ui.heading("Show");
const tri = ui.check("Similar triangles", true);
const arcs = ui.check("Angles", true);
ui.check("Snap to grid (¼)", false, v => { VCA.snap = v ? 0.25 : 0; });
ui.slider("Zoom", 1.5, 8, 0.1, 3.2, v => v.toFixed(1), v => pl.setView(v));
ui.heading("Try");
const spin = VCA.anim(dt => pl.set("b", C.rot(pl.get("b"), 0.7 * dt)), "b");
let base = 1;
const pulse = VCA.anim((dt, t) => { const b = pl.get("b"); pl.set("b", C.scale(C.unit(b), base * (1 + 0.6 * Math.sin(1.6 * t)))); }, "b");
const stopB = () => { spin.stop(); pulse.stop(); };
ui.buttons([
  ["a = i", () => pl.set("a", C.I)],
  ["a = −1", () => pl.set("a", { x: -1, y: 0 })],
  ["|a| = 1", () => pl.set("a", C.unit(pl.get("a")))],
  ["a real", () => { const a = pl.get("a"); pl.set("a", { x: (a.x < 0 ? -1 : 1) * C.abs(a), y: 0 }); }],
  ["b = a", () => { stopB(); pl.set("b", pl.get("a")); }],
  ["Reset", () => { stopB(); pl.set("a", A0); pl.set("b", B0); }],
]);
ui.toggle("Spin b", spin);
const pb = ui.toggle("Pulse |b|", pulse);
pb.addEventListener("click", () => { base = C.abs(pl.get("b")) || 1; pulse.t = 0; });
pl.onGrab = n => { if (n === "b") stopB(); };

VCA.run(() => {
  const a = pl.get("a"), b = pl.get("b"), p = C.mul(a, b);
  if (tri.value) {
    pl.poly([C.ZERO, C.ONE, a], { fill: "f1", color: "c1", width: 1, dash: "3 3", layer: "back" });
    pl.poly([C.ZERO, b, p], { fill: "f3", color: "c3", width: 1, dash: "3 3", layer: "back" });
    pl.line(C.ONE, a, { color: "c1", width: 1.4, opacity: 0.7, layer: "back" });
    pl.line(b, p, { color: "c3", width: 1.4, opacity: 0.7, layer: "back" });
  }
  const th = C.arg0(a), ph = C.arg0(b);
  if (arcs.value) {
    if (C.abs(a) > 0.05) pl.arcPx(C.ZERO, 26, 0, th, { color: "c1", width: 2.2 });
    if (C.abs(b) > 0.05) pl.arcPx(C.ZERO, 38, 0, ph, { color: "c2", width: 2.2 });
    if (C.abs(p) > 0.05) {
      pl.arcPx(C.ZERO, 52, 0, th, { color: "c1", width: 3, grow: 10, opacity: 0.85 });
      pl.arcPx(C.ZERO, 52, th, th + ph, { color: "c2", width: 3, grow: 10, opacity: 0.85 });
      const r = (52 + 10 * (th + ph) / VCA.TAU + 14) / pl.k;
      pl.text(C.polar(r, th + ph), "θ+φ", { color: "c3", size: 15, dy: 5 });
    }
  }
  pl.vec(p, { color: "c3", width: 3.2 });
  pl.vec(a, { color: "c1" });
  pl.vec(b, { color: "c2" });
  pl.label(p, "ab", "c3", 24);
  pl.dot(p, { color: "c3", r: 6 });
  pl.dot(C.ZERO, { r: 3.5 });
  const [X, Y] = pl.S(p);
  if (X < 0 || X > 600 || Y < 0 || Y > 600) pl.text(pl.W(14, 24), "ab is off-screen; zoom out", { color: "c3", anchor: "start", size: 15 });

  const ra = C.abs(a), rb = C.abs(b), sum = (th + ph) * 180 / Math.PI;
  const r = (l, k, q) => row(l, k, `${C.fmt(q)}<br><span class="sub">|·| = ${num(C.abs(q))}, arg = ${deg(C.arg0(q))}</span>`);
  P.read(r("a", "c1", a) + r("b", "c2", b) + r("ab", "c3", p) +
    `<hr><div>Lengths multiply: ${num(ra)} × ${num(rb)} = ${num(ra * rb)}</div>` +
    `<div>Angles add: ${deg(th)} + ${deg(ph)} = ${num(sum, 1)}°${sum >= 360 ? ` = ${num(sum - 360, 1)}° + 360°` : ""}</div>`);
});
