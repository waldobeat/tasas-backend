import { Dimensions } from 'react-native';

// --- PALETTES (NEON AURORA / GLASSMERPHISM) ---
// Both palettes are now dark to maintain the neon aesthetic, with slight variations
export const LIGHT_PALETTE = {
    bg: '#0F121C', // Deep Void
    cardCtx: 'rgba(255, 255, 255, 0.03)', // Glass
    secondary: '#8B9BB4', // Starlight text
    textDark: '#FFFFFF', // Pure White text
    border: 'rgba(255, 255, 255, 0.1)', // Light glass border
    inputBg: 'rgba(0,0,0,0.3)', // Dark input
    shadow: '#06080D' // Deep shadow
};

export const DARK_PALETTE = {
    bg: '#05070B', // Ultimate Black/Void
    cardCtx: 'rgba(255, 255, 255, 0.02)', // Darker glass
    secondary: '#73829C', // Dimmed starlight
    textDark: '#F8FAFC', // Off white
    border: 'rgba(255, 255, 255, 0.05)', // Faint glass border
    inputBg: 'rgba(0,0,0,0.5)',
    shadow: '#000000'
};

export const STATIC_COLORS = {
    success: '#00FF9D', // Neon Mint
    successBtn: 'rgba(0, 255, 157, 0.2)', // Mint glass
    whatsapp: '#00FF9D',
};

// COMPATIBILITY: Default COLORS for StyleSheet
export const COLORS = {
    ...DARK_PALETTE,
    ...STATIC_COLORS,
    primary: '#00E5FF', // Neon Cyan
    primarySoft: 'rgba(0, 229, 255, 0.1)',
};

export const THEMES = {
    DEFAULT: { key: 'DEFAULT', primary: '#00E5FF', primarySoft: 'rgba(0, 229, 255, 0.15)', label: 'Neon Cyan', secondary: '#0099AA' },
    MAGENTA: { key: 'MAGENTA', primary: '#FF0055', primarySoft: 'rgba(255, 0, 85, 0.15)', label: 'Cyber Pink', secondary: '#AA0033' },
    ACID: { key: 'ACID', primary: '#CCFF00', primarySoft: 'rgba(204, 255, 0, 0.15)', label: 'Toxic Yellow', secondary: '#88AA00' },
    VIOLET: { key: 'VIOLET', primary: '#9D00FF', primarySoft: 'rgba(157, 0, 255, 0.15)', label: 'Deep Void', secondary: '#5500AA' },
    FLAME: { key: 'FLAME', primary: '#FF3300', primarySoft: 'rgba(255, 51, 0, 0.15)', label: 'Orange Flare', secondary: '#AA2200' },
};

// RESPONSIVE DESIGN UTILITIES
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 360;
const isMediumScreen = SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 400;
const isLargeScreen = SCREEN_WIDTH >= 400;

// Responsive scaling functions
export const scale = (size) => {
    if (isSmallScreen) return size * 0.85;
    if (isMediumScreen) return size * 0.92;
    return size;
};

export const verticalScale = (size) => {
    if (isSmallScreen) return size * 0.8;
    if (isMediumScreen) return size * 0.9;
    return size;
};

export const moderateScale = (size, factor = 0.5) => {
    return size + (scale(size) - size) * factor;
};
