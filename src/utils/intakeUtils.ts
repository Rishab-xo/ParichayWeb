/**
 * Utility functions for legal intake brief parsing and narrative compilation.
 */

export interface ParsedBrief {
  /**
   * Extracted caveat text from Section IV (Assumptions Made), or null if absent.
   */
  assumptions: string | null;
  /**
   * The brief markdown with Section IV stripped out for separate presentation.
   */
  cleanedBrief: string;
  cleanBrief: string;
}

/**
 * Parses a legal brief markdown string, isolating the "## IV. ASSUMPTIONS MADE"
 * section so it can be presented in an amber alert card.
 *
 * @param briefMarkdown the full rendered markdown from the intake pipeline
 * @returns ParsedBrief containing separated assumptions and cleaned brief
 */
export function parseBriefAssumptions(briefMarkdown: string | null): ParsedBrief {
  if (!briefMarkdown) {
    return { assumptions: null, cleanedBrief: '' };
  }

  // Case-insensitive, whitespace-flexible regex that handles:
  // - "## ASSUMPTIONS MADE" (Strict Refirm standard format)
  // - "## Assumptions Made" (Title Case)
  // - "## IV. ASSUMPTIONS MADE", "## VI. ASSUMPTIONS MADE" (Any Roman numeral prefix)
  // - "## 4. ASSUMPTIONS MADE", "## 6. ASSUMPTIONS MADE" (Any Arabic numeral prefix)
  // - "### ASSUMPTIONS MADE" (Level 3 header)
  const headerPattern = /#{2,3}\s*(?:(?:[IVXLCDM]+|\d+)[.:]?\s*)?(?:KEY\s+)?ASSUMPTIONS(?:\s+MADE)?(?:\s*[:\-])?/i;
  const assumptionsRegex = new RegExp(`(?:^|\\n)(${headerPattern.source}[\\s\\S]*?)(?=(?:\\n#{2,3}\\s+[^\\n]+)|\\s*$)`, 'i');
  const match = briefMarkdown.match(assumptionsRegex);

  if (match && match[1]) {
    const rawSection = match[1].trim();
    // Strip the matched header line to isolate the pure caveats text
    const headerStripRegex = new RegExp(`^${headerPattern.source}\\s*`, 'i');
    const bodyOnly = rawSection.replace(headerStripRegex, '').trim();
    const cleanedBrief = briefMarkdown.replace(match[0], '').trim();

    return {
      assumptions: bodyOnly || rawSection,
      cleanedBrief,
      cleanBrief: cleanedBrief,
    };
  }

  return {
    assumptions: null,
    cleanedBrief: briefMarkdown,
    cleanBrief: briefMarkdown,
  };
}
