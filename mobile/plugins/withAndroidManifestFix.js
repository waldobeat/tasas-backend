const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withAndroidManifestFix(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Ensure tools namespace
    if (!androidManifest.manifest.$['xmlns:tools']) {
        androidManifest.manifest.$['xmlns:tools'] = "http://schemas.android.com/tools";
    }

    const mainApplication = androidManifest.manifest.application[0];
    
    if (mainApplication && mainApplication['meta-data']) {
      const metaData = mainApplication['meta-data'].find(
        (md) => md.$['android:name'] === 'com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT'
      );
      
      if (metaData) {
        metaData.$['tools:replace'] = 'android:value';
      }
    }
    
    return config;
  });
};
