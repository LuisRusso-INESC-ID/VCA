const { C, num, deg, row } = VCA;
const P = VCA.page({
  id: "ch06-hyperbolic-triangles",
  kicker: "Drag the corners of a hyperbolic triangle. Its angles always add up to less than 180°.",
  planes: [{ R: 1.15, unit: false, ticks: false }],
  explain: `
  <h2>Two maps of the hyperbolic plane</h2>
  <p>In the <b>Poincaré disc</b> the whole hyperbolic plane is the inside of the unit circle. Straight lines (geodesics) are arcs of circles that meet the boundary at right angles, and diameters. In the <b>upper half-plane</b> the geodesics are semicircles centred on the real axis, and vertical lines. The Möbius map <i>z</i> ↦ <i>i</i>(1 + <i>z</i>)/(1 − <i>z</i>) carries one model to the other. It is conformal, so angles are drawn truthfully in both.</p>
  <h2>Angle sum and area</h2>
  <p>A hyperbolic triangle with angles α, β, γ has area π − (α + β + γ) (with curvature −1). Drag the corners toward the boundary and the angles shrink toward 0 while the area approaches its maximum, π. Distances are measured by <i>d</i>(<i>p</i>, <i>q</i>) = 2 artanh |(<i>p</i> − <i>q</i>)/(1 − <span style="text-decoration:overline">p</span><i>q</i>)| and grow without bound near the edge.</p>
  <p><b>Move by isometry</b> slides the triangle with a hyperbolic translation, which is a Möbius map of the disc onto itself. The picture shrinks and distorts, but the angles, side lengths and area in the readout stay fixed.</p>`,
});
const [pl] = P.planes, ui = P.ui;
const model = ui.select("Model", [["disc", "Poincaré disc"], ["uhp", "Upper half-plane"]], "disc", setModel);
const full = ui.check("Extend sides to full geodesics", true);
const fan = ui.check("Background geodesics", true);
const toU = z => C.div(C.mul(C.I, C.add(C.ONE, z)), C.sub(C.ONE, z));
const fromU = w => C.div(C.sub(w, C.I), C.add(w, C.I));
const show = z => (model.value === "disc" ? z : toU(z));
const unshow = w => (model.value === "disc" ? w : fromU(w));
const clampD = z => { const r = C.abs(z); return r > 0.985 ? C.scale(z, 0.985 / r) : z; };
const constrain = w => model.value === "disc" ? clampD(w) : show(clampD(fromU({ x: w.x, y: Math.max(0.02, w.y) })));
const D0 = [{ x: -0.5, y: -0.35 }, { x: 0.55, y: -0.25 }, { x: 0.05, y: 0.6 }];
["p", "q", "r"].forEach((n, i) => pl.handle(n, D0[i], { color: ["c1", "c2", "c4"][i], label: ["A", "B", "C"][i], constrain }));
let D = D0.slice();
function setModel(m) {
  ["p", "q", "r"].forEach((n, i) => { pl.handles[n].p = show(D[i]); });
  if (m === "disc") pl.setView(1.15, { x: 0, y: 0 }); else pl.setView(2.4, { x: 0, y: 2.05 });
}
let u = C.polar(1, 0.6);
const iso = VCA.anim(dt => {
  const e = C.scale(u, 0.35 * dt);
  D = D.map(z => C.div(C.add(z, e), C.add(C.ONE, C.mul(C.conj(e), z))));
  if (D.some(z => C.abs(z) > 0.93)) u = C.rot(C.neg(u), 0.7);
  ["p", "q", "r"].forEach((n, i) => { pl.handles[n].p = show(D[i]); });
});
ui.toggle("Move by isometry", iso);
pl.onGrab = () => iso.stop();
ui.buttons([["Reset", () => { D = D0.slice(); setModel(model.value); }], ["Big triangle", () => { D = [C.polar(0.95, -2.4), C.polar(0.95, -0.4), C.polar(0.95, 1.6)]; setModel(model.value); }]]);

// geodesic through p, q in the disc: {o, R} circle or null for a diameter
function geo(p, q) {
  const s = C.abs(p) > 1e-3 ? C.scale(p, 1 / C.abs2(p)) : C.scale(q, 1 / C.abs2(q));
  const o = Math.abs(C.cross(p, q)) < 1e-6 ? null : C.circumcenter(p, q, s);
  return o ? { o, R: C.dist(o, p) } : null;
}
function arcPts(p, q, n = 80) {
  const g = geo(p, q);
  if (!g) return Array.from({ length: n + 1 }, (_, i) => C.lerp(p, q, i / n));
  let a0 = C.arg(C.sub(p, g.o)), a1 = C.arg(C.sub(q, g.o)), da = a1 - a0;
  while (da > Math.PI) da -= VCA.TAU; while (da < -Math.PI) da += VCA.TAU;
  return Array.from({ length: n + 1 }, (_, i) => C.add(g.o, C.polar(g.R, a0 + da * i / n)));
}
function fullGeo(p, q) {
  const g = geo(p, q);
  if (!g) { const v = C.unit(C.sub(q, p)), m = C.sub(p, C.scale(v, C.dot(p, v))); const h = Math.sqrt(Math.max(0, 1 - C.abs2(m))); return [C.sub(m, C.scale(v, h)), C.add(m, C.scale(v, h))].length && Array.from({ length: 101 }, (_, i) => C.add(C.sub(m, C.scale(v, h)), C.scale(v, 2 * h * i / 100))); }
  const pts = []; for (let i = 0; i <= 720; i++) { const z = C.add(g.o, C.polar(g.R, VCA.TAU * i / 720)); pts.push(C.abs(z) <= 1.0005 ? z : { x: NaN, y: NaN }); }
  return pts;
}
const tangent = (p, q) => { const a = arcPts(p, q, 400); return C.sub(a[1], a[0]); };
const dist = (p, q) => 2 * Math.atanh(Math.min(0.999999999, C.abs(C.div(C.sub(p, q), C.sub(C.ONE, C.mul(C.conj(p), q))))));

VCA.run(() => {
  if (!iso.running) D = ["p", "q", "r"].map(n => unshow(pl.get(n)));
  const isDisc = model.value === "disc";
  const map = pts => pts.map(show);
  if (isDisc) pl.circle(C.ZERO, 1, { color: "ink", width: 2, fill: "f6" });
  else { pl.poly([{ x: -20, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }, { x: -20, y: 20 }], { fill: "f6", width: 0 }); pl.line({ x: -20, y: 0 }, { x: 20, y: 0 }, { color: "ink", width: 2 }); }
  if (fan.value) for (let k = 0; k < 12; k++) {
    const a = C.polar(0.999, k * Math.PI / 6), b = C.polar(0.999, k * Math.PI / 6 + Math.PI * 2 / 3);
    pl.path(map(arcPts(a, b, 120)), { color: "c6", width: 1, opacity: 0.45 });
  }
  const [p, q, r] = D, sides = [[p, q, "c3"], [q, r, "c3"], [r, p, "c3"]];
  if (full.value) for (const [a, b] of sides) pl.path(map(fullGeo(a, b)), { color: "muted", width: 1.2, dash: "5 4" });
  const tri = [...arcPts(p, q), ...arcPts(q, r), ...arcPts(r, p)];
  pl.path(map(tri), { color: "c3", width: 2.8, fill: "f3", close: true });
  const ang = (v, a, b) => Math.abs(C.arg(C.div(tangent(v, b), tangent(v, a))));
  const al = ang(p, q, r), be = ang(q, r, p), ga = ang(r, p, q), sum = al + be + ga;
  P.read(row("α", "c1", deg(al)) + row("β", "c2", deg(be)) + row("γ", "c4", deg(ga)) +
    `<hr><div>Angle sum: <b>${deg(sum)}</b> &lt; 180°</div><div>Area = π − sum = <b>${num(Math.PI - sum, 3)}</b></div>` +
    `<div class="sub">Sides: AB = ${num(dist(p, q))}, BC = ${num(dist(q, r))}, CA = ${num(dist(r, p))}</div>`);
});
