declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_CPCB_API_KEY: string;
      EXPO_PUBLIC_ISRO_API_KEY: string;
      EXPO_PUBLIC_WEATHER_API_KEY: string;
      EXPO_PUBLIC_API_URL: string;
    }
  }
}

export {};