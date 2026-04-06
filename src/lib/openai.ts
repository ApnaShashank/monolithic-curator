import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

export function getOpenAI() {
  if (!openaiInstance && process.env.OPENAI_API_KEY) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

export async function generateChatFallback(message: string, history: any[], systemPrompt: string) {
  const openai = getOpenAI();
  if (!openai) return null;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system' as const, content: systemPrompt },
      ...history.map(h => ({
        role: (h.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: h.message
      })),
      { role: 'user' as const, content: message }
    ],
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "OpenAI failed to generate a response.";
}
