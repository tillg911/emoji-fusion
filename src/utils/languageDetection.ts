export const detectLanguage = (): string => {
  // Get browser language preference
  const browserLanguage = navigator.language || navigator.languages?.[0] || 'en';
  
  // Extract the language code (first 2 characters)
  const languageCode = browserLanguage.toLowerCase().substring(0, 2);
  
  // Default to German if language starts with "de", otherwise use English
  return languageCode === 'de' ? 'de' : 'en';
};

export const getSupportedLanguages = () => ['en', 'de'] as const;
export type SupportedLanguage = ReturnType<typeof getSupportedLanguages>[number];