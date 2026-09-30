export function normalizeSearchPunctuation(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u02BC\uFF07]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\uFF02]/g, "\"")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\u00A0/g, " ");
}

export function normalizeLookupQuery(value) {
  return normalizeSearchPunctuation(value).replace(/\s+/g, " ").trim();
}

export function normalizeSearchText(value) {
  return normalizeSearchPunctuation(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeCompactSearchText(value) {
  return normalizeSearchText(value).replace(/[^\p{L}\p{N}]+/gu, "");
}

export function getSearchTokens(query) {
  return normalizeSearchText(query)
    .split(/[\s,;:()[\]{}"'`~!?.\\/|_-]+/)
    .filter(Boolean);
}

function countTokenMatches(text, token) {
  let count = 0;
  let index = text.indexOf(token);

  while (index !== -1) {
    count += 1;
    index = text.indexOf(token, index + token.length);
  }

  return count;
}

export function getKeywordMatchScore(text, tokens) {
  const normalizedText = normalizeSearchText(text);
  const compactText = normalizeCompactSearchText(text);
  const compactTokens = tokens.map(normalizeCompactSearchText).filter(Boolean);
  if (!compactTokens.length) return -1;

  const hasEveryToken = tokens.every((token, index) => {
    const compactToken = compactTokens[index];
    return normalizedText.includes(token) || compactText.includes(compactToken);
  });

  if (!hasEveryToken) return -1;

  const tokenScore = tokens.reduce((score, token, index) => {
    const compactToken = compactTokens[index];
    const normalizedMatches = countTokenMatches(normalizedText, token);
    const compactMatches = compactToken === token ? 0 : countTokenMatches(compactText, compactToken);
    return score + Math.max(normalizedMatches, compactMatches, 1);
  }, 0);
  const compactQuery = compactTokens.join("");
  const compactPhraseBonus = compactQuery && compactText.includes(compactQuery) ? 40 : 0;

  return tokenScore + compactPhraseBonus;
}
