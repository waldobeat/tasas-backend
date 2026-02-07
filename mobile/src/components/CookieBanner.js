import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../styles/theme';

const CookieBanner = ({ onAccept }) => {
    return (
        <View style={styles.cookieBanner}>
            <Text style={styles.cookieText}>Usamos cookies para mejorar tu experiencia.</Text>
            <TouchableOpacity
                style={styles.cookieBtn}
                onPress={onAccept}
            >
                <Text style={styles.cookieBtnText}>Entendido</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    cookieBanner: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: COLORS.textDark,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000
    },
    cookieText: { color: '#E2E8F0', fontSize: 14, flex: 1, fontWeight: '500' },
    cookieBtn: {
        backgroundColor: '#334155',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginLeft: 10,
        borderWidth: 1,
        borderColor: '#475569'
    },
    cookieBtnText: { color: 'white', fontWeight: '700', fontSize: 14 }
});

export default CookieBanner;
