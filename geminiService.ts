
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI SDK using the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Gets a coaching hint for the current chess position.
 */
export const getCoachResponse = async (fen: string, lastMove: string, history: any[], engineBestMove?: string) => {
  // Use gemini-3-flash-preview for basic text tasks like generating coaching hints.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{
      parts: [{ 
        text: `You are a high-level Chess Coach. 
        Current position (FEN): ${fen}. 
        Last move played: ${lastMove}. 
        Engine suggests: ${engineBestMove || 'Unknown'}.
        Previous history: ${JSON.stringify(history.slice(-5))}.
        Give a concise, encouraging tactical hint or strategic observation for the player whose turn it is. 
        Ground your advice in the engine's recommendation if provided.
        Keep it under 3 sentences.` 
      }]
    }],
    config: {
      temperature: 0.7,
      maxOutputTokens: 150,
    }
  });

  // Access the text property directly from the response object.
  return response.text;
};

/**
 * Analyzes the position and returns a structured JSON evaluation.
 */
export const analyzePosition = async (fen: string) => {
  // Use gemini-3-pro-preview for complex reasoning tasks like position analysis.
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{
      parts: [{ 
        text: `Analyze this chess position (FEN): ${fen}. Provide a JSON response.` 
      }]
    }],
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

  // Access the text property directly and parse the JSON.
  return JSON.parse(response.text || '{}');
};
