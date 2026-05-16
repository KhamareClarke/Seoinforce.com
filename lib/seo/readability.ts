/** Flesch Reading Ease and related readability metrics. */

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const vowels = w.match(/[aeiouy]+/g);
  let count = vowels ? vowels.length : 1;
  if (w.endsWith('e')) count = Math.max(1, count - 1);
  return count;
}

export function analyzeReadability(text: string) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 3);
  const words = text.match(/\b[\w']+\b/g) || [];
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const sentenceCount = Math.max(sentences.length, 1);
  const wordCount = Math.max(words.length, 1);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const fleschEase =
    206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount);
  const fleschKincaidGrade = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllables / wordCount) - 15.59;
  const fogIndex =
    0.4 * (wordCount / sentenceCount + 100 * (words.filter((w) => countSyllables(w) >= 3).length / wordCount));

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgWordsPerParagraph =
    paragraphs.length > 0 ? wordCount / paragraphs.length : wordCount;

  let label = 'Difficult';
  if (fleschEase >= 90) label = 'Very easy';
  else if (fleschEase >= 80) label = 'Easy';
  else if (fleschEase >= 70) label = 'Standard';
  else if (fleschEase >= 60) label = 'Fairly easy';
  else if (fleschEase >= 50) label = 'Fairly difficult';

  return {
    fleschReadingEase: Math.round(fleschEase * 10) / 10,
    fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
    gunningFogIndex: Math.round(fogIndex * 10) / 10,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgWordsPerParagraph: Math.round(avgWordsPerParagraph * 10) / 10,
    label,
    sentenceCount,
    wordCount,
    paragraphCount: paragraphs.length,
  };
}
