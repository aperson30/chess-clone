
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getCoachResponse = async (fen: string, lastMove: string, history: any[]) => {
  const model = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        role: 'user',
        parts: [{ 
          text: `You are a high-level Chess Coach. Current position (FEN): ${fen}. Last move played: ${lastMove}. 
          Previous history: ${JSON.stringify(history.slice(-5))}.
          Give a concise, encouraging tactical hint or strategic observation for the player whose turn it is. 
          Keep it under 3 sentences.` 
        }]
      }
    ],
    config: {
      temperature: 0.7,
      maxOutputTokens: 150,
    }
  });

  const response = await model;
  return response.text;
};

export const analyzePosition = async (fen: string) => {
  const model = ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      {
        role: 'user',
        parts: [{ 
          text: `Analyze this chess position (FEN): ${fen}. Provide a JSON response.` 
        }]
      }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          evaluation: { type: Type.NUMBER, description: 'Approximate centipawn evaluation (+ is white advantage, - is black)' },
          bestMove: { type: Type.STRING, description: 'The best move in SAN format' },
          explanation: { type: Type.STRING, description: 'A detailed strategic explanation of the position' },
          keyConcepts: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'Key themes in this position (e.g., "Pin", "Open file", "Isolated pawn")'
          }
        },
        required: ['evaluation', 'bestMove', 'explanation', 'keyConcepts']
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || '{}');
};

export const generatePuzzle = async () => {
  const model = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        role: 'user',
        parts: [{ 
          text: `Generate a chess puzzle. Return a JSON object with: 
          1. FEN of the starting position
          2. Solution (sequence of moves in SAN)
          3. Title (e.g., "Back Rank Mate")
          4. Difficulty (1-5)` 
        }]
      }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fen: { type: Type.STRING },
          solution: { type: Type.ARRAY, items: { type: Type.STRING } },
          title: { type: Type.STRING },
          difficulty: { type: Type.NUMBER }
        },
        required: ['fen', 'solution', 'title', 'difficulty']
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || '{}');
};
