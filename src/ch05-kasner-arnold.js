const { C, num, row } = VCA;
const P = VCA.page({
  id: "ch05-kasner-arnold",
  kicker: "A particle on a spring (left) and a planet (right) are the same motion seen through w = z².",
  planes: [{ R: 2, title: "z-plane: Hooke (force ∝ r)" }, { R: 4, title: "w = z²: Kepler (force ∝ 1/r²)" }],
  explain: `
  <h2>Two classical orbits</h2>
  <p>A particle attracted to the origin by a force proportional to distance (Hooke's law, a perfect spring) moves on an ellipse <b>centred</b> at the origin: <i>z</i>(<i>t</i>) = <i>a</i> cos <i>t</i> + <i>ib</i> sin <i>t</i>. A planet attracted by an inverse-square force (Newton–Kepler) moves on an ellipse with a <b>focus</b> at the origin.</p>
  <h2>Squaring turns one into the other</h2>
  <p>Squaring gives <i>z</i>² = ½(<i>a</i>² − <i>b</i>²) + ½(<i>a</i>² + <i>b</i>²) cos 2<i>t</i> + <i>iab</i> sin 2<i>t</i>. That is an ellipse with centre ½(<i>a</i>² − <i>b</i>²), semi-axes ½(<i>a</i>² + <i>b</i>²) and <i>ab</i>, and so with focal distance exactly ½(<i>a</i>² − <i>b</i>²). The origin is a focus. This observation, which Needham credits to Kasner and Arnol'd, goes further: with the time change d<i>τ</i> = |<i>z</i>|² d<i>t</i>, the squared Hooke motion <i>is</i> Kepler motion.</p>
  <p>Switch the clock to <b>Kepler time</b> to see the planet speed up near the focus and slow down far away. The shaded sector it sweeps in a fixed time has constant area, which is Kepler's second law.</p>`,
});
const [zp, wp] = P.planes, ui = P.ui;
const A = ui.slider("a", 0.3, 1.8, 0.01, 1.5, v => v.toFixed(2));
const B = ui.slider("b", 0.1, 1.8, 0.01, 0.7, v => v.toFixed(2));
const PHI = ui.slider("tilt", -90, 90, 1, 15, v => v + "°");
const clock = ui.select("Clock", [["hooke", "Hooke time t"], ["kepler", "Kepler time τ"]], "kepler");
let t = 0.3, hist = [];
const run = VCA.anim(dt => {
  const z = pos(t), K = (A.value ** 2 + B.value ** 2) / 2;
  t += clock.value === "kepler" ? 1.2 * dt * K / Math.max(C.abs2(z), 1e-3) : 1.2 * dt;
  hist.push({ t, time: run.t }); while (hist.length && run.t - hist[0].time > 0.5) hist.shift();
});
ui.toggle("Run", run);
setTimeout(() => run.start(), 300);
function pos(s) { return C.rot({ x: A.value * Math.cos(s), y: B.value * Math.sin(s) }, PHI.value * Math.PI / 180); }

VCA.run(() => {
  const a = A.value, b = B.value, rot = PHI.value * Math.PI / 180;
  zp.curve(pos, 0, VCA.TAU, { color: "c1", width: 2.5, n: 240 });
  wp.curve(s => C.mul(pos(s), pos(s)), 0, VCA.TAU, { color: "c3", width: 2.5, n: 240 });
  const z = pos(t), w = C.mul(z, z);
  if (hist.length > 1 && clock.value === "kepler") {
    const pts = [C.ZERO]; const t0 = hist[0].t;
    for (let i = 0; i <= 30; i++) { const p = pos(t0 + (t - t0) * i / 30); pts.push(C.mul(p, p)); }
    wp.poly(pts, { color: "c3", fill: "f3", width: 0.8 });
  }
  zp.line(C.ZERO, z, { color: "c1", width: 1.2, dash: "4 3" });
  wp.line(C.ZERO, w, { color: "c3", width: 1.2, dash: "4 3" });
  zp.dot(z, { color: "c1", r: 7 }); wp.dot(w, { color: "c3", r: 7 });
  zp.dot(C.ZERO, { r: 4 });
  const f2 = C.polar((a * a - b * b), 2 * rot);
  wp.dot(C.ZERO, { color: "c5", r: 5 }); wp.dot(f2, { color: "c5", r: 4, opacity: 0.6 });
  wp.text(C.ZERO, "focus", { color: "c5", dy: 20, size: 15 });
  wp.dot(C.scale(f2, 0.5), { color: "muted", r: 3 });
  const A2 = (a * a + b * b) / 2, B2 = a * b, ecc = Math.sqrt(Math.max(0, 1 - (B2 * B2) / (A2 * A2)));
  P.read(row("z", "c1", `ellipse a = ${num(a)}, b = ${num(b)}<br><span class="sub">centred at 0</span>`) +
    row("z²", "c3", `semi-axes ${num(A2)}, ${num(B2)}<br><span class="sub">centre ${C.fmt(C.scale(f2, 0.5))}</span>`) +
    `<hr><div>Focal distance √(A² − B²) = ${num(Math.sqrt(Math.max(0, A2 * A2 - B2 * B2)), 3)}</div><div>|centre| = ½(a² − b²) = ${num(Math.abs(a * a - b * b) / 2, 3)}</div><div class="ok">So the origin is a focus.</div><div class="sub">Eccentricity of the orbit: ${num(ecc, 3)}</div>`);
});
