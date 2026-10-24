import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveProvider } from "../src/lib/ai/openrouter";

test("resolveProvider: OpenRouter si hay clave; si no, Gemini con herramientas por su endpoint compatible", () => {
  const prev = { or: process.env.OPENROUTER_API_KEY, g: process.env.GEMINI_API_KEY };
  try {
    process.env.OPENROUTER_API_KEY = "sk-or";
    process.env.GEMINI_API_KEY = "g";
    const or = resolveProvider("anthropic/claude-haiku-5.5", "google/gemini-2.5-flash")!;
    assert.equal(or.name, "OpenRouter");
    assert.equal(or.headers["X-Title"], "Sintia");

    process.env.OPENROUTER_API_KEY = "";
    const g = resolveProvider("google/gemini-2.5-flash-lite", "anthropic/claude-haiku-5.5")!;
    assert.equal(g.name, "Gemini");
    assert.match(g.url, /generativelanguage\.googleapis\.com\/v1beta\/openai\/chat\/completions$/);
    assert.equal(g.model, "gemini-2.5-flash-lite");
    assert.equal(g.fallback, "gemini-2.5-flash");
    assert.equal(resolveProvider("google/gemma-4-26b-a4b-it:free", "x")!.model, "gemini-2.5-flash");

    process.env.GEMINI_API_KEY = "";
    assert.equal(resolveProvider("a", "b"), null);
  } finally {
    process.env.OPENROUTER_API_KEY = prev.or;
    process.env.GEMINI_API_KEY = prev.g;
  }
});
