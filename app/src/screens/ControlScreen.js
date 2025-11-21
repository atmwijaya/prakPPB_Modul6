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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Api } from "../services/api.js";
import { DataTable } from "../components/DataTable.js";
import { SafeAreaView } from "react-native-safe-area-context";

export function ControlScreen() {
  const [thresholdValue, setThresholdValue] = useState(30);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchHistory = useCallback(async () => {
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
      setCurrentPage(1); // Reset ke halaman pertama saat focus
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
    const valueNumber = Number(thresholdValue);
    if (Number.isNaN(valueNumber)) {
      setError("Please enter a numeric threshold.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await Api.createThreshold({ value: valueNumber, note });
      setNote("");
      await fetchHistory();
      setCurrentPage(1); // Kembali ke halaman pertama setelah submit baru
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [thresholdValue, note, fetchHistory]);

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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Configure Threshold</Text>
          {latestThreshold !== null && (
            <Text style={styles.metaText}>
              Current threshold: {Number(latestThreshold).toFixed(2)}°C
            </Text>
          )}
          <Text style={styles.label}>Threshold (°C)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(thresholdValue)}
            onChangeText={setThresholdValue}
          />
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            placeholder="Describe why you are changing the threshold"
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Threshold</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Threshold History</Text>
          {loading && <ActivityIndicator />}
        </View>

        {/* Pagination Info */}
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} records
          </Text>
        </View>

        <DataTable
          columns={[
            {
              key: "created_at",
              title: "Saved At",
              render: (value) => (value ? new Date(value).toLocaleString() : "--"),
            },
            {
              key: "value",
              title: "Threshold (°C)",
              render: (value) =>
                typeof value === "number" ? `${Number(value).toFixed(2)}` : "--",
            },
            {
              key: "note",
              title: "Note",
              render: (value) => value || "-",
            },
          ]}
          data={paginatedHistory}
          keyExtractor={(item) => item.id}
        />

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

            <Text style={styles.pageIndicator}>
              Page {currentPage} of {totalPages}
            </Text>

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
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f9fb",
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
    marginBottom: 12,
  },
  label: {
    marginTop: 16,
    fontWeight: "600",
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  metaText: {
    color: "#666",
  },
  errorText: {
    marginTop: 12,
    color: "#c82333",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Pagination Styles
  paginationInfo: {
    marginBottom: 12,
    alignItems: "center",
  },
  paginationText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
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
  pageIndicator: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
});