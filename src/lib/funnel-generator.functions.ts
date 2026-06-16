import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateFunnelHtml, type FunnelConfig } from "@/lib/funnel-generator";

function buildPrompt(config: FunnelConfig): string {
  return `Tu es un expert en copywriting et en tunnels de vente haute conversion optimisés pour Systeme.io. Génère un fichier HTML/CSS complet et autonome pour un tunnel de vente avec ces paramètres :

- Produit/Service : ${config.productName}
- Type d'offre : ${config.offerType}
- Avatar client : ${config.avatar}
- Objectif de page : ${config.pageGoal}
- Couleur d'ambiance : ${config.ambianceColor}
- Couleur de fond : ${config.bgColor}
- Couleur accent : ${config.accentColor}
- Layout Hero : ${config.heroLayout}
- Typographie : ${config.typography}
- Nombre de sections : ${config.sectionsCount}
- Sections bonus : ${config.bonusSections.join(", ")}

Règles IMPORTANTES :
1. Retourne UNIQUEMENT le code HTML complet, sans explication ni balises markdown
2. Le CSS doit être intégré dans une balise <style> dans le <head>
3. Toutes les classes CSS doivent être préfixées avec .ts- pour éviter les conflits Systeme.io
4. Le design doit être premium, mobile-first et responsive
5. Utilise les couleurs fournies
6. Inclus un vrai copywriting persuasif basé sur l'avatar client
7. Tous les titres doivent être en LETTRES CAPITALES`;
}

function stripMarkdownFences(text: string): string {
  let out = text.trim();
  const fence = out.match(/^```(?:html)?\s*([\s\S]*?)\s*```$/i);
  if (fence) out = fence[1].trim();
  const start = out.indexOf("<!DOCTYPE");
  if (start > 0) out = out.slice(start);
  return out.trim();
}

/**
 * Generates the funnel HTML by calling the Anthropic Claude API server-side.
 * The API key never reaches the browser. Falls back to the local deterministic
 * generator if the key is missing or the API call fails, so the feature never hard-breaks.
 */
export const generateFunnel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { config: FunnelConfig }) => data)
  .handler(async ({ data }) => {
    const { config } = data;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return { html: generateFunnelHtml(config), source: "fallback" as const };
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 8000,
          messages: [{ role: "user", content: buildPrompt(config) }],
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        console.error("Anthropic API error", response.status, detail);
        return { html: generateFunnelHtml(config), source: "fallback" as const };
      }

      const result = (await response.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const text = result.content?.find((b) => b.type === "text")?.text ?? "";
      const html = stripMarkdownFences(text);

      if (!html.toLowerCase().includes("<html")) {
        return { html: generateFunnelHtml(config), source: "fallback" as const };
      }

      return { html, source: "claude" as const };
    } catch (err) {
      console.error("Anthropic request failed", err);
      return { html: generateFunnelHtml(config), source: "fallback" as const };
    }
  });
