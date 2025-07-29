import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../context/ThemeContext";
import {
  getAttendanceReport,
  getClassReport,
  getStudentReport,
  getTeacherReport,
  getAllClasses,
} from "../services/reportService";

const ViewReports = ({ navigation }) => {
  const { theme } = useTheme();
  const [reportType, setReportType] = useState("attendance");
  const [selectedClass, setSelectedClass] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const styles = getStyles(theme);

  const reportTypes = [
    { label: "Attendance Report", value: "attendance" },
    { label: "Class Report", value: "class" },
    { label: "Student Report", value: "student" },
    { label: "Teacher Report", value: "teacher" },
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await getAllClasses();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await generateReport();
    setRefreshing(false);
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      let data;

      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        classId: selectedClass,
      };

      switch (reportType) {
        case "attendance":
          data = await getAttendanceReport(params);
          break;
        case "class":
          data = await getClassReport(params);
          break;
        case "student":
          data = await getStudentReport(params);
          break;
        case "teacher":
          data = await getTeacherReport(params);
          break;
        default:
          data = await getAttendanceReport(params);
      }

      setReportData(data);
    } catch (error) {
      console.error("Error generating report:", error);
      Alert.alert("Error", "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderAttendanceReport = () => {
    if (!reportData) return null;

    return (
      <View style={styles.reportContainer}>
        <Text style={[styles.reportTitle, { color: theme.text }]}>
          Attendance Report
        </Text>
        <Text style={[styles.reportSubtitle, { color: theme.textSecondary }]}>
          {formatDate(startDate)} to {formatDate(endDate)}
        </Text>

        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.summaryNumber, { color: theme.success }]}>
              {reportData.totalPresent || 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Total Present
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.summaryNumber, { color: theme.danger }]}>
              {reportData.totalAbsent || 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Total Absent
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.summaryNumber, { color: theme.warning }]}>
              {reportData.totalLate || 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Total Late
            </Text>
          </View>
        </View>

        {reportData.attendancePercentage && (
          <View style={[styles.percentageContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.percentageText, { color: theme.text }]}>
              Overall Attendance: {reportData.attendancePercentage.toFixed(1)}%
            </Text>
          </View>
        )}

        {reportData.dailyStats && reportData.dailyStats.length > 0 && (
          <View style={styles.dailyStatsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Daily Statistics
            </Text>
            {reportData.dailyStats.map((day, index) => (
              <View key={index} style={[styles.dailyStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.dailyDate, { color: theme.text }]}>
                  {formatDate(new Date(day.date))}
                </Text>
                <View style={styles.dailyStats}>
                  <Text style={[styles.statText, { color: theme.success }]}>
                    Present: {day.present}
                  </Text>
                  <Text style={[styles.statText, { color: theme.danger }]}>
                    Absent: {day.absent}
                  </Text>
                  <Text style={[styles.statText, { color: theme.warning }]}>
                    Late: {day.late}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderClassReport = () => {
    if (!reportData) return null;

    return (
      <View style={styles.reportContainer}>
        <Text style={[styles.reportTitle, { color: theme.text }]}>
          Class Report
        </Text>
        <Text style={[styles.reportSubtitle, { color: theme.textSecondary }]}>
          {reportData.className} - {formatDate(startDate)} to {formatDate(endDate)}
        </Text>

        <View style={[styles.classInfoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.classInfoText, { color: theme.text }]}>
            Total Students: {reportData.totalStudents || 0}
          </Text>
          <Text style={[styles.classInfoText, { color: theme.text }]}>
            Active Students: {reportData.activeStudents || 0}
          </Text>
          <Text style={[styles.classInfoText, { color: theme.text }]}>
            Average Attendance: {reportData.averageAttendance?.toFixed(1) || 0}%
          </Text>
        </View>

        {reportData.topPerformers && reportData.topPerformers.length > 0 && (
          <View style={styles.performersContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Top Performers
            </Text>
            {reportData.topPerformers.map((student, index) => (
              <View key={index} style={[styles.performerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.performerName, { color: theme.text }]}>
                  {student.name}
                </Text>
                <Text style={[styles.performerAttendance, { color: theme.success }]}>
                  {student.attendancePercentage?.toFixed(1) || 0}%
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderGenericReport = () => {
    if (!reportData) return null;

    return (
      <View style={styles.reportContainer}>
        <Text style={[styles.reportTitle, { color: theme.text }]}>
          {reportTypes.find(t => t.value === reportType)?.label}
        </Text>
        <Text style={[styles.reportSubtitle, { color: theme.textSecondary }]}>
          {formatDate(startDate)} to {formatDate(endDate)}
        </Text>

        <View style={[styles.dataContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.dataText, { color: theme.text }]}>
            {JSON.stringify(reportData, null, 2)}
          </Text>
        </View>
      </View>
    );
  };

  const renderReport = () => {
    if (!reportData) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
            Select parameters and tap "Generate Report" to view data
          </Text>
        </View>
      );
    }

    switch (reportType) {
      case "attendance":
        return renderAttendanceReport();
      case "class":
        return renderClassReport();
      default:
        return renderGenericReport();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: theme.surface }]}>
            ‹ Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.surface }]}>
          View Reports
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.filtersContainer}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>
            Report Type
          </Text>
          <View style={[styles.pickerContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Picker
              selectedValue={reportType}
              onValueChange={(itemValue) => setReportType(itemValue)}
              style={[styles.picker, { color: theme.text }]}
            >
              {reportTypes.map((type) => (
                <Picker.Item
                  key={type.value}
                  label={type.label}
                  value={type.value}
                />
              ))}
            </Picker>
          </View>

          {classes.length > 0 && (
            <>
              <Text style={[styles.filterLabel, { color: theme.text }]}>
                Class
              </Text>
              <View style={[styles.pickerContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Picker
                  selectedValue={selectedClass}
                  onValueChange={(itemValue) => setSelectedClass(itemValue)}
                  style={[styles.picker, { color: theme.text }]}
                >
                  {classes.map((cls) => (
                    <Picker.Item
                      key={cls.id}
                      label={`${cls.name} (${cls.grade}-${cls.section})`}
                      value={cls.id}
                    />
                  ))}
                </Picker>
              </View>
            </>
          )}

          <Text style={[styles.filterLabel, { color: theme.text }]}>
            Date Range
          </Text>
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={[styles.dateButtonText, { color: theme.text }]}>
                From: {formatDate(startDate)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={[styles.dateButtonText, { color: theme.text }]}>
                To: {formatDate(endDate)}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: theme.primary }]}
            onPress={generateReport}
            disabled={loading}
          >
            <Text style={[styles.generateButtonText, { color: theme.surface }]}>
              {loading ? "Generating..." : "Generate Report"}
            </Text>
          </TouchableOpacity>
        </View>

        {renderReport()}
      </ScrollView>

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 20,
      paddingTop: 50,
    },
    backButton: {
      padding: 5,
    },
    backButtonText: {
      fontSize: 18,
      fontWeight: "600",
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
    },
    content: {
      flex: 1,
      padding: 20,
    },
    filtersContainer: {
      marginBottom: 20,
    },
    filterLabel: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      marginTop: 15,
    },
    pickerContainer: {
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 10,
    },
    picker: {
      height: 50,
    },
    dateContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
    },
    dateButton: {
      flex: 1,
      padding: 15,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: "center",
    },
    dateButtonText: {
      fontSize: 14,
      fontWeight: "500",
    },
    generateButton: {
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 20,
    },
    generateButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    noDataContainer: {
      padding: 50,
      alignItems: "center",
    },
    noDataText: {
      fontSize: 16,
      textAlign: "center",
    },
    reportContainer: {
      marginTop: 10,
    },
    reportTitle: {
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 5,
    },
    reportSubtitle: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 20,
    },
    summaryContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    summaryCard: {
      flex: 1,
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginHorizontal: 5,
      borderWidth: 1,
    },
    summaryNumber: {
      fontSize: 24,
      fontWeight: "bold",
    },
    summaryLabel: {
      fontSize: 12,
      textAlign: "center",
      marginTop: 5,
    },
    percentageContainer: {
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 20,
      borderWidth: 1,
    },
    percentageText: {
      fontSize: 18,
      fontWeight: "600",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      marginTop: 10,
    },
    dailyStatsContainer: {
      marginTop: 10,
    },
    dailyStatCard: {
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
    },
    dailyDate: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },
    dailyStats: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    statText: {
      fontSize: 14,
      fontWeight: "500",
    },
    classInfoCard: {
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      borderWidth: 1,
    },
    classInfoText: {
      fontSize: 16,
      marginBottom: 5,
    },
    performersContainer: {
      marginTop: 10,
    },
    performerCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
    },
    performerName: {
      fontSize: 16,
      fontWeight: "500",
    },
    performerAttendance: {
      fontSize: 16,
      fontWeight: "600",
    },
    dataContainer: {
      padding: 15,
      borderRadius: 10,
      borderWidth: 1,
    },
    dataText: {
      fontSize: 12,
      fontFamily: "monospace",
    },
  });

export default ViewReports;