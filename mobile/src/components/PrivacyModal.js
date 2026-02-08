import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const PrivacyModal = ({ visible, onClose, onAccept, theme }) => {

    // Componente para las filas de información
    const InfoRow = ({ icon, title, text }) => (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name={icon} size={18} color={theme.primary} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.textDark }]}>{title}</Text>
            </View>
            <Text style={[styles.sectionText, { color: theme.secondary }]}>{text}</Text>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.cardCtx, shadowColor: theme.shadow }]}>

                    <View style={[styles.topIndicator, { backgroundColor: theme.border }]} />

                    <View style={styles.header}>
                        <View>
                            <Text style={[styles.title, { color: theme.textDark }]}>Política de Privacidad</Text>
                            <Text style={[styles.subtitle, { color: theme.secondary }]}>Versión oficial • Feb 2026</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.secondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollArea}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <Text style={[styles.introText, { color: theme.secondary }]}>
                            Esta aplicación es operada por <Text style={{ fontWeight: 'bold', color: theme.textDark }}>cafesitoXpressVE Group</Text>. Al utilizar nuestros servicios, usted acepta los siguientes términos:
                        </Text>

                        <InfoRow
                            icon="information-circle-outline"
                            title="1. Naturaleza del Servicio"
                            text="La Tasa es una herramienta estrictamente informativa. Su propósito es facilitar el acceso a indicadores económicos públicos (BCV, entre otros) para referencia personal. No garantizamos la exactitud absoluta de los datos externos."
                        />

                        <InfoRow
                            icon="shield-checkmark-outline"
                            title="2. Exención de Responsabilidad"
                            text="Queremos ser transparentes: No somos una entidad bancaria ni financiera. No vendemos, compramos ni intercambiamos divisas de ningún tipo. No intermediamos en transacciones financieras ni captamos fondos del público."
                        />

                        <InfoRow
                            icon="cash-outline"
                            title="3. Gratuidad y Publicidad"
                            text="El uso de esta aplicación es completamente gratuito. Para sostener los costos de desarrollo y servidores, incluimos publicidad de terceros. Ofrecemos funciones voluntarias para desactivar anuncios temporalmente sin costo monetario."
                        />

                        <InfoRow
                            icon="eye-off-outline"
                            title="4. Recopilación de Datos"
                            text="Respetamos su privacidad. No recopilamos datos personales identificables (PII) como nombres o documentos. Se utilizan identificadores anónimos solo para guardar sus preferencias de configuración y gestionar la frecuencia de anuncios."
                        />

                        <InfoRow
                            icon="mail-outline"
                            title="5. Contacto y Soporte"
                            text="Para cualquier duda, sugerencia o reporte técnico, puede contactar directamente al equipo de soporte de cafesitoXpressVE Group a través de nuestros canales oficiales de atención al desarrollador."
                        />

                        <View style={{ height: 20 }} />
                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <TouchableOpacity
                            style={[styles.acceptBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
                            onPress={onAccept}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.acceptBtnText}>Aceptar y Continuar</Text>
                            <Ionicons name="chevron-forward" size={18} color="white" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                        <Text style={[styles.footerNote, { color: theme.secondary }]}>Desarrollado con compromiso por cafesitoXpressVE</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.92,
        maxHeight: height * 0.8, // Asegura que el modal no se salga de la pantalla
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        elevation: 20,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
    },
    topIndicator: {
        width: 35,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    closeButton: {
        padding: 4,
    },
    scrollArea: {
        flexGrow: 0, // Importante para que el scroll no empuje el footer fuera
    },
    scrollContent: {
        paddingHorizontal: 4,
    },
    introText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
    },
    sectionContainer: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    sectionText: {
        fontSize: 14,
        lineHeight: 21,
        paddingLeft: 42,
    },
    footer: {
        marginTop: 10,
        paddingTop: 15,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    acceptBtn: {
        flexDirection: 'row',
        paddingVertical: 16, // Increased height
        width: '100%',
        borderRadius: 20, // Rounder corners
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 8 }, // Deeper shadow
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        marginTop: 10,
    },
    acceptBtnText: {
        color: '#FFFFFF',
        fontSize: 18, // Larger text
        fontWeight: '800', // Bolder
        letterSpacing: 0.5,
    },
    footerNote: {
        fontSize: 10,
        marginTop: 10,
        fontWeight: '500'
    },
});

export default PrivacyModal;