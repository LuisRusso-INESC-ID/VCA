const { C, num, row } = VCA;
const P = VCA.page({
  id: "ch03-inversion",
  kicker: "Inversion swaps the inside and outside of the red circle, and sends circles and lines to circles and lines.",
  planes: [{ R: 3, unit: false }],
  explain: `
  <h2>Definition</h2>
  <p>Inversion in the circle of radius <i>K</i> centred at 0 sends a point <i>z</i> to the point <i>z′</i> on the same ray with |<i>z</i>|·|<i>z′</i>| = <i>K</i>². In complex terms <i>z′</i> = <i>K</i>² / <span style="text-decoration:overline">z</span>. Points inside the circle go outside, the circle itself stays fixed, and 0 is swapped with ∞.</p>
  <h2>Circles go to circles</h2>
  <p>Drag the blue circle. Its image (purple) is again a circle, unless the blue circle passes through 0, in which case the image is a straight line. Conversely, lines map to circles through 0. Notice that the <b>centre</b> of the circle does not map to the centre of the image circle: the hollow purple dot is the image of the centre.</p>
  <p>A circle that meets the red circle at right angles is mapped onto itself. The readout tells you when this happens: the condition is |<i>c</i>|² = <i>r</i>² + <i>K</i>². Inversion also reverses angles (it is <b>anticonformal</b>), and Möbius transformations are compositions of two inversions.</p>`,
});
const [pl] = P.planes, ui = P.ui;
const mode = ui.select("Shape", [["circle", "Circle"], ["line", "Line"], ["point", "Point"]], "circle", setMode);
const K = ui.slider("K (radius)", 0.4, 2, 0.01, 1, v => v.toFixed(2));
ui.buttons([["Make orthogonal", () => {
  const c = pl.get("O"), k = K.value; const r = Math.sqrt(Math.max(0.01, C.abs2(c) - k * k));
  if (C.abs(c) <= k) pl.set("O", C.scale(C.unit(c), k * 1.5));
  const c2 = pl.get("O"), r2 = Math.sqrt(C.abs2(c2) - k * k); pl.set("Q", C.add(c2, { x: 0, y: r2 }));
}], ["Through 0", () => { const c = pl.get("O"); pl.set("Q", C.ZERO); }]]);
pl.handle("O", { x: 1.2, y: 0.6 }, { color: "c1", label: "c" });
pl.handle("Q", { x: 1.2, y: 1.2 }, { color: "c1" });
pl.handle("L1", { x: 0.6, y: -1.5 }, { color: "c1" });
pl.handle("L2", { x: 1.5, y: 1 }, { color: "c1" });
pl.handle("p", { x: 0.6, y: 0.35 }, { color: "c1", label: "z" });
function setMode(m) {
  pl.handles.O.hidden = pl.handles.Q.hidden = m !== "circle";
  pl.handles.L1.hidden = pl.handles.L2.hidden = m !== "line";
  pl.handles.p.hidden = m !== "point";
}
setMode("circle");

VCA.run(() => {
  const k = K.value, inv = z => C.scale(z, k * k / C.abs2(z));
  pl.circle(C.ZERO, k, { color: "c5", width: 2.2, fill: "f5" });
  pl.dot(C.ZERO, { r: 3.5 });
  const m = mode.value;
  let info = "";
  if (m === "circle") {
    const c = pl.get("O"), r = C.dist(c, pl.get("Q"));
    pl.circle(c, r, { color: "c1", width: 2.5 });
    pl.curve(t => inv(C.add(c, C.polar(r, t))), 0, VCA.TAU, { color: "c3", width: 2.5, n: 720 });
    const ci = inv(c);
    pl.circle(ci, 0.05, { color: "c3", width: 2, fill: "paper" });
    const D = C.abs2(c) - r * r;
    info = row("c", "c1", `${C.fmt(c)}<br><span class="sub">r = ${num(r)}</span>`);
    if (Math.abs(D) < 0.02) info += `<hr><div>The circle passes through 0, so its image is a <b>line</b>.</div>`;
    else {
      const cc = C.scale(c, k * k / D), rr = k * k * r / Math.abs(D);
      pl.dot(cc, { color: "c3", r: 3 });
      info += row("c′", "c3", `${C.fmt(cc)}<br><span class="sub">r′ = ${num(rr)}</span>`) +
        `<hr><div class="sub">Image of the centre: ${C.fmt(ci)} (not the centre of the image)</div>` +
        `<div class="${Math.abs(D - k * k) < 0.03 ? "ok" : "sub"}">|c|² − r² = ${num(D)} ${Math.abs(D - k * k) < 0.03 ? "= K²: orthogonal, mapped to itself" : "(orthogonal when this equals K² = " + num(k * k) + ")"}</div>`;
    }
  } else if (m === "line") {
    const a = pl.get("L1"), b = pl.get("L2"), v = C.sub(b, a);
    pl.fullLine(a, v, { color: "c1", width: 2.5 });
    pl.curve(s => inv(C.add(a, C.scale(v, Math.tan(s)))), -Math.PI / 2 + 1e-4, Math.PI / 2 - 1e-4, { color: "c3", width: 2.5, n: 1200 });
    const dist = Math.abs(C.cross(v, C.neg(a))) / C.abs(v);
    info = `<div>Distance from 0 to the line: ${num(dist)}</div><div class="sub">The image is a circle through 0 of diameter K²/d = ${dist > 1e-3 ? num(k * k / dist) : "∞"}.</div>`;
  } else {
    const z = pl.get("p"), zi = inv(z);
    pl.fullLine(C.ZERO, z, { color: "muted", width: 1, dash: "4 4" });
    pl.dot(zi, { color: "c3", r: 7 });
    pl.label(zi, "z′", "c3", 18);
    info = row("z", "c1", `${C.fmt(z)}<br><span class="sub">|z| = ${num(C.abs(z))}</span>`) + row("z′", "c3", `${C.fmt(zi)}<br><span class="sub">|z′| = ${num(C.abs(zi))}</span>`) +
      `<hr><div>|z|·|z′| = ${num(C.abs(z) * C.abs(zi))} = K²</div>`;
  }
  P.read(info);
});
