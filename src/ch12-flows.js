const { C, num, row } = VCA;
const P = VCA.page({
  id: "ch12-flows",
  kicker: "An ideal fluid flow is the Pólya field of the derivative of a complex potential Ω. Streamlines are the curves Im Ω = constant.",
  planes: [{ R: 3, unit: false }],
  explain: `
  <h2>Complex potentials</h2>
  <p>A two-dimensional flow that is incompressible (no divergence) and irrotational (no curl) is exactly the Pólya field of an analytic function. Write that function as Ω′(<i>z</i>), where Ω is the <b>complex potential</b>. The velocity is the conjugate of Ω′(<i>z</i>). The imaginary part ψ = Im Ω (the stream function) is constant along streamlines (blue). The real part φ = Re Ω (the velocity potential) has level curves crossing them at right angles (orange, optional), because Ω is conformal.</p>
  <h2>Building blocks</h2>
  <p><b>z</b> is a uniform stream, <b>log z</b> a source, <b>−i log z</b> a vortex, and <b>1/z</b> a dipole. Because the equations are linear, flows can be added. The flow past a cylinder is Ω = <i>z</i> + 1/<i>z</i>: the unit circle is itself a streamline, so the fluid slides around it. Adding circulation Γ moves the stagnation points (where the fluid stops) around the cylinder. Faster flow on one side means lower pressure there, and that gives lift (the Kutta–Joukowski theorem).</p>`,
});
const [pl] = P.planes, ui = P.ui;
const flows = {
  uni: ["Uniform: z", z => z, z => C.ONE, 0.25, null],
  src: ["Source: log z", z => C.log(z), z => C.inv(z), Math.PI / 8, z => C.abs(z) < 0.08],
  vor: ["Vortex: −i log z", z => C.mul({ x: 0, y: -1 }, C.log(z)), z => C.div({ x: 0, y: -1 }, z), 0.2, z => C.abs(z) < 0.08],
  spi: ["Spiral: (1 − i) log z", z => C.mul({ x: 1, y: -1 }, C.log(z)), z => C.div({ x: 1, y: -1 }, z), Math.PI / 8, z => C.abs(z) < 0.08],
  dip: ["Dipole: 1/z", z => C.inv(z), z => C.neg(C.inv(C.mul(z, z))), 0.25, z => C.abs(z) < 0.12],
  cyl: ["Cylinder: z + 1/z − iΓ/2π log z", null, null, 0.25, z => C.abs(z) < 1],
};
const fs = ui.select("Ω(z)", Object.keys(flows).map(k => [k, flows[k][0]]), "cyl", reseed);
const G = ui.slider("Circulation Γ", -12.6, 12.6, 0.1, 4, v => v.toFixed(1));
const eq = ui.check("Equipotentials", false);
const showP = ui.check("Particles", true);
const getF = () => {
  const f = flows[fs.value];
  if (fs.value !== "cyl") return f;
  const g = G.value / VCA.TAU;
  return [f[0], z => C.sub(C.add(z, C.inv(z)), C.mul({ x: 0, y: g }, C.log(z))), z => C.sub(C.sub(C.ONE, C.inv(C.mul(z, z))), C.div({ x: 0, y: g }, z)), f[3], f[4]];
};
let parts = [];
function spawn(p) {
  const k = fs.value, R = pl.R;
  if (k === "uni" || k === "cyl") { p.z = { x: -R - Math.random() * 0.5, y: (Math.random() * 2 - 1) * R }; }
  else if (k === "src" || k === "spi") p.z = C.polar(0.1 + Math.random() * 0.1, Math.random() * VCA.TAU);
  else p.z = { x: (Math.random() * 2 - 1) * R, y: (Math.random() * 2 - 1) * R };
  p.age = 0; p.life = 3 + Math.random() * 6; p.tail = [p.z];
}
function reseed() { parts = []; for (let i = 0; i < 220; i++) { const p = {}; spawn(p); if (fs.value === "uni" || fs.value === "cyl") p.z.x = (Math.random() * 2 - 1) * pl.R; p.tail = [p.z]; parts.push(p); } cache = null; }
const flow = VCA.anim(dt => {
  const [, , dW, , mask] = getF();
  const vel = z => { const v = C.conj(dW(z)), m = C.abs(v); return m > 4 ? C.scale(v, 4 / m) : v; };
  for (const p of parts) {
    const k1 = vel(p.z), mid = C.add(p.z, C.scale(k1, dt * 0.35)), k2 = vel(mid);
    p.z = C.add(p.z, C.scale(k2, dt * 0.7)); p.age += dt;
    p.tail.unshift(p.z); if (p.tail.length > 7) p.tail.pop();
    if (p.age > p.life || Math.abs(p.z.x) > pl.R + 0.6 || Math.abs(p.z.y) > pl.R + 0.6 || (mask && mask(p.z)) || !C.ok(p.z)) spawn(p);
  }
});
ui.toggle("Flow", flow);
let cache = null;
reseed(); setTimeout(() => flow.start(), 300);

VCA.run(() => {
  const [name, W, dW, step, mask] = getF();
  const key = fs.value + G.value + eq.value;
  if (!cache || cache.key !== key) {
    const b = pl.bounds, levels = [], lv2 = [];
    for (let k = -60; k <= 60; k++) levels.push(k * step + 1e-7);
    const s1 = VCA.contours(z => W(z).y, b, 140, 140, levels, step * 6, mask);
    const s2 = eq.value ? VCA.contours(z => W(z).x, b, 140, 140, levels, step * 6, mask) : [];
    cache = { key, s1, s2 };
  }
  if (fs.value === "cyl") pl.circle(C.ZERO, 1, { color: "ink", width: 2, fill: "f5" });
  if (cache.s2.length) pl.segs(cache.s2, { color: "c2", width: 1.1, opacity: 0.8 });
  pl.segs(cache.s1, { color: "c1", width: 1.4 });
  if (showP.value) for (const p of parts) { pl.path(p.tail, { color: "c3", width: 2.2, opacity: 0.75 }); }
  let extra = "";
  if (fs.value === "cyl") {
    const g = G.value / VCA.TAU, s = -g / 2; // stagnation: z² − i g z − 1 = 0
    const disc = C.sqrt({ x: 4 - g * g, y: 0 }), zz = [C.scale(C.add({ x: 0, y: g }, disc), 0.5), C.scale(C.sub({ x: 0, y: g }, disc), 0.5)];
    zz.forEach(z => { if (C.abs(z) >= 0.999) pl.dot(z, { color: "c5", r: 6 }); });
    extra = `<hr><div>Stagnation points (red): ${zz.filter(z => C.abs(z) >= 0.999).map(z => C.fmt(z)).join(", ")}</div><div class="sub">With |Γ| &gt; 4π they leave the cylinder and merge into one point in the fluid.</div>`;
  }
  P.read(row("Ω", "", `<span class="big">${name}</span>`) + `<div class="sub">Blue: streamlines Im Ω = const${eq.value ? "; orange: equipotentials Re Ω = const" : ""}.</div>` + extra);
});
