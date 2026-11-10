const { C, num, row } = VCA;
const P = VCA.page({
  id: "ch05-analytic-continuation",
  kicker: "Carry a branch of log z (or √z) from disc to overlapping disc around the origin.",
  planes: [{ R: 2, title: "z-plane: chain of discs" }, { R: 4, title: "w-plane: values of the continued function" }],
  explain: `
  <h2>Continuing a function disc by disc</h2>
  <p>An analytic function is determined everywhere by its values on any small disc. If two discs overlap, a function on the first has at most one analytic continuation to the second. Start with a branch of log <i>z</i> on the first disc and continue it around a chain of discs, each centred on a circle around 0. Each disc reaches up to, but not past, the singularity at 0, just like the disc of convergence of the Taylor series there.</p>
  <p>On the right each disc's image is shown in its own colour. For log, the images march upward. After one full circuit the continued function has gained exactly 2π<i>i</i>: we are back at the same <i>z</i> but on a different branch. For √<i>z</i> the value changes sign, and two circuits are needed to return. This is the analytic, disc-by-disc version of the branch-point picture in Chapter 2.</p>`,
});
const [zp, wp] = P.planes, ui = P.ui;
const fsel = ui.select("Function", [["log", "log z"], ["sqrt", "√z"]], "log", v => wp.setView(v === "log" ? 4.5 : 2, v === "log" ? { x: 0, y: 3 } : { x: 0, y: 0 }));
const per = ui.slider("Discs per turn", 7, 16, 1, 8);
const turns = ui.slider("Turns", 0.25, 2, 0.25, 1, v => v.toFixed(2));
const shown = ui.slider("Discs shown (%)", 5, 100, 1, 100, v => v + "%");
zp.handle("s", { x: 1.2, y: 0 }, { color: "c3", label: "start" });
const play = VCA.anim(dt => { let v = shown.value + 25 * dt; if (v > 100) v = 5; shown.value = Math.round(v); });
ui.toggle("Animate", play);
wp.setView(4.5, { x: 0, y: 3 });
const cols = ["c1", "c2", "c4", "c3", "c6", "c5"];

VCA.run(() => {
  const s = zp.get("s"), r0 = C.abs(s), th0 = C.arg(s), n = per.value, total = Math.round(n * turns.value);
  const k1 = Math.max(1, Math.round(total * shown.value / 100)), d = VCA.TAU / n;
  const branch = (z, c, T) => { const L = { x: Math.log(C.abs(z)), y: T + C.arg(C.div(z, c)) }; return fsel.value === "log" ? L : C.exp(C.scale(L, 0.5)); };
  zp.curve(t => C.polar(r0, t), th0, th0 + VCA.TAU * turns.value, { color: "muted", width: 1, dash: "4 4", n: 200 });
  zp.cross(C.ZERO, { color: "c5" });
  let first, last;
  for (let k = 0; k <= Math.min(k1, total); k++) {
    const T = th0 + k * d, c = C.polar(r0, T), rad = 0.92 * r0, col = cols[k % cols.length];
    zp.circle(c, rad, { color: col, width: 1.6, fill: "f" + col[1], opacity: 0.85 });
    zp.dot(c, { color: col, r: 3.5 });
    wp.curve(t => branch(C.add(c, C.polar(rad, t)), c, T), 0, VCA.TAU, { color: col, width: 1.6, fill: "f" + col[1], n: 160, jump: Infinity });
    const v = branch(c, c, T); wp.dot(v, { color: col, r: 4 });
    if (k === 0) first = v; last = v;
  }
  wp.label(first, "start", "c3", 16, C.add(first, { x: 1, y: 0 }), { size: 15 });
  const diff = C.sub(last, first);
  const done = k1 >= total;
  P.read(row("start", "c3", `f = ${C.fmt(first, 3)}`) + row("now", "", `f = ${C.fmt(last, 3)}`) +
    `<hr><div>${fsel.value === "log" ? `Change: ${C.fmt(diff, 3)} = ${num(diff.y / Math.PI, 2)}π i` : `Ratio: ${C.fmt(C.div(last, first), 3)}`}</div>` +
    `<div class="sub">${done ? `After ${num(turns.value, 2)} turn(s) of continuation.` : "Continuation in progress…"}</div>`);
});
