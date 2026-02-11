import { Dimensions } from 'react-native';

// --- PALETTES ---
export const LIGHT_PALETTE = {
    bg: '#F1F5F9', // Slightly cooler light gray
    cardCtx: '#FFFFFF',
    secondary: '#475569', // Darker gray for better readability
    textDark: '#020617', // Almost black for maximum contrast
    border: '#E2E8F0',
    inputBg: '#F8FAFC',
    shadow: '#94A3B8'
};

export const DARK_PALETTE = {
    bg: '#0F172A',
    cardCtx: '#1E293B',
    secondary: '#94A3B8',
    textDark: '#F8FAFC',
    border: '#334155',
    inputBg: '#0F172A',
    shadow: '#000000'
};

export const STATIC_COLORS = {
    success: '#059669',
    successBtn: '#10B981',
    whatsapp: '#25D366',
};

// COMPATIBILITY: Default COLORS for StyleSheet (Light Mode Initial)
export const COLORS = {
    ...LIGHT_PALETTE,
    ...STATIC_COLORS,
    primary: '#2563EB', // Default Blue
    primarySoft: '#EFF6FF',
};

export const THEMES = {
    DEFAULT: { key: 'DEFAULT', primary: '#2563EB', primarySoft: '#EFF6FF', label: 'Azul', secondary: '#475569' },
    PURPLE: { key: 'PURPLE', primary: '#7C3AED', primarySoft: '#F5F3FF', label: 'Morado', secondary: '#5B21B6' },
    ORANGE: { key: 'ORANGE', primary: '#EA580C', primarySoft: '#FFF7ED', label: 'Naranja', secondary: '#9A3412' },
    TEAL: { key: 'TEAL', primary: '#0D9488', primarySoft: '#F0FDFA', label: 'Turquesa', secondary: '#115E59' },
    BLACK: { key: 'BLACK', primary: '#1E293B', primarySoft: '#F1F5F9', label: 'Negro', secondary: '#0F172A' },
    RED: { key: 'RED', primary: '#DC2626', primarySoft: '#FEF2F2', label: 'Rojo', secondary: '#991B1B' },
    INDIGO: { key: 'INDIGO', primary: '#4F46E5', primarySoft: '#EEF2FF', label: 'Indigo', secondary: '#3730A3' },
    PINK: { key: 'PINK', primary: '#DB2777', primarySoft: '#FDF2F8', label: 'Rosa', secondary: '#9D174D' },
    GREEN: { key: 'GREEN', primary: '#16A34A', primarySoft: '#F0FDF4', label: 'Verde', secondary: '#166534' },
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
