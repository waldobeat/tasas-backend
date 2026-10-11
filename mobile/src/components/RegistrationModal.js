import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthScreen from './AuthScreen';
import { scale, moderateScale } from '../styles/theme';

const RegistrationModal = ({ visible, onClose, onAuthSuccess, theme, activeColors }) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: activeColors.bg }]}>
                    {/* Header with Close Button */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close-circle" size={30} color={activeColors.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Auth Screen Content */}
                    <AuthScreen
                        onAuthSuccess={(user) => {
                            onAuthSuccess(user);
                            onClose();
                        }}
                        theme={theme}
                        activeColors={activeColors}
                        onShowPrivacy={() => { }} // Handle privacy if needed
                        isGiftMode={true}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '90%',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingTop: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 10
    },
    closeBtn: {
        padding: 5
    }
});

export default RegistrationModal;
