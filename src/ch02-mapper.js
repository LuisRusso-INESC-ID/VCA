const { C, num, row } = VCA;
const P = VCA.page({
  id: "ch02-mapper",
  kicker: 'Pick a function and a grid. Drag the probe <span class="k3">z</span> to see where single points go.',
  planes: [{ R: 2, title: "z-plane" }, { R: 4.2, title: "w = f(z)" }],
  explain: `
  <h2>Seeing a function</h2>
  <p>A complex function cannot be graphed the way a real one can, because input and output together need four dimensions. Needham's answer is to draw two planes and watch how <i>f</i> carries curves from one to the other. Each blue curve on the left lands on the blue curve on the right, and likewise for the orange ones.</p>
  <h2>What to look for</h2>
  <p><b>z²</b> doubles angles and squares lengths: the right half-plane covers the whole plane, and horizontal and vertical lines become two families of parabolas. <b>1/z</b> turns lines into circles through 0. <b>e<sup>z</sup></b> sends horizontal lines to rays and vertical lines to circles, wrapping each strip of height 2π once around 0. <b>sin z</b> and <b>cos z</b> produce confocal ellipses and hyperbolas, and <b>z + 1/z</b> (the Joukowski map) flattens the unit circle onto the segment [−2, 2].</p>
  <p>Wherever <i>f</i> is analytic and <i>f′</i> ≠ 0, the image curves still cross at right angles: the map is <b>conformal</b>. Where right angles break down, look for a zero of <i>f′</i> (e.g. 0 for z²) or a branch point.</p>`,
});
const [zp, wp] = P.planes, ui = P.ui;
const PI = Math.PI;
const F = {
  sq: ["z²", z => C.mul(z, z), 2, 4.2, [-1.5, 1.5, -1.5, 1.5]],
  cube: ["z³", z => C.ipow(z, 3), 1.6, 3.6, [-1.2, 1.2, -1.2, 1.2]],
  inv: ["1/z", z => C.inv(z), 2.5, 2.5, [-2, 2, -2, 2]],
  exp: ["e<sup>z</sup>", z => C.exp(z), 3.6, 8, [-2, 2, -PI, PI]],
  sin: ["sin z", z => C.sin(z), 2.2, 3, [-PI / 2, PI / 2, -1.2, 1.2]],
  cos: ["cos z", z => C.cos(z), 3.6, 3, [0, PI, -1.2, 1.2]],
  jouk: ["z + 1/z", z => C.add(z, C.inv(z)), 2.5, 4, [-2, 2, -2, 2]],
  sqrt: ["√z (principal)", z => C.sqrt(z), 2.5, 2, [-2, 2, -2, 2]],
  log: ["Log z (principal)", z => C.log(z), 2.5, 3.8, [-2, 2, -2, 2]],
  mob: ["(z − i)/(z + i)", z => C.div(C.sub(z, C.I), C.add(z, C.I)), 2.5, 2.5, [-2, 2, -2, 2]],
  conj: ["z̄ (not analytic)", z => C.conj(z), 2, 2, [-1.5, 1.5, -1.5, 1.5]],
};
const fn = ui.select("f(z)", Object.keys(F).map(k => [k, F[k][0].replace(/<\/?sup>/g, m => m === "<sup>" ? "^" : "")]), "sq", k => { zp.setView(F[k][2]); wp.setView(F[k][3]); });
const grid = ui.select("Grid", [["cart", "Cartesian"], ["polar", "Polar"]], "cart");
const dens = ui.slider("Lines", 4, 16, 1, 8);
const probe = ui.check("Probe circle", true);
zp.handle("z", { x: 0.8, y: 0.5 }, { color: "c3", label: "z" });

function curves(ext, type, n) {
  const [x0, x1, y0, y1] = ext, out = [];
  if (type === "cart") {
    for (let i = 0; i <= n; i++) {
      const y = y0 + (y1 - y0) * i / n, x = x0 + (x1 - x0) * i / n;
      out.push([t => ({ x: x0 + (x1 - x0) * t, y }), "c1"]);
      out.push([t => ({ x, y: y0 + (y1 - y0) * t }), "c2"]);
    }
  } else {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.min(x1 - x0, y1 - y0) / 2;
    for (let i = 1; i <= Math.ceil(n * 0.75); i++) { const r = R * i / Math.ceil(n * 0.75); out.push([t => ({ x: cx + r * Math.cos(VCA.TAU * t), y: cy + r * Math.sin(VCA.TAU * t) }), "c1"]); }
    for (let i = 0; i < 2 * n; i++) { const a = VCA.TAU * i / (2 * n); out.push([t => ({ x: cx + R * t * Math.cos(a), y: cy + R * t * Math.sin(a) }), "c2"]); }
  }
  return out;
}

VCA.run(() => {
  const [name, f, , , ext] = F[fn.value];
  for (const [g, c] of curves(ext, grid.value, dens.value)) {
    zp.curve(g, 0, 1, { color: c, width: 1.5, n: 60 });
    wp.curve(t => f(g(t)), 0, 1, { color: c, width: 1.5, n: 300 });
  }
  const z = zp.get("z"), w = f(z);
  if (probe.value) {
    const r = zp.R * 0.08;
    zp.circle(z, r, { color: "c3", width: 2, fill: "f3" });
    wp.curve(t => f(C.add(z, C.polar(r, t))), 0, VCA.TAU, { color: "c3", width: 2, fill: "f3", n: 120 });
  }
  wp.dot(w, { color: "c3", r: 6 });
  wp.label(w, "f(z)", "c3", 18, C.ZERO, { size: 17 });
  const d = C.deriv(f, z);
  P.read(row("f", "", `<span class="big">${name}</span>`) + row("z", "c3", C.fmt(z)) + row("f(z)", "c3", C.fmt(w)) +
    (fn.value === "conj" ? "" : row("f′(z)", "", `${C.fmt(d)}<br><span class="sub">stretch ${num(C.abs(d))}, twist ${VCA.deg(C.arg(d))}</span>`)));
});
