
import { GoogleGenAI, Type } from "@google/genai";

export const generateSubtasks = async (taskTitle: string, description: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Ты — профессиональный менеджер проектов. Разбей следующую задачу на 5 конкретных и выполнимых подзадач на РУССКОМ ЯЗЫКЕ:
  
  Задача: ${taskTitle}
  Описание: ${description}
  
  Верни только список строк.`;

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

  try {
    const jsonStr = response.text?.trim() || '[]';
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Ошибка парсинга AI ответа", e);
    return [];
  }
};

export const suggestTaskPriority = async (taskTitle: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `На основе названия задачи "${taskTitle}" предложи приоритет: НИЗКИЙ, СРЕДНИЙ, ВЫСОКИЙ или СРОЧНО. Дай краткое пояснение на русском языке.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text;
};
