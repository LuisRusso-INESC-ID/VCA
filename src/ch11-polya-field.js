const { C, num, row } = VCA;
const P = VCA.page({
  id: "ch11-polya-field",
  kicker: "The Pólya vector field of f is its conjugate. Integrating f around a loop measures the work and flux of that field.",
  planes: [{ R: 2.5, unit: false }],
  explain: `
  <h2>The Pólya vector field</h2>
  <p>Draw the vector <span style="text-decoration:overline">f(z)</span> at each point <i>z</i>, the conjugate of <i>f</i>. Needham explains why this is the natural picture of <i>f</i> for integration. Writing d<i>z</i> along the loop as <i>T</i> d<i>s</i> (unit tangent <i>T</i>, unit outward normal <i>N</i> = −<i>iT</i>), one finds</p>
  <p style="text-align:center">∮ <i>f</i>(<i>z</i>) d<i>z</i> = ∮ <span style="text-decoration:overline">f</span>·<i>T</i> d<i>s</i> + <i>i</i> ∮ <span style="text-decoration:overline">f</span>·<i>N</i> d<i>s</i> = <b>work</b> + <i>i</i>·<b>flux</b>.</p>
  <p>The real part is the work done by the field along the loop (circulation), and the imaginary part is the flux out through it.</p>
  <h2>What analytic means here</h2>
  <p><i>f</i> is analytic exactly when its Pólya field has neither curl nor divergence. That is why ∮ <i>f</i> d<i>z</i> = 0 for loops containing no singularity: Cauchy's theorem. The field of 1/<i>z</i> is a <b>source</b> with flux 2π, giving ∮ = 2π<i>i</i>. The field of <i>i</i>/<i>z</i> is a <b>vortex</b> with circulation −2π. The field of 1/<i>z</i>² is a dipole: no net work, no net flux, so the integral vanishes even though the loop surrounds a singularity.</p>`,
});
const [pl] = P.planes, ui = P.ui;
pl.handle("a", { x: -0.6, y: 0.2 }, { color: "c5", label: "a" });
pl.handle("c", { x: 0, y: 0 }, { color: "c3", label: "L" });
const F = {
  inv: ["1/(z − a)", (z, a) => C.inv(C.sub(z, a))],
  vort: ["i/(z − a)", (z, a) => C.div(C.I, C.sub(z, a))],
  inv2: ["1/(z − a)²", (z, a) => C.inv(C.ipow(C.sub(z, a), 2))],
  mix: ["(1 + i)/(z − a)", (z, a) => C.div({ x: 1, y: 1 }, C.sub(z, a))],
  z: ["z (no singularity)", z => z],
  conj: ["z̄ (not analytic)", z => C.conj(z)],
};
const fs = ui.select("f(z)", Object.keys(F).map(k => [k, F[k][0]]), "inv");
const rad = ui.slider("Loop radius", 0.2, 2.2, 0.01, 1.2, v => v.toFixed(2));
const tn = ui.check("Tangential / normal parts on the loop", true);

VCA.run(() => {
  const [name, f0] = F[fs.value], a = pl.get("a"), f = z => f0(z, a);
  pl.handles.a.hidden = fs.value === "z" || fs.value === "conj";
  const n = 19, step = 2 * pl.R / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const z = { x: -pl.R + (i + 0.5) * step, y: -pl.R + (j + 0.5) * step }, v = C.conj(f(z)), m = C.abs(v);
    if (!isFinite(m) || m < 1e-9) continue;
    const L = 0.45 * step * Math.min(1, 0.35 + 0.4 * Math.log1p(m)), u = C.scale(v, L / m);
    pl.arrow(C.sub(z, C.scale(u, 0.5)), C.add(z, C.scale(u, 0.5)), { color: "c6", width: 1.4, head: 6 });
  }
  const c = pl.get("c"), r = rad.value;
  pl.circle(c, r, { color: "c3", width: 2.5 });
  const N = 2000; let I = C.ZERO, W = 0, Fl = 0;
  for (let k = 0; k < N; k++) {
    const t = VCA.TAU * (k + 0.5) / N, z = C.add(c, C.polar(r, t)), T = C.polar(1, t + Math.PI / 2), Nn = C.polar(1, t), ds = r * VCA.TAU / N;
    const fz = f(z), V = C.conj(fz);
    I = C.add(I, C.mul(fz, C.scale(T, ds)));
    W += C.dot(V, T) * ds; Fl += C.dot(V, Nn) * ds;
  }
  if (tn.value) for (let k = 0; k < 16; k++) {
    const t = VCA.TAU * k / 16, z = C.add(c, C.polar(r, t)), V = C.conj(f(z)), T = C.polar(1, t + Math.PI / 2), Nn = C.polar(1, t);
    const s = 0.3 / Math.max(1, C.abs(V));
    pl.arrow(z, C.add(z, C.scale(T, C.dot(V, T) * s)), { color: "c2", width: 2.4, head: 8 });
    pl.arrow(z, C.add(z, C.scale(Nn, C.dot(V, Nn) * s)), { color: "c4", width: 2.4, head: 8 });
  }
  P.read(row("f", "", `<span class="big">${name}</span>`) +
    row("work", "c2", `${num(W, 4)} <span class="sub">(= ${num(W / Math.PI, 3)}π)</span>`) +
    row("flux", "c4", `${num(Fl, 4)} <span class="sub">(= ${num(Fl / Math.PI, 3)}π)</span>`) +
    `<hr>${row("∮ f dz", "c3", C.fmt(I, 4))}<div class="sub">= work + i·flux</div>`);
});
