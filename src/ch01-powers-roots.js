const { C, num, deg, row } = VCA;
const P = VCA.page({
  id: "ch01-powers-roots",
  kicker: 'Drag <span class="k1">a</span>. Its powers lie on a spiral; its n-th roots form a regular polygon.',
  planes: [{ R: 2.6, one: true }],
  explain: `
  <h2>Powers</h2>
  <p>Each multiplication by <i>a</i> = <i>r e<sup>iθ</sup></i> turns by θ and stretches by <i>r</i>, so the powers <i>a<sup>k</sup></i> = <i>r<sup>k</sup> e<sup>ikθ</sup></i> march along the curve <i>a<sup>t</sup></i> = e<sup>t log a</sup>. That curve is an <b>equiangular (logarithmic) spiral</b>: it crosses every ray from 0 at the same angle. When |<i>a</i>| = 1 the spiral collapses to the unit circle, and when <i>a</i> is real it straightens into a ray. This is De Moivre's formula in pictures.</p>
  <h2>Roots</h2>
  <p>To solve <i>z<sup>n</sup></i> = <i>a</i>, undo the picture: take the n-th root of the length and divide the angle by <i>n</i>. Because θ and θ + 2π describe the same <i>a</i>, the angles (θ + 2πk)/<i>n</i> for <i>k</i> = 0, …, <i>n</i>−1 all work. That gives <i>n</i> roots at the corners of a regular <i>n</i>-gon. With <i>a</i> = 1 these are the roots of unity.</p>`,
});
const [pl] = P.planes, ui = P.ui;
pl.handle("a", { x: 0.95, y: 0.45 }, { color: "c1", label: "a" });
const mode = ui.select("Mode", [["pow", "Powers aᵏ"], ["root", "n-th roots of a"]], "pow");
const N = ui.slider("k range / n", 2, 16, 1, 8);
ui.buttons([["|a| = 1", () => pl.set("a", C.unit(pl.get("a")))], ["a = 1", () => pl.set("a", C.ONE)], ["a = i", () => pl.set("a", C.I)]]);

VCA.run(() => {
  const a = pl.get("a"), n = N.value;
  if (mode.value === "pow") {
    const L = C.log(a);
    pl.curve(t => C.exp(C.scale(L, t)), -n, n, { color: "c6", width: 1.5, dash: "5 4", n: 800 });
    const pts = [];
    for (let k = -n; k <= n; k++) pts.push(C.ipow(a, k));
    pts.forEach((p, i) => {
      const k = i - n;
      pl.dot(p, { color: k === 0 ? "ink" : k > 0 ? "c3" : "c2", r: 4.5 });
      if (Math.abs(k) <= 4 && k !== 0 && k !== 1) pl.label(p, `a<tspan baseline-shift="super" font-size="12">${k}</tspan>`, k > 0 ? "c3" : "c2", 16, C.ZERO, { size: 16 });
    });
    for (let k = 0; k < Math.min(n, 6); k++) pl.line(C.ZERO, C.ipow(a, k), { color: "muted", width: 0.8, opacity: 0.6 });
    const t = C.arg0(a);
    pl.arcPx(C.ZERO, 30, 0, t, { color: "c1", width: 2 });
    P.read(row("a", "c1", `${C.fmt(a)}<br><span class="sub">r = ${num(C.abs(a))}, θ = ${deg(t)}</span>`) +
      row("a²", "c3", C.fmt(C.ipow(a, 2))) + row("a³", "c3", C.fmt(C.ipow(a, 3))) + row("a⁻¹", "c2", C.fmt(C.ipow(a, -1))) +
      `<hr><div class="sub">aᵏ has length rᵏ and angle kθ.</div>`);
  } else {
    const r = Math.pow(C.abs(a), 1 / n), t = C.arg0(a);
    const roots = []; for (let k = 0; k < n; k++) roots.push(C.polar(r, (t + 2 * Math.PI * k) / n));
    pl.circle(C.ZERO, r, { color: "c3", width: 1, dash: "4 4" });
    pl.poly(roots, { color: "c3", fill: "f3", width: 1.5 });
    roots.forEach((z, k) => { pl.line(C.ZERO, z, { color: "c3", width: 0.8, opacity: 0.5 }); pl.dot(z, { color: k ? "c3" : "c5", r: 5 }); });
    pl.arcPx(C.ZERO, 30, 0, t, { color: "c1", width: 2 });
    pl.arcPx(C.ZERO, 44, 0, t / n, { color: "c5", width: 2.4 });
    P.read(row("a", "c1", `${C.fmt(a)}<br><span class="sub">|a| = ${num(C.abs(a))}, arg = ${deg(t)}</span>`) +
      row("z₀", "c5", `${C.fmt(roots[0])}<br><span class="sub">angle θ/n = ${deg(t / n)}</span>`) +
      `<hr><div class="sub">Root length |a|<sup>1/n</sup> = ${num(r, 3)}; neighbouring roots differ by 360°/n = ${num(360 / n, 1)}°.</div>`);
  }
});
