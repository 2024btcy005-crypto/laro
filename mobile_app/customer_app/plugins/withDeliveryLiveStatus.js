const { withAndroidManifest, withMainApplication, withSettingsGradle, withAppBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');

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

  // 2. Link in settings.gradle
  config = withSettingsGradle(config, (config) => {
    const settingsStr = `
include ':delivery-live-status'
project(':delivery-live-status').projectDir = new File(rootProject.projectDir, '../modules/delivery-live-status/android')
`;
    if (!config.modResults.contents.includes("include ':delivery-live-status'")) {
      config.modResults.contents += settingsStr;
    }
    return config;
  });

  // 3. Link in app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    const dependencyStr = `    implementation project(':delivery-live-status')`;
    if (!config.modResults.contents.includes("implementation project(':delivery-live-status')")) {
      // Find dependencies block and inject
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*{/,
        `dependencies {\n${dependencyStr}`
      );
    }
    return config;
  });

  // 4. MainApplication: Register DeliveryLiveStatusPackage
  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    const packageName = 'com.zippit.laro.deliverylivestatus.DeliveryLiveStatusPackage';

    if (!contents.includes(packageName)) {
      // Add import after package declaration
      contents = contents.replace(
        /^package .*$/m,
        (match) => `${match}\nimport ${packageName}`
      );

      // Register package in getPackages()
      if (contents.includes('PackageList(this).packages.apply {')) {
        contents = contents.replace(
          'PackageList(this).packages.apply {',
          `PackageList(this).packages.apply {\n          add(DeliveryLiveStatusPackage())`
        );
      } else if (contents.includes('List<ReactPackage> =')) {
        // Fallback for some other templates
        contents = contents.replace(
          'List<ReactPackage> =',
          `List<ReactPackage> = listOf(DeliveryLiveStatusPackage()) + `
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
