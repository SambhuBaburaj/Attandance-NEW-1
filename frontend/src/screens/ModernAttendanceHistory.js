import React, { useState, useEffect, useRef } from "react";
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
  Dimensions,
  Animated,
  PanResponder,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getAttendanceByDateRange } from "../services/attendanceService";
import { getAllClasses } from "../services/classService";

const { width: screenWidth } = Dimensions.get("window");

const ModernAttendanceHistory = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();

  // State management
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Date navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState(7); // Default to 7 days
  const [showClassModal, setShowClassModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  // Animation for swipe
  const pan = useRef(new Animated.Value(0)).current;
  const [isSwipingEnabled, setIsSwipingEnabled] = useState(true);

  const styles = getStyles(theme);

  // Pan responder for swipe functionality
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return isSwipingEnabled && Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 50;
    },
    onPanResponderMove: (evt, gestureState) => {
      pan.setValue(gestureState.dx);
    },
    onPanResponderRelease: (evt, gestureState) => {
      const threshold = screenWidth * 0.3;
      
      if (gestureState.dx > threshold) {
        // Swipe right - go to previous period
        navigateDate('previous');
      } else if (gestureState.dx < -threshold) {
        // Swipe left - go to next period
        navigateDate('next');
      }
      
      // Reset animation
      Animated.spring(pan, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    },
  });

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadAttendanceData();
    }
  }, [selectedClass, currentDate, dateRange]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const classData = await getAllClasses();
      setClasses(classData);
      
      if (classData.length > 0) {
        setSelectedClass(classData[0]);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      Alert.alert("Error", "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceData = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - (dateRange - 1));
      
      const endDate = new Date(currentDate);
      
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      const data = await getAttendanceByDateRange(
        selectedClass.id,
        startDateStr,
        endDateStr
      );

      setAttendanceData(data);
    } catch (error) {
      console.error("Error loading attendance data:", error);
      Alert.alert("Error", "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendanceData();
    setRefreshing(false);
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === 'next') {
      newDate.setDate(newDate.getDate() + dateRange);
    } else {
      newDate.setDate(newDate.getDate() - dateRange);
    }
    
    // Don't allow navigation to future dates
    if (newDate <= new Date()) {
      setCurrentDate(newDate);
    }
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
        return "✓";
      case "ABSENT":
        return "✗";
      case "LATE":
        return "⏰";
      case "EXCUSED":
        return "📋";
      default:
        return "?";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 7:
        return "Week";
      case 14:
        return "2 Weeks";
      case 30:
        return "Month";
      default:
        return `${dateRange} Days`;
    }
  };

  const renderDayCard = ({ item, index }) => (
    <View style={[styles.dayCard, { backgroundColor: theme.surface }]}>
      <View style={styles.dayHeader}>
        <Text style={[styles.dayName, { color: theme.text }]}>
          {item.dayName}
        </Text>
        <Text style={[styles.dayDate, { color: theme.textSecondary }]}>
          {formatDate(item.date)}
        </Text>
      </View>

      <View style={styles.attendanceStats}>
        <View style={[styles.statChip, { backgroundColor: "#4CAF50" }]}>
          <Text style={styles.statChipText}>P: {item.present}</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: "#F44336" }]}>
          <Text style={styles.statChipText}>A: {item.absent}</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: "#FF9800" }]}>
          <Text style={styles.statChipText}>L: {item.late}</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: "#2196F3" }]}>
          <Text style={styles.statChipText}>E: {item.excused}</Text>
        </View>
      </View>

      <View style={styles.attendanceProgress}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${((item.present + item.late + item.excused) / item.totalStudents) * 100}%`,
                backgroundColor: "#4CAF50" 
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {item.totalStudents - item.unmarked}/{item.totalStudents} marked
        </Text>
      </View>

      {item.students && item.students.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.studentsScroll}
        >
          {item.students.slice(0, 10).map((student, idx) => (
            <View 
              key={`${student.id}-${idx}`} 
              style={[
                styles.studentChip,
                { backgroundColor: getStatusColor(student.status) }
              ]}
            >
              <Text style={styles.studentChipText}>
                {student.name.split(' ')[0]} {getStatusIcon(student.status)}
              </Text>
            </View>
          ))}
          {item.students.length > 10 && (
            <View style={[styles.studentChip, { backgroundColor: theme.border }]}>
              <Text style={[styles.studentChipText, { color: theme.text }]}>
                +{item.students.length - 10}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading attendance history...
        </Text>
      </View>
    );
  }

  if (classes.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyText, { color: theme.text }]}>
          No classes found
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
          Contact the administrator to add classes
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: "#FF9800" }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Attendance History</Text>
          <Text style={styles.headerSubtitle}>
            {selectedClass?.name} - {getDateRangeLabel()}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowClassModal(true)}
        >
          <Text style={styles.menuButtonText}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Date Navigation */}
      <View style={[styles.dateNavigation, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[styles.navButton, { borderColor: theme.border }]}
          onPress={() => navigateDate('previous')}
        >
          <Text style={[styles.navButtonText, { color: "#FF9800" }]}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateRangeButton}
          onPress={() => setShowDateRangeModal(true)}
        >
          <Text style={[styles.dateRangeText, { color: theme.text }]}>
            {getDateRangeLabel()}
          </Text>
          <Text style={[styles.dateRangeSubtext, { color: theme.textSecondary }]}>
            {attendanceData?.dateRange && 
              `${formatDate(attendanceData.dateRange.startDate)} - ${formatDate(attendanceData.dateRange.endDate)}`
            }
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, { borderColor: theme.border }]}
          onPress={() => navigateDate('next')}
          disabled={new Date(currentDate.getTime() + dateRange * 24 * 60 * 60 * 1000) > new Date()}
        >
          <Text style={[
            styles.navButtonText, 
            { 
              color: new Date(currentDate.getTime() + dateRange * 24 * 60 * 60 * 1000) > new Date() 
                ? theme.textSecondary 
                : "#FF9800" 
            }
          ]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      {attendanceData && (
        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>
              {attendanceData.classInfo?.name} Summary
            </Text>
            <Text style={[styles.summarySubitle, { color: theme.textSecondary }]}>
              {attendanceData.classInfo?.totalStudents} students
            </Text>
          </View>
          
          <View style={styles.overallStats}>
            <View style={styles.overallStatItem}>
              <Text style={[styles.overallStatValue, { color: "#4CAF50" }]}>
                {attendanceData.overallStats?.overallAttendanceRate || 0}%
              </Text>
              <Text style={[styles.overallStatLabel, { color: theme.textSecondary }]}>
                Attendance Rate
              </Text>
            </View>
            <View style={styles.overallStatItem}>
              <Text style={[styles.overallStatValue, { color: "#2196F3" }]}>
                {attendanceData.dateRange?.totalDays || 0}
              </Text>
              <Text style={[styles.overallStatLabel, { color: theme.textSecondary }]}>
                Days Tracked
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Swipeable Daily Attendance */}
      <Animated.View 
        style={[styles.swipeContainer, { transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        <FlatList
          data={attendanceData?.dailyAttendance || []}
          renderItem={renderDayCard}
          keyExtractor={(item, index) => `${item.date}-${index}`}
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
                No attendance data for this period
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </Animated.View>

      {/* Swipe Hint */}
      <View style={[styles.swipeHint, { backgroundColor: theme.surface }]}>
        <Text style={[styles.swipeHintText, { color: theme.textSecondary }]}>
          ← Swipe to navigate between periods →
        </Text>
      </View>

      {/* Class Selection Modal */}
      <Modal
        visible={showClassModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Select Class
            </Text>
            
            <ScrollView style={styles.classOptions}>
              {classes.map((classItem) => (
                <TouchableOpacity
                  key={classItem.id}
                  style={[
                    styles.classOption,
                    {
                      backgroundColor: selectedClass?.id === classItem.id 
                        ? "#FF9800" 
                        : theme.background,
                      borderColor: theme.border
                    }
                  ]}
                  onPress={() => {
                    setSelectedClass(classItem);
                    setShowClassModal(false);
                  }}
                >
                  <Text style={[
                    styles.classOptionText,
                    {
                      color: selectedClass?.id === classItem.id 
                        ? "#FFFFFF" 
                        : theme.text
                    }
                  ]}>
                    {classItem.name}
                  </Text>
                  <Text style={[
                    styles.classOptionSubtext,
                    {
                      color: selectedClass?.id === classItem.id 
                        ? "#FFFFFF" 
                        : theme.textSecondary
                    }
                  ]}>
                    Grade {classItem.grade} - Section {classItem.section}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: "#F44336" }]}
              onPress={() => setShowClassModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Range Selection Modal */}
      <Modal
        visible={showDateRangeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateRangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Select Time Period
            </Text>
            
            {[7, 14, 30].map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.dateRangeOption,
                  {
                    backgroundColor: dateRange === days 
                      ? "#FF9800" 
                      : theme.background,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => {
                  setDateRange(days);
                  setShowDateRangeModal(false);
                }}
              >
                <Text style={[
                  styles.dateRangeOptionText,
                  {
                    color: dateRange === days 
                      ? "#FFFFFF" 
                      : theme.text
                  }
                ]}>
                  {days === 7 ? "Week" : days === 14 ? "2 Weeks" : "Month"} ({days} days)
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: "#F44336" }]}
              onPress={() => setShowDateRangeModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
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
    dateNavigation: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#E0E0E0",
    },
    navButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    navButtonText: {
      fontSize: 18,
      fontWeight: "bold",
    },
    dateRangeButton: {
      flex: 1,
      alignItems: "center",
      marginHorizontal: 20,
    },
    dateRangeText: {
      fontSize: 18,
      fontWeight: "bold",
    },
    dateRangeSubtext: {
      fontSize: 12,
      marginTop: 2,
    },
    summaryCard: {
      margin: 20,
      padding: 20,
      borderRadius: 15,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    summaryHeader: {
      alignItems: "center",
      marginBottom: 15,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: "bold",
    },
    summarySubitle: {
      fontSize: 14,
      marginTop: 4,
    },
    overallStats: {
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
    swipeContainer: {
      flex: 1,
    },
    dayCard: {
      margin: 20,
      marginVertical: 10,
      padding: 20,
      borderRadius: 15,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    dayHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    dayName: {
      fontSize: 18,
      fontWeight: "bold",
    },
    dayDate: {
      fontSize: 14,
    },
    attendanceStats: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 15,
    },
    statChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    statChipText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "bold",
    },
    attendanceProgress: {
      marginBottom: 15,
    },
    progressBar: {
      height: 8,
      backgroundColor: "#E0E0E0",
      borderRadius: 4,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
    },
    progressText: {
      fontSize: 12,
      textAlign: "center",
      marginTop: 4,
    },
    studentsScroll: {
      marginTop: 10,
    },
    studentChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      marginRight: 8,
    },
    studentChipText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "500",
    },
    swipeHint: {
      paddingVertical: 8,
      alignItems: "center",
    },
    swipeHintText: {
      fontSize: 12,
      fontStyle: "italic",
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
    emptySubtext: {
      fontSize: 14,
      textAlign: "center",
      marginTop: 8,
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
    classOptions: {
      maxHeight: 300,
    },
    classOption: {
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
    },
    classOptionText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    classOptionSubtext: {
      fontSize: 14,
      marginTop: 4,
    },
    dateRangeOption: {
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      alignItems: "center",
    },
    dateRangeOptionText: {
      fontSize: 16,
      fontWeight: "500",
    },
    modalCloseButton: {
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 20,
    },
    modalCloseButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
  });

export default ModernAttendanceHistory;