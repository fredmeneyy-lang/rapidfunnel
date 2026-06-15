import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Zap,
  Code2,
  Smartphone,
  Palette,
  ArrowRight,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FunnelForge — Générateur de tunnels de vente d'élite pour Systeme.io" },
      {
        name: "description",
        content:
          "Créez des tunnels de vente HTML/CSS haut de gamme optimisés pour Systeme.io. Code propre, responsive mobile-first, prêt à coller. 10 crédits offerts.",
      },
      { property: "og:title", content: "FunnelForge — Tunnels de vente d'élite pour Systeme.io" },
      {
        property: "og:description",
        content: "Générez des tunnels de vente HTML/CSS premium en quelques clics. 10 crédits offerts.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Code2, title: "Code propre & unique", text: "Classes CSS préfixées (.ts-) sans conflit, prêtes pour Systeme.io." },
  { icon: Smartphone, title: "Responsive mobile-first", text: "Chaque tunnel s'adapte parfaitement à tous les écrans." },
  { icon: Palette, title: "Charte sur-mesure", text: "Vos couleurs, votre layout, votre typographie premium." },
  { icon: Zap, title: "Génération instantanée", text: "Un brief, un clic, votre tunnel d'élite est livré." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-gold" />
          <span className="font-display text-xl font-bold tracking-tight">FunnelForge</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Connexion</Button>
          </Link>
          <Link to="/auth">
            <Button variant="gold" size="sm">Commencer</Button>
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-16 pb-24 text-center">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-gradient-gold opacity-[0.12] blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-medium text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            Optimisé pour Systeme.io
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.1] sm:text-6xl">
            Des tunnels de vente{" "}
            <span className="text-gradient-gold">d'élite</span> en quelques clics
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Décrivez votre offre, choisissez votre style, et obtenez un code HTML/CSS
            premium, propre et responsive — prêt à coller dans Systeme.io.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/auth">
              <Button variant="gold" size="xl" className="group">
                Générer mon tunnel d'élite
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">
              <Check className="mr-1 inline h-4 w-4 text-gold" />
              10 crédits offerts à l'inscription
            </span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-gold/40"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10">
                <f.icon className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-dark p-12 text-center shadow-elegant">
          <div className="pointer-events-none absolute -bottom-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-gold opacity-10 blur-3xl" />
          <h2 className="relative font-display text-3xl font-bold sm:text-4xl">
            Prêt à créer votre prochain tunnel ?
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-muted-foreground">
            Inscrivez-vous gratuitement et lancez votre première génération dès maintenant.
          </p>
          <div className="relative mt-8">
            <Link to="/auth">
              <Button variant="gold" size="xl">Commencer gratuitement</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FunnelForge. Tous droits réservés.
      </footer>
    </div>
  );
}
