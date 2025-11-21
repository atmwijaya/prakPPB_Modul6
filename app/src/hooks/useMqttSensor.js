import { useEffect, useRef, useState, useCallback } from "react";
import { AppState } from "react-native";
import mqtt from "mqtt";
import { Buffer } from "buffer";
import { MQTT_BROKER_URL, MQTT_TOPIC } from "../services/config.js";
import { Api } from "../services/api.js"; // IMPORT API UNTUK FETCH THRESHOLD

if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}

const clientOptions = {
  reconnectPeriod: 5000,
  connectTimeout: 30_000,
  protocolVersion: 4,
};

export function useMqttSensor() {
  const [state, setState] = useState({
    temperature: null,
    timestamp: null,
    connectionState: "disconnected",
    error: null,
  });

  const [currentThreshold, setCurrentThreshold] = useState(null);
  const [thresholdError, setThresholdError] = useState(null);

  const clientRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Function untuk fetch current threshold
  const fetchCurrentThreshold = useCallback(async () => {
    try {
      console.log("⚙️ [MQTT] Fetching current threshold...");
      const thresholds = await Api.getThresholds();
      
      if (Array.isArray(thresholds) && thresholds.length > 0) {
        const latestThreshold = thresholds[0];
        console.log("✅ [MQTT] Current threshold set to:", latestThreshold.value);
        setCurrentThreshold(latestThreshold.value);
        setThresholdError(null);
        return latestThreshold.value;
      } else {
        console.log("⚠️ [MQTT] No thresholds found, using default 30°C");
        setCurrentThreshold(30);
        setThresholdError("No thresholds configured, using default");
        return 30;
      }
    } catch (error) {
      console.warn("❌ [MQTT] Failed to fetch threshold:", error.message);
      setCurrentThreshold(30); // Fallback ke default
      setThresholdError(`Failed to fetch threshold: ${error.message}`);
      return 30;
    }
  }, []);

  // Check jika temperature melebihi threshold
  const checkTemperatureThreshold = useCallback((temperature, threshold) => {
    if (temperature === null || threshold === null) return;
    
    if (temperature > threshold) {
      console.log(`🚨 [ALERT] Temperature ${temperature}°C exceeds threshold ${threshold}°C`);
      // Di sini Anda bisa tambahkan logic untuk trigger alert/notification
    }
  }, []);

  useEffect(() => {
    // Fetch threshold pertama kali
    fetchCurrentThreshold();

    if (!MQTT_BROKER_URL || !MQTT_TOPIC) {
      setState((prev) => ({
        ...prev,
        error: "MQTT configuration missing. Update app.json",
      }));
      return;
    }

    const clientId = `rn-monitor-${Math.random().toString(16).slice(2)}`;
    const client = mqtt.connect(MQTT_BROKER_URL, {
      ...clientOptions,
      clientId,
      clean: true,
    });
    clientRef.current = client;

    const handleAppStateChange = (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
        console.log("🔄 [MQTT] App became active, reconnecting...");
        client.reconnect();
        
        // Refresh threshold ketika app aktif kembali
        fetchCurrentThreshold();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    client.on("connect", () => {
      console.log("✅ [MQTT] Connected to broker");
      setState((prev) => ({ ...prev, connectionState: "connected", error: null }));
      
      client.subscribe(MQTT_TOPIC, { qos: 0 }, (err) => {
        if (err) {
          console.error("❌ [MQTT] Subscribe error:", err.message);
          setState((prev) => ({ ...prev, error: err.message }));
        } else {
          console.log("📡 [MQTT] Subscribed to topic:", MQTT_TOPIC);
        }
      });
    });

    client.on("reconnect", () => {
      console.log("🔄 [MQTT] Reconnecting...");
      setState((prev) => ({ ...prev, connectionState: "reconnecting" }));
    });

    client.on("error", (error) => {
      console.error("❌ [MQTT] Error:", error.message);
      setState((prev) => ({ ...prev, error: error.message, connectionState: "error" }));
    });

    client.on("message", (_topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const temperature = payload.temperature ?? null;
        const timestamp = payload.timestamp ?? new Date().toISOString();
        
        console.log(`🌡️ [MQTT] Received: ${temperature}°C at ${new Date(timestamp).toLocaleTimeString()}`);

        setState((prev) => ({
          ...prev,
          temperature,
          timestamp,
          error: null,
        }));

        // Check jika temperature melebihi threshold
        if (temperature !== null && currentThreshold !== null) {
          checkTemperatureThreshold(temperature, currentThreshold);
        }

      } catch (error) {
        console.error("❌ [MQTT] Message parse error:", error.message);
        setState((prev) => ({ ...prev, error: error.message }));
      }
    });

    // Refresh threshold periodically (setiap 1 menit)
    const thresholdInterval = setInterval(() => {
      console.log("🔄 [MQTT] Refreshing threshold...");
      fetchCurrentThreshold();
    }, 60000);

    return () => {
      console.log("🧹 [MQTT] Cleaning up...");
      subscription.remove();
      clearInterval(thresholdInterval);
      if (clientRef.current) {
        clientRef.current.end(true);
      }
    };
  }, [fetchCurrentThreshold, checkTemperatureThreshold, currentThreshold]);

  return {
    ...state,
    currentThreshold,
    thresholdError,
    connectionState: state.connectionState === "connected" ? "Connected" : 
                    state.connectionState === "reconnecting" ? "Connecting" : 
                    state.connectionState === "error" ? "Disconnected" : "Disconnected"
  };
}