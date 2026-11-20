(() => {
  const LAUNCH = new Date("2026-12-18T00:00:00-06:00");
  const START = new Date("2026-11-18T00:00:00-06:00");
  const TZ = "America/Mexico_City";
  const DAY = 86400000;

  const LOGO = `<svg class="logo" viewBox="209 592 1581 226" role="img" aria-label="Celux">
    <rect class="bar v" style="--i:0" x="209" y="592" width="33" height="218"/>
    <rect class="bar" style="--i:1" x="209" y="592" width="248" height="33"/>
    <rect class="bar" style="--i:2" x="209" y="777" width="248" height="33"/>
    <rect class="bar e" style="--i:3" x="551" y="592" width="247" height="33"/>
    <rect class="bar e" style="--i:4" x="551" y="685" width="153" height="33"/>
    <rect class="bar e" style="--i:5" x="551" y="777" width="247" height="33"/>
    <rect class="bar v" style="--i:6" x="891" y="592" width="33" height="226"/>
    <rect class="bar" style="--i:7" x="891" y="785" width="244" height="33"/>
    <rect class="bar v" style="--i:8" x="1228" y="592" width="33" height="226"/>
    <rect class="bar v" style="--i:8" x="1439" y="592" width="33" height="226"/>
    <rect class="bar" style="--i:9" x="1228" y="785" width="244" height="33"/>
    <g stroke-width="33">
      <line class="arm" style="--i:10" x1="1578" y1="605" x2="1665.5" y2="693"/>
      <line class="arm" style="--i:10" x1="1777" y1="605" x2="1689.5" y2="693"/>
      <line class="arm" style="--i:11" x1="1578" y1="805" x2="1665.5" y2="717"/>
      <line class="arm" style="--i:11" x1="1777" y1="805" x2="1689.5" y2="717"/>
    </g>
  </svg>`;

  // Dígitos con el sistema de barras del logo
  const W = 10, H = 15, T = 1.45, MID = (H - T) / 2, GAP = 3.6;
  const SEG = {
    a: [0, 0, W, T], b: [W - T, 0, T, H / 2 + T / 2], c: [W - T, MID, T, H - MID],
    d: [0, H - T, W, T], e: [0, MID, T, H - MID], f: [0, 0, T, H / 2 + T / 2], g: [0, MID, W, T],
  };
  const MAP = ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abcdfg"];

  function render(svg, str) {
    if (svg.dataset.v === str) return;
    svg.dataset.v = str;
    svg.setAttribute("viewBox", `0 0 ${str.length * W + (str.length - 1) * GAP} ${H}`);
    let out = "";
    [...str].forEach((ch, i) => {
      for (const s of MAP[+ch]) {
        const [x, y, w, h] = SEG[s];
        out += `<rect x="${x + i * (W + GAP)}" y="${y}" width="${w}" height="${h}"/>`;
      }
    });
    svg.innerHTML = out;
  }

  const pad = n => String(n).padStart(2, "0");
  const UNITS = [["d", "día", "días"], ["h", "hora", "horas"], ["m", "minuto", "minutos"], ["s", "segundo", "segundos"]];

  function mountCountdown(el) {
    el.setAttribute("role", "timer");
    el.innerHTML = UNITS.map(([k]) =>
      `<div class="unit"><svg class="digits" data-unit="${k}" aria-hidden="true"></svg><span class="label" data-label="${k}"></span></div>`
    ).join("");
    return p => {
      for (const [k, one, many] of UNITS) {
        render(el.querySelector(`[data-unit="${k}"]`), pad(p[k]));
        el.querySelector(`[data-label="${k}"]`).textContent = p[k] === 1 ? one : many;
      }
    };
  }

  function parts(now = Date.now()) {
    const ms = Math.max(0, LAUNCH - now);
    const s = Math.floor(ms / 1000);
    return {
      now, ms,
      d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60,
      progress: Math.min(1, Math.max(0, (now - START) / (LAUNCH - START))),
      dayFraction: (((now - START) % DAY) + DAY) % DAY / DAY,
      minuteFraction: new Date(now).getSeconds() / 60,
    };
  }

  function boot(onTick) {
    document.querySelectorAll("[data-logo]").forEach(e => { e.innerHTML = LOGO; });
    const cd = document.querySelector("[data-countdown]");
    const update = cd && mountCountdown(cd);
    const when = document.querySelector("[data-when]");
    if (when) when.textContent = "Abrimos el " +
      new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: TZ }).format(LAUNCH) + ".";
    const year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
    const sr = document.querySelector("[data-sr]");
    let lastMin = -1;

    const tick = () => {
      const p = parts();
      if (p.ms <= 0) {
        document.body.classList.add("done");
        const h = document.querySelector("[data-headline]");
        if (h) h.textContent = "Ya llegamos.";
        if (when) when.textContent = "";
        onTick && onTick(p);
        return;
      }
      update && update(p);
      if (sr && p.m !== lastMin) {
        lastMin = p.m;
        sr.textContent = `Faltan ${p.d} días, ${p.h} horas y ${p.m} minutos.`;
      }
      onTick && onTick(p);
      setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    tick();
  }

  window.Celux = { LAUNCH, START, TZ, DAY, parts, boot };
})();
