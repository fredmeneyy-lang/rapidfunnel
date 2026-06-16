import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import process from "node:process";

const FunnelConfigSchema = z.object({
  productName: z.string(),
  offerType: z.enum(["infoproduit", "coaching", "ecommerce", "physique"]),
  avatar: z.string(),
  pageGoal: z.enum(["capture", "vente", "remerciement"]),
  ambianceColor: z.string(),
  bgColor: z.string(),
  accentColor: z.string(),
  heroLayout: z.enum(["split-left", "split-right", "centered"]),
  typography: z.enum(["impact", "premium", "minimal"]),
  sectionsCount: z.number(),
  bonusSections: z.array(z.enum(["temoignages", "faq", "garantie", "tarifs"])),
});

const FONT_STACKS = {
  impact: "'Archivo Black', 'Helvetica Neue', Arial, sans-serif",
  premium: "'Playfair Display', Georgia, 'Times New Roman', serif",
  minimal: "'Inter', system-ui, -apple-system, sans-serif",
} as const;

const GOAL_CTA = {
  capture: "JE REÇOIS MON ACCÈS GRATUIT",
  vente: "JE COMMANDE MAINTENANT",
  remerciement: "ACCÉDER À MON ESPACE",
} as const;

export const generateFunnel = createServerFn({ method: "POST" })
  .inputValidator(z.object({ config: FunnelConfigSchema }))
  .handler(async ({ data }) => {
    const { config } = data;

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Clé API Anthropic manquante. Ajoutez ANTHROPIC_API_KEY dans vos variables d'environnement Lovable."
      );
    }

    const font = FONT_STACKS[config.typography];
    const cta = GOAL_CTA[config.pageGoal];

    const heroDirection =
      config.heroLayout === "centered"
        ? "column; text-align:center;"
        : config.heroLayout === "split-right"
        ? "row-reverse;"
        : "row;";

    const prompt = `Tu es un expert en copywriting et tunnels de vente haute conversion optimisés pour Systeme.io.

Génère un fichier HTML/CSS COMPLET et autonome pour un tunnel de vente avec ces paramètres :

- Produit/Service : ${config.productName}
- Type d'offre : ${config.offerType}
- Avatar client (cible, peurs, désirs) : ${config.avatar || "entrepreneur cherchant à développer son activité en ligne"}
- Objectif de la page : ${config.pageGoal}
- Sections bonus à inclure : ${config.bonusSections.join(", ") || "aucune"}
- Nombre de sections principales : ${config.sectionsCount}

Couleurs :
- Fond principal : ${config.bgColor}
- Couleur d'ambiance/gradient : ${config.ambianceColor}
- Couleur accent (boutons, titres clés) : ${config.accentColor}

Typographie : ${font}
Layout Hero : ${config.heroLayout} (flex-direction: ${heroDirection})
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
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      throw new Error(
        `Erreur API Claude (${response.status}): ${errorData.error?.message ?? "Erreur inconnue"}`
      );
    }

    const result = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };

    const html = result.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    return { html };
  });
