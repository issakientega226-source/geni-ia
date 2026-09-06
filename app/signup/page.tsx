"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const COLORS = {
  bg: "#10131C", surface: "#171B27", border: "#2A3040",
  text: "#EEF0F5", textDim: "#8B93A7", accent: "#E3A34E", danger: "#E8807A",
};

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!email.trim() || password.length < 6) {
      setError("Email requis, mot de passe d'au moins 6 caractères.");
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.session) {
      router.push("/chat");
    } else {
      setNotice("Compte créé. Vérifie ton email pour confirmer ton compte, puis connecte-toi.");
    }
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
            <span className="text-xs" style={{ color: COLORS.textDim }}>Mot de passe (
