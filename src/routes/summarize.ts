import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const summarizeRouter = Router();

// In a real app, ensure GEMINI_API_KEY is in your environment variables.
const ai = new GoogleGenAI({});

summarizeRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Valid text string is required in the request body.' });
      return;
    }

    const prompt = `Analyze the following text.
1. Generate a 1-sentence summary of the text.
2. Determine the overall sentiment (Positive, Negative, or Neutral).

Return the result as a strict JSON object with exactly two keys: "summary" and "sentiment".

Text: "${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('No output from model');
    }
    
    const parsed = JSON.parse(outputText);
    res.status(200).json({
      summary: parsed.summary,
      sentiment: parsed.sentiment,
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Failed to summarize text.' });
  }
});
