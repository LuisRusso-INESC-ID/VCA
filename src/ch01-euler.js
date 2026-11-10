const { C, num, deg, row } = VCA;
const P = VCA.page({
  id: "ch01-euler",
  kicker: "Compound the tiny step 1 + iθ/n, n times. The result spirals onto the unit circle at angle θ.",
  planes: [{ R: 1.6, one: true }],
  explain: `
  <h2>Why e<sup>iθ</sup> lies on the unit circle</h2>
  <p>Since e<sup>x</sup> = lim (1 + x/n)<sup>n</sup>, it is natural to define e<sup>iθ</sup> = lim (1 + iθ/n)<sup>n</sup>. The number 1 + iθ/n sits just above 1: it has length √(1 + θ²/n²) ≈ 1 and angle ≈ θ/n. Raising it to the n-th power multiplies the angles, giving total angle ≈ θ, while the length (1 + θ²/n²)<sup>n/2</sup> tends to 1.</p>
  <p>Geometrically, each multiplication adds a thin right triangle to the previous point, as in Needham's figure. As <i>n</i> grows the polygon hugs the unit circle, and its end point arrives at cos θ + i sin θ. The arc length walked is θ, so θ really is an angle in radians.</p>
  <h2>Try</h2>
  <p>Set θ = π and increase <i>n</i> to watch e<sup>iπ</sup> = −1 appear. With small <i>n</i>, the spiral overshoots the circle.</p>`,
});
const [pl] = P.planes, ui = P.ui;
const nS = ui.slider("n", 1, 100, 1, 6);
const tS = ui.slider("θ", 0, 6.283, 0.01, Math.PI, v => num(v, 2));
ui.buttons([["θ = π/2", () => { tS.value = Math.PI / 2; }], ["θ = π", () => { tS.value = Math.PI; }], ["θ = 2π", () => { tS.value = 2 * Math.PI; }]]);
const grow = VCA.anim(dt => { nS.value = Math.min(100, nS.value + 1); if (nS.value >= 100) grow.stop(); });
let acc = 0;
grow.step = dt => { acc += dt; if (acc > 0.12) { acc = 0; nS.value = nS.value >= 100 ? 1 : nS.value + 1; } };
ui.toggle("Increase n", grow);
const tri = ui.check("Show right triangles", true);

VCA.run(() => {
  const n = nS.value, th = tS.value, step = { x: 1, y: th / n };
  const pts = [C.ONE];
  for (let k = 0; k < n; k++) pts.push(C.mul(pts[k], step));
  if (tri.value && n <= 40) for (let k = 0; k < n; k++) {
    pl.poly([C.ZERO, pts[k], pts[k + 1]], { color: "c1", width: 0.6, fill: k % 2 ? "f1" : "f6", layer: "back" });
  }
  pl.arc(C.ZERO, 1, 0, th, { color: "c4", width: 3, opacity: 0.6 });
  pl.path(pts, { color: "c1", width: 2.2 });
  if (n <= 60) pts.forEach(p => pl.dot(p, { color: "c1", r: 2.6 }));
  const e = C.polar(1, th), end = pts[n];
  pl.dot(e, { color: "c4", r: 6 });
  pl.label(e, "e<tspan baseline-shift='super' font-size='14'>iθ</tspan>", "c4", 20);
  pl.dot(end, { color: "c3", r: 5 });
  P.read(row("step", "c1", `1 + iθ/n = ${C.fmt(step, 4)}`) +
    row("(·)ⁿ", "c3", `${C.fmt(end, 4)}<br><span class="sub">|·| = ${num(C.abs(end), 4)}, arg = ${deg(C.arg0(end), 2)}</span>`) +
    row("e^iθ", "c4", `${C.fmt(e, 4)}`) +
    `<hr><div>Error: ${num(C.dist(end, e), 4)}</div>`);
});
