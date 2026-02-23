import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const VastVideoPlayer = ({ adTagUrl, onAdEnded }) => {
    const [loading, setLoading] = useState(true);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://vjs.zencdn.net/7.20.3/video-js.css" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/videojs-ima/2.1.0/videojs.ima.css" rel="stylesheet" />
        <style>
            body { margin: 0; background-color: black; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
            .video-js { width: 100vw; height: 100vh; }
        </style>
    </head>
    <body>
        <video id="my-video" class="video-js vjs-default-skin" playsinline controls preload="auto">
            <source src="https://vjs.zencdn.net/v/oceans.mp4" type="video/mp4" />
        </video>
        
        <script src="https://vjs.zencdn.net/7.20.3/video.min.js"></script>
        <script src="https://imasdk.googleapis.com/js/sdkloader/ima3.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/videojs-contrib-ads/6.9.0/videojs.ads.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/videojs-ima/2.1.0/videojs.ima.min.js"></script>
        <script>
            var player = videojs('my-video');
            
            var options = {
                id: 'my-video',
                adTagUrl: '${adTagUrl}',
                showControlsForAds: true,
                debug: false
            };

            player.ima(options);

            // Notify React Native when ad is done or if there is an error so we can proceed
            var events = [
                google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
                google.ima.AdEvent.Type.SKIPPED,
                google.ima.AdEvent.Type.AD_ERROR
            ];

            player.ima.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, function() {
                window.ReactNativeWebView.postMessage("END");
            });

            for (var i = 0; i < events.length; i++) {
                player.ima.addEventListener(events[i], function() {
                    window.ReactNativeWebView.postMessage("END");
                });
            }

            // Start playing the ad automatically
            player.on('loadedmetadata', function() {
                // Ensure ad request is made
                player.ima.requestAds();
                player.play();
            });
            
            // Fallback: If ad doesn't load within 5 seconds, let user continue
            setTimeout(function() {
                 window.ReactNativeWebView.postMessage("END");
            }, 8000);
        </script>
    </body>
    </html>
    `;

    return (
        <View style={styles.container}>
            {loading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            )}
            <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                onLoadEnd={() => setLoading(false)}
                onMessage={(event) => {
                    const message = event.nativeEvent.data;
                    if (message === "END") {
                        if (onAdEnded) onAdEnded();
                    }
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 250, // Set height for banner-style wrapper or full screen
        backgroundColor: 'black',
        borderRadius: 16,
        overflow: 'hidden',
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        zIndex: 10,
    },
    webview: {
        flex: 1,
        backgroundColor: 'black',
    }
});

export default VastVideoPlayer;
