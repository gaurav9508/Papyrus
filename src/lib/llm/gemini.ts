/**
 * Thin wrapper around Google's free Gemini API (AI Studio key).
 * Kept isolated so the rest of the app depends on `generateStructuredJson`,
 * not on Gemini specifically — swapping providers later means editing only this file.
 */

import { jsonrepair } from "jsonrepair";

const MODEL = "gemini-3.6-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents`;
const EMBEDDING_DIMENSIONS = 768;

interface GeminiEmbedResponse {
  embeddings?: { values?: number[] }[];
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

/**
 * Send a prompt to Gemini and parse the response as JSON.
 * Throws if the API errors or the response isn't valid JSON after cleanup.
 */
export async function generateStructuredJson<T>(prompt: string): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in the environment.");
  }

  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
        maxOutputTokens: 16384,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    try {
      return JSON.parse(jsonrepair(cleaned)) as T;
    } catch {
      console.error("Gemini raw response that failed to parse:\n", text);
      throw new Error("Failed to parse Gemini response as JSON.");
    }
  }
}

/** Embed a batch of text chunks. Returns vectors in the same order as `texts`. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in the environment.");

  const res = await fetch(`${EMBED_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType: "RETRIEVAL_DOCUMENT",
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Gemini embedding error (${res.status}): ${await res.text()}`,
    );
  }

  const data = (await res.json()) as GeminiEmbedResponse;
  const vectors = data.embeddings?.map((e) => e.values ?? []);
  if (!vectors || vectors.length !== texts.length) {
    throw new Error("Gemini embedding response length mismatch.");
  }
  return vectors;
}

/** Embed a single query (e.g. a chat question) for vector search. */
export async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in the environment.");

  const res = await fetch(`${EMBED_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
          outputDimensionality: EMBEDDING_DIMENSIONS,
          taskType: "RETRIEVAL_QUERY",
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Gemini embedding error (${res.status}): ${await res.text()}`,
    );
  }

  const data = (await res.json()) as GeminiEmbedResponse;
  const vector = data.embeddings?.[0]?.values;
  if (!vector) throw new Error("Gemini embedding response missing vector.");
  return vector;
}

/** Plain-text Gemini generation, for chat answers (not structured JSON). */
export async function generateText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in the environment.");

  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });

  if (!res.ok)
    throw new Error(`Gemini API error (${res.status}): ${await res.text()}`);

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response.");
  return text.trim();
}

export async function summarizeForExport(input: {
  paperTitle: string;
  notebookBlocks?: { type: string; content: string }[];
  chatMessages?: { role: "user" | "assistant"; content: string }[];
  scope: "notebook" | "chat" | "both";
}): Promise<string> {
  const notebookText =
    input.notebookBlocks?.map((b) => `[${b.type}] ${b.content}`).join("\n\n") ??
    "";

  const chatText =
    input.chatMessages?.map((m) => `${m.role}: ${m.content}`).join("\n") ?? "";

  const sourceText =
    input.scope === "notebook"
      ? notebookText
      : input.scope === "chat"
        ? chatText
        : `NOTEBOOK:\n${notebookText}\n\nCHAT:\n${chatText}`;

  const prompt = `You are summarizing a learning session on the paper "${input.paperTitle}".
Produce a clear, well-structured summary covering: key concepts explained, implementation steps taken, and any Q&A insights from chat. Use markdown-style headers and bullet points. Keep it concise but complete.

SOURCE CONTENT:
${sourceText}`;

  return generateText(prompt);
}
