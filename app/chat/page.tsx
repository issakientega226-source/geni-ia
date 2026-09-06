"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu, X, Send, Plus, Mic, MessageSquarePlus, Home, MessagesSquare,
  Target, Rocket, FileText, Brain, User, Settings, Trash2, ChevronRight, Sparkles,
  LogOut, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const COLORS = {
  bg: "#10131C", surface: "#171B27", surfaceRaised: "#1E2333", border: "#2A3040",
  text: "#EEF0F5", textDim: "#8B93A7", accent: "#E3A34E", accentDim: "#3A2E1D",
  bubbleUser: "#2B2515", danger: "#E8807A",
};

const MENU_ITEMS = [
  { id: "accueil", label: "Accueil", icon: Home, soon: false },
  { id: "conversations", label: "Conversations", icon: MessagesSquare, soon: false },
  { id: "objectifs", label: "Objectifs", icon: Target, soon: true },
  { id: "missions", label: "Missions", icon: Rocket, soon: true },
  { id: "fichiers", label: "Fichiers", icon: FileText, soon: true },
  { id: "memoire", label: "Mémoire", icon: Brain, soon: true },
  { id: "profil", label: "Profil", icon: User, soon: false },
  { id: "parametres", label: "Paramètres", icon: Settings, soon: false },
];

const SUGGESTIONS = [
  "Explique-moi une idée simplement",
  "Aide-moi à organiser ma journée",
  "Résume un texte pour moi",
];

type Msg = { id: string; role: "user" | "assistant"; content: string; error?: boolean };
type Conv = { id: string; title: string; messages: Msg[] | null };

function Logo({ size = 28 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, background: `radial-gradient(circle at 30% 30%, ${COLORS.accent}, #8a5f22)` }}
    >
      <Sparkles size={size * 0.55} color="#10131C" strokeWidth={2.2} />
    </div>
  );
}

function SoonBadge() {
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full ml-auto" style={{ background: COLORS.accentDim, color: COLORS.accent }}>
      Bientôt disponible
    </span>
  );
}

function PlaceholderScreen({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full px-8 gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: COLORS.surfaceRaised }}>
        <Icon size={28} color={COLORS.accent} />
      </div>
      <h2 className="text-lg font-medium" style={{ color: COLORS.text }}>{title}</h2>
      <p className="text-sm max-w-xs" style={{ color: COLORS.textDim }}>{description}</p>
      <span className="text-xs px-3 py-1 rounded-full" style={{ background: COLORS.accentDim, color: COLORS.accent }}>
        Bientôt disponible
      </span>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-1 py-2">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full geni-dot" style={{ background: COLORS.textDim, animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileNameDraft, setProfileNameDraft] = useState("");

  const [view, setView] = useState("accueil");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSendRef = useRef(0);

  const active = conversations.find((c) => c.id === activeId) || null;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
        return;
      }
      setSession(data.session);
      setReady(true);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.session.user.id).single();
      setProfile(p);
      setProfileNameDraft(p?.display_name || "");
      loadConversations();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active?.messages?.length, loading, view]);

  function flashHint(text: string) {
    setHint(text);
    setTimeout(() => setHint(""), 2200);
  }

  async function loadConversations() {
    setConvLoading(true);
    const { data, error } = await supabase.from("conversations").select("*").order("updated_at", { ascending: false });
    if (error) flashHint("Erreur de chargement : " + error.message);
    else setConversations((data || []).map((r: any) => ({ id: r.id, title: r.title, messages: null })));
    setConvLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function saveProfileName() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data, error } = await supabase.from("profiles").update({ display_name: profileNameDraft }).eq("id", uid).select().single();
    if (error) flashHint("Erreur : " + error.message);
    else { setProfile(data); flashHint("Profil mis à jour."); }
  }

  async function createConversation(title?: string | null): Promise<string | null> {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return null;
    const finalTitle = title ? title.slice(0, 28) + (title.length > 28 ? "…" : "") : "Nouvelle conversation";
    const { data, error } = await supabase.from("conversations").insert({ user_id: uid, title: finalTitle }).select().single();
    if (error) { flashHint("Création impossible : " + error.message); return null; }
    setConversations((prev) => [{ id: data.id, title: data.title, messages: [] }, ...prev]);
    setActiveId(data.id);
    setView("chat");
    return data.id;
  }

  async function openConversation(id: string) {
    setActiveId(id);
    setView("chat");
    const conv = conversations.find((c) => c.id === id);
    if (conv && conv.messages !== null) return;
    const { data, error } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
    if (error) { flashHint("Erreur de chargement des messages : " + error.message); return; }
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, messages: (data || []).map((r: any) => ({ id: r.id, role: r.role, content: r.content })) } : c)));
  }

  async function deleteConversation(id: string) {
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) { flashHint("Suppression impossible : " + error.message); return; }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) { setActiveId(null); setView("conversations"); }
  }

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const now = Date.now();
    if (now - lastSendRef.current < 800) return;
    lastSendRef.current = now;

    let id = activeId;
    let baseMessages: Msg[] = [];
    let isNew = false;
    if (id) {
      baseMessages = conversations.find((c) => c.id === id)?.messages || [];
    } else {
      isNew = true;
      id = await createConversation(content);
      if (!id) return;
    }

    setInput("");
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    const { data: savedUserMsg, error: insertErr } = await supabase
      .from("messages")
      .insert({ conversation_id: id, user_id: uid, role: "user", content })
      .select()
      .single();
    if (insertErr) {
      flashHint("Message non sauvegardé : " + insertErr.message);
      setLoading(false);
      return;
    }
    const userMsg: Msg = { id: savedUserMsg.id, role: "user", content };
    const historyForAI = [...baseMessages, userMsg];
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, messages: historyForAI } : c)));
    supabase.from("conversations").update({
      updated_at: new Date().toISOString(),
      ...(isNew || baseMessages.length === 0 ? { title: content.slice(0, 28) + (content.length > 28 ? "…" : "") } : {}),
    }).eq("id", id).then(() => {});

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyForAI.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      const replyText: string = data.reply;

      const { data: savedReply, error: replyErr } = await supabase
        .from("messages")
        .insert({ conversation_id: id, user_id: uid, role: "assistant", content: replyText })
        .select()
        .single();
      if (replyErr) throw replyErr;

      const reply: Msg = { id: savedReply.id, role: "assistant", content: replyText };
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, messages: [...(c.messages || []), reply] } : c)));
    } catch (err: any) {
      const errorReply: Msg = { id: Date.now() + "-e", role: "assistant", error: true, content: "GENI IA rencontre momentanément un problème. Réessaie." };
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, messages: [...(c.messages || []), errorReply] } : c)));
    } finally {
      setLoading(false);
    }
  }

  function goTo(id: string) {
    setView(id);
    setDrawerOpen(false);
    if (id === "conversations") loadConversations();
  }

  if (!ready) {
    return (
      <div className="w-full flex items-center justify-center" style={{ background: COLORS.bg, minHeight: "100dvh" }}>
        <Loader2 size={22} color={COLORS.accent} className="geni-spin" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col relative overflow-hidden" style={{ background: COLORS.bg, minHeight: "100dvh" }}>
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        <button onClick={() => setDrawerOpen(true)} className="p-1 -ml-1">
          <Menu size={22} color={COLORS.text} />
        </button>
        <Logo size={26} />
        <div className="flex flex-col leading-tight overflow-hidden">
          <span className="text-sm font-medium truncate" style={{ color: COLORS.text }}>
            {view === "chat" ? (active ? active.title : "Nouvelle conversation") : "GENI IA"}
          </span>
        </div>
        <button onClick={() => { setActiveId(null); setView("chat"); }} className="ml-auto p-2 rounded-lg" style={{ background: COLORS.surfaceRaised }}>
          <MessageSquarePlus size={18} color={COLORS.accent} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {view === "accueil" && (
          <div className="h-full overflow-y-auto px-5 py-6 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-medium" style={{ color: COLORS.text }}>Bonjour.</h2>
              <p className="text-sm mt-1" style={{ color: COLORS.textDim }}>Sur quoi veux-tu réfléchir aujourd'hui ?</p>
            </div>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => sendMessage(s)} className="text-left px-4 py-3 rounded-xl text-sm transition active:scale-[0.98]" style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={() => { setActiveId(null); setView("chat"); }} className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium" style={{ background: COLORS.accent, color: "#10131C" }}>
              <Plus size={16} /> Nouvelle conversation
            </button>
          </div>
        )}

        {view === "conversations" && (
          <div className="h-full overflow-y-auto px-3 py-4">
            {convLoading ? (
              <div className="flex justify-center py-10"><Loader2 size={18} color={COLORS.textDim} className="geni-spin" /></div>
            ) : conversations.length === 0 ? (
              <PlaceholderScreen icon={MessagesSquare} title="Aucune conversation" description="Tes conversations avec GENI IA apparaîtront ici une fois que tu en auras commencé une." />
            ) : (
              <div className="flex flex-col gap-1">
                {conversations.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-3 rounded-xl" style={{ background: c.id === activeId ? COLORS.surfaceRaised : "transparent" }}>
                    <button onClick={() => openConversation(c.id)} className="flex-1 text-left text-sm truncate" style={{ color: COLORS.text }}>{c.title}</button>
                    <button onClick={() => deleteConversation(c.id)} className="p-1"><Trash2 size={16} color={COLORS.textDim} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "objectifs" && <PlaceholderScreen icon={Target} title="Objectifs" description="Bientôt, GENI IA t'aidera à transformer tes objectifs en plans concrets." />}
        {view === "missions" && <PlaceholderScreen icon={Rocket} title="Missions" description="Bientôt, GENI IA pourra découper tes demandes complexes en missions." />}
        {view === "fichiers" && <PlaceholderScreen icon={FileText} title="Fichiers" description="Bientôt, tu pourras envoyer des documents que GENI IA analysera pour toi." />}
        {view === "memoire" && <PlaceholderScreen icon={Brain} title="Mémoire" description="Bientôt, GENI IA pourra retenir certaines informations avec ton autorisation." />}

        {view === "profil" && (
          <div className="h-full overflow-y-auto px-5 py-6 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-medium" style={{ background: COLORS.surfaceRaised, color: COLORS.accent }}>
                {(profileNameDraft || session?.user?.email || "?").slice(0, 1).toUpperCase()}
              </div>
              <input value={profileNameDraft} onChange={(e) => setProfileNameDraft(e.target.value)} onBlur={saveProfileName} placeholder="Ton nom" className="text-base font-medium bg-transparent outline-none flex-1" style={{ color: COLORS.text }} />
            </div>
            <div className="flex flex-col gap-3 text-sm" style={{ color: COLORS.textDim }}>
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}><span>Email</span><span style={{ color: COLORS.text }}>{session?.user?.email}</span></div>
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}><span>Membre depuis</span><span style={{ color: COLORS.text }}>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString("fr-FR") : "—"}</span></div>
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}><span>Créateur de l'app</span><span style={{ color: COLORS.text }}>Issa Kientega</span></div>
              <div className="flex justify-between py-2"><span>Origine</span><span style={{ color: COLORS.text }}>Burkina Faso 🇧🇫</span></div>
            </div>
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium mt-2" style={{ background: COLORS.surface, color: COLORS.danger, border: `1px solid ${COLORS.border}` }}>
              <LogOut size={16} /> Se déconnecter
            </button>
          </div>
        )}

        {view === "parametres" && (
          <div className="h-full overflow-y-auto px-5 py-6 flex flex-col gap-2">
            {["Apparence", "Langue", "Notifications", "Confidentialité"].map((s) => (
              <div key={s} className="flex items-center px-4 py-3 rounded-xl" style={{ background: COLORS.surface }}>
                <span className="text-sm" style={{ color: COLORS.text }}>{s}</span>
                <SoonBadge />
              </div>
            ))}
          </div>
        )}

        {view === "chat" && (
          <div className="h-full flex flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {(!active || !active.messages || active.messages.length === 0) && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-center px-8" style={{ color: COLORS.textDim }}>Écris un message pour commencer.</p>
                </div>
              )}
              {active?.messages?.map((m) => (
                <div key={m.id} className={`geni-msg max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "self-end" : "self-start"}`} style={{ background: m.role === "user" ? COLORS.bubbleUser : COLORS.surface, color: m.error ? COLORS.danger : COLORS.text, border: m.role === "assistant" ? `1px solid ${m.error ? "#4A2E2C" : COLORS.border}` : "none" }}>
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="self-start flex items-center gap-2 rounded-2xl pl-3 pr-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                  <span className="text-xs" style={{ color: COLORS.textDim }}>GENI IA réfléchit</span>
                  <TypingDots />
                </div>
              )}
            </div>
          </div>
        )}

        {hint && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs text-center max-w-[90%]" style={{ background: COLORS.surfaceRaised, color: COLORS.textDim }}>
            {hint}
          </div>
        )}
      </div>

      {view === "chat" && (
        <div className="shrink-0 flex items-end gap-2 px-3 py-3" style={{ borderTop: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <button onClick={() => flashHint("Envoi de fichiers — bientôt disponible")} className="p-2.5 rounded-full" style={{ background: COLORS.surfaceRaised }}>
            <Plus size={18} color={COLORS.textDim} />
          </button>
          <textarea
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            disabled={loading} placeholder={loading ? "GENI IA répond..." : "Écris à GENI IA..."} rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none"
            style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}`, maxHeight: 100, opacity: loading ? 0.7 : 1 }}
          />
          <button onClick={() => flashHint("Entrée vocale — bientôt disponible")} className="p-2.5 rounded-full" style={{ background: COLORS.surfaceRaised }}>
            <Mic size={18} color={COLORS.textDim} />
          </button>
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} className="p-2.5 rounded-full transition" style={{ background: input.trim() && !loading ? COLORS.accent : COLORS.surf
