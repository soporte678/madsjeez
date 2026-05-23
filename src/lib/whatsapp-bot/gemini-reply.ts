import { GoogleGenerativeAI } from "@google/generative-ai";

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key.length >= 10 && key !== "your-gemini-api-key");
}

export async function generateGeminiWhatsappReply(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("gemini_not_configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.45,
      maxOutputTokens: 280,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text()?.trim();
  if (!text || text.length < 2) throw new Error("gemini_empty");
  return text;
}
