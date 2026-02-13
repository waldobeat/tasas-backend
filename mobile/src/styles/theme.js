import { Dimensions } from 'react-native';

// --- PALETTES (PREMIUM LOOK) ---
export const LIGHT_PALETTE = {
    bg: '#F8FAFC', // Ultra light blue-gray
    cardCtx: '#FFFFFF',
    secondary: '#64748B', // Slate 500
    textDark: '#0F172A', // Slate 900
    border: '#E2E8F0', // Slate 200
    inputBg: '#F1F5F9', // Slate 100
    shadow: '#64748B' // Soft slate shadow
};

export const DARK_PALETTE = {
    bg: '#0B1120', // Ultra dark blue (Rich black)
    cardCtx: '#1E293B', // Slate 800
    secondary: '#94A3B8', // Slate 400
    textDark: '#F8FAFC', // Slate 50
    border: '#334155', // Slate 700
    inputBg: '#0F172A', // Slate 900
    shadow: '#000000'
};

export const STATIC_COLORS = {
    success: '#10B981', // Emerald 500
    successBtn: '#059669', // Emerald 600
    whatsapp: '#22C55E', // Green 500
};

// COMPATIBILITY: Default COLORS for StyleSheet (Light Mode Initial)
export const COLORS = {
    ...LIGHT_PALETTE,
    ...STATIC_COLORS,
    primary: '#3B82F6', // Blue 500 (Vibrant)
    primarySoft: '#EFF6FF',
};

export const THEMES = {
    DEFAULT: { key: 'DEFAULT', primary: '#3B82F6', primarySoft: '#EFF6FF', label: 'Azul Real', secondary: '#1E40AF' },
    PURPLE: { key: 'PURPLE', primary: '#8B5CF6', primarySoft: '#F5F3FF', label: 'Violeta', secondary: '#5B21B6' },
    ORANGE: { key: 'ORANGE', primary: '#F97316', primarySoft: '#FFF7ED', label: 'Naranja Solar', secondary: '#9A3412' },
    TEAL: { key: 'TEAL', primary: '#14B8A6', primarySoft: '#F0FDFA', label: 'Menta', secondary: '#115E59' },
    BLACK: { key: 'BLACK', primary: '#334155', primarySoft: '#F8FAFC', label: 'Grafito', secondary: '#0F172A' },
    RED: { key: 'RED', primary: '#EF4444', primarySoft: '#FEF2F2', label: 'Carmesí', secondary: '#991B1B' },
    INDIGO: { key: 'INDIGO', primary: '#6366F1', primarySoft: '#EEF2FF', label: 'Índigo', secondary: '#3730A3' },
    PINK: { key: 'PINK', primary: '#EC4899', primarySoft: '#FDF2F8', label: 'Fucsia', secondary: '#9D174D' },
    GREEN: { key: 'GREEN', primary: '#22C55E', primarySoft: '#F0FDF4', label: 'Esmeralda', secondary: '#166534' },
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
