import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme';

const PrivacyModal = ({ visible, onClose, onAccept, theme }) => {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Aviso Legal</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={28} color={COLORS.secondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalBold}>1. Naturaleza Informativa</Text>
                        <Text style={styles.modalP}>La app muestra datos referenciales del BCV. El acceso es gratuito.</Text>
                        <Text style={styles.modalBold}>2. Premium</Text>
                        <Text style={styles.modalP}>Los pagos son por herramientas de gestión.</Text>
                        <Text style={styles.modalBold}>3. Exención</Text>
                        <Text style={styles.modalP}>No somos banco ni vendemos divisas.</Text>
                        <Text style={styles.modalBold}>4. Privacidad</Text>
                        <Text style={styles.modalP}>No recopilamos datos personales, todo es local/anónimo.</Text>
                    </ScrollView>
                    <TouchableOpacity
                        style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                        onPress={onAccept}
                    >
                        <Text style={styles.modalBtnText}>He leído y Acepto</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 30, maxHeight: '80%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textDark },
    modalBold: { fontWeight: '700', fontSize: 16, color: COLORS.textDark, marginTop: 15, marginBottom: 6 },
    modalP: { fontSize: 15, color: COLORS.secondary, lineHeight: 24 },
    modalBtn: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 20 },
    modalBtnText: { color: 'white', fontWeight: '700', fontSize: 16 }
});

export default PrivacyModal;
