import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const PrivacyModal = ({ visible, onClose, onAccept, theme }) => {

    const InfoRow = ({ icon, title, text }) => (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Ionicons name={icon} size={20} color={theme.primary} style={styles.headerIcon} />
                <Text style={[styles.sectionTitle, { color: theme.textDark }]}>{title}</Text>
            </View>
            <View style={[styles.textBorderLeft, { borderLeftColor: theme.border }]}>
                <Text style={[styles.sectionText, { color: theme.secondary }]}>{text}</Text>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.cardCtx }]}>

                    {/* Header Corporativo */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <View style={styles.headerTitleContainer}>
                            <Text style={[styles.title, { color: theme.textDark }]}>Términos y Privacidad</Text>
                            <View style={[styles.badge, { backgroundColor: theme.primary + '10' }]}>
                                <Text style={[styles.badgeText, { color: theme.primary }]}>VERSIÓN 2.0</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close-outline" size={26} color={theme.secondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollArea}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <Text style={[styles.introText, { color: theme.secondary }]}>
                            Bienvenido a <Text style={{ fontWeight: '700', color: theme.textDark }}>cafesitoXpressVE</Text>.
                            El presente documento detalla el marco legal y de privacidad que rige el uso de nuestra plataforma informativa.
                        </Text>

                        <InfoRow
                            icon="shield-check-outline"
                            title="Marco Legal e Informativo"
                            text="Esta herramienta tiene carácter estrictamente referencial. Los datos provienen de fuentes públicas oficiales. No garantizamos la inmutabilidad de los valores externos."
                        />

                        <InfoRow
                            icon="briefcase-outline"
                            title="Limitación de Servicios"
                            text="cafesitoXpressVE no es una entidad financiera. No realizamos operaciones de cambio, captación de fondos ni intermediación bursátil bajo ningún concepto."
                        />

                        <InfoRow
                            icon="lock-closed-outline"
                            title="Tratamiento de Datos"
                            text="No recolectamos Información de Identificación Personal (PII). Los datos técnicos se procesan de forma anónima para optimizar la experiencia del usuario y seguridad."
                        />

                        <InfoRow
                            icon="megaphone-outline"
                            title="Sostenibilidad"
                            text="El acceso es gratuito y se financia mediante publicidad de terceros. Al continuar, usted comprende que los anuncios permiten mantener la infraestructura técnica."
                        />

                        <InfoRow
                            icon="alert-circle-outline"
                            title="Aviso de Volatilidad"
                            text="Las referencias de mercados P2P son altamente fluctuantes. Se recomienda validación directa en las plataformas origen antes de cualquier decisión."
                        />

                        <View style={{ height: 10 }} />
                    </ScrollView>

                    {/* Footer con Acción Clara */}
                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <Text style={[styles.footerConsent, { color: theme.secondary }]}>
                            Al pulsar el botón, usted confirma que ha leído y acepta nuestras políticas.
                        </Text>
                        <TouchableOpacity
                            style={[styles.acceptBtn, { backgroundColor: theme.primary }]}
                            onPress={onAccept}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.acceptBtnText}>Entendido y Aceptar</Text>
                        </TouchableOpacity>
                        <Text style={[styles.legalNote, { color: theme.secondary }]}>
                            © 2026 cafesitoXpressVE Group • Soporte Técnico
                        </Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.9,
        maxHeight: height * 0.85,
        borderRadius: 16, // Bordes menos curvos, más serios
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
            android: { elevation: 5 }
        })
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginRight: 10,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    scrollArea: {
        paddingHorizontal: 24,
    },
    scrollContent: {
        paddingVertical: 20,
    },
    introText: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 24,
        opacity: 0.9,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerIcon: {
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    textBorderLeft: {
        borderLeftWidth: 2,
        marginLeft: 9,
        paddingLeft: 22,
    },
    sectionText: {
        fontSize: 13,
        lineHeight: 20,
        opacity: 0.8,
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
    },
    footerConsent: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
    },
    acceptBtn: {
        height: 54,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    legalNote: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 16,
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

export default PrivacyModal;