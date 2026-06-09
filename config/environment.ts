import Constants from 'expo-constants';

type AppExtra = {
  groqApiKey?: string;
  groqModel?: string;
  nasaApiKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

export const environment = {
  groqApiKey: extra.groqApiKey,
  groqModel: extra.groqModel || 'llama-3.1-8b-instant',
  nasaApiKey: extra.nasaApiKey,
};
