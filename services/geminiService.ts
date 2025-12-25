
import { GoogleGenAI, Type } from "@google/genai";

// Функция для проверки, проброшен ли ключ
export const isAiConfigured = () => {
  const apiKey = process.env.API_KEY;
  return !!(apiKey && apiKey !== "undefined" && apiKey !== "" && apiKey !== "YOUR_API_KEY");
};

export const generateSubtasks = async (taskTitle: string, description: string) => {
  const apiKey = process.env.API_KEY;
  
  if (!isAiConfigured()) {
    return {
      subtasks: [],
      tokens: 0,
      isError: true,
      errorMsg: "Ключ API_KEY не найден. Перейдите в Vercel Settings -> Environment Variables, добавьте API_KEY и сделайте REDEPLOY последней сборки."
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    
    const prompt = `Ты — профессиональный менеджер проектов. Разбей задачу на 5 подзадач на русском языке.
    Задача: ${taskTitle}
    Описание: ${description}
    Верни JSON массив строк.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    return {
      subtasks: JSON.parse(response.text || '[]') as string[],
      tokens: response.usageMetadata?.totalTokenCount || 0,
      isError: false
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка API";
    return {
      subtasks: [],
      tokens: 0,
      isError: true,
      errorMsg: msg.includes("API key") ? "Неверный API ключ. Проверьте его в Google AI Studio." : `Ошибка: ${msg}`
    };
  }
};
