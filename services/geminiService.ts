import { GoogleGenAI, Type } from "@google/genai";
import { ReflectionQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReflectionQuestions = async (title: string, content: string, grade: string): Promise<ReflectionQuestion[]> => {
  try {
    const prompt = `
      Kamu adalah asisten guru SD. Buatkan 3-5 pertanyaan refleksi yang mendorong berpikir kritis untuk siswa kelas ${grade} SD.
      Berdasarkan materi berikut:
      Judul: "${title}"
      Isi/Ringkasan: "${content}"
      
      Output harus HANYA berupa JSON array of strings. Jangan ada teks lain.
      Contoh: ["Apa pelajaran moral dari cerita ini?", "Bagaimana perasaan tokoh utama?"]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    const text = response.text;
    if (!text) return [];

    const questionsArray: string[] = JSON.parse(text);

    return questionsArray.map((q, index) => ({
      id: `gen-${Date.now()}-${index}`,
      text: q
    }));

  } catch (error) {
    console.error("Gemini Error:", error);
    return [
      { id: 'err1', text: 'Sebutkan hal menarik dari bacaan ini!' },
      { id: 'err2', text: 'Apa pesan moral yang kamu dapatkan?' }
    ];
  }
};