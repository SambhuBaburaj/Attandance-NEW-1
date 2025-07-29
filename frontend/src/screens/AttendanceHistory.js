import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { parentService } from "../services/parentService";

const AttendanceHistory = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();

  // State management
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Custom date picker state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  // Quick filter options
  const [quickFilterSelected, setQuickFilterSelected] = useState("30days");

  const styles = getStyles(theme);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadAttendanceHistory();
    }
  }, [selectedChild, startDate, endDate]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const childrenData = await parentService.getMyChildren();
      setChildren(childrenData);

      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error("Error loading children:", error);
      Alert.alert("Error", "Failed to load children data");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceHistory = async () => {
    if (!selectedChild) return;

    try {
      setLoading(true);
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      const attendanceResponse = await parentService.getChildAttendance(
        selectedChild.id,
        startDateStr,
        endDateStr
      );

      setAttendanceData(attendanceResponse.attendance || []);
      setAttendanceSummary(attendanceResponse.summary || {});
    } catch (error) {
      console.error("Error loading attendance history:", error);
      Alert.alert("Error", "Failed to load attendance history");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendanceHistory();
    setRefreshing(false);
  };

  const handleQuickFilter = (filterType) => {
    const today = new Date();
    let newStartDate = new Date();

    switch (filterType) {
      case "7days":
        newStartDate.setDate(today.getDate() - 7);
        break;
      case "30days":
        newStartDate.setDate(today.getDate() - 30);
        break;
      case "90days":
        newStartDate.setDate(today.getDate() - 90);
        break;
      case "thisMonth":
        newStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "lastMonth":
        newStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        break;
      default:
        newStartDate.setDate(today.getDate() - 30);
    }

    setStartDate(newStartDate);
    setEndDate(today);
    setQuickFilterSelected(filterType);
  };

  const openFilterModal = () => {
    setTempStartDate(startDate.toISOString().split("T")[0]);
    setTempEndDate(endDate.toISOString().split("T")[0]);
    setShowFilterModal(true);
  };

  const applyCustomDateFilter = () => {
    if (!tempStartDate || !tempEndDate) {
      Alert.alert("Error", "Please select both start and end dates");
      return;
    }

    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);

    if (start > end) {
      Alert.alert("Error", "Start date cannot be after end date");
      return;
    }

    if (end > new Date()) {
      Alert.alert("Error", "End date cannot be in the future");
      return;
    }

    setStartDate(start);
    setEndDate(end);
    setQuickFilterSelected("custom");
    setShowFilterModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PRESENT":
        return "#4CAF50";
      case "ABSENT":
        return "#F44336";
      case "LATE":
        return "#FF9800";
      case "EXCUSED":
        return "#2196F3";
      default:
        return theme.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PRESENT":
        return "✅";
      case "ABSENT":
        return "❌";
      case "LATE":
        return "⏰";
      case "EXCUSED":
        return "📝";
      default:
        return "❓";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getAttendancePercentageColor = (percentage) => {
    if (percentage >= 90) return "#4CAF50";
    if (percentage >= 75) return "#FF9800";
    return "#F44336";
  };

  const getQuickFilterLabel = (filterType) => {
    switch (filterType) {
      case "7days":
        return "Last 7 Days";
      case "30days":
        return "Last 30 Days";
      case "90days":
        return "Last 90 Days";
      case "thisMonth":
        return "This Month";
      case "lastMonth":
        return "Last Month";
      case "custom":
        return "Custom Range";
      default:
        return "Last 30 Days";
    }
  };

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.background },
        ]}
      >
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading attendance history...
        </Text>
      </View>
    );
  }

  if (children.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.background },
        ]}
      >
        <Text style={[styles.emptyText, { color: theme.text }]}>
          No children found
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
          Contact the school administrator to add your children
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#FF9800" }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.surface }]}>
          Attendance History
        </Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={openFilterModal}
        >
          <Text style={[styles.filterButtonText, { color: theme.surface }]}>
            📅
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF9800"]}
            tintColor={"#FF9800"}
          />
        }
      >
        {/* Child Selector */}
        {children.length > 1 && (
          <View
            style={[
              styles.selectorContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.selectorLabel, { color: theme.text }]}>
              Select Child:
            </Text>
            <View
              style={[
                styles.pickerContainer,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <Picker
                selectedValue={selectedChild?.id}
                style={[styles.picker, { color: theme.text }]}
                onValueChange={(itemValue) => {
                  const child = children.find((c) => c.id === itemValue);
                  setSelectedChild(child);
                }}
              >
                {children.map((child) => (
                  <Picker.Item
                    key={child.id}
                    label={`${child.name} (${child.rollNumber})`}
                    value={child.id}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Quick Filter Buttons */}
        <View
          style={[
            styles.quickFilterContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.quickFilterTitle, { color: theme.text }]}>
            Quick Filters
          </Text>
          <View style={styles.quickFilterButtons}>
            {["7days", "30days", "90days", "thisMonth"].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.quickFilterButton,
                  {
                    backgroundColor:
                      quickFilterSelected === filter ? "#FF9800" : theme.background,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => handleQuickFilter(filter)}
              >
                <Text
                  style={[
                    styles.quickFilterButtonText,
                    {
                      color:
                        quickFilterSelected === filter ? "#FFFFFF" : theme.text,
                    },
                  ]}
                >
                  {getQuickFilterLabel(filter)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Range Display */}
        <View
          style={[
            styles.dateRangeContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.dateRangeTitle, { color: theme.text }]}>
            Current Range: {getQuickFilterLabel(quickFilterSelected)}
          </Text>
          <Text style={[styles.dateRangeText, { color: theme.textSecondary }]}>
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </Text>
        </View>

        {/* Summary Statistics */}
        {selectedChild && (
          <View
            style={[
              styles.summaryContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.summaryTitle, { color: theme.text }]}>
              Summary for {selectedChild.name}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: "#2196F3" }]}>
                  {attendanceSummary.totalDays || 0}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Total Days
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: "#4CAF50" }]}>
                  {attendanceSummary.presentDays || 0}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Present
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: "#F44336" }]}>
                  {attendanceSummary.absentDays || 0}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Absent
                </Text>
              </View>
            </View>

            <View style={styles.percentageContainer}>
              <Text style={[styles.percentageLabel, { color: theme.text }]}>
                Attendance Rate
              </Text>
              <Text
                style={[
                  styles.percentageValue,
                  {
                    color: getAttendancePercentageColor(
                      attendanceSummary.attendancePercentage || 0
                    ),
                  },
                ]}
              >
                {attendanceSummary.attendancePercentage || 0}%
              </Text>
            </View>
          </View>
        )}

        {/* Attendance Records */}
        <View
          style={[
            styles.recordsContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.recordsTitle, { color: theme.text }]}>
            Attendance Records ({attendanceData.length} days)
          </Text>

          {attendanceData.length === 0 ? (
            <View style={styles.emptyRecords}>
              <Text
                style={[
                  styles.emptyRecordsText,
                  { color: theme.textSecondary },
                ]}
              >
                No attendance records found for the selected date range
              </Text>
            </View>
          ) : (
            attendanceData.map((record, index) => (
              <View
                key={record.id || index}
                style={[
                  styles.recordItem,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.recordHeader}>
                  <Text style={[styles.recordDate, { color: theme.text }]}>
                    {formatDate(record.date)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(record.status) },
                    ]}
                  >
                    <Text style={styles.statusIcon}>
                      {getStatusIcon(record.status)}
                    </Text>
                    <Text style={styles.statusText}>{record.status}</Text>
                  </View>
                </View>

                {record.remarks && (
                  <Text
                    style={[
                      styles.recordRemarks,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Note: {record.remarks}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Custom Date Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Custom Date Range
            </Text>

            <View style={styles.dateInputContainer}>
              <Text style={[styles.dateInputLabel, { color: theme.text }]}>
                Start Date (YYYY-MM-DD)
              </Text>
              <TextInput
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={tempStartDate}
                onChangeText={setTempStartDate}
                placeholder="2024-01-01"
                placeholderTextColor={theme.textSecondary}
                maxLength={10}
              />
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={[styles.dateInputLabel, { color: theme.text }]}>
                End Date (YYYY-MM-DD)
              </Text>
              <TextInput
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={tempEndDate}
                onChangeText={setTempEndDate}
                placeholder="2024-12-31"
                placeholderTextColor={theme.textSecondary}
                maxLength={10}
              />
            </View>

            <Text style={[styles.dateFormatHint, { color: theme.textSecondary }]}>
              Please use YYYY-MM-DD format (e.g., 2024-03-15)
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={applyCustomDateFilter}
              >
                <Text style={styles.applyButtonText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    centered: {
      justifyContent: "center",
      alignItems: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 20,
      paddingTop: 50,
    },
    backButton: {
      padding: 10,
    },
    backButtonText: {
      fontSize: 24,
      color: "#FFFFFF",
      fontWeight: "bold",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      flex: 1,
      textAlign: "center",
    },
    filterButton: {
      padding: 10,
    },
    filterButtonText: {
      fontSize: 18,
    },
    scrollView: {
      flex: 1,
      padding: 20,
    },
    loadingText: {
      fontSize: 16,
      textAlign: "center",
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 10,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: "center",
    },
    selectorContainer: {
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 1,
    },
    selectorLabel: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 10,
    },
    pickerContainer: {
      borderRadius: 8,
      borderWidth: 1,
    },
    picker: {
      height: 50,
    },
    quickFilterContainer: {
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 1,
    },
    quickFilterTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 10,
    },
    quickFilterButtons: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    quickFilterButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 8,
      minWidth: "48%",
      alignItems: "center",
    },
    quickFilterButtonText: {
      fontSize: 12,
      fontWeight: "500",
    },
    dateRangeContainer: {
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 1,
    },
    dateRangeTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 5,
    },
    dateRangeText: {
      fontSize: 14,
    },
    summaryContainer: {
      padding: 20,
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 1,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 15,
      textAlign: "center",
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 20,
    },
    statItem: {
      alignItems: "center",
    },
    statNumber: {
      fontSize: 24,
      fontWeight: "bold",
    },
    statLabel: {
      fontSize: 12,
      marginTop: 5,
    },
    percentageContainer: {
      alignItems: "center",
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: "#E0E0E0",
    },
    percentageLabel: {
      fontSize: 16,
      marginBottom: 5,
    },
    percentageValue: {
      fontSize: 28,
      fontWeight: "bold",
    },
    recordsContainer: {
      padding: 20,
      borderRadius: 10,
      borderWidth: 1,
    },
    recordsTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 15,
    },
    emptyRecords: {
      padding: 20,
      alignItems: "center",
    },
    emptyRecordsText: {
      fontSize: 14,
      textAlign: "center",
    },
    recordItem: {
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
    },
    recordHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 5,
    },
    recordDate: {
      fontSize: 16,
      fontWeight: "500",
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
    },
    statusIcon: {
      fontSize: 12,
      marginRight: 5,
    },
    statusText: {
      fontSize: 12,
      color: "#FFFFFF",
      fontWeight: "bold",
    },
    recordRemarks: {
      fontSize: 14,
      fontStyle: "italic",
      marginTop: 5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "90%",
      maxWidth: 400,
      padding: 20,
      borderRadius: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
    },
    dateInputContainer: {
      marginBottom: 15,
    },
    dateInputLabel: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
    },
    dateInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },
    dateFormatHint: {
      fontSize: 12,
      textAlign: "center",
      marginBottom: 20,
      fontStyle: "italic",
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginHorizontal: 5,
    },
    cancelButton: {
      backgroundColor: "#f0f0f0",
    },
    applyButton: {
      backgroundColor: "#FF9800",
    },
    cancelButtonText: {
      color: "#333",
      fontWeight: "500",
    },
    applyButtonText: {
      color: "#fff",
      fontWeight: "500",
    },
  });

export default AttendanceHistory;