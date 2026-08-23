const { withAndroidManifest, withMainApplication, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for DeliveryLiveStatus
 * Registers POST_NOTIFICATIONS permission and native Android DeliveryLiveStatusPackage
 */
const withDeliveryLiveStatus = (config) => {
  // 1. AndroidManifest.xml: Add POST_NOTIFICATIONS permission
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    const permissions = androidManifest.manifest['uses-permission'];
    const hasPostNotifications = permissions.some(
      (item) => item.$['android:name'] === 'android.permission.POST_NOTIFICATIONS'
    );

    if (!hasPostNotifications) {
      permissions.push({
        $: {
          'android:name': 'android.permission.POST_NOTIFICATIONS',
        },
      });
    }

    return config;
  });

  // 2. MainApplication: Register DeliveryLiveStatusPackage
  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    const packageName = 'com.zippit.laro.deliverylivestatus.DeliveryLiveStatusPackage';

    if (!contents.includes(packageName)) {
      // Add import
      contents = `import ${packageName}\n` + contents;

      // Register package in getPackages()
      if (contents.includes('Package>(')) {
        contents = contents.replace(
          'Package>(',
          `Package>(\n            DeliveryLiveStatusPackage(),`
        );
      } else if (contents.includes('Package> =')) {
        contents = contents.replace(
          'Package> =',
          `Package> = listOf(\n        DeliveryLiveStatusPackage(),`
        );
      }
    }

    config.modResults.contents = contents;
    return config;
  });

  return config;
};

module.exports = createRunOncePlugin(
  withDeliveryLiveStatus,
  'withDeliveryLiveStatus',
  '1.0.0'
);
