"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const COLORS = {
  bg: "#10131C", surface: "#171B27", surfaceRaised: "#1E2333", border: "#2A3040",
  text: "#EEF0F5", textDim: "#8B93A7", accent: "#E3A34E", danger: "#E8807A",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Merci de remplir l'email et le mot de passe.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/chat");
  }

  return (
    <main className="w-full flex flex-col items-center justify-center px-6" style={{ background: COLORS.bg, minHeight: "100dvh" }}>
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 mb-2">
          <span className="text-lg font-medium" style={{ color: COLORS.text }}>GENI IA</span>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-left">
            <span className="text-xs" style={{ color: COLORS.textDim }}>Email</span>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-left">
            <span className="text-xs" style={{ color: COLORS.textDim }}>Mot de passe</span>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            />
          </label>
          {error && <p className="text-xs" style={{ color: COLORS.danger }}>{error}</p>}
          <button
            type="submit" disabled={loading}
            className="py-3 rounded-xl font-medium mt-1"
            style={{ background: COLORS.accent, color: "#10131C", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="text-xs text-center" style={{ color: COLORS.textDim }}>
          Pas encore de compte ?{" "}
          <Link href="/signup" style={{ color: COLORS.accent }}>Créer un compte</Link>
        </p>
      </div>
    </main>
  );
          }
