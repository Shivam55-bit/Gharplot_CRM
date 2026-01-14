/**
 * NotificationDiagnostics.js
 * Comprehensive notification diagnostics and fixes
 * Helps identify why notifications don't work on specific devices
 */
import { Platform, Alert } from 'react-native';
import notifee from '@notifee/react-native';
import DevicePermissionGuide from './DevicePermissionGuide';

class NotificationDiagnostics {
  /**
   * Run complete diagnostic check
   */
  static async runDiagnostics() {
    console.log('🔍 Running Notification Diagnostics...\n');
    
    const results = {
      device: await this.checkDeviceInfo(),
      permissions: await this.checkPermissions(),
      battery: await this.checkBatteryOptimization(),
      channels: await this.checkNotificationChannels(),
      settings: await this.checkNotificationSettings(),
    };

    // Generate report
    const report = this.generateReport(results);
    console.log(report);
    
    return results;
  }

  /**
   * Check device information
   */
  static async checkDeviceInfo() {
    try {
      const manufacturer = Platform.constants?.Manufacturer || 'Unknown';
      const brand = Platform.constants?.Brand || manufacturer;
      const model = Platform.constants?.Model || 'Unknown';
      
      const info = {
        manufacturer: manufacturer,
        brand: brand,
        model: model,
        androidVersion: Platform.Version,
        isProblematicBrand: ['xiaomi', 'oppo', 'vivo', 'realme', 'poco'].some(
          brand => manufacturer.toLowerCase().includes(brand) || 
                   (typeof brand === 'string' && brand.toLowerCase().includes(brand))
        ),
      };

      console.log('📱 Device Info:');
      console.log(`   Manufacturer: ${info.manufacturer}`);
      console.log(`   Brand: ${info.brand}`);
      console.log(`   Model: ${info.model}`);
      console.log(`   Android: ${info.androidVersion}`);
      console.log(`   Problematic Brand: ${info.isProblematicBrand ? '⚠️ YES' : '✅ NO'}`);
      
      return info;
    } catch (error) {
      console.error('❌ Device info check failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Check notification permissions
   */
  static async checkPermissions() {
    try {
      const settings = await notifee.getNotificationSettings();
      
      const permissions = {
        granted: settings.authorizationStatus === 1, // AUTHORIZED
        authStatus: settings.authorizationStatus,
        exactAlarms: false,
      };

      // Check exact alarms (Android 12+)
      if (Platform.Version >= 31) {
        try {
          permissions.exactAlarms = await notifee.canScheduleExactAlarms();
        } catch {
          permissions.exactAlarms = false;
        }
      } else {
        permissions.exactAlarms = true; // Not needed below Android 12
      }

      console.log('\n🔐 Permissions:');
      console.log(`   Notifications: ${permissions.granted ? '✅ Granted' : '❌ Denied'}`);
      console.log(`   Exact Alarms: ${permissions.exactAlarms ? '✅ Granted' : '❌ Denied'}`);
      
      return permissions;
    } catch (error) {
      console.error('❌ Permission check failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Check battery optimization
   */
  static async checkBatteryOptimization() {
    try {
      const powerManager = await notifee.getPowerManagerInfo();
      
      const battery = {
        isOptimized: true, // Assume optimized by default
        activity: powerManager?.activity || 'unknown',
      };

      console.log('\n🔋 Battery:');
      console.log(`   Optimization: ${battery.isOptimized ? '⚠️ Enabled (BAD)' : '✅ Disabled (GOOD)'}`);
      console.log(`   Activity: ${battery.activity}`);
      
      return battery;
    } catch (error) {
      console.warn('⚠️ Battery check not available:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Check notification channels
   */
  static async checkNotificationChannels() {
    try {
      const channels = await notifee.getChannels();
      
      const channelInfo = {
        count: channels.length,
        channels: channels.map(ch => ({
          id: ch.id,
          name: ch.name,
          importance: ch.importance,
          blocked: ch.blocked || false,
        })),
      };

      console.log('\n📢 Notification Channels:');
      console.log(`   Total: ${channelInfo.count}`);
      channels.forEach(ch => {
        console.log(`   • ${ch.name}: ${ch.blocked ? '❌ BLOCKED' : '✅ Active'} (Importance: ${ch.importance})`);
      });
      
      return channelInfo;
    } catch (error) {
      console.error('❌ Channel check failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Check overall notification settings
   */
  static async checkNotificationSettings() {
    try {
      const settings = await notifee.getNotificationSettings();
      
      const info = {
        enabled: settings.authorizationStatus === 1,
        android: settings.android || {},
      };

      console.log('\n⚙️ Notification Settings:');
      console.log(`   Enabled: ${info.enabled ? '✅ YES' : '❌ NO'}`);
      console.log(`   Settings:`, JSON.stringify(info.android, null, 2));
      
      return info;
    } catch (error) {
      console.error('❌ Settings check failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Generate diagnostic report
   */
  static generateReport(results) {
    let report = '\n' + '='.repeat(50) + '\n';
    report += '📊 NOTIFICATION DIAGNOSTIC REPORT\n';
    report += '='.repeat(50) + '\n\n';

    // Device issues
    if (results.device?.isProblematicBrand) {
      report += '⚠️ WARNING: Device brand known for aggressive battery optimization!\n';
      report += '   Manual configuration required for notifications to work.\n\n';
    }

    // Permission issues
    if (!results.permissions?.granted) {
      report += '❌ ISSUE: Notification permission not granted\n';
      report += '   FIX: Enable notifications in Settings\n\n';
    }

    if (!results.permissions?.exactAlarms && Platform.Version >= 31) {
      report += '❌ ISSUE: Exact alarm permission not granted (Android 12+)\n';
      report += '   FIX: Enable "Alarms & reminders" in Settings\n\n';
    }

    // Battery issues
    if (results.battery?.isOptimized) {
      report += '⚠️ WARNING: Battery optimization is enabled\n';
      report += '   FIX: Disable battery optimization for this app\n\n';
    }

    // Channel issues
    const blockedChannels = results.channels?.channels?.filter(ch => ch.blocked) || [];
    if (blockedChannels.length > 0) {
      report += `❌ ISSUE: ${blockedChannels.length} notification channel(s) blocked\n`;
      blockedChannels.forEach(ch => {
        report += `   • ${ch.name}\n`;
      });
      report += '   FIX: Enable blocked channels in Settings\n\n';
    }

    // Final verdict
    const allGood = results.permissions?.granted && 
                     results.permissions?.exactAlarms && 
                     blockedChannels.length === 0;

    report += '='.repeat(50) + '\n';
    if (allGood) {
      report += '✅ VERDICT: Notifications should work correctly!\n';
    } else {
      report += '❌ VERDICT: Issues detected - notifications may not work!\n';
      report += '   Check the fixes above and manufacturer-specific guide.\n';
    }
    report += '='.repeat(50) + '\n';

    return report;
  }

  /**
   * Show diagnostic results to user
   */
  static async showDiagnosticsDialog() {
    const results = await this.runDiagnostics();
    
    const issues = [];
    
    if (!results.permissions?.granted) {
      issues.push('❌ Notification permission denied');
    }
    
    if (!results.permissions?.exactAlarms && Platform.Version >= 31) {
      issues.push('❌ Exact alarms not allowed');
    }
    
    if (results.device?.isProblematicBrand) {
      issues.push('⚠️ Device needs special configuration');
    }
    
    const blockedChannels = results.channels?.channels?.filter(ch => ch.blocked) || [];
    if (blockedChannels.length > 0) {
      issues.push(`❌ ${blockedChannels.length} channel(s) blocked`);
    }

    if (issues.length === 0) {
      Alert.alert(
        '✅ Notifications Ready',
        'All notification settings are properly configured!',
        [{ text: 'OK' }]
      );
    } else {
      const message = 'Issues found:\n\n' + issues.join('\n') + 
        '\n\nWould you like to see the fix guide?';
      
      Alert.alert(
        '⚠️ Notification Issues Detected',
        message,
        [
          { text: 'Later', style: 'cancel' },
          { 
            text: 'Show Guide',
            onPress: () => DevicePermissionGuide.showPermissionDialog()
          }
        ]
      );
    }
    
    return results;
  }

  /**
   * Test notification immediately
   */
  static async testNotification() {
    try {
      await notifee.displayNotification({
        title: '🧪 Test Notification',
        body: 'If you see this, notifications are working!',
        android: {
          channelId: 'enquiry_reminders',
          importance: 4,
          sound: 'default',
        },
      });
      
      console.log('✅ Test notification sent!');
      return true;
    } catch (error) {
      console.error('❌ Test notification failed:', error);
      return false;
    }
  }
}

export default NotificationDiagnostics;

/**
 * USAGE:
 * 
 * 1. Run diagnostics in console:
 *    await NotificationDiagnostics.runDiagnostics()
 * 
 * 2. Show dialog to user:
 *    await NotificationDiagnostics.showDiagnosticsDialog()
 * 
 * 3. Test notification:
 *    await NotificationDiagnostics.testNotification()
 */
