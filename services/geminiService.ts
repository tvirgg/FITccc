import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
  if (!client) {
    // In a real app, you would handle the key more securely or via backend proxy
    // For this demo, we assume the environment variable is set
    client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }
  return client;
};

export const generateCapyWisdom = async (userPrompt: string): Promise<string> => {
  try {
    const ai = getClient();
    const systemPrompt = `
      You are the "Grand Sage Capybara". 
      You are the mascot and advisor for the $CHILL token.
      Your personality is: Extremely chill, zen, relaxed, slightly mystical, and obsessed with hot springs, yuzu fruits, and relaxing.
      You give crypto advice but always add a disclaimer that it's "Not Financial Advice (NFA)".
      Keep responses concise (under 50 words) and funny.
      Use emojis like 🍊, 🧖, 🌊, 🥥.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + "\nUser asks: " + userPrompt }] }
      ]
    });

    return response.text || "The hot springs are too steamy, I cannot see the future right now... 🧖";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Even a sage needs a nap. API error. Try again later. 😴";
  }
};