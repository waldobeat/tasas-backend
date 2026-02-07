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
    handleLogout,
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

                            {isPremium && (
                                <View style={{ padding: scale(12), borderBottomWidth: 1, borderBottomColor: activeColors.border }}>
                                    <Text style={{ marginBottom: 10, color: activeColors.textDark }}>Tema de la App</Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                                        {Object.values(THEMES).map(t => (
                                            <TouchableOpacity
                                                key={t.key}
                                                onPress={() => changeTheme(t.key)}
                                                style={{
                                                    width: 30,
                                                    height: 30,
                                                    borderRadius: 15,
                                                    backgroundColor: t.primary,
                                                    borderWidth: activeThemeKey === t.key ? 2 : 0,
                                                    borderColor: activeColors.textDark,
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {activeThemeKey === t.key && <Ionicons name="checkmark" size={16} color="white" />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <TouchableOpacity
                                onPress={() => { setActiveModule('rates'); onClose(); }}
                                style={{ flexDirection: 'row', padding: scale(12), borderBottomWidth: 1, borderBottomColor: activeColors.border }}
                            >
                                <Ionicons name="stats-chart-outline" size={18} color={activeColors.textDark} style={{ marginRight: 12 }} />
                                <Text style={{ flex: 1, color: activeColors.textDark }}>Tasas y Calculadora</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => { setActiveModule('finance'); onClose(); }}
                                style={{ flexDirection: 'row', padding: scale(12), borderBottomWidth: 1, borderBottomColor: activeColors.border }}
                            >
                                <Ionicons name="wallet-outline" size={18} color={activeColors.textDark} style={{ marginRight: 12 }} />
                                <Text style={{ flex: 1, color: activeColors.textDark }}>Gestión Financiera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => { handleLogout(); onClose(); }}
                                style={{ flexDirection: 'row', padding: scale(12) }}
                            >
                                <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 12 }} />
                                <Text style={{ flex: 1, color: "#EF4444" }}>Cerrar Sesión</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default SettingsMenu;
