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
  FlatList,
  ActivityIndicator,
  TextInput,
  Switch,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getAllClassesAttendanceSummary, getAdminAttendanceReport } from "../services/attendanceService";
import { getAllClasses } from "../services/classService";

const AdminAttendanceHistory = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();

  // State management
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detailed'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Summary view data
  const [summaryData, setSummaryData] = useState(null);
  
  // Detailed view data
  const [detailedData, setDetailedData] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  
  // Date range state
  const [dateRange, setDateRange] = useState('week'); // 'week', 'month', 'custom'
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  
  // Modal states
  const [showDateModal, setShowDateModal] = useState(false);
  const [showClassFilterModal, setShowClassFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Custom date inputs
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  const styles = getStyles(theme);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (viewMode === 'summary') {
      loadSummaryData();
    } else {
      loadDetailedData();
    }
  }, [viewMode, startDate, endDate, selectedClasses]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const classesData = await getAllClasses();
      setAllClasses(classesData);
      
      // Load summary data by default
      await loadSummaryData();
    } catch (error) {
      console.error("Error loading initial data:", error);
      Alert.alert("Error", "Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const loadSummaryData = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];
      
      const data = await getAllClassesAttendanceSummary(startDateStr, endDateStr);
      setSummaryData(data);
    } catch (error) {
      console.error("Error loading summary data:", error);
      Alert.alert("Error", "Failed to load attendance summary");
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedData = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];
      const classIds = selectedClasses.length > 0 ? selectedClasses.join(',') : null;
      
      const data = await getAdminAttendanceReport(startDateStr, endDateStr, classIds);
      setDetailedData(data);
    } catch (error) {
      console.error("Error loading detailed data:", error);
      Alert.alert("Error", "Failed to load detailed attendance report");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (viewMode === 'summary') {
      await loadSummaryData();
    } else {
      await loadDetailedData();
    }
    setRefreshing(false);
  };

  const handleDateRangeChange = (range) => {
    const today = new Date();
    let newStartDate = new Date();
    
    switch (range) {
      case 'week':
        newStartDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        newStartDate.setDate(today.getDate() - 30);
        break;
      case 'quarter':
        newStartDate.setDate(today.getDate() - 90);
        break;
      default:
        return;
    }
    
    setStartDate(newStartDate);
    setEndDate(today);
    setDateRange(range);
  };

  const applyCustomDateRange = () => {
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
    setDateRange('custom');
    setShowDateModal(false);
  };

  const toggleClassSelection = (classId) => {
    setSelectedClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
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

  const getAttendanceRateColor = (rate) => {
    if (rate >= 90) return "#4CAF50";
    if (rate >= 75) return "#FF9800";
    return "#F44336";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const renderSummaryCard = ({ item }) => (
    <View style={[styles.classCard, { backgroundColor: theme.surface }]}>
      <View style={styles.classCardHeader}>
        <View>
          <Text style={[styles.className, { color: theme.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.classInfo, { color: theme.textSecondary }]}>
            Grade {item.grade} - Section {item.section}
          </Text>
          <Text style={[styles.teacherInfo, { color: theme.textSecondary }]}>
            👨‍🏫 {item.teacher}
          </Text>
        </View>
        <View style={styles.attendanceRateContainer}>
          <Text 
            style={[
              styles.attendanceRate, 
              { color: getAttendanceRateColor(item.attendanceStats.attendanceRate) }
            ]}
          >
            {item.attendanceStats.attendanceRate}%
          </Text>
          <Text style={[styles.attendanceRateLabel, { color: theme.textSecondary }]}>
            Attendance
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#2196F3" }]}>
            {item.totalStudents}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Students
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#4CAF50" }]}>
            {item.attendanceStats.presentCount}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Present
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#F44336" }]}>
            {item.attendanceStats.absentCount}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Absent
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#FF9800" }]}>
            {item.attendanceStats.daysTracked}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Days
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.viewDetailButton, { backgroundColor: "#FF9800" }]}
        onPress={() => {
          setSelectedClasses([item.id]);
          setViewMode('detailed');
        }}
      >
        <Text style={styles.viewDetailButtonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDailyReport = ({ item }) => (
    <View style={[styles.dailyReportCard, { backgroundColor: theme.surface }]}>
      <View style={styles.dailyReportHeader}>
        <Text style={[styles.reportDate, { color: theme.text }]}>
          {formatDate(item.date)}
        </Text>
        <View style={styles.dailyStats}>
          <View style={[styles.dailyStatChip, { backgroundColor: "#4CAF50" }]}>
            <Text style={styles.dailyStatText}>P: {item.totalPresent}</Text>
          </View>
          <View style={[styles.dailyStatChip, { backgroundColor: "#F44336" }]}>
            <Text style={styles.dailyStatText}>A: {item.totalAbsent}</Text>
          </View>
          <View style={[styles.dailyStatChip, { backgroundColor: "#FF9800" }]}>
            <Text style={styles.dailyStatText}>L: {item.totalLate}</Text>
          </View>
        </View>
      </View>

      {item.classes.map((classItem, index) => (
        <View key={index} style={styles.classAttendanceRow}>
          <Text style={[styles.classRowName, { color: theme.text }]}>
            {classItem.classInfo.name}
          </Text>
          <View style={styles.classRowStats}>
            <Text style={[styles.classRowStat, { color: "#4CAF50" }]}>
              {classItem.present}
            </Text>
            <Text style={[styles.classRowStat, { color: "#F44336" }]}>
              {classItem.absent}
            </Text>
            <Text style={[styles.classRowStat, { color: "#FF9800" }]}>
              {classItem.late}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading attendance data...
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
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Admin Attendance</Text>
          <Text style={styles.headerSubtitle}>
            {summaryData?.dateRange && 
              `${formatDate(summaryData.dateRange.startDate)} - ${formatDate(summaryData.dateRange.endDate)}`
            }
          </Text>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowDateModal(true)}
        >
          <Text style={styles.menuButtonText}>📅</Text>
        </TouchableOpacity>
      </View>

      {/* View Mode Toggle */}
      <View style={[styles.toggleContainer, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: viewMode === 'summary' ? "#FF9800" : theme.background,
              borderColor: theme.border
            }
          ]}
          onPress={() => setViewMode('summary')}
        >
          <Text style={[
            styles.toggleButtonText,
            { color: viewMode === 'summary' ? "#FFFFFF" : theme.text }
          ]}>
            📊 Summary
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: viewMode === 'detailed' ? "#FF9800" : theme.background,
              borderColor: theme.border
            }
          ]}
          onPress={() => setViewMode('detailed')}
        >
          <Text style={[
            styles.toggleButtonText,
            { color: viewMode === 'detailed' ? "#FFFFFF" : theme.text }
          ]}>
            📋 Detailed
          </Text>
        </TouchableOpacity>

        {viewMode === 'detailed' && (
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: theme.border }]}
            onPress={() => setShowClassFilterModal(true)}
          >
            <Text style={[styles.filterButtonText, { color: theme.text }]}>
              🔍 Filter ({selectedClasses.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Overall Statistics */}
      {summaryData && (
        <View style={[styles.overallStatsCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.overallStatsTitle, { color: theme.text }]}>
            System Overview
          </Text>
          <View style={styles.overallStatsRow}>
            <View style={styles.overallStatItem}>
              <Text style={[styles.overallStatValue, { color: "#2196F3" }]}>
                {summaryData.overallStats.totalClasses}
              </Text>
              <Text style={[styles.overallStatLabel, { color: theme.textSecondary }]}>
                Classes
              </Text>
            </View>
            <View style={styles.overallStatItem}>
              <Text style={[styles.overallStatValue, { color: "#4CAF50" }]}>
                {summaryData.overallStats.totalStudents}
              </Text>
              <Text style={[styles.overallStatLabel, { color: theme.textSecondary }]}>
                Students
              </Text>
            </View>
            <View style={styles.overallStatItem}>
              <Text style={[
                styles.overallStatValue, 
                { color: getAttendanceRateColor(summaryData.overallStats.overallAttendanceRate) }
              ]}>
                {summaryData.overallStats.overallAttendanceRate}%
              </Text>
              <Text style={[styles.overallStatLabel, { color: theme.textSecondary }]}>
                Overall Rate
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Content based on view mode */}
      <FlatList
        data={viewMode === 'summary' ? summaryData?.classes || [] : detailedData?.dailyReports || []}
        renderItem={viewMode === 'summary' ? renderSummaryCard : renderDailyReport}
        keyExtractor={(item, index) => `${viewMode}-${item.id || item.date || index}`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF9800"]}
            tintColor={"#FF9800"}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No attendance data available for the selected period
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
      />

      {/* Date Range Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Select Date Range
            </Text>
            
            {/* Quick date range options */}
            <View style={styles.quickDateOptions}>
              {[
                { key: 'week', label: 'Last Week' },
                { key: 'month', label: 'Last Month' },
                { key: 'quarter', label: 'Last Quarter' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.quickDateOption,
                    {
                      backgroundColor: dateRange === option.key ? "#FF9800" : theme.background,
                      borderColor: theme.border
                    }
                  ]}
                  onPress={() => {
                    handleDateRangeChange(option.key);
                    setShowDateModal(false);
                  }}
                >
                  <Text style={[
                    styles.quickDateOptionText,
                    { color: dateRange === option.key ? "#FFFFFF" : theme.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom date inputs */}
            <View style={styles.customDateContainer}>
              <Text style={[styles.customDateLabel, { color: theme.text }]}>
                Custom Range
              </Text>
              <TextInput
                style={[styles.dateInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={tempStartDate}
                onChangeText={setTempStartDate}
                placeholder="Start Date (YYYY-MM-DD)"
                placeholderTextColor={theme.textSecondary}
              />
              <TextInput
                style={[styles.dateInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={tempEndDate}
                onChangeText={setTempEndDate}
                placeholder="End Date (YYYY-MM-DD)"
                placeholderTextColor={theme.textSecondary}
              />
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: "#4CAF50" }]}
                onPress={applyCustomDateRange}
              >
                <Text style={styles.applyButtonText}>Apply Custom Range</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: "#F44336" }]}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Class Filter Modal */}
      <Modal
        visible={showClassFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClassFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Filter by Classes
            </Text>
            
            <View style={styles.selectAllContainer}>
              <TouchableOpacity
                style={[styles.selectAllButton, { backgroundColor: "#2196F3" }]}
                onPress={() => setSelectedClasses(allClasses.map(c => c.id))}
              >
                <Text style={styles.selectAllButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectAllButton, { backgroundColor: "#F44336" }]}
                onPress={() => setSelectedClasses([])}
              >
                <Text style={styles.selectAllButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.classFilterList}>
              {allClasses.map((classItem) => (
                <View key={classItem.id} style={styles.classFilterItem}>
                  <Switch
                    value={selectedClasses.includes(classItem.id)}
                    onValueChange={() => toggleClassSelection(classItem.id)}
                    trackColor={{ false: theme.border, true: "#FF9800" }}
                    thumbColor={selectedClasses.includes(classItem.id) ? "#FFFFFF" : theme.textSecondary}
                  />
                  <Text style={[styles.classFilterItemText, { color: theme.text }]}>
                    {classItem.name} - Grade {classItem.grade}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: "#4CAF50" }]}
              onPress={() => setShowClassFilterModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Apply Filter</Text>
            </TouchableOpacity>
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
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 20,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    backButton: {
      padding: 8,
    },
    backButtonText: {
      fontSize: 24,
      color: "#FFFFFF",
      fontWeight: "bold",
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    headerSubtitle: {
      fontSize: 14,
      color: "#FFFFFF",
      opacity: 0.9,
      marginTop: 2,
    },
    menuButton: {
      padding: 8,
    },
    menuButtonText: {
      fontSize: 20,
      color: "#FFFFFF",
    },
    toggleContainer: {
      flexDirection: "row",
      padding: 15,
      justifyContent: "space-around",
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: "center",
      marginHorizontal: 4,
    },
    toggleButtonText: {
      fontSize: 14,
      fontWeight: "600",
    },
    filterButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: "center",
      marginLeft: 8,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: "500",
    },
    overallStatsCard: {
      margin: 20,
      padding: 20,
      borderRadius: 15,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    overallStatsTitle: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 15,
    },
    overallStatsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    overallStatItem: {
      alignItems: "center",
    },
    overallStatValue: {
      fontSize: 24,
      fontWeight: "bold",
    },
    overallStatLabel: {
      fontSize: 12,
      marginTop: 4,
    },
    classCard: {
      marginBottom: 15,
      padding: 20,
      borderRadius: 15,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    classCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 15,
    },
    className: {
      fontSize: 18,
      fontWeight: "bold",
    },
    classInfo: {
      fontSize: 14,
      marginTop: 2,
    },
    teacherInfo: {
      fontSize: 12,
      marginTop: 4,
    },
    attendanceRateContainer: {
      alignItems: "center",
    },
    attendanceRate: {
      fontSize: 24,
      fontWeight: "bold",
    },
    attendanceRateLabel: {
      fontSize: 10,
      marginTop: 2,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 15,
    },
    statItem: {
      alignItems: "center",
    },
    statValue: {
      fontSize: 18,
      fontWeight: "bold",
    },
    statLabel: {
      fontSize: 10,
      marginTop: 2,
    },
    viewDetailButton: {
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    viewDetailButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
    dailyReportCard: {
      marginBottom: 15,
      padding: 15,
      borderRadius: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    dailyReportHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    reportDate: {
      fontSize: 16,
      fontWeight: "bold",
    },
    dailyStats: {
      flexDirection: "row",
    },
    dailyStatChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginLeft: 4,
    },
    dailyStatText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "bold",
    },
    classAttendanceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: "#E0E0E0",
    },
    classRowName: {
      fontSize: 14,
      fontWeight: "500",
      flex: 1,
    },
    classRowStats: {
      flexDirection: "row",
    },
    classRowStat: {
      fontSize: 14,
      fontWeight: "bold",
      marginLeft: 15,
      minWidth: 25,
      textAlign: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 50,
    },
    emptyText: {
      fontSize: 16,
      textAlign: "center",
    },
    loadingText: {
      fontSize: 16,
      marginTop: 10,
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
      maxHeight: "80%",
      borderRadius: 15,
      padding: 20,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 20,
    },
    quickDateOptions: {
      marginBottom: 20,
    },
    quickDateOption: {
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      alignItems: "center",
    },
    quickDateOptionText: {
      fontSize: 16,
      fontWeight: "500",
    },
    customDateContainer: {
      marginBottom: 20,
    },
    customDateLabel: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 10,
    },
    dateInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 10,
    },
    applyButton: {
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    applyButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    selectAllContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 15,
    },
    selectAllButton: {
      flex: 0.48,
      padding: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    selectAllButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
    classFilterList: {
      maxHeight: 300,
      marginBottom: 20,
    },
    classFilterItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#E0E0E0",
    },
    classFilterItemText: {
      fontSize: 16,
      marginLeft: 15,
      flex: 1,
    },
    modalCloseButton: {
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
    },
    modalCloseButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
  });

export default AdminAttendanceHistory;