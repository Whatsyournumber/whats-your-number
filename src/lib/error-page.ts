/**
 * Página de error del servidor con la misma estética que la 404 de la marca
 * (faro, estrellas, fondo oscuro). Es HTML estático porque se sirve cuando
 * React no pudo renderizar.
 */
export function renderErrorPage(pathname = "/"): string {
  const en = pathname === "/en" || pathname.startsWith("/en/");
  const t = (es: string, enText: string) => (en ? enText : es);
  const home = en ? "/en" : "/";
  const stars = Array.from({ length: 28 }, (_, i) => {
    const f = (x: number) => x - Math.floor(x);
    const a = f(Math.sin(i * 12.9898) * 43758.5453);
    const b = f(Math.sin(i * 78.233) * 12345.6789);
    const c = f(Math.sin(i * 39.425) * 24634.6345);
    const s = (1.5 + c * 2.5).toFixed(2);
    return `<span class="star" style="top:${(3 + a * 84).toFixed(2)}%;left:${(2 + b * 96).toFixed(2)}%;width:${s}px;height:${s}px;animation-delay:${(a * 6).toFixed(2)}s;animation-duration:${(3.2 + b * 4.5).toFixed(2)}s"></span>`;
  }).join("");

  return `<!doctype html>
<html lang="${en ? "en" : "es"}">
  <head>
    <meta charset="utf-8" />
    <title>${t("Esta página no cargó · WhatsYourNumber", "This page didn't load · WhatsYourNumber")}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <style>
      *{box-sizing:border-box}
      body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:3.5rem 1rem;background:#14161F;color:#F8FAFC;font:15px/1.5 Inter,system-ui,-apple-system,sans-serif;overflow:hidden;position:relative}
      .sky{position:absolute;inset:0;pointer-events:none;overflow:hidden}
      .glow{position:absolute;inset:auto 0 0 0;height:33%;background:linear-gradient(to top,rgba(52,211,153,.12),rgba(52,211,153,.04),transparent)}
      .beam{position:absolute;top:38%;left:50%;width:140vmax;height:40vmax;transform-origin:0 50%;background:conic-gradient(from -12deg at 0 50%,transparent,rgba(52,211,153,.10),transparent 24deg);animation:sweep 9s ease-in-out infinite alternate}
      .star{position:absolute;border-radius:50%;background:#F8FAFC;opacity:.15;animation:twinkle 4s ease-in-out infinite}
      @keyframes twinkle{50%{opacity:.8}}
      @keyframes sweep{from{transform:rotate(160deg)}to{transform:rotate(380deg)}}
      @keyframes halo{50%{opacity:.9;transform:scale(1.1)}}
      @keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
      main{position:relative;z-index:1;max-width:36rem;width:100%;text-align:center;display:flex;flex-direction:column;align-items:center;animation:rise .6s cubic-bezier(.32,.72,0,1) both}
      .pill{display:inline-flex;align-items:center;gap:.5rem;border:1px solid rgba(148,163,184,.2);background:rgba(30,41,59,.7);border-radius:999px;padding:.25rem .75rem;font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#94A3B8}
      .dot{width:6px;height:6px;border-radius:50%;background:#34D399}
      h1{margin:1.25rem 0 0;display:flex;align-items:center;gap:.03em;font-size:8rem;line-height:.82;font-weight:700;letter-spacing:-.05em}
      .zero{position:relative;width:.78em;height:.78em;border-radius:50%;background:rgba(52,211,153,.05);box-shadow:inset 0 0 0 1px rgba(52,211,153,.25);display:grid;place-items:center}
      .zero::before{content:"";position:absolute;inset:0;border-radius:50%;background:rgba(52,211,153,.3);filter:blur(24px);opacity:.5;animation:halo 3.5s ease-in-out infinite}
      
      .lead{margin:1.25rem 0 0;font-size:1.25rem;font-weight:600}
      .sub{margin:.5rem auto 0;max-width:28rem;font-size:.875rem;color:#94A3B8}
      .actions{margin-top:2rem;display:flex;gap:.625rem;flex-wrap:wrap;justify-content:center}
      .btn{display:inline-flex;align-items:center;gap:.5rem;border-radius:999px;padding:.75rem 1.75rem;font:600 .875rem Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none;border:1px solid transparent;transition:transform .2s}
      .btn:hover{transform:scale(1.03)}
      .primary{background:#34D399;color:#06281D;box-shadow:0 0 32px rgba(52,211,153,.35)}
      .secondary{background:rgba(30,41,59,.6);color:#F8FAFC;border-color:rgba(148,163,184,.2)}
      .help{margin-top:2.5rem;font-size:.8rem;color:#94A3B8}
      .help a{color:#F8FAFC}
      @media (max-width:640px){h1{font-size:6rem}}
      @media (prefers-reduced-motion:reduce){*{animation:none!important}}
    </style>
  </head>
  <body>
    <div class="sky" aria-hidden="true"><div class="beam"></div>${stars}<div class="glow"></div></div>
    <main>
      <span class="pill"><span class="dot"></span>${t("Algo falló", "Something went wrong")}</span>
      <h1 aria-label="404"><span>4</span><span class="zero" aria-hidden="true"><img src="/__l5e/assets-v1/39f570ec-8267-4103-b468-0ffc20a1f895/brand-lighthouse-clean.png" alt="" style="position:relative;width:.5em;height:.5em;object-fit:contain;filter:drop-shadow(0 0 6px rgba(52,211,153,.45))" /></span><span>4</span></h1>
      <p class="lead">${t("Esta página no cargó.", "This page didn't load.")}</p>
      <p class="sub">${t("Algo falló de nuestro lado. Puedes reintentar o volver al inicio.", "Something went wrong on our end. You can retry or go back home.")}</p>
      <div class="actions">
        <button class="btn primary" onclick="location.reload()">↻ ${t("Reintentar", "Try again")}</button>
        <a class="btn secondary" href="${home}">← ${t("Volver al inicio", "Back to home")}</a>
      </div>
      <p class="help">${t("¿Sigue fallando? Escríbenos a", "Still broken? Email us at")} <a href="mailto:wyn.welcome@gmail.com">wyn.welcome@gmail.com</a></p>
    </main>
  </body>
</html>`;
}
