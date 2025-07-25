// ===========================================
// THEME COLORS - Centralized Color Palette
// ===========================================

// Primary Green (main UI actions)
export const THEME_COLORS = {
  // Primary palette
  primary: '#4CAF50',
  primaryLight: '#81C784',
  primaryDark: '#388E3C',
  
  // Warning/Status colors
  warning: '#FFEB3B',
  orange: '#FFA000',
  danger: '#F44336',
  
  // Background and neutral UI
  background: '#FAFAFA',
  tileBackground: '#ECEFF1',
  tileBorder: '#CFD8DC',
  uiGray: '#9E9E9E',
  
  // Text colors
  textPrimary: '#212121',
  textInverse: '#FFFFFF',
  textSecondary: '#666666',
  
  // Additional UI states
  hover: {
    primary: '#45a049',
    secondary: '#e9ecef',
    danger: '#E04949',
    warning: '#E6B800',
  },
  
  // Border colors
  border: {
    light: '#e9ecef',
    medium: '#CFD8DC',
    dark: '#6c757d',
  }
} as const;

// ===========================================
// TILE COLORS - Level-based backgrounds
// ===========================================

// Level-based background colors for tiles
// Colors are carefully chosen to be harmonious, accessible, and match the emoji themes

export const LEVEL_COLOR_MAP = new Map<number, string>([
  [1, "#FFF3E0"],   // ✨ - Soft cream/yellow (sparkles)
  [2, "#E3F2FD"],   // 💧 - Light blue (water)
  [3, "#E8F5E8"],   // 🌱 - Soft green (seedling)
  [4, "#F1F8E9"],   // 🌿 - Light sage green (herb)
  [5, "#FFEBEE"],   // 🐞 - Soft pink/red (ladybug)
  [6, "#E0F2F1"],   // 🐦 - Mint green (bird/nature)
  [7, "#FFF8E1"],   // 🌤️ - Warm yellow (sun)
  [8, "#F3E5F5"],   // 🌈 - Light purple (rainbow)
  [9, "#E8EAF6"],   // 🔭 - Soft indigo (telescope/night sky)
  [10, "#E1F5FE"],  // 🚀 - Sky blue (rocket/space)
  [11, "#E0F7FA"],  // 🌍 - Teal (earth/ocean)
  [12, "#F9FBE7"],  // 🌌 - Pale lime (galaxy/cosmic)
  [13, "#FCE4EC"],  // 🪐 - Soft rose (planet)
  [14, "#E4C441"],  // 👽 - Golden yellow (alien/otherworldly)
  [15, "#FFECB3"],  // 🧠 - Amber (brain/intelligence)
  [16, "#F0F4C3"],  // 📿 - Light olive (prayer beads/spiritual)
  [17, "#E1BEE7"],  // 🧘 - Lavender (meditation/calm)
  [18, "#FFFFFF"],  // 🕊️ - Pure white (dove/peace/ultimate)
]);

// Helper function to get tile background color
export const getTileColor = (level: number): string => {
  return LEVEL_COLOR_MAP.get(level) || "#F5F5F5"; // Default light gray
};

// Helper function to get appropriate text color for contrast
export const getTileTextColor = (level: number): string => {
  // Most backgrounds are light, so dark text works well
  // Special cases for darker backgrounds
  if (level === 14) return "#2D2D2D"; // Dark text on golden background
  return "#424242"; // Default dark gray for good contrast
};