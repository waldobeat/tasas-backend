import React from 'react';
import { Modal, TouchableOpacity, View, Text, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, THEMES } from '../styles/theme';

const SettingsMenu = ({
    visible,
    onClose,
    activeColors,
    darkMode,
    toggleDarkMode,
    isPremium,
    activeThemeKey,
    changeTheme,
    setActiveModule,
    onOpenPrivacy,
    theme
}) => {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', padding: 24 }}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={{
                    backgroundColor: activeColors.cardCtx,
                    width: '100%',
                    height: 'auto',
                    maxHeight: '80%',
                    position: 'absolute',
                    bottom: 0,
                    borderTopLeftRadius: scale(30),
                    borderTopRightRadius: scale(30),
                    paddingTop: scale(20),
                    paddingHorizontal: 25,
                    paddingBottom: 40
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(20) }}>
                        <Text style={{ fontSize: moderateScale(20), fontWeight: '900', color: activeColors.textDark }}>Ajustes</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={scale(24)} color={activeColors.secondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{ backgroundColor: activeColors.bg, borderRadius: 16, overflow: 'hidden' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: scale(12), borderBottomWidth: 1, borderBottomColor: activeColors.border }}>
                                <Ionicons name="moon" size={18} color={activeColors.textDark} style={{ marginRight: 12 }} />
                                <Text style={{ flex: 1, color: activeColors.textDark }}>Modo Oscuro</Text>
                                <Switch
                                    value={darkMode}
                                    onValueChange={toggleDarkMode}
                                    trackColor={{ false: '#CBD5E1', true: theme.primary }}
                                    thumbColor="white"
                                />
                            </View>

                            <View style={{ padding: scale(12), borderBottomWidth: 1, borderBottomColor: activeColors.border }}>
                                <Text style={{ marginBottom: 10, color: activeColors.textDark, fontWeight: '700' }}>Personalizar Color</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'center' }}>
                                    {Object.values(THEMES).map(t => (
                                        <TouchableOpacity
                                            key={t.key}
                                            onPress={() => changeTheme(t.key)}
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                backgroundColor: t.primary,
                                                borderWidth: activeThemeKey === t.key ? 3 : 2,
                                                borderColor: activeThemeKey === t.key ? activeColors.textDark : 'transparent',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                shadowColor: t.primary,
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.3,
                                                shadowRadius: 5,
                                                elevation: 4
                                            }}
                                        >
                                            {activeThemeKey === t.key && <Ionicons name="checkmark" size={20} color="white" />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => { onOpenPrivacy(); onClose(); }}
                                style={{ flexDirection: 'row', padding: scale(12) }}
                            >
                                <Ionicons name="shield-checkmark-outline" size={18} color={activeColors.primary} style={{ marginRight: 12 }} />
                                <Text style={{ flex: 1, color: activeColors.primary }}>Términos y Privacidad</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default SettingsMenu;
