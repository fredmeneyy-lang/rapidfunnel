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

export async function generateFunnelHtml(config: FunnelConfig): Promise<string> {
  const {
    productName,
    offerType,
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

  const font = FONT_STACKS[typography];
  const cta = GOAL_CTA[pageGoal];

  const heroDirection =
    heroLayout === "centered"
      ? "column; text-align:center;"
      : heroLayout === "split-right"
      ? "row-reverse;"
      : "row;";

  const prompt = `Tu es un expert en copywriting et tunnels de vente haute conversion optimisés pour Systeme.io.

Génère un fichier HTML/CSS COMPLET et autonome pour un tunnel de vente avec ces paramètres :

- Produit/Service : ${productName}
- Type d'offre : ${offerType}
- Avatar client (cible, peurs, désirs) : ${avatar || "entrepreneur cherchant à développer son activité en ligne"}
- Objectif de la page : ${pageGoal}
- Sections bonus à inclure : ${bonusSections.join(", ") || "aucune"}
- Nombre de sections principales : ${sectionsCount}

Couleurs :
- Fond principal : ${bgColor}
- Couleur d'ambiance/gradient : ${ambianceColor}
- Couleur accent (boutons, titres clés) : ${accentColor}

Typographie : ${font}
Layout Hero : ${heroLayout} (flex-direction: ${heroDirection})
CTA principal : "${cta}"

RÈGLES STRICTES :
1. Retourne UNIQUEMENT le code HTML complet — aucune explication, aucun texte avant ou après, aucune balise markdown ou triple backtick
2. Le fichier doit commencer par <!DOCTYPE html> et finir par </html>
3. Tout le CSS doit être dans une balise <style> dans le <head>
4. TOUTES les classes CSS doivent être préfixées avec .ts- (ex: .ts-hero, .ts-btn) pour éviter les conflits Systeme.io
5. Le design doit être premium, mobile-first et responsive (media queries à 768px et 1024px)
6. Utilise EXACTEMENT les couleurs fournies
7. Écris un vrai copywriting persuasif et personnalisé basé sur l'avatar client — pas de placeholders comme "PILIER N°1" ou "bénéfice concret"
8. Génère de vrais témoignages fictifs crédibles si la section témoignages est demandée
9. Génère de vraies questions/réponses FAQ pertinentes si la section FAQ est demandée
10. Le contenu doit être entièrement en français`;

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Clé API Anthropic manquante. Vérifiez votre variable d'environnement VITE_ANTHROPIC_API_KEY.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Erreur API Claude (${response.status}): ${
        (errorData as { error?: { message?: string } }).error?.message || "Erreur inconnue"
      }`
    );
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };

  const html = data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  // Nettoyer les éventuelles balises markdown si Claude en ajoute
  return html
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}
