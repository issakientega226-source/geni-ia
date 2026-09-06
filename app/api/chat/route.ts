import { NextRequest, NextResponse } from "next/server";
import { generateResponse, type ChatMessage } from "@/services/ai/AIService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages requis" }, { status: 400 });
    }

    const reply = await generateResponse(messages);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("GENI IA /api/chat error:", err);
    return NextResponse.json(
      { error: "GENI IA rencontre momentanément un problème. Réessaie." },
      { status: 500 }
    );
  }
}
