import { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useMqttSensor } from "../hooks/useMqttSensor";
import { Api } from "../services/api";
import { DataTable } from "../components/DataTable";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext.js";
import Ionicons from "@expo/vector-icons/Ionicons";
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

export function MonitoringScreen({ navigation }) {
  const {
    temperature,
    timestamp,
    connectionState,
    error: mqttError,
  } = useMqttSensor();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const { isAuthenticated, user, logout } = useAuth();

  const fetchReadings = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await Api.getSensorReadings();
      setReadings(data ?? []);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReadings();
    }, [fetchReadings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchReadings();
    } finally {
      setRefreshing(false);
    }
  }, [fetchReadings]);

  const handleControlAccess = () => {
    if (isAuthenticated) {
      navigation.navigate("MainTabs", { screen: "Control" });
    } else {
      navigation.navigate("Login");
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case "Connected":
        return "#10b981";
      case "Connecting":
        return "#f59e0b";
      case "Disconnected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getTemperatureColor = (temp) => {
    if (typeof temp !== "number") return "#6b7280";
    if (temp > 30) return "#ef4444";
    if (temp > 25) return "#f59e0b";
    return "#10b981";
  };

  // Swipe gesture untuk cards
  const renderCardSwipeActions = (onPress, isPrimary = false) => {
    return (
      <TouchableOpacity
        style={[
          styles.swipeAction,
          isPrimary ? styles.swipePrimary : styles.swipeSecondary
        ]}
        onPress={onPress}
      >
        <Text style={styles.swipeActionText}>
          {isPrimary ? 'Open' : 'View'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Auth Header */}
          <View style={styles.authHeader}>
            <View>
              <Text style={styles.authTitle}>Sensor Monitoring</Text>
              {isAuthenticated && (
                <Text style={styles.userText}>Welcome, {user?.email}</Text>
              )}
            </View>
            <View style={styles.authSection}>
              {isAuthenticated ? (
                <View style={styles.authButtons}>
                  <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() =>
                      navigation.navigate("MainTabs", { screen: "Profile" })
                    }
                  >
                    <Ionicons name="person" size={20} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => navigation.navigate("Login")}
                >
                  <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Realtime Temperature Card dengan Gesture */}
          <Swipeable
            renderRightActions={() => renderCardSwipeActions(() => {}, true)}
            overshootRight={false}
            friction={2}
            rightThreshold={40}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Realtime Temperature</Text>
              <View style={styles.valueRow}>
                <Text
                  style={[
                    styles.temperatureText,
                    { color: getTemperatureColor(temperature) },
                  ]}
                >
                  {typeof temperature === "number"
                    ? `${temperature.toFixed(2)}°C`
                    : "--"}
                </Text>
                <View style={styles.statusIndicator}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getConnectionStatusColor() },
                    ]}
                  />
                  <Text style={styles.statusText}>{connectionState}</Text>
                </View>
              </View>

              {timestamp && (
                <Text style={styles.metaText}>
                  Last update: {new Date(timestamp).toLocaleString()}
                </Text>
              )}

              {mqttError && (
                <Text style={styles.errorText}>MQTT error: {mqttError}</Text>
              )}
            </View>
          </Swipeable>

          {/* Quick Actions Card dengan Gesture */}
          <Swipeable
            renderRightActions={() => renderCardSwipeActions(handleControlAccess)}
            overshootRight={false}
            friction={2}
            rightThreshold={40}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Quick Actions</Text>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  !isAuthenticated && styles.disabledButton,
                ]}
                onPress={handleControlAccess}
                disabled={!isAuthenticated}
                activeOpacity={0.8}
              >
                <Text style={styles.controlButtonText}>
                  {isAuthenticated
                    ? "Go to Control Panel"
                    : "Login to Access Control"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={onRefresh}
                disabled={refreshing}
                activeOpacity={0.8}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : (
                  <Text style={styles.refreshButtonText}>Refresh Data</Text>
                )}
              </TouchableOpacity>
            </View>
          </Swipeable>

          {/* Sensor History Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Triggered Readings History</Text>
            {loading && <ActivityIndicator size="small" />}
          </View>

          {apiError && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                Failed to load history: {apiError}
              </Text>
            </View>
          )}

          {readings.length > 0 ? (
            <DataTable
              columns={[
                {
                  key: "recorded_at",
                  title: "Timestamp",
                  render: (value) =>
                    value ? new Date(value).toLocaleString() : "--",
                  width: "40%",
                },
                {
                  key: "temperature",
                  title: "Temperature (°C)",
                  render: (value) =>
                    typeof value === "number"
                      ? `${Number(value).toFixed(2)}`
                      : "--",
                  width: "30%",
                },
                {
                  key: "threshold_value",
                  title: "Threshold (°C)",
                  render: (value) =>
                    typeof value === "number"
                      ? `${Number(value).toFixed(2)}`
                      : "--",
                  width: "30%",
                },
              ]}
              data={readings}
              keyExtractor={(item) => item.id}
            />
          ) : (
            !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No sensor readings available
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Sensor data will appear here when temperature thresholds are
                  triggered
                </Text>
              </View>
            )
          )}

          {/* System Status Card dengan Gesture */}
          <Swipeable
            renderRightActions={() => renderCardSwipeActions(onRefresh)}
            overshootRight={false}
            friction={2}
            rightThreshold={40}
          >
            <View style={styles.card}>
              <Text style={styles.title}>System Status</Text>
              <View style={styles.statusGrid}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>MQTT Connection</Text>
                  <View style={styles.statusValue}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getConnectionStatusColor() },
                      ]}
                    />
                    <Text style={styles.statusText}>{connectionState}</Text>
                  </View>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Data Points</Text>
                  <Text style={styles.statusValueText}>{readings.length}</Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Authentication</Text>
                  <Text style={styles.statusValueText}>
                    {isAuthenticated ? "Logged In" : "Public Access"}
                  </Text>
                </View>
              </View>
            </View>
          </Swipeable>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fb",
    padding: 16,
  },
  authHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  authButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileButton: {
    backgroundColor: "#eff6ff",
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  userText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  authSection: {
    alignItems: "flex-end",
  },
  loginButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1f2937",
  },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  temperatureText: {
    fontSize: 48,
    fontWeight: "700",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  metaText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 8,
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  controlButton: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
  },
  controlButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  refreshButton: {
    backgroundColor: "transparent",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  refreshButtonText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  statusGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusItem: {
    alignItems: "center",
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  statusValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusValueText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  // Gesture Handler Styles
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 12,
    marginVertical: 8,
  },
  swipePrimary: {
    backgroundColor: '#2563eb',
  },
  swipeSecondary: {
    backgroundColor: '#10b981',
  },
  swipeActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
});