/**
 * Utility functions for handling player names safely without i18n translation
 */

/**
 * Ensures a player name is displayed as-is without any translation processing
 * @param name - The raw player name from user input
 * @returns The name wrapped in a way that prevents i18n translation
 */
export const safePlayerName = (name: string): string => {
  // Return the name as-is to prevent any translation processing
  // This is a simple wrapper that can be expanded if needed
  return name || 'Anonymous';
};

/**
 * Create a safe player name span element attributes
 * This can be used when we need to be extra sure names aren't translated
 */
export const getPlayerNameAttributes = () => ({
  lang: "und" as const,
  suppressHydrationWarning: true,
});