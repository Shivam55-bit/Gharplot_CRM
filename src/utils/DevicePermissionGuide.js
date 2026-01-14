/**
 * DevicePermissionGuide.js
 * Manufacturer-specific guides for notification permissions
 * Fixes notification issues on different phone brands
 */
import { Alert, Linking, Platform } from 'react-native';

class DevicePermissionGuide {
  /**
   * Get device manufacturer from Build properties
   */
  static async getManufacturer() {
    try {
      // Use React Native's Platform constants
      const brand = Platform.constants?.Brand || 'unknown';
      const manufacturer = Platform.constants?.Manufacturer || brand;
      return manufacturer.toLowerCase();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get manufacturer-specific settings guide
   */
  static async getPermissionGuide() {
    const manufacturer = await this.getManufacturer();
    
    const guides = {
      xiaomi: {
        name: 'Xiaomi/Redmi/POCO',
        steps: [
          '1. Settings → Apps → GharPlot',
          '2. Autostart → Enable',
          '3. Battery saver → No restrictions',
          '4. Notifications → Enable all',
          '5. Other permissions → Display pop-up windows → Allow',
        ],
        criticalSettings: [
          'Autostart (आवश्यक)',
          'Battery saver → No restrictions',
          'Display pop-up windows',
        ]
      },
      
      oppo: {
        name: 'Oppo/Realme',
        steps: [
          '1. Settings → Apps → GharPlot',
          '2. Battery → Background freeze → Don\'t freeze',
          '3. Startup Manager → Enable',
          '4. Notifications → Enable all',
          '5. Other permissions → Display over other apps → Allow',
        ],
        criticalSettings: [
          'Startup Manager (जरूरी)',
          'Background freeze → Off',
        ]
      },
      
      vivo: {
        name: 'Vivo/iQOO',
        steps: [
          '1. Settings → Apps → GharPlot',
          '2. Battery → High background power consumption → Allow',
          '3. Autostart → Enable',
          '4. Notifications → Enable all',
          '5. Floating window → Allow',
        ],
        criticalSettings: [
          'Autostart (आवश्यक)',
          'High background power consumption',
        ]
      },
      
      oneplus: {
        name: 'OnePlus',
        steps: [
          '1. Settings → Apps → GharPlot',
          '2. Battery optimization → Don\'t optimize',
          '3. App auto-launch → Enable',
          '4. Notifications → Enable all',
        ],
        criticalSettings: [
          'Battery optimization → Off',
          'App auto-launch',
        ]
      },
      
      samsung: {
        name: 'Samsung',
        steps: [
          '1. Settings → Apps → GharPlot',
          '2. Battery → Background usage limits → Unrestricted',
          '3. Notifications → Enable all',
          '4. Sleeping apps → Remove GharPlot from list',
        ],
        criticalSettings: [
          'Background usage → Unrestricted',
          'Remove from Sleeping apps',
        ]
      },
      
      huawei: {
        name: 'Huawei/Honor',
        steps: [
          '1. Settings → Apps → GharPlot',
          '2. Launch → Manage manually → Enable all',
          '3. Battery → App launch → Manual → Enable all',
          '4. Notifications → Enable all',
        ],
        criticalSettings: [
          'Launch → Manual (all enabled)',
          'Battery → Manual launch',
        ]
      },
      
      default: {
        name: 'Android (Generic)',
        steps: [
          '1. Settings → Apps → GharPlot',
          '2. Battery → Unrestricted',
          '3. Notifications → Enable all',
          '4. Alarms & reminders → Allow',
        ],
        criticalSettings: [
          'Battery → Unrestricted',
          'Alarms & reminders',
        ]
      }
    };

    // Return guide for detected manufacturer or default
    return guides[manufacturer] || guides.default;
  }

  /**
   * Show manufacturer-specific permission dialog
   */
  static async showPermissionDialog() {
    const guide = await this.getPermissionGuide();
    
    const message = `${guide.name} के लिए जरूरी Settings:\n\n` +
      guide.steps.join('\n\n') +
      '\n\n⚠️ सबसे जरूरी:\n' +
      guide.criticalSettings.map(s => `• ${s}`).join('\n');

    Alert.alert(
      '🔔 Notification Settings Guide',
      message,
      [
        { text: 'Later', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => Linking.openSettings() 
        }
      ]
    );
  }

  /**
   * Check if device needs special configuration
   */
  static async needsSpecialConfiguration() {
    const manufacturer = await this.getManufacturer();
    const problematicBrands = ['xiaomi', 'oppo', 'vivo', 'oneplus', 'huawei', 'realme'];
    return problematicBrands.includes(manufacturer);
  }

  /**
   * Auto-detect and show relevant guide
   */
  static async autoShowGuideIfNeeded() {
    if (Platform.OS !== 'android') return;
    
    const needsGuide = await this.needsSpecialConfiguration();
    
    if (needsGuide) {
      // Show guide after 3 seconds
      setTimeout(() => {
        this.showPermissionDialog();
      }, 3000);
    }
  }
}

export default DevicePermissionGuide;
