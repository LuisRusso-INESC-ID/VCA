const { C, num, deg, row } = VCA;
const P = VCA.page({
  id: "ch04-amplitwist",
  kicker: 'Drag <span class="k3">z</span>. A tiny circle around z maps to a tiny circle: f′(z) amplifies and twists it.',
  planes: [{ R: 2, title: "z-plane" }, { R: 3, title: "w = f(z)" }],
  explain: `
  <h2>The derivative as an amplitwist</h2>
  <p>Zoom in far enough on an analytic map and it looks like multiplication by a single complex number <i>f′</i>(<i>z</i>). Every tiny arrow leaving <i>z</i> is <b>amplified</b> by |<i>f′</i>(<i>z</i>)| and <b>twisted</b> by arg <i>f′</i>(<i>z</i>). Needham calls this the <i>amplitwist</i>. So the infinitesimal circle stays a circle, and the two perpendicular arrows (blue = along 1, orange = along <i>i</i>) stay perpendicular and equal in length.</p>
  <p>Shrink ε to see the exact image (purple) merge with the amplitwist prediction <i>f</i>(<i>z</i>) + <i>f′</i>(<i>z</i>)·ε<i>e<sup>it</sup></i> (dashed green).</p>
  <h2>When it fails</h2>
  <p>Choose a non-analytic map such as <i>x</i> + 2<i>iy</i>. Its local linear approximation stretches different directions by different amounts, so circles become ellipses and right angles are lost. The <b>Cauchy–Riemann equations</b> are exactly the condition that the orange arrow's image is the blue arrow's image turned by 90°: ∂<i>f</i>/∂<i>y</i> = <i>i</i> ∂<i>f</i>/∂<i>x</i>. The readout checks this.</p>`,
});
const [zp, wp] = P.planes, ui = P.ui;
const F = {
  sq: ["z²", z => C.mul(z, z), 3], cube: ["z³", z => C.ipow(z, 3), 4], exp: ["e<sup>z</sup>", C.exp, 4], sin: ["sin z", C.sin, 3],
  inv: ["1/z", C.inv, 3], jouk: ["z + 1/z", z => C.add(z, C.inv(z)), 3.5],
  conj: ["z̄", C.conj, 2], aniso: ["x + 2iy", z => ({ x: z.x, y: 2 * z.y }), 3], mixed: ["z² + 0.5 z̄", z => C.add(C.mul(z, z), C.scale(C.conj(z), 0.5)), 3],
};
const sel = ui.select("f(z)", Object.keys(F).map(k => [k, F[k][0].replace(/<\/?sup>/g, m => m === "<sup>" ? "^" : "")]), "sq", k => wp.setView(F[k][2]));
const eps = ui.slider("ε", 0.03, 0.8, 0.01, 0.35, v => v.toFixed(2));
const gridOn = ui.check("Background grid image", true);
zp.handle("z", { x: 0.9, y: 0.6 }, { color: "c3", label: "z" });

VCA.run(() => {
  const [name, f] = F[sel.value], z = zp.get("z"), e = eps.value, w = f(z);
  if (gridOn.value) for (let v = -2; v <= 2.01; v += 0.25) {
    wp.curve(t => f({ x: t, y: v }), -2, 2, { color: "grid", width: 1, n: 160 });
    wp.curve(t => f({ x: v, y: t }), -2, 2, { color: "grid", width: 1, n: 160 });
  }
  const fx = C.dx(f, z), fy = C.dy(f, z);
  zp.circle(z, e, { color: "c3", width: 2, fill: "f3" });
  zp.arrow(z, C.add(z, { x: e, y: 0 }), { color: "c1", width: 2.5, head: 9 });
  zp.arrow(z, C.add(z, { x: 0, y: e }), { color: "c2", width: 2.5, head: 9 });
  wp.curve(t => f(C.add(z, C.polar(e, t))), 0, VCA.TAU, { color: "c3", width: 2.2, fill: "f3", n: 160 });
  // linear approximation: J(ε cos t, ε sin t) = fx ε cos t + fy ε sin t
  wp.curve(t => C.add(w, C.add(C.scale(fx, e * Math.cos(t)), C.scale(fy, e * Math.sin(t)))), 0, VCA.TAU, { color: "c4", width: 2, dash: "6 4", n: 120 });
  wp.arrow(w, f(C.add(z, { x: e, y: 0 })), { color: "c1", width: 2.5, head: 9 });
  wp.arrow(w, f(C.add(z, { x: 0, y: e })), { color: "c2", width: 2.5, head: 9 });
  wp.dot(w, { color: "c3", r: 4 });
  const cr = C.dist(fy, C.mul(C.I, fx)), analytic = cr < 1e-4 * (1 + C.abs(fx));
  const ang = Math.abs(C.arg(C.div(fy, fx)));
  let html = row("f", "", `<span class="big">${name}</span>`) + row("z", "c3", C.fmt(z));
  if (analytic) html += row("f′(z)", "", `${C.fmt(fx)}<br><span class="sub">amplification ${num(C.abs(fx))}, twist ${deg(C.arg(fx))}</span>`);
  html += `<hr><div>∂f/∂x = ${C.fmt(fx)}</div><div>∂f/∂y = ${C.fmt(fy)}</div><div>i·∂f/∂x = ${C.fmt(C.mul(C.I, fx))}</div>` +
    `<div class="${analytic ? "ok" : "bad"}">${analytic ? "Cauchy–Riemann holds: an amplitwist" : "Cauchy–Riemann fails: not analytic"}</div>` +
    `<div class="sub">Angle between image arrows: ${deg(ang)}; length ratio ${num(C.abs(fy) / C.abs(fx))}</div>`;
  P.read(html);
});
