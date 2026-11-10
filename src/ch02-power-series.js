const { C, num, row } = VCA;
const P = VCA.page({
  id: "ch02-power-series",
  kicker: 'Each term aₙzⁿ is an arrow; laid head to tail they walk toward f(z). Drag <span class="k3">z</span>.',
  planes: [{ R: 2.5, one: true }],
  explain: `
  <h2>Partial sums as a walk</h2>
  <p>A power series Σ <i>a<sub>n</sub> z<sup>n</sup></i> is an infinite sum of complex numbers, so it can be drawn as a chain of arrows placed head to tail. For the geometric series 1 + <i>z</i> + <i>z</i>² + … each arrow is the previous one rotated by arg <i>z</i> and shrunk by |<i>z</i>|. The chain is an equiangular spiral that winds in to 1/(1 − <i>z</i>) when |<i>z</i>| &lt; 1.</p>
  <h2>The disc of convergence</h2>
  <p>Push <i>z</i> outside the dashed unit circle and the arrows start to grow: the series diverges, even though 1/(1 − <i>z</i>) is still perfectly finite. A power series always converges inside a disc and diverges outside it. For e<sup>z</sup> and sin <i>z</i> the factorials eventually crush every term, so the disc is the whole plane. That can still take many terms when |<i>z</i>| is large, as you will see.</p>`,
});
const [pl] = P.planes, ui = P.ui;
let fact = [1]; for (let i = 1; i < 200; i++) fact[i] = fact[i - 1] * i;
const S = {
  geom: ["1/(1 − z)", n => 1, z => C.inv(C.sub(C.ONE, z)), 1],
  exp: ["e<sup>z</sup>", n => 1 / fact[n], z => C.exp(z), Infinity],
  log: ["log(1 + z)", n => n === 0 ? 0 : (n % 2 ? 1 : -1) / n, z => C.log(C.add(C.ONE, z)), 1],
  sin: ["sin z", n => n % 2 === 0 ? 0 : ((n - 1) / 2 % 2 ? -1 : 1) / fact[n], z => C.sin(z), Infinity],
};
const sel = ui.select("Series", [["geom", "1/(1−z) = Σ zⁿ"], ["exp", "eᶻ = Σ zⁿ/n!"], ["log", "log(1+z) = Σ (−1)ⁿ⁺¹zⁿ/n"], ["sin", "sin z"]], "geom");
const N = ui.slider("Terms", 1, 60, 1, 12);
ui.slider("Zoom", 1, 12, 0.1, 2.5, v => v.toFixed(1), v => pl.setView(v));
pl.handle("z", { x: 0.55, y: 0.55 }, { color: "c3", label: "z" });

VCA.run(() => {
  const [name, a, f, rad] = S[sel.value], z = pl.get("z"), n = N.value;
  if (isFinite(rad)) pl.circle(C.ZERO, rad, { color: "c5", width: 1.5, dash: "6 4" });
  let s = C.ZERO, zn = C.ONE;
  const sums = [s];
  for (let k = 0; k < n; k++) {
    const t = C.scale(zn, a(k));
    if (C.abs(t) > 1e-12) {
      const s2 = C.add(s, t);
      pl.arrow(s, s2, { color: k % 2 ? "c1" : "c6", width: 2, head: 9 });
      s = s2;
    }
    sums.push(s);
    zn = C.mul(zn, z);
  }
  const target = f(z);
  pl.dot(target, { color: "c4", r: 7 });
  pl.label(target, "f(z)", "c4", 18, z, { size: 16 });
  pl.dot(s, { color: "c2", r: 4.5 });
  const err = C.dist(s, target), conv = C.abs(z) < rad;
  P.read(row("f", "", `<span class="big">${name}</span>`) + row("z", "c3", `${C.fmt(z)}<br><span class="sub">|z| = ${num(C.abs(z))}</span>`) +
    row("Sₙ", "c2", C.fmt(s, 3)) + row("f(z)", "c4", C.fmt(target, 3)) +
    `<hr><div>|Sₙ − f(z)| = ${num(err, 4)}</div><div class="${conv ? "ok" : "bad"}">${conv ? "Inside the disc of convergence" : "Outside the disc: the series diverges"}</div>`);
});
