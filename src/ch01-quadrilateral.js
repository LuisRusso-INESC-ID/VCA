const { C, num, deg, row } = VCA;
const P = VCA.page({
  id: "ch01-quadrilateral",
  kicker: "Drag the four corners. The two purple segments stay equal in length and perpendicular.",
  planes: [{ R: 5.5, unit: false }],
  explain: `
  <h2>The theorem</h2>
  <p>Build a square outward on each side of any quadrilateral. The segment joining the centres of one pair of opposite squares is equal in length to, and perpendicular to, the segment joining the other pair. (This is often called van Aubel's theorem.)</p>
  <h2>Needham's proof with complex numbers</h2>
  <p>Let the sides, taken in order, be the vectors 2<i>a</i>, 2<i>b</i>, 2<i>c</i>, 2<i>d</i>, so that <i>a + b + c + d</i> = 0. Going from a corner to the centre of the square on side 2<i>a</i> means going half-way along the side, <i>a</i>, then turning a right angle, giving <i>a</i> + <i>ia</i> = (1+<i>i</i>)<i>a</i>. Turn on <b>midpoint construction</b> to see those half-sides and their quarter-turns.</p>
  <p>Working out the two segments gives <span class="m k3">p</span> = (<i>b</i> + <i>c</i>) + <i>i</i>(<i>c</i> − <i>a</i>) and <span class="m k3">q</span> = (<i>c</i> + <i>d</i>) + <i>i</i>(<i>d</i> − <i>b</i>). Using <i>a + b + c + d</i> = 0, one checks that <span class="m k3">p</span> = <i>i</i>·<span class="m k3">q</span> (up to the sign set by orientation). Multiplying by <i>i</i> is a quarter-turn with no stretch, so the segments are equal and perpendicular. The readout shows the ratio <i>p/q</i> staying at ±<i>i</i>.</p>
  <p>It still works when the quadrilateral is non-convex, or even self-intersecting.</p>`,
});
const [pl] = P.planes, ui = P.ui;
const init = [{ x: -1.5, y: -1.1 }, { x: 1.2, y: -1.4 }, { x: 1.6, y: 0.9 }, { x: -0.8, y: 1.2 }];
const names = ["A", "B", "C", "D"];
names.forEach((n, i) => pl.handle(n, init[i], { color: "c1", label: n }));
ui.heading("Show");
const sq = ui.check("Squares", true);
const mid = ui.check("Midpoint construction", false);
ui.buttons([["Square", () => [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]].forEach(([x, y], i) => pl.set(names[i], { x, y }))],
  ["Kite", () => [[0, -2.5], [1.4, 0], [0, 1.2], [-1.4, 0]].forEach(([x, y], i) => pl.set(names[i], { x, y }))],
  ["Reset", () => init.forEach((p, i) => pl.set(names[i], p))]]);

VCA.run(() => {
  const V = names.map(n => pl.get(n));
  let area = 0; for (let i = 0; i < 4; i++) area += C.cross(V[i], V[(i + 1) % 4]);
  const s = area >= 0 ? -1 : 1;   // outward turn: clockwise for a counter-clockwise polygon
  const cols = ["c2", "c4", "c2", "c4"];
  const centres = [];
  for (let i = 0; i < 4; i++) {
    const p = V[i], q = V[(i + 1) % 4], side = C.sub(q, p), out = C.rot(side, s * Math.PI / 2);
    const m = C.lerp(p, q, 0.5), c = C.add(m, C.scale(out, 0.5));
    centres.push(c);
    if (sq.value) pl.poly([p, q, C.add(q, out), C.add(p, out)], { color: cols[i], fill: "f" + cols[i][1], width: 1.3, layer: "back" });
    if (mid.value) {
      pl.arrow(p, m, { color: "ink", width: 1.6, head: 8 });
      pl.arrow(m, c, { color: "c5", width: 1.6, head: 8 });
      pl.dot(m, { r: 3 });
    }
    pl.dot(c, { color: cols[i], r: 5 });
  }
  pl.poly(V, { color: "c1", width: 2.5 });
  const p = C.sub(centres[2], centres[0]), q = C.sub(centres[3], centres[1]);
  pl.line(centres[0], centres[2], { color: "c3", width: 3 });
  pl.line(centres[1], centres[3], { color: "c3", width: 3 });
  // right-angle mark at intersection
  const d = C.cross(p, q);
  if (Math.abs(d) > 1e-9) {
    const t = C.cross(C.sub(centres[1], centres[0]), q) / d, X = C.add(centres[0], C.scale(p, t));
    const u = C.scale(C.unit(p), 0.22), v = C.scale(C.unit(q), 0.22);
    pl.path([C.add(X, u), C.add(C.add(X, u), v), C.add(X, v)], { color: "c3", width: 1.5 });
  }
  pl.label(C.lerp(centres[0], centres[2], 0.3), "p", "c3", 0, C.ZERO, { dx: 12, dy: -6 });
  pl.label(C.lerp(centres[1], centres[3], 0.3), "q", "c3", 0, C.ZERO, { dx: 12, dy: -6 });
  const ratio = C.div(p, q);
  P.read(row("p", "c3", `${C.fmt(p)}<br><span class="sub">|p| = ${num(C.abs(p), 3)}</span>`) +
    row("q", "c3", `${C.fmt(q)}<br><span class="sub">|q| = ${num(C.abs(q), 3)}</span>`) +
    `<hr>${row("p/q", "", `<span class="big">${C.fmt(ratio, 3)}</span>`)}<div class="sub">Angle between p and q: ${deg(Math.abs(C.arg(ratio)))}</div>`);
});
