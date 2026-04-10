import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, verticalScale } from '../styles/theme';
import { authService } from '../utils/authService';

const CommentsModal = ({ visible, onClose, theme, activeColors }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ratingData, setRatingData] = useState({ average: 0, total: 0 });

    useEffect(() => {
        if (visible) {
            fetchComments();
        }
    }, [visible]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const data = await authService.getComments();
            if (data) {
                setComments(data.comments || []);
                setRatingData({ average: data.averageRating || 0, total: data.totalComments || 0 });
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderComment = ({ item }) => (
        <View style={[styles.commentCard, { backgroundColor: activeColors.cardCtx, borderColor: activeColors.border }]}>
            <View style={styles.commentHeader}>
                <View style={styles.userInfo}>
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                        <Text style={styles.avatarText}>{item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}</Text>
                    </View>
                    <View>
                        <Text style={[styles.userName, { color: activeColors.textDark }]}>
                            {item.userName || 'Usuario'}
                        </Text>
                        <View style={{ flexDirection: 'row' }}>
                            {[...Array(5)].map((_, i) => (
                                <Ionicons
                                    key={i}
                                    name={i < (item.rating || 5) ? "star" : "star-outline"}
                                    size={12}
                                    color="#F59E0B"
                                />
                            ))}
                        </View>
                    </View>
                </View>
                <Text style={[styles.dateText, { color: activeColors.secondary }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <Text style={[styles.commentText, { color: activeColors.text }]}>
                {item.text}
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: activeColors.bg }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: activeColors.border }]}>
                        <View>
                            <Text style={[styles.title, { color: activeColors.textDark }]}>Opiniones</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: activeColors.textDark, marginRight: 8 }}>
                                    {ratingData.average}
                                </Text>
                                <View>
                                    <View style={{ flexDirection: 'row' }}>
                                        {[...Array(5)].map((_, i) => (
                                            <Ionicons
                                                key={i}
                                                name={i < Math.round(ratingData.average) ? "star" : "star-outline"}
                                                size={16}
                                                color="#F59E0B"
                                            />
                                        ))}
                                    </View>
                                    <Text style={{ fontSize: 12, color: activeColors.secondary }}>
                                        {ratingData.total} valoraciones
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close-circle" size={30} color={activeColors.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={comments}
                            renderItem={renderComment}
                            keyExtractor={(item) => item._id || Math.random().toString()}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="chatbubbles-outline" size={48} color={activeColors.secondary} />
                                    <Text style={[styles.emptyText, { color: activeColors.secondary }]}>
                                        Aún no hay opiniones. ¡Sé el primero!
                                    </Text>
                                </View>
                            }
                        />
                    )}
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
        height: '85%',
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
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        marginBottom: 10
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 5
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40
    },
    commentCard: {
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    avatarText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14
    },
    userName: {
        fontWeight: '600',
        fontSize: 14,
        marginBottom: 2
    },
    dateText: {
        fontSize: 10
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50
    },
    emptyText: {
        marginTop: 10,
        fontSize: 14
    }
});

export default CommentsModal;
