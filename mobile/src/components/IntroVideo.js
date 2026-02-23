import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, verticalScale } from '../styles/theme';

const { width, height } = Dimensions.get('window');

const IntroVideo = ({ onFinish, theme, activeColors }) => {
    // We try to load the video from assets.
    // If you add your real video, replace this require with: require('../../assets/intro.mp4')
    const videoSource = require('../../assets/placeholder-intro.mp4');

    const [isVideoReady, setIsVideoReady] = useState(false);

    const player = useVideoPlayer(videoSource, player => {
        player.loop = false;
        player.play();
    });

    // Listen to player status to know when it finishes
    React.useEffect(() => {
        const subscription = player.addListener('statusChange', (status) => {
            if (status === 'readyToPlay') {
                setIsVideoReady(true);
            }
        });

        const endSubscription = player.addListener('playToEnd', () => {
            onFinish(); // Auto-skip when video ends
        });

        return () => {
            subscription.remove();
            endSubscription.remove();
        };
    }, [player, onFinish]);

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg }]}>
            <VideoView
                style={styles.video}
                player={player}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
                nativeControls={false}
                contentFit="cover"
            />

            {/* Overlay Gradient (Optional) */}
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={[styles.skipButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                    onPress={() => {
                        player.pause();
                        onFinish();
                    }}
                >
                    <Text style={styles.skipText}>Omitir Intro</Text>
                    <Ionicons name="chevron-forward" size={16} color="white" />
                </TouchableOpacity>

                <View style={styles.branding}>
                    <Text style={styles.title}>Finanzas Premium</Text>
                    <Text style={styles.subtitle}>Gana dólares al registrarte y usar el gestor</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    video: {
        width: width,
        height: height,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        paddingVertical: verticalScale(50),
        paddingHorizontal: scale(20),
    },
    skipButton: {
        alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: verticalScale(10),
    },
    skipText: {
        color: 'white',
        fontWeight: 'bold',
        marginRight: 5,
        fontSize: moderateScale(14)
    },
    branding: {
        alignItems: 'center',
        marginBottom: verticalScale(40),
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 20,
        borderRadius: 15,
    },
    title: {
        color: 'white',
        fontSize: moderateScale(28),
        fontWeight: '900',
        marginBottom: 5,
        textAlign: 'center'
    },
    subtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: moderateScale(16),
        textAlign: 'center'
    }
});

export default IntroVideo;
