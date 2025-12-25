
import { GoogleGenAI, Type } from "@google/genai";

export const generateSubtasks = async (taskTitle: string, description: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Ты — профессиональный менеджер проектов. Разбей следующую задачу на 5 конкретных и выполнимых подзадач на РУССКОМ ЯЗЫКЕ:
  
  Задача: ${taskTitle}
  Описание: ${description}
  
  Верни только список строк.`;

  try {
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

    const jsonStr = response.text?.trim() || '[]';
    return {
      subtasks: JSON.parse(jsonStr) as string[],
      tokens: response.usageMetadata?.totalTokenCount || 0
    };
  } catch (e) {
    console.error("Ошибка Gemini API:", e);
    return {
      subtasks: [`Ошибка: ${e instanceof Error ? e.message : 'Не удалось связаться с AI'}`],
      tokens: 0
    };
  }
};

export const suggestTaskPriority = async (taskTitle: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `На основе названия задачи "${taskTitle}" предложи приоритет: НИЗКИЙ, СРЕДНИЙ, ВЫСОКИЙ или СРОЧНО. Дай краткое пояснение на русском языке.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return {
      text: response.text,
      tokens: response.usageMetadata?.totalTokenCount || 0
    };
  } catch (e) {
    console.error("Ошибка получения приоритета:", e);
    return {
      text: "Не удалось получить рекомендацию.",
      tokens: 0
    };
  }
};
