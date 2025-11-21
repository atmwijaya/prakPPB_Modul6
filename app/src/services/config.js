import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

export const BACKEND_URL = extra.backendUrl;
export const MQTT_BROKER_URL = extra.mqtt?.brokerUrl;
export const MQTT_TOPIC = extra.mqtt?.topic;

export const SUPABASE_URL = extra.supabase?.url;
export const SUPABASE_ANON_KEY = extra.supabase?.anonKey;

export function assertConfig() {
  if (!BACKEND_URL) {
    console.warn("Backend URL missing from Expo config.");
  }
  if (!MQTT_BROKER_URL || !MQTT_TOPIC) {
    console.warn("MQTT broker URL or topic missing from Expo config.");
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase URL or anon key missing from Expo config.");
  }
}
