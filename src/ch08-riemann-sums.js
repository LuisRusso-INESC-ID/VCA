const { C, num, row } = VCA;
const P = VCA.page({
  id: "ch08-riemann-sums",
  kicker: "Chop the path into pieces Δz; multiply each by f and add the arrows head to tail.",
  planes: [{ R: 2.5, title: "z-plane: the path" }, { R: 3, title: "the sum Σ f(z) Δz" }],
  explain: `
  <h2>What ∫ f(z) dz means</h2>
  <p>Split the path into small steps Δ<i>z<sub>k</sub></i>. Each step is rotated and stretched by the value <i>f</i>(<i>z<sub>k</sub></i>), and the resulting arrows are added head to tail (right). As the steps get finer, the end of the chain converges to the integral (green dot).</p>
  <h2>Does the path matter?</h2>
  <p>Drag the middle handle to bend the path while keeping its ends fixed. For an analytic function like <i>z</i>² or e<sup>z</sup>, the integral does not change: it only depends on the end points. This is <b>Cauchy's theorem</b> at work, and the readout compares the bent path with the straight one. For <span style="text-decoration:overline">z</span>, which is not analytic, the integral changes as the path bends.</p>
  <p>On a closed circle, analytic functions give ∮ <i>f</i> d<i>z</i> = 0. The exception is 1/<i>z</i> when the circle surrounds 0, giving 2π<i>i</i>. For <span style="text-decoration:overline">z</span> the answer is 2<i>i</i> × the enclosed area.</p>`,
});
const [zp, wp] = P.planes, ui = P.ui;
const F = { z: ["z", z => z], sq: ["z²", z => C.mul(z, z)], exp: ["e<sup>z</sup>", C.exp], inv: ["1/z", C.inv], inv2: ["1/z²", z => C.inv(C.mul(z, z))], conj: ["z̄ (not analytic)", C.conj] };
const fs = ui.select("f(z)", Object.keys(F).map(k => [k, F[k][0].replace(/<\/?sup>/g, m => m === "<sup>" ? "^" : "")]), "sq");
const ps = ui.select("Path", [["open", "Open path A → B"], ["loop", "Closed circle"]], "open", setPath);
const N = ui.slider("Pieces", 3, 120, 1, 30);
const rad = ui.slider("Circle radius", 0.2, 2, 0.01, 1, v => v.toFixed(2));
zp.handle("A", { x: -1.5, y: -0.6 }, { color: "c4", label: "A" });
zp.handle("M", { x: 0, y: 1.4 }, { color: "c1" });
zp.handle("B", { x: 1.5, y: -0.3 }, { color: "c5", label: "B" });
zp.handle("c", { x: 0.3, y: 0.2 }, { color: "c1", label: "c" });
function setPath(v) { zp.handles.A.hidden = zp.handles.M.hidden = zp.handles.B.hidden = v !== "open"; zp.handles.c.hidden = v === "open"; }
setPath("open");
const integ = (f, g, n) => { let s = C.ZERO, prev = g(0); for (let i = 1; i <= n; i++) { const z = g(i / n); s = C.add(s, C.mul(f(C.lerp(prev, z, 0.5)), C.sub(z, prev))); prev = z; } return s; };

VCA.run(() => {
  const [name, f] = F[fs.value], n = N.value;
  let g, closed = ps.value === "loop";
  if (!closed) { const a = zp.get("A"), m = zp.get("M"), b = zp.get("B"); g = t => C.add(C.add(C.scale(a, (1 - t) ** 2), C.scale(m, 2 * t * (1 - t))), C.scale(b, t * t)); }
  else { const c = zp.get("c"), r = rad.value; g = t => C.add(c, C.polar(r, VCA.TAU * t)); }
  if (fs.value === "inv" || fs.value === "inv2") zp.cross(C.ZERO, { color: "c5" });
  zp.curve(g, 0, 1, { color: "c3", width: 2.5, n: 300, jump: Infinity });
  if (!closed) zp.line(zp.get("A"), zp.get("B"), { color: "muted", width: 1.2, dash: "5 4" });
  let s = C.ZERO;
  const cols = ["c1", "c6"];
  for (let k = 0; k < n; k++) {
    const z0 = g(k / n), z1 = g((k + 1) / n), dz = C.sub(z1, z0), term = C.mul(f(z0), dz);
    zp.arrow(z0, z1, { color: cols[k % 2], width: 2, head: n > 40 ? 0 : 8 });
    wp.arrow(s, C.add(s, term), { color: cols[k % 2], width: 2, head: n > 40 ? 0 : 9 });
    s = C.add(s, term);
  }
  const exact = integ(f, g, 4000);
  const M = Math.max(C.abs(exact), C.abs(s), 0.5) * 1.4;
  if (Math.abs(M - wp.R) / wp.R > 0.25) wp.setView(M);
  wp.dot(exact, { color: "c4", r: 7 }); wp.dot(C.ZERO, { r: 4 });
  wp.label(exact, "∫", "c4", 18, C.ZERO, { size: 20 });
  let html = row("f", "", `<span class="big">${name}</span>`) + row("Σ", "c1", `${C.fmt(s, 3)} <span class="sub">(${n} pieces)</span>`) + row("∫", "c4", C.fmt(exact, 4));
  if (!closed) {
    const a = zp.get("A"), b = zp.get("B"), straight = integ(f, t => C.lerp(a, b, t), 4000);
    const same = C.dist(straight, exact) < 1e-3;
    html += `<hr>${row("straight", "", C.fmt(straight, 4))}<div class="${same ? "ok" : "bad"}">${same ? "Same as the straight path: path-independent" : "Differs from the straight path"}</div>`;
  } else {
    html += `<hr><div>∮ ÷ 2πi = ${C.fmt(C.div(exact, { x: 0, y: VCA.TAU }), 3)}</div>`;
  }
  P.read(html);
});
