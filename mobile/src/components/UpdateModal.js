import React from 'react';
import { Modal, View, Text, Animated, ActivityIndicator } from 'react-native';
import { scale } from '../styles/theme';

const UpdateModal = ({
    visible,
    isDownloading,
    downloadProgress,
    isUpdatePending,
    progressAnim,
    activeColors,
    theme
}) => {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 30 }}>
                <View style={{ backgroundColor: activeColors.cardCtx, padding: 30, borderRadius: 20, width: '100%', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={{ color: activeColors.textDark, fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>
                        {isUpdatePending ? 'Actualización Lista' : 'Descargando Mejora'}
                    </Text>
                    <Text style={{ color: activeColors.secondary, textAlign: 'center', marginTop: 10, fontSize: 13 }}>
                        {isUpdatePending
                            ? 'La app se reiniciará para aplicar los cambios.'
                            : 'Estamos preparando una versión más estable para ti.'}
                    </Text>

                    <View style={{ width: '100%', height: 10, backgroundColor: activeColors.bg, borderRadius: 5, marginTop: 20, overflow: 'hidden' }}>
                        <Animated.View style={{
                            width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%']
                            }),
                            height: '100%',
                            backgroundColor: theme.primary
                        }} />
                    </View>

                    {!isUpdatePending && (
                        <Text style={{ color: theme.primary, fontWeight: 'bold', marginTop: 10 }}>
                            {Math.round((downloadProgress || 0) * 100)}%
                        </Text>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default UpdateModal;
