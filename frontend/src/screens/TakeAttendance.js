import React, { useState, useEffect } from 'react';
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
  Switch,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../context/ThemeContext';
import { getAllClasses } from '../services/classService';
import {
  getAttendanceByClassAndDate,
  markAttendance,
  getAttendanceHistory,
  getDetailedAttendanceByDate
} from '../services/attendanceService';

const TakeAttendance = ({ navigation }) => {
  const { theme } = useTheme();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth(), day: new Date().getDate() });
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('name'); // 'name' or 'roll'
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [detailedAttendance, setDetailedAttendance] = useState(null);
  const [remarksModal, setRemarksModal] = useState({ visible: false, studentId: null, remarks: '' });

  const styles = getStyles(theme);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const data = await getAllClasses();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      Alert.alert('Error', 'Failed to fetch classes');
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const data = await getAttendanceByClassAndDate(selectedClass, selectedDate);
      setAttendanceData(data.students || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      Alert.alert('Error', 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await getAttendanceHistory(selectedClass, { limit: 10 });
      setHistoryData(data.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      Alert.alert('Error', 'Failed to fetch attendance history');
    }
  };

  const fetchDetailedAttendance = async (date) => {
    try {
      const data = await getDetailedAttendanceByDate(selectedClass, date);
      setDetailedAttendance(data);
      setSelectedHistoryDate(date);
    } catch (error) {
      console.error('Error fetching detailed attendance:', error);
      Alert.alert('Error', 'Failed to fetch detailed attendance');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendance();
    setRefreshing(false);
  };

  const toggleAttendance = (studentId, currentStatus) => {
    setAttendanceData(prevData =>
      prevData.map(item => {
        if (item.student.id === studentId) {
          return {
            ...item,
            attendance: {
              ...item.attendance,
              present: !currentStatus
            }
          };
        }
        return item;
      })
    );
  };

  const markAllPresent = () => {
    setAttendanceData(prevData =>
      prevData.map(item => ({
        ...item,
        attendance: {
          ...item.attendance,
          present: true
        }
      }))
    );
  };

  const markAllAbsent = () => {
    setAttendanceData(prevData =>
      prevData.map(item => ({
        ...item,
        attendance: {
          ...item.attendance,
          present: false
        }
      }))
    );
  };

  const openRemarksModal = (studentId, currentRemarks = '') => {
    setRemarksModal({
      visible: true,
      studentId,
      remarks: currentRemarks
    });
  };

  const saveRemarks = () => {
    const { studentId, remarks } = remarksModal;
    setAttendanceData(prevData =>
      prevData.map(item => {
        if (item.student.id === studentId) {
          return {
            ...item,
            attendance: {
              ...item.attendance,
              remarks
            }
          };
        }
        return item;
      })
    );
    setRemarksModal({ visible: false, studentId: null, remarks: '' });
  };

  const submitAttendance = async () => {
    try {
      const attendancePayload = attendanceData.map(item => ({
        studentId: item.student.id,
        present: item.attendance?.present || false,
        remarks: item.attendance?.remarks || null
      }));

      await markAttendance(selectedClass, selectedDate, attendancePayload);
      Alert.alert('Success', 'Attendance marked successfully');
      await fetchAttendance(); // Refresh to show updated data
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  const getSelectedClassName = () => {
    const classData = classes.find(c => c.id === selectedClass);
    return classData ? `${classData.name} (Grade ${classData.grade})` : 'Select Class';
  };

  const renderStudentItem = (item, index) => {
    const { student, attendance } = item;
    const isPresent = attendance?.present || false;
    const hasRemarks = attendance?.remarks && attendance.remarks.length > 0;

    return (
      <View
        key={student.id}
        style={[
          styles.studentItem,
          { 
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderLeftColor: isPresent ? '#4CAF50' : '#FF5722',
            borderLeftWidth: 4
          }
        ]}
      >
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: theme.text }]}>
            {viewMode === 'name' ? student.name : student.rollNumber}
          </Text>
          <Text style={[styles.studentSecondary, { color: theme.textSecondary }]}>
            {viewMode === 'name' ? `Roll: ${student.rollNumber}` : student.name}
          </Text>
          {hasRemarks && (
            <Text style={[styles.remarks, { color: theme.primary }]}>
              💬 {attendance.remarks}
            </Text>
          )}
        </View>

        <View style={styles.attendanceControls}>
          <TouchableOpacity
            style={[
              styles.attendanceButton,
              styles.presentButton,
              isPresent && { backgroundColor: '#4CAF50' }
            ]}
            onPress={() => toggleAttendance(student.id, isPresent)}
          >
            <Text style={[
              styles.attendanceButtonText,
              { color: isPresent ? '#fff' : '#4CAF50' }
            ]}>
              ✓ Present
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.attendanceButton,
              styles.absentButton,
              !isPresent && { backgroundColor: '#FF5722' }
            ]}
            onPress={() => toggleAttendance(student.id, isPresent)}
          >
            <Text style={[
              styles.attendanceButtonText,
              { color: !isPresent ? '#fff' : '#FF5722' }
            ]}>
              ✗ Absent
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.remarksButton, { backgroundColor: theme.primary }]}
            onPress={() => openRemarksModal(student.id, attendance?.remarks)}
          >
            <Text style={[styles.remarksButtonText, { color: theme.surface }]}>
              💬
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: theme.surface }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.surface }]}>Take Attendance</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => {
            setShowHistory(true);
            fetchHistory();
          }}
        >
          <Text style={[styles.historyButtonText, { color: theme.surface }]}>📊 History</Text>
        </TouchableOpacity>
      </View>

      {/* Class and Date Selection */}
      <View style={styles.selectionContainer}>
        <View style={styles.pickerContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Select Class:</Text>
          <View style={[styles.picker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Picker
              selectedValue={selectedClass}
              onValueChange={setSelectedClass}
              style={{ color: theme.text }}
            >
              <Picker.Item label="Select a class" value="" />
              {classes.map(classData => (
                <Picker.Item
                  key={classData.id}
                  label={`${classData.name} (Grade ${classData.grade})`}
                  value={classData.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.dateContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Date:</Text>
          <TouchableOpacity
            style={[
              styles.dateInput,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                justifyContent: 'center'
              }
            ]}
            onPress={() => {
              const currentDate = new Date(selectedDate);
              setTempDate({
                year: currentDate.getFullYear(),
                month: currentDate.getMonth(),
                day: currentDate.getDate()
              });
              setShowDatePicker(true);
            }}
          >
            <Text style={[styles.dateText, { color: theme.text }]}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View Mode Toggle */}
      {selectedClass && (
        <View style={styles.controlsContainer}>
          <View style={styles.viewModeContainer}>
            <Text style={[styles.controlLabel, { color: theme.text }]}>View by:</Text>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'name' && { backgroundColor: theme.primary }
              ]}
              onPress={() => setViewMode('name')}
            >
              <Text style={[
                styles.toggleButtonText,
                { color: viewMode === 'name' ? theme.surface : theme.text }
              ]}>
                Name
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'roll' && { backgroundColor: theme.primary }
              ]}
              onPress={() => setViewMode('roll')}
            >
              <Text style={[
                styles.toggleButtonText,
                { color: viewMode === 'roll' ? theme.surface : theme.text }
              ]}>
                Roll No.
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bulkActionsContainer}>
            <TouchableOpacity
              style={[styles.bulkButton, { backgroundColor: '#4CAF50' }]}
              onPress={markAllPresent}
            >
              <Text style={styles.bulkButtonText}>All Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkButton, { backgroundColor: '#FF5722' }]}
              onPress={markAllAbsent}
            >
              <Text style={styles.bulkButtonText}>All Absent</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Students List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading attendance data...
            </Text>
          </View>
        ) : attendanceData.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {selectedClass ? 'No students found in this class' : 'Please select a class to view students'}
            </Text>
          </View>
        ) : (
          attendanceData.map(renderStudentItem)
        )}
      </ScrollView>

      {/* Submit Button */}
      {attendanceData.length > 0 && (
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={submitAttendance}
          >
            <Text style={[styles.submitButtonText, { color: theme.surface }]}>
              Save Attendance ({attendanceData.filter(item => item.attendance?.present).length} Present)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Remarks Modal */}
      <Modal
        visible={remarksModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRemarksModal({ visible: false, studentId: null, remarks: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Remarks</Text>
            <TextInput
              style={[
                styles.remarksInput,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text
                }
              ]}
              value={remarksModal.remarks}
              onChangeText={(text) => setRemarksModal(prev => ({ ...prev, remarks: text }))}
              placeholder="Enter remarks (optional)"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.textSecondary }]}
                onPress={() => setRemarksModal({ visible: false, studentId: null, remarks: '' })}
              >
                <Text style={[styles.modalButtonText, { color: theme.surface }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={saveRemarks}
              >
                <Text style={[styles.modalButtonText, { color: theme.surface }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={[styles.historyModal, { backgroundColor: theme.background }]}>
          <View style={[styles.historyHeader, { backgroundColor: theme.primary }]}>
            <Text style={[styles.historyTitle, { color: theme.surface }]}>Attendance History</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHistory(false)}
            >
              <Text style={[styles.closeButtonText, { color: theme.surface }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.historyContent}>
            {selectedHistoryDate && detailedAttendance ? (
              <View>
                <TouchableOpacity
                  style={styles.backToHistoryButton}
                  onPress={() => {
                    setSelectedHistoryDate(null);
                    setDetailedAttendance(null);
                  }}
                >
                  <Text style={[styles.backToHistoryText, { color: theme.primary }]}>‹ Back to History</Text>
                </TouchableOpacity>
                
                <View style={[styles.detailedHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.detailedDate, { color: theme.text }]}>
                    {new Date(selectedHistoryDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  <Text style={[styles.detailedStats, { color: theme.textSecondary }]}>
                    Present: {detailedAttendance.totalPresent} | Absent: {detailedAttendance.totalAbsent}
                  </Text>
                </View>

                {detailedAttendance.presentStudents.length > 0 && (
                  <View style={styles.attendanceSection}>
                    <Text style={[styles.sectionTitle, { color: '#4CAF50' }]}>Present Students ({detailedAttendance.totalPresent})</Text>
                    {detailedAttendance.presentStudents.map((student, index) => (
                      <View key={student.id} style={[styles.studentDetailItem, { backgroundColor: theme.surface, borderColor: theme.border, borderLeftColor: '#4CAF50' }]}>
                        <Text style={[styles.studentDetailName, { color: theme.text }]}>{student.name}</Text>
                        <Text style={[styles.studentDetailRoll, { color: theme.textSecondary }]}>Roll: {student.rollNumber}</Text>
                        {student.remarks && (
                          <Text style={[styles.studentDetailRemarks, { color: theme.primary }]}>💬 {student.remarks}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {detailedAttendance.absentStudents.length > 0 && (
                  <View style={styles.attendanceSection}>
                    <Text style={[styles.sectionTitle, { color: '#FF5722' }]}>Absent Students ({detailedAttendance.totalAbsent})</Text>
                    {detailedAttendance.absentStudents.map((student, index) => (
                      <View key={student.id} style={[styles.studentDetailItem, { backgroundColor: theme.surface, borderColor: theme.border, borderLeftColor: '#FF5722' }]}>
                        <Text style={[styles.studentDetailName, { color: theme.text }]}>{student.name}</Text>
                        <Text style={[styles.studentDetailRoll, { color: theme.textSecondary }]}>Roll: {student.rollNumber}</Text>
                        {student.remarks && (
                          <Text style={[styles.studentDetailRemarks, { color: theme.primary }]}>💬 {student.remarks}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              historyData.map((dayData, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.historyItem,
                    { backgroundColor: theme.surface, borderColor: theme.border }
                  ]}
                  onPress={() => fetchDetailedAttendance(dayData.date)}
                >
                  <Text style={[styles.historyDate, { color: theme.text }]}>
                    {new Date(dayData.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                  <Text style={[styles.historyStats, { color: theme.textSecondary }]}>
                    Present: {dayData.totalPresent} | Absent: {dayData.totalAbsent}
                  </Text>
                  <Text style={[styles.tapToViewText, { color: theme.primary }]}>Tap to view details</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={[styles.datePickerContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.datePickerTitle, { color: theme.text }]}>Select Date</Text>
            
            <View style={styles.datePickerRow}>
              {/* Year Picker */}
              <View style={styles.datePickerColumn}>
                <Text style={[styles.datePickerLabel, { color: theme.text }]}>Year</Text>
                <View style={[styles.datePickerSelect, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Picker
                    selectedValue={tempDate.year}
                    onValueChange={(value) => setTempDate(prev => ({ ...prev, year: value }))}
                    style={{ color: theme.text }}
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                      <Picker.Item key={year} label={year.toString()} value={year} />
                    ))}
                  </Picker>
                </View>
              </View>
              
              {/* Month Picker */}
              <View style={styles.datePickerColumn}>
                <Text style={[styles.datePickerLabel, { color: theme.text }]}>Month</Text>
                <View style={[styles.datePickerSelect, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Picker
                    selectedValue={tempDate.month}
                    onValueChange={(value) => setTempDate(prev => ({ ...prev, month: value }))}
                    style={{ color: theme.text }}
                  >
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((month, index) => (
                      <Picker.Item key={index} label={month} value={index} />
                    ))}
                  </Picker>
                </View>
              </View>
              
              {/* Day Picker */}
              <View style={styles.datePickerColumn}>
                <Text style={[styles.datePickerLabel, { color: theme.text }]}>Day</Text>
                <View style={[styles.datePickerSelect, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Picker
                    selectedValue={tempDate.day}
                    onValueChange={(value) => setTempDate(prev => ({ ...prev, day: value }))}
                    style={{ color: theme.text }}
                  >
                    {Array.from({ length: new Date(tempDate.year, tempDate.month + 1, 0).getDate() }, (_, i) => i + 1).map(day => (
                      <Picker.Item key={day} label={day.toString()} value={day} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
            
            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={[styles.datePickerButton, { backgroundColor: theme.textSecondary }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.datePickerButtonText, { color: theme.surface }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePickerButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  const newDate = new Date(tempDate.year, tempDate.month, tempDate.day);
                  setSelectedDate(newDate.toISOString().split('T')[0]);
                  setShowDatePicker(false);
                }}
              >
                <Text style={[styles.datePickerButtonText, { color: theme.surface }]}>Select</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  // Date picker styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContent: {
    width: '90%',
    borderRadius: 15,
    padding: 20,
    maxHeight: '70%',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  datePickerColumn: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center',
  },
  datePickerSelect: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  datePickerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  datePickerButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  historyButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  historyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectionContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  dateContainer: {
    marginBottom: 10,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  controlsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  viewModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
  },
  toggleButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bulkActionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  bulkButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  bulkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyState: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  studentItem: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  studentSecondary: {
    fontSize: 14,
    marginBottom: 4,
  },
  remarks: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  attendanceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendanceButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  presentButton: {
    borderColor: '#4CAF50',
  },
  absentButton: {
    borderColor: '#FF5722',
  },
  attendanceButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  remarksButton: {
    padding: 8,
    borderRadius: 15,
    minWidth: 35,
    alignItems: 'center',
  },
  remarksButtonText: {
    fontSize: 12,
  },
  submitContainer: {
    padding: 20,
  },
  submitButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  remarksInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyModal: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  historyContent: {
    flex: 1,
    padding: 20,
  },
  historyItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  historyStats: {
    fontSize: 14,
  },
  tapToViewText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  backToHistoryButton: {
    padding: 10,
    marginBottom: 15,
  },
  backToHistoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailedHeader: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  detailedDate: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detailedStats: {
    fontSize: 14,
  },
  attendanceSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingLeft: 5,
  },
  studentDetailItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  studentDetailName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  studentDetailRoll: {
    fontSize: 14,
    marginBottom: 4,
  },
  studentDetailRemarks: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default TakeAttendance;