import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Api } from "../services/api";
import { DataTable } from "../components/DataTable";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext.js";
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

export function ControlScreen() {
  const [thresholdValue, setThresholdValue] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const { isAuthenticated, user, logout } = useAuth();

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await Api.getThresholds();
      setHistory(data ?? []);
      setTotalItems(data?.length ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
      setCurrentPage(1);
    }, [fetchHistory])
  );

  const latestThreshold = useMemo(() => history?.[0]?.value ?? null, [history]);

  // Hitung data yang akan ditampilkan berdasarkan pagination
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return history.slice(startIndex, endIndex);
  }, [history, currentPage, itemsPerPage]);

  // Hitung total halaman
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / itemsPerPage);
  }, [totalItems, itemsPerPage]);

  const handleSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert("Authentication Required", "Please login to set thresholds");
      return;
    }

    const valueNumber = Number(thresholdValue);
    if (Number.isNaN(valueNumber) || thresholdValue === "") {
      setError("Please enter a valid numeric threshold.");
      return;
    }

    if (valueNumber < -50 || valueNumber > 100) {
      setError("Please enter a threshold between -50°C and 100°C.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await Api.createThreshold({ value: valueNumber, note });
      setThresholdValue("");
      setNote("");
      await fetchHistory();
      setCurrentPage(1);
      Alert.alert("Success", "Threshold updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [thresholdValue, note, fetchHistory, isAuthenticated]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Swipe gesture untuk table rows
  const renderTableRowActions = (item) => {
    return (
      <TouchableOpacity
        style={styles.swipeAction}
        onPress={() => {
          Alert.alert(
            "Threshold Details",
            `Value: ${item.value}°C\nNote: ${item.note || "No note"}\nCreated: ${new Date(item.created_at).toLocaleString()}`
          );
        }}
      >
        <Text style={styles.swipeActionText}>Details</Text>
      </TouchableOpacity>
    );
  };

  // Jika tidak authenticated, tampilkan pesan error
  if (!isAuthenticated) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View style={styles.container}>
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>🔒</Text>
              <Text style={styles.errorTitle}>Access Restricted</Text>
              <Text style={styles.errorText}>
                You need to be logged in to access the control panel and manage temperature thresholds.
              </Text>
              <TouchableOpacity 
                style={styles.loginRedirectButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginRedirectText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.container}>
            {/* User Info Header */}
            <View style={styles.userHeader}>
              <View>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>

            {/* Threshold Configuration Card */}
            <View style={styles.card}>
              <Text style={styles.title}>Configure Temperature Threshold</Text>
              
              {latestThreshold !== null && (
                <View style={styles.currentThreshold}>
                  <Text style={styles.currentThresholdLabel}>Current Active Threshold:</Text>
                  <Text style={styles.currentThresholdValue}>
                    {Number(latestThreshold).toFixed(2)}°C
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Threshold (°C)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={thresholdValue}
                  onChangeText={setThresholdValue}
                  placeholder="Enter temperature value"
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.inputHelp}>
                  Enter value between -50°C and 100°C
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Note (Optional) 
                  <Text style={styles.optionalText}> - describe the reason for this change</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.noteInput]}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                  placeholder="e.g., Summer season adjustment, Equipment calibration, Safety precaution..."
                  placeholderTextColor="#9ca3af"
                  textAlignVertical="top"
                />
              </View>

              {error && (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, submitting && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={submitting || !thresholdValue}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    Save Threshold Configuration
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Threshold History Section */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Threshold History</Text>
                <Text style={styles.sectionSubtitle}>
                  Recent threshold configurations and changes
                </Text>
              </View>
              {loading && <ActivityIndicator />}
            </View>

            {error && history.length === 0 && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>Failed to load history: {error}</Text>
              </View>
            )}

            {/* Pagination Info */}
            {history.length > 0 && (
              <View style={styles.paginationInfo}>
                <Text style={styles.paginationText}>
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} records
                </Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={fetchHistory}
                  disabled={loading}
                >
                  <Text style={styles.refreshButtonText}>
                    {loading ? "Refreshing..." : "Refresh"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {history.length > 0 ? (
              <>
                {/* Custom DataTable dengan Gesture Support */}
                <View style={styles.dataTable}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Saved At</Text>
                    <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Threshold (°C)</Text>
                    <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Note</Text>
                  </View>
                  
                  {/* Table Rows dengan Swipe Gesture */}
                  {paginatedHistory.map((item) => (
                    <Swipeable
                      key={item.id}
                      renderRightActions={() => renderTableRowActions(item)}
                      overshootRight={false}
                      friction={2}
                      rightThreshold={40}
                    >
                      <TouchableOpacity
                        style={styles.tableRow}
                        onPress={() => {
                          Alert.alert(
                            "Threshold Details",
                            `Value: ${item.value}°C\nNote: ${item.note || "No note"}\nCreated: ${new Date(item.created_at).toLocaleString()}`
                          );
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.tableCell, { width: '35%' }]}>
                          {item.created_at ? new Date(item.created_at).toLocaleString() : "--"}
                        </Text>
                        <Text style={[styles.tableCell, { width: '25%' }]}>
                          {typeof item.value === "number" ? `${Number(item.value).toFixed(2)}` : "--"}
                        </Text>
                        <Text style={[styles.tableCell, { width: '40%' }]}>
                          {item.note || "-"}
                        </Text>
                      </TouchableOpacity>
                    </Swipeable>
                  ))}
                </View>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity
                      style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                      onPress={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                        Previous
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.pageNumbers}>
                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        const pageNum = currentPage <= 3 
                          ? index + 1 
                          : currentPage >= totalPages - 2 
                          ? totalPages - 4 + index 
                          : currentPage - 2 + index;
                        
                        if (pageNum > 0 && pageNum <= totalPages) {
                          return (
                            <TouchableOpacity
                              key={pageNum}
                              style={[
                                styles.pageNumber,
                                currentPage === pageNum && styles.pageNumberActive
                              ]}
                              onPress={() => goToPage(pageNum)}
                            >
                              <Text style={[
                                styles.pageNumberText,
                                currentPage === pageNum && styles.pageNumberTextActive
                              ]}>
                                {pageNum}
                              </Text>
                            </TouchableOpacity>
                          );
                        }
                        return null;
                      })}
                    </View>

                    <TouchableOpacity
                      style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                      onPress={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                        Next
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              !loading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>📊</Text>
                  <Text style={styles.emptyStateText}>No threshold history yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Configure your first temperature threshold above to get started
                  </Text>
                </View>
              )
            )}

            {/* Quick Stats */}
            {history.length > 0 && (
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Configuration Stats</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalItems}</Text>
                    <Text style={styles.statLabel}>Total Configurations</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {latestThreshold ? `${Number(latestThreshold).toFixed(2)}°C` : '--'}
                    </Text>
                    <Text style={styles.statLabel}>Current Threshold</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {history.filter(item => item.note && item.note.trim() !== '').length}
                    </Text>
                    <Text style={styles.statLabel}>With Notes</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f9fb",
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: "#6b7280",
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 2,
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
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1f2937",
  },
  currentThreshold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0369a1',
  },
  currentThresholdLabel: {
    fontSize: 14,
    color: "#0369a1",
    fontWeight: "500",
  },
  currentThresholdValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0369a1",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    fontSize: 15,
  },
  optionalText: {
    fontWeight: "400",
    color: "#6b7280",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  inputHelp: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  paginationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  paginationText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  refreshButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  refreshButtonText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "500",
  },
  // Data Table Styles dengan Gesture Support
  dataTable: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderCell: {
    fontWeight: "600",
    color: "#374151",
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  tableCell: {
    fontSize: 14,
    color: "#374151",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 8,
  },
  paginationButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  paginationButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  paginationButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  paginationButtonTextDisabled: {
    color: "#94a3b8",
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageNumber: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  pageNumberActive: {
    backgroundColor: "#2563eb",
  },
  pageNumberText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  pageNumberTextActive: {
    color: "#fff",
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ef4444",
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: 'center',
  },
  loginRedirectButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  loginRedirectText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyState: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateIcon: {
    fontSize: 48,
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
  statsCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: 'center',
  },
  // Gesture Handler Styles
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginVertical: 4,
    marginRight: 8,
  },
  swipeActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});