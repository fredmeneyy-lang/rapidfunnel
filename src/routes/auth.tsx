import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Gift, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — FunnelForge" },
      { name: "description", content: "Connectez-vous ou créez votre compte FunnelForge et recevez 10 crédits offerts." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez renseigner votre email et mot de passe.");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("Compte créé ! 10 crédits offerts vous attendent. 🎁");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bon retour parmi nous !");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      if (message.toLowerCase().includes("already registered")) {
        toast.error("Cet email est déjà utilisé. Essayez de vous connecter.");
      } else if (message.toLowerCase().includes("invalid login")) {
        toast.error("Email ou mot de passe incorrect.");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-gold opacity-10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-gold" />
          <span className="font-display text-2xl font-bold tracking-tight">FunnelForge</span>
        </Link>

        <Card className="gold-border bg-card/80 p-8 shadow-elegant backdrop-blur">
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl font-bold">
              {mode === "signup" ? "Créez votre compte" : "Connexion"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signup"
                ? "Rejoignez l'élite des tunnels de vente."
                : "Accédez à votre studio de génération."}
            </p>
          </div>

          {mode === "signup" && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-gold/30 bg-gold/5 p-3 text-sm">
              <Gift className="h-5 w-5 shrink-0 text-gold" />
              <span className="text-foreground/90">
                <strong className="text-gold">10 crédits offerts</strong> dès votre inscription.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Créer mon compte" : "Se connecter"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="font-semibold text-gold hover:underline"
            >
              {mode === "signup" ? "Se connecter" : "S'inscrire"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
