export type OfferType = "infoproduit" | "coaching" | "ecommerce" | "physique";
export type PageGoal = "capture" | "vente" | "remerciement";
export type HeroLayout = "split-left" | "split-right" | "centered";
export type Typography = "impact" | "premium" | "minimal";
export type BonusSection = "temoignages" | "faq" | "garantie" | "tarifs";

export interface FunnelConfig {
  productName: string;
  offerType: OfferType;
  avatar: string;
  pageGoal: PageGoal;
  ambianceColor: string;
  bgColor: string;
  accentColor: string;
  heroLayout: HeroLayout;
  typography: Typography;
  sectionsCount: number;
  bonusSections: BonusSection[];
}

const FONT_STACKS: Record<Typography, string> = {
  impact: "'Archivo Black', 'Helvetica Neue', Arial, sans-serif",
  premium: "'Playfair Display', Georgia, 'Times New Roman', serif",
  minimal: "'Inter', system-ui, -apple-system, sans-serif",
};

const GOAL_CTA: Record<PageGoal, string> = {
  capture: "JE REÇOIS MON ACCÈS GRATUIT",
  vente: "JE COMMANDE MAINTENANT",
  remerciement: "ACCÉDER À MON ESPACE",
};

const GOAL_HEADLINE: Record<PageGoal, string> = {
  capture: "TÉLÉCHARGEZ LA MÉTHODE QUI CHANGE TOUT",
  vente: "LA SOLUTION D'ÉLITE QUE VOUS ATTENDIEZ",
  remerciement: "MERCI — VOTRE COMMANDE EST CONFIRMÉE",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateFunnelHtml(config: FunnelConfig): string {
  const {
    productName,
    avatar,
    pageGoal,
    ambianceColor,
    bgColor,
    accentColor,
    heroLayout,
    typography,
    sectionsCount,
    bonusSections,
  } = config;

  const product = escapeHtml(productName || "Votre Offre");
  const cta = GOAL_CTA[pageGoal];
  const headline = GOAL_HEADLINE[pageGoal];
  const font = FONT_STACKS[typography];
  const heroAlign =
    heroLayout === "centered" ? "center" : heroLayout === "split-right" ? "right" : "left";

  const featureCount = Math.max(4, sectionsCount);
  const features = Array.from({ length: featureCount }, (_, i) => {
    return `      <article class="ts-feature-card">
        <div class="ts-feature-icon">0${i + 1}</div>
        <h3 class="ts-feature-title">PILIER N°${i + 1}</h3>
        <p class="ts-feature-text">Un bénéfice concret et mesurable pensé pour ${escapeHtml(
          avatar || "votre client idéal",
        )}.</p>
      </article>`;
  }).join("\n");

  const testimonials = bonusSections.includes("temoignages")
    ? `
  <section class="ts-testimonials">
    <div class="ts-container">
      <h2 class="ts-section-title">ILS ONT FRANCHI LE CAP</h2>
      <div class="ts-testimonial-grid">
        ${[1, 2, 3]
          .map(
            (n) => `<blockquote class="ts-testimonial">
          <p>"Des résultats au-delà de mes attentes. Une transformation totale grâce à ${product}."</p>
          <cite>— Client Satisfait ${n}</cite>
        </blockquote>`,
          )
          .join("\n        ")}
      </div>
    </div>
  </section>`
    : "";

  const pricing = bonusSections.includes("tarifs")
    ? `
  <section class="ts-pricing">
    <div class="ts-container">
      <h2 class="ts-section-title">UN INVESTISSEMENT, UNE TRANSFORMATION</h2>
      <div class="ts-price-card">
        <span class="ts-price-old">997 €</span>
        <span class="ts-price-now">497 €</span>
        <p class="ts-price-note">Offre de lancement — places limitées</p>
        <a href="#cta" class="ts-btn ts-btn-large">${cta}</a>
      </div>
    </div>
  </section>`
    : "";

  const guarantee = bonusSections.includes("garantie")
    ? `
  <section class="ts-guarantee">
    <div class="ts-container">
      <div class="ts-guarantee-badge">30 JOURS</div>
      <h2 class="ts-section-title">GARANTIE SATISFAIT OU REMBOURSÉ</h2>
      <p class="ts-guarantee-text">Testez sans aucun risque. Si vous n'êtes pas pleinement satisfait, nous vous remboursons intégralement.</p>
    </div>
  </section>`
    : "";

  const faq = bonusSections.includes("faq")
    ? `
  <section class="ts-faq">
    <div class="ts-container">
      <h2 class="ts-section-title">QUESTIONS FRÉQUENTES</h2>
      ${[
        "Pour qui est cette offre ?",
        "Combien de temps avant les premiers résultats ?",
        "Ai-je un accès à vie ?",
      ]
        .map(
          (q) => `<div class="ts-faq-item">
        <h3 class="ts-faq-question">${q.toUpperCase()}</h3>
        <p class="ts-faq-answer">Une réponse claire et rassurante pensée pour ${escapeHtml(
          avatar || "votre audience",
        )}.</p>
      </div>`,
        )
        .join("\n      ")}
    </div>
  </section>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${product}</title>
<style>
/* ===== FUNNELFORGE — Tunnel généré pour Systeme.io ===== */
/* Classes uniques préfixées .ts- | Mobile-first | Responsive */
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
.ts-page{font-family:${font};background:${bgColor};color:#f5f5f5;line-height:1.6;overflow-x:hidden;}
.ts-container{width:100%;max-width:1140px;margin:0 auto;padding:0 20px;}
.ts-btn{display:inline-block;background:${accentColor};color:#0a0a0a;font-weight:800;text-transform:uppercase;letter-spacing:.5px;text-decoration:none;padding:16px 28px;border-radius:10px;transition:transform .2s ease,box-shadow .2s ease;}
.ts-btn:hover{transform:translateY(-2px);box-shadow:0 12px 30px -8px ${accentColor};}
.ts-btn-large{font-size:1.05rem;padding:20px 36px;margin-top:18px;}

/* HERO */
.ts-hero{background:linear-gradient(160deg, ${ambianceColor}, ${bgColor});padding:72px 0;}
.ts-hero-inner{display:flex;flex-direction:column;gap:32px;text-align:center;}
.ts-hero-eyebrow{text-transform:uppercase;letter-spacing:2px;font-size:.8rem;color:${accentColor};font-weight:700;}
.ts-hero-title{font-size:2rem;text-transform:uppercase;line-height:1.1;margin:14px 0 18px;}
.ts-hero-sub{font-size:1.1rem;opacity:.85;max-width:560px;margin:0 auto;}
.ts-hero-visual{background:rgba(255,255,255,.05);border:1px solid ${accentColor};border-radius:16px;min-height:240px;display:flex;align-items:center;justify-content:center;font-weight:800;letter-spacing:1px;opacity:.6;}

/* FEATURES */
.ts-features{padding:72px 0;}
.ts-section-title{font-size:1.7rem;text-transform:uppercase;text-align:center;margin-bottom:40px;}
.ts-feature-grid{display:grid;grid-template-columns:1fr;gap:22px;}
.ts-feature-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:28px;}
.ts-feature-icon{display:inline-block;color:${accentColor};font-size:1.4rem;font-weight:800;margin-bottom:10px;}
.ts-feature-title{text-transform:uppercase;font-size:1.1rem;margin-bottom:8px;}
.ts-feature-text{opacity:.8;}

/* TESTIMONIALS */
.ts-testimonials{padding:72px 0;background:rgba(255,255,255,.03);}
.ts-testimonial-grid{display:grid;grid-template-columns:1fr;gap:22px;}
.ts-testimonial{background:${bgColor};border-left:3px solid ${accentColor};padding:24px;border-radius:10px;font-style:italic;}
.ts-testimonial cite{display:block;margin-top:14px;color:${accentColor};font-style:normal;font-weight:700;}

/* PRICING */
.ts-pricing{padding:72px 0;text-align:center;}
.ts-price-card{background:linear-gradient(160deg,${ambianceColor},${bgColor});border:1px solid ${accentColor};border-radius:18px;padding:40px;max-width:480px;margin:0 auto;}
.ts-price-old{display:block;text-decoration:line-through;opacity:.5;font-size:1.3rem;}
.ts-price-now{display:block;color:${accentColor};font-size:3rem;font-weight:800;}
.ts-price-note{opacity:.75;margin-top:10px;}

/* GUARANTEE */
.ts-guarantee{padding:72px 0;text-align:center;}
.ts-guarantee-badge{display:inline-block;background:${accentColor};color:#0a0a0a;font-weight:800;padding:14px 22px;border-radius:50px;margin-bottom:20px;}
.ts-guarantee-text{max-width:600px;margin:0 auto;opacity:.85;}

/* FAQ */
.ts-faq{padding:72px 0;background:rgba(255,255,255,.03);}
.ts-faq-item{max-width:760px;margin:0 auto 18px;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:22px;}
.ts-faq-question{text-transform:uppercase;font-size:1rem;color:${accentColor};margin-bottom:8px;}
.ts-faq-answer{opacity:.8;}

/* CTA */
.ts-cta{padding:80px 0;text-align:center;background:linear-gradient(160deg,${ambianceColor},${bgColor});}
.ts-cta-title{font-size:1.9rem;text-transform:uppercase;margin-bottom:24px;}

/* FOOTER */
.ts-footer{padding:32px 0;text-align:center;opacity:.5;font-size:.85rem;}

/* ===== RESPONSIVE — Tablette & Desktop ===== */
@media(min-width:768px){
  .ts-hero{padding:110px 0;}
  .ts-hero-title{font-size:3.2rem;}
  .ts-hero-inner{flex-direction:row;align-items:center;text-align:${heroAlign === "center" ? "center" : "left"};${
    heroLayout === "split-right" ? "flex-direction:row-reverse;" : ""
  }}
  ${heroLayout === "centered" ? ".ts-hero-inner{flex-direction:column;}.ts-hero-visual{width:100%;max-width:680px;margin:0 auto;}" : ".ts-hero-inner>*{flex:1;}"}
  .ts-feature-grid{grid-template-columns:repeat(2,1fr);}
  .ts-testimonial-grid{grid-template-columns:repeat(3,1fr);}
  .ts-section-title{font-size:2.2rem;}
}
@media(min-width:1024px){
  .ts-feature-grid{grid-template-columns:repeat(3,1fr);}
}
</style>
</head>
<body>
<div class="ts-page">

  <section class="ts-hero">
    <div class="ts-container ts-hero-inner">
      <div class="ts-hero-copy">
        <span class="ts-hero-eyebrow">${product}</span>
        <h1 class="ts-hero-title">${headline}</h1>
        <p class="ts-hero-sub">Une offre conçue spécialement pour ${escapeHtml(
          avatar || "celles et ceux qui veulent passer au niveau supérieur",
        )}.</p>
        <a href="#cta" class="ts-btn ts-btn-large">${cta}</a>
      </div>
      <div class="ts-hero-visual">VISUEL PRODUIT</div>
    </div>
  </section>

  <section class="ts-features">
    <div class="ts-container">
      <h2 class="ts-section-title">CE QUE VOUS OBTENEZ</h2>
      <div class="ts-feature-grid">
${features}
      </div>
    </div>
  </section>
${testimonials}${pricing}${guarantee}${faq}

  <section class="ts-cta" id="cta">
    <div class="ts-container">
      <h2 class="ts-cta-title">PRÊT À PASSER À L'ACTION ?</h2>
      <a href="#" class="ts-btn ts-btn-large">${cta}</a>
    </div>
  </section>

  <footer class="ts-footer">
    <div class="ts-container">© ${new Date().getFullYear()} ${product} — Tous droits réservés.</div>
  </footer>

</div>
</body>
</html>`;
}
