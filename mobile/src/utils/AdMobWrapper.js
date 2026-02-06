import { Platform } from 'react-native';

let RewardedAd, RewardedAdEventType, TestIds, AdEventType, BannerAd, BannerAdSize;

try {
    const adMob = require('react-native-google-mobile-ads');
    RewardedAd = adMob.RewardedAd;
    RewardedAdEventType = adMob.RewardedAdEventType;
    TestIds = adMob.TestIds;
    AdEventType = adMob.AdEventType;
    BannerAd = adMob.BannerAd;
    BannerAdSize = adMob.BannerAdSize;
} catch (error) {
    console.warn("AdMob not found (likely running in Expo Go). Using API Mock.");
}

// Mock implementation for Expo Go / Dev without native module
if (!RewardedAd) {
    TestIds = { REWARDED: 'mock-id', BANNER: 'mock-banner' };
    RewardedAdEventType = { LOADED: 'loaded', EARNED_REWARD: 'earned', CLOSED: 'closed' };
    AdEventType = { CLOSED: 'closed' };
    BannerAdSize = { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' };

    class MockRewardedAd {
        constructor(id, opts) {
            this.listeners = {};
        }
        static createForAdRequest(id, opts) {
            return new MockRewardedAd(id, opts);
        }
        addAdEventListener(event, callback) {
            this.listeners[event] = callback;
            return () => delete this.listeners[event];
        }
        load() {
            console.log("Mock Ad Loading...");
            setTimeout(() => {
                if (this.listeners['loaded']) this.listeners['loaded']();
            }, 1000);
        }
        show() {
            console.log("Mock Ad Showing...");
            setTimeout(() => {
                if (this.listeners['earned']) this.listeners['earned']({ amount: 1, type: 'mock' });
                if (this.listeners['closed']) this.listeners['closed']();
            }, 2000);
        }
    }
    RewardedAd = MockRewardedAd;

    // Mock Banner component
    const React = require('react');
    const { View, Text } = require('react-native');
    BannerAd = (props) => (
        <View style={{ height: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderColor: '#ddd' }}>
            <Text style={{ fontSize: 10, color: '#999' }}>AD BANNER MOCK [{props.unitId}]</Text>
        </View>
    );
}

export { RewardedAd, RewardedAdEventType, TestIds, AdEventType, BannerAd, BannerAdSize };
