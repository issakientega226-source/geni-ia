"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const COLORS = { bg: "#10131C", text: "#EEF0F5", textDim: "#8B93A7", accent: "#E3A34E" };

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function handleStart() {
    setChecking(true);
    const { data } = await supabase.auth.getSession();
    if (data.session) router.push("/chat");
    else router.push("/login");
  }

  return (
    <main
      className="w-full flex flex-col items-center justify-center px-8 text-center"
      style={{ background: COLORS.bg, minHeight: "100dvh" }}
    >
      <div
        className="geni-pulse mb-6 flex items-center justify-center rounded-full"
        style={{ width: 72, height: 72, background: "radial-gradient(circle at 30% 30%, #E3A34E, #8a5f22)" }}
      >
        <span style={{ fontSize: 28 }}>✨</span>
      </div>
      <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: COLORS.text }}>
        GENI IA
      </h1>
      <p className="text-sm mb-10" style={{ color: COLORS.textDim }}>
        Votre intelligence artificielle personnelle.
      </p>
      <button
        onClick={handleStart}
        disabled={checking}
        className="w-full max-w-xs py-3 rounded-xl font-medium transition active:scale-[0.98]"
        style={{ background: COLORS.accent, color: "#10131C", opacity: checking ? 0.7 : 1 }}
      >
        {checking ? "..." : "Commencer"}
      </button>
      <p className="text-[11px] mt-8" style={{ color: COLORS.textDim }}>
        Créé par Issa Kientega — Burkina Faso 🇧🇫
      </p>
    </main>
  );
                      }
