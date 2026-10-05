/**
 * Text a search box matches (the blog's index, the glossary): lower case,
 * straight apostrophes, no punctuation but the dot in ".nz". Its own module,
 * so the search fields don't carry the blog's registry into the browser.
 */
export const searchable = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
