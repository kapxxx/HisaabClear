import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.hisabclear.app',
  appName: 'Hisab Clear',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
