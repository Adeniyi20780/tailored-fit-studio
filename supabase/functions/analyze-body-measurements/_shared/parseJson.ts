export function extractJsonFromContent(content: string): string {
  const trimmed = content.trim();

  // Prefer fenced JSON blocks
  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  // Fallback: first JSON-looking object
  const objMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objMatch?.[0]) return objMatch[0].trim();

  return trimmed;
}

/**
 * Parses JSON from a model response.
 *
 * Includes a targeted repair for a common failure mode we see here:
 * the model returns valid JSON but gets truncated mid-string in the final
 * `notes` field, which makes the whole payload invalid.
 */
export function parseJsonWithFallback(content: string): unknown {
  const jsonStr = extractJsonFromContent(content);

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Repair attempt: drop the (often verbose) notes field if present.
    const notesIdx = jsonStr.indexOf('"notes"');
    if (notesIdx !== -1) {
      let beforeNotes = jsonStr.slice(0, notesIdx);
      // Remove the comma that precedes the notes key (and any whitespace)
      beforeNotes = beforeNotes.replace(/,\s*$/, "").trimEnd();
      const repaired = `${beforeNotes}\n}`;
      try {
        return JSON.parse(repaired);
      } catch {
        // fall through
      }
    }

    throw new Error("Failed to parse measurement data from AI response");
  }
}
