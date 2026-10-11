import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

const CalendarModal = ({
    visible,
    onClose,
    selectedDate,
    onSelect,
    theme,
    activeColors
}) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ backgroundColor: activeColors.cardCtx, margin: 20, padding: 20, borderRadius: 20 }}>
                    <Text style={{ textAlign: 'center', color: activeColors.textDark, marginBottom: 20 }}>
                        Seleccionar Fecha
                    </Text>
                    {/* Simplified Calendar for refactor - using Today as primary action for stability */}
                    <TouchableOpacity
                        onPress={() => onSelect(new Date())}
                        style={{ padding: 10, backgroundColor: theme.primary, borderRadius: 10, alignItems: 'center' }}
                    >
                        <Text style={{ color: 'white' }}>Hoy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onClose}
                        style={{ marginTop: 10, alignItems: 'center' }}
                    >
                        <Text style={{ color: activeColors.secondary }}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default CalendarModal;
