export const SAMPLE = {
  taskBlurb: 'Rewrite a bullet list into a clear product update for indie builders.',
  promptA: `You are a helpful assistant.
Task: Rewrite the user's bullet list into a clear product update.
Rules:
- Keep the same meaning
- Use short sentences
- Do not invent features`,
  promptB: `You are a helpful assistant for indie builders.
Task: Rewrite the user's bullet list into a clear product update for X (Twitter).
Rules:
- Keep the same meaning
- Use short sentences (under 20 words each)
- Prefer concrete verbs
- Do not invent features
- End with one clear next step`,
  outputA: `• Shipped Prompt Diff Lab Week 1
• Dual-column editors with char counts
• Line and word-level text diff
• Local sessions saved in the browser
• Next: output comparison and export card`,
  outputB: `• Shipped Prompt Diff Lab W1 for indie builders
• Dual editors with live char counts
• Line + word diff, red/green highlights
• Sessions stay on-device (last 20)
• Next step: paste outputs and export a comparison card`,
};
