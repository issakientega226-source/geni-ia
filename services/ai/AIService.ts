export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function generateResponse(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY manquante côté serveur.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system:
        "Tu es GENI IA, l'assistant personnel créé par Issa Kientega. Réponds en français, de façon claire et chaleureuse.",
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`AI_HTTP_${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((b: any) => b.type === "text");
  if (!textBlock?.text) throw new Error("AI_EMPTY_RESPONSE");
  return textBlock.text as string;
}
