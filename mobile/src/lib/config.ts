import Constants from 'expo-constants';

const fallbackApiBaseUrl =
  Constants.expoConfig?.hostUri ? `http://${Constants.expoConfig.hostUri.split(':')[0]}:3000` : 'http://localhost:3000';

export const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || fallbackApiBaseUrl).replace(/\/$/, '');
