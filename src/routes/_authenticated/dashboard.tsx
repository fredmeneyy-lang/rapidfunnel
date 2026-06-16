import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import {
  type FunnelConfig,
  type OfferType,
  type PageGoal,
  type HeroLayout,
  type Typography,
  type BonusSection,
} from "@/lib/funnel-generator";
import { generateFunnel } from "@/lib/funnel-generator.functions";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sparkles,
  Coins,
  LogOut,
  Target,
  Palette,
  LayoutGrid,
  Wand2,
  Loader2,
  Copy,
  Download,
  ArrowLeft,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Studio de génération — FunnelForge" }] }),
  component: Dashboard,
});

const CREDIT_COST = 10;

const OFFER_TYPES: { value: OfferType; label: string }[] = [
  { value: "infoproduit", label: "Infoproduit" },
  { value: "coaching", label: "Coaching / Service" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "physique", label: "Produit physique" },
];

const PAGE_GOALS: { value: PageGoal; label: string }[] = [
  { value: "capture", label: "Page de capture d'emails" },
  { value: "vente", label: "Page de vente directe" },
  { value: "remerciement", label: "Page de remerciement" },
];

const HERO_LAYOUTS: { value: HeroLayout; label: string }[] = [
  { value: "split-left", label: "Split Gauche" },
  { value: "split-right", label: "Split Droite" },
  { value: "centered", label: "Centré" },
];

const TYPOGRAPHIES: { value: Typography; label: string }[] = [
  { value: "impact", label: "Impact Moderne" },
  { value: "premium", label: "Élégant / Premium" },
  { value: "minimal", label: "Minimaliste" },
];

const BONUS: { value: BonusSection; label: string }[] = [
  { value: "temoignages", label: "Témoignages" },
  { value: "faq", label: "FAQ" },
  { value: "garantie", label: "Garantie" },
  { value: "tarifs", label: "Tarifs" },
];

const LOADING_STEPS = [
  "Analyse du brief stratégique…",
  "Définition de la charte graphique…",
  "Construction de la structure des sections…",
  "Rédaction du copywriting d'élite…",
  "Génération du code HTML/CSS propre…",
  "Optimisation pour Systeme.io…",
];

type View = "form" | "loading" | "result";

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const [view, setView] = useState<View>("form");
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const generateFunnelFn = useServerFn(generateFunnel);

  const [config, setConfig] = useState<FunnelConfig>({
    productName: "",
    offerType: "infoproduit",
    avatar: "",
    pageGoal: "vente",
    ambianceColor: "#1a1a1a",
    bgColor: "#0a0a0a",
    accentColor: "#d4af37",
    heroLayout: "split-left",
    typography: "premium",
    sectionsCount: 4,
    bonusSections: ["temoignages", "garantie"],
  });

  const credits = profile?.credits ?? 0;

  const set = <K extends keyof FunnelConfig>(key: K, value: FunnelConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const toggleBonus = (b: BonusSection) =>
    setConfig((c) => ({
      ...c,
      bonusSections: c.bonusSections.includes(b)
        ? c.bonusSections.filter((x) => x !== b)
        : [...c.bonusSections, b],
    }));

  const handleLogout = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const runLoadingAnimation = () =>
    new Promise<void>((resolve) => {
      let step = 0;
      setLoadingStep(0);
      const interval = setInterval(() => {
        step += 1;
        if (step >= LOADING_STEPS.length) {
          clearInterval(interval);
          resolve();
        } else {
          setLoadingStep(step);
        }
      }, 650);
    });

  const handleGenerate = async () => {
    if (!config.productName.trim()) {
      toast.error("Veuillez renseigner le nom de votre produit / service.");
      return;
    }
    if (credits < CREDIT_COST) {
      toast.error(
        `Crédits insuffisants. Il vous faut ${CREDIT_COST} crédits (solde : ${credits}).`,
      );
      return;
    }

    setView("loading");

    try {
      // Deduct credits atomically (server-side)
      const { data: newCredits, error } = await supabase.rpc("deduct_credits", {
        amount: CREDIT_COST,
      });

      if (error) {
        if (error.message.includes("INSUFFICIENT_CREDITS")) {
          toast.error("Crédits insuffisants pour lancer la génération.");
        } else {
          toast.error("Erreur lors de la déduction des crédits.");
        }
        setView("form");
        return;
      }

      // Persist funnel history (non-blocking for UX)
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("funnels").insert({
          user_id: userData.user.id,
          product_name: config.productName,
          offer_type: config.offerType,
          page_goal: config.pageGoal,
          brief: config as unknown as import("@/integrations/supabase/types").Json,
        });
      }

      await runLoadingAnimation();

      const { html } = await generateFunnelFn({ data: { config } });
      setGeneratedHtml(html);

      queryClient.setQueryData(["profile"], (old: typeof profile) =>
        old ? { ...old, credits: newCredits as number } : old,
      );
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      setView("result");
      toast.success(`Tunnel généré ! ${CREDIT_COST} crédits déduits.`);
    } catch {
      toast.error("Une erreur inattendue est survenue.");
      setView("form");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedHtml);
    setCopied(true);
    toast.success("Code copié — prêt pour Systeme.io !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.productName.replace(/\s+/g, "-").toLowerCase() || "tunnel"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Fichier .html téléchargé !");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <span className="font-display text-lg font-bold tracking-tight">FunnelForge</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5">
              <Coins className="h-4 w-4 text-gold" />
              <span className="text-sm font-semibold text-gold">{credits}</span>
              <span className="text-xs text-muted-foreground">crédits</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Déconnexion">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {view === "form" && (
        <FormView
          config={config}
          set={set}
          toggleBonus={toggleBonus}
          credits={credits}
          onGenerate={handleGenerate}
        />
      )}

      {view === "loading" && <LoadingView step={loadingStep} />}

      {view === "result" && (
        <ResultView
          html={generatedHtml}
          copied={copied}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onBack={() => setView("form")}
        />
      )}
    </div>
  );
}

/* ---------------- FORM ---------------- */
function SectionCard({
  icon: Icon,
  step,
  title,
  desc,
  children,
}: {
  icon: typeof Target;
  step: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border bg-card p-6 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10">
          <Icon className="h-5 w-5 text-gold" />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gold">{step}</span>
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </Card>
  );
}

function FormView({
  config,
  set,
  toggleBonus,
  credits,
  onGenerate,
}: {
  config: FunnelConfig;
  set: <K extends keyof FunnelConfig>(key: K, value: FunnelConfig[K]) => void;
  toggleBonus: (b: BonusSection) => void;
  credits: number;
  onGenerate: () => void;
}) {
  const enough = credits >= CREDIT_COST;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Créez votre <span className="text-gradient-gold">tunnel d'élite</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Remplissez le brief et laissez la magie opérer.
        </p>
      </div>

      <div className="space-y-6">
        {/* A. BRIEF STRATÉGIQUE */}
        <SectionCard
          icon={Target}
          step="Étape A"
          title="Le Brief Stratégique"
          desc="Les fondations de votre tunnel."
        >
          <div className="space-y-2">
            <Label>Nom du produit / service</Label>
            <Input
              placeholder="ex : Masterclass Closing Premium"
              value={config.productName}
              onChange={(e) => set("productName", e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label>Type d'offre</Label>
            <Select value={config.offerType} onValueChange={(v) => set("offerType", v as OfferType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OFFER_TYPES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Avatar client (cible, peurs, désirs profonds)</Label>
            <Textarea
              placeholder="ex : Entrepreneurs débutants qui craignent de manquer de clients et rêvent de liberté financière…"
              value={config.avatar}
              onChange={(e) => set("avatar", e.target.value)}
              rows={4}
              maxLength={600}
            />
          </div>
          <div className="space-y-2">
            <Label>Objectif de la page</Label>
            <Select value={config.pageGoal} onValueChange={(v) => set("pageGoal", v as PageGoal)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAGE_GOALS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SectionCard>

        {/* B. CHARTE GRAPHIQUE */}
        <SectionCard
          icon={Palette}
          step="Étape B"
          title="La Charte Graphique & Style"
          desc="L'identité visuelle de votre tunnel."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <ColorPicker label="Ambiance" value={config.ambianceColor} onChange={(v) => set("ambianceColor", v)} />
            <ColorPicker label="Fond" value={config.bgColor} onChange={(v) => set("bgColor", v)} />
            <ColorPicker label="Accent (boutons)" value={config.accentColor} onChange={(v) => set("accentColor", v)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Layout Hero Section</Label>
              <Select value={config.heroLayout} onValueChange={(v) => set("heroLayout", v as HeroLayout)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HERO_LAYOUTS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Typographie</Label>
              <Select value={config.typography} onValueChange={(v) => set("typography", v as Typography)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPOGRAPHIES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>

        {/* C. STRUCTURE */}
        <SectionCard
          icon={LayoutGrid}
          step="Étape C"
          title="Structure des Sections"
          desc="L'architecture de votre page."
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Nombre de sections principales</Label>
              <span className="rounded-md bg-gold/10 px-3 py-1 text-sm font-semibold text-gold">
                {config.sectionsCount}
              </span>
            </div>
            <Slider
              min={4}
              max={10}
              step={1}
              value={[config.sectionsCount]}
              onValueChange={([v]) => set("sectionsCount", v)}
            />
            <p className="text-xs text-muted-foreground">Minimum 4 sections recommandé.</p>
          </div>
          <div className="space-y-3">
            <Label>Sections bonus recommandées</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {BONUS.map((b) => {
                const checked = config.bonusSections.includes(b.value);
                return (
                  <label
                    key={b.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      checked ? "border-gold/50 bg-gold/5" : "border-border hover:border-gold/30"
                    }`}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleBonus(b.value)} />
                    <span className="text-sm font-medium">{b.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </SectionCard>

        {/* ACTION */}
        <div className="rounded-2xl border border-gold/30 bg-gradient-dark p-6 text-center">
          {!enough && (
            <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              Crédits insuffisants — il vous faut {CREDIT_COST} crédits (solde : {credits}).
            </p>
          )}
          <Button variant="gold" size="xl" className="w-full sm:w-auto" onClick={onGenerate} disabled={!enough}>
            <Wand2 />
            Générer mon tunnel de vente d'élite
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Coût : <span className="font-semibold text-gold">{CREDIT_COST} crédits</span> par génération.
          </p>
        </div>
      </div>
    </main>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label={label}
        />
        <span className="font-mono text-xs uppercase text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}

/* ---------------- LOADING ---------------- */
function LoadingView({ step }: { step: number }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping rounded-full bg-gold/20" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-gold shadow-gold-glow">
          <Loader2 className="h-9 w-9 animate-spin text-primary-foreground" />
        </div>
      </div>
      <h2 className="font-display text-2xl font-bold">Génération en cours…</h2>
      <p className="mt-2 text-sm text-muted-foreground">Notre IA forge votre tunnel d'élite.</p>

      <div className="mt-8 w-full space-y-2 text-left">
        {LOADING_STEPS.map((s, i) => (
          <div
            key={s}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
              i < step
                ? "text-foreground/70"
                : i === step
                  ? "bg-gold/5 font-medium text-gold"
                  : "text-muted-foreground/40"
            }`}
          >
            {i < step ? (
              <Check className="h-4 w-4 text-gold" />
            ) : i === step ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-current opacity-40" />
            )}
            {s}
          </div>
        ))}
      </div>
    </main>
  );
}

/* ---------------- RESULT ---------------- */
function ResultView({
  html,
  copied,
  onCopy,
  onDownload,
  onBack,
}: {
  html: string;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onBack: () => void;
}) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Votre tunnel est <span className="text-gradient-gold">prêt</span> ✨
          </h1>
          <p className="text-sm text-muted-foreground">Aperçu à gauche, code à droite.</p>
        </div>
        <Button variant="goldOutline" onClick={onBack}>
          <ArrowLeft />
          Nouveau tunnel
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* PREVIEW */}
        <Card className="overflow-hidden border-border bg-card p-0">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-destructive/60" />
              <span className="h-3 w-3 rounded-full bg-gold/60" />
              <span className="h-3 w-3 rounded-full bg-muted-foreground/40" />
            </div>
            <span className="ml-2 text-xs text-muted-foreground">Aperçu en direct</span>
          </div>
          <iframe
            title="Aperçu du tunnel"
            srcDoc={html}
            className="h-[600px] w-full bg-white"
            sandbox="allow-same-origin"
          />
        </Card>

        {/* CODE */}
        <Card className="flex flex-col overflow-hidden border-border bg-card p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-mono text-xs text-muted-foreground">tunnel.html</span>
            <span className="text-xs text-gold">HTML / CSS — Systeme.io</span>
          </div>
          <pre className="max-h-[480px] flex-1 overflow-auto bg-background/60 p-4 text-xs leading-relaxed">
            <code className="font-mono text-foreground/80">{html}</code>
          </pre>
          <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row">
            <Button variant="gold" className="flex-1" onClick={onCopy}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copié !" : "Copier le code (Spécial Systeme.io)"}
            </Button>
            <Button variant="goldOutline" className="flex-1" onClick={onDownload}>
              <Download />
              Télécharger le .html
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
