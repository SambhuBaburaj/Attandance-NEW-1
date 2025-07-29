import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../context/ThemeContext';
import {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getAvailableParents
} from '../services/studentService';
import { getAllClasses } from '../services/classService';

const ManageStudents = ({ navigation }) => {
  const { theme } = useTheme();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    phone: '',
    email: '',
    classId: '',
    parentId: '',
  });
  const [parentFormData, setParentFormData] = useState({
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    parentAddress: '',
    occupation: '',
    emergencyContact: '',
  });
  const [useNewParent, setUseNewParent] = useState(false);

  const styles = getStyles(theme);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchParents();
  }, []);

  const fetchStudents = async (classId = null) => {
    try {
      setLoading(true);
      const data = await getAllStudents(classId);
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      Alert.alert('Error', 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await getAllClasses();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchParents = async () => {
    try {
      const data = await getAvailableParents();
      setParents(data);
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents(selectedClass);
    setRefreshing(false);
  };

  const handleClassFilter = (classId) => {
    setSelectedClass(classId);
    fetchStudents(classId);
  };

  const openModal = (studentData = null) => {
    if (studentData) {
      setEditingStudent(studentData);
      setUseNewParent(false);
      setFormData({
        name: studentData.name,
        rollNumber: studentData.rollNumber,
        dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toISOString().split('T')[0] : '',
        gender: studentData.gender || '',
        address: studentData.address || '',
        phone: studentData.phone || '',
        email: studentData.email || '',
        classId: studentData.classId,
        parentId: studentData.parentId,
      });
    } else {
      setEditingStudent(null);
      setUseNewParent(false);
      setFormData({
        name: '',
        rollNumber: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        phone: '',
        email: '',
        classId: '',
        parentId: '',
      });
      setParentFormData({
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        parentAddress: '',
        occupation: '',
        emergencyContact: '',
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingStudent(null);
    setUseNewParent(false);
    setFormData({
      name: '',
      rollNumber: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      phone: '',
      email: '',
      classId: '',
      parentId: '',
    });
    setParentFormData({
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      parentAddress: '',
      occupation: '',
      emergencyContact: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.rollNumber || !formData.classId) {
      Alert.alert('Error', 'Name, roll number, and class are required');
      return;
    }

    if (!editingStudent) {
      // For new students, either parentId or parent info is required
      if (!useNewParent && !formData.parentId) {
        Alert.alert('Error', 'Please select a parent or create a new one');
        return;
      }
      if (useNewParent && (!parentFormData.parentName || !parentFormData.parentEmail)) {
        Alert.alert('Error', 'Parent name and email are required');
        return;
      }
    } else {
      // For editing, parentId is required
      if (!formData.parentId) {
        Alert.alert('Error', 'Parent is required');
        return;
      }
    }

    try {
      const data = {
        ...formData,
        dateOfBirth: formData.dateOfBirth || null,
      };

      // Add parent info for new students with new parent
      if (!editingStudent && useNewParent) {
        data.parentInfo = parentFormData;
        delete data.parentId;
      }

      if (editingStudent) {
        await updateStudent(editingStudent.id, data);
        Alert.alert('Success', 'Student updated successfully');
      } else {
        await createStudent(data);
        Alert.alert('Success', 'Student created successfully');
      }

      closeModal();
      fetchStudents(selectedClass);
    } catch (error) {
      console.error('Error saving student:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save student');
    }
  };

  const handleDelete = (studentData) => {
    Alert.alert(
      'Deactivate Student',
      `Are you sure you want to deactivate "${studentData.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(studentData.id);
              Alert.alert('Success', 'Student deactivated successfully');
              fetchStudents(selectedClass);
            } catch (error) {
              console.error('Error deactivating student:', error);
              Alert.alert('Error', 'Failed to deactivate student');
            }
          },
        },
      ]
    );
  };

  const getClassName = (classId) => {
    const classData = classes.find(c => c.id === classId);
    return classData ? `${classData.name} (Grade ${classData.grade})` : 'Unknown Class';
  };

  const getParentName = (parentId) => {
    const parent = parents.find(p => p.id === parentId);
    return parent ? parent.user.name : 'Unknown Parent';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: theme.surface }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.surface }]}>Manage Students</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openModal()}
        >
          <Text style={[styles.addButtonText, { color: theme.surface }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <Text style={[styles.filterLabel, { color: theme.text }]}>Filter by Class:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: !selectedClass ? theme.primary : theme.surface, borderColor: theme.border }
            ]}
            onPress={() => handleClassFilter('')}
          >
            <Text style={[styles.filterText, { color: !selectedClass ? theme.surface : theme.text }]}>
              All Classes
            </Text>
          </TouchableOpacity>
          {classes.map((classData) => (
            <TouchableOpacity
              key={classData.id}
              style={[
                styles.filterButton,
                { 
                  backgroundColor: selectedClass === classData.id ? theme.primary : theme.surface,
                  borderColor: theme.border
                }
              ]}
              onPress={() => handleClassFilter(classData.id)}
            >
              <Text style={[
                styles.filterText,
                { color: selectedClass === classData.id ? theme.surface : theme.text }
              ]}>
                {classData.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {students.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No students found. Tap "Add" to create your first student.
            </Text>
          </View>
        ) : (
          students.map((student) => (
            <View
              key={student.id}
              style={[styles.studentCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={styles.studentHeader}>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: theme.text }]}>
                    {student.name}
                  </Text>
                  <Text style={[styles.rollNumber, { color: theme.primary }]}>
                    Roll: {student.rollNumber}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: theme.primary }]}
                    onPress={() => openModal(student)}
                  >
                    <Text style={[styles.actionText, { color: theme.surface }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: theme.danger }]}
                    onPress={() => handleDelete(student)}
                  >
                    <Text style={[styles.actionText, { color: theme.surface }]}>Deactivate</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.studentDetail, { color: theme.textSecondary }]}>
                Class: {getClassName(student.classId)}
              </Text>
              <Text style={[styles.studentDetail, { color: theme.textSecondary }]}>
                Parent: {getParentName(student.parentId)}
              </Text>
              {student.gender && (
                <Text style={[styles.studentDetail, { color: theme.textSecondary }]}>
                  Gender: {student.gender}
                </Text>
              )}
              {student.dateOfBirth && (
                <Text style={[styles.studentDetail, { color: theme.textSecondary }]}>
                  DOB: {new Date(student.dateOfBirth).toLocaleDateString()}
                </Text>
              )}
              {student.phone && (
                <Text style={[styles.studentDetail, { color: theme.textSecondary }]}>
                  Phone: {student.phone}
                </Text>
              )}
              {student.email && (
                <Text style={[styles.studentDetail, { color: theme.textSecondary }]}>
                  Email: {student.email}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </Text>

            <ScrollView style={styles.form}>
              <Text style={[styles.label, { color: theme.text }]}>Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter student name"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.text }]}>Roll Number *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                value={formData.rollNumber}
                onChangeText={(text) => setFormData({ ...formData, rollNumber: text })}
                placeholder="Enter roll number"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.text }]}>Class *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Picker
                  selectedValue={formData.classId}
                  onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  style={[styles.picker, { color: theme.text }]}
                >
                  <Picker.Item label="Select a class" value="" />
                  {classes.map((classData) => (
                    <Picker.Item
                      key={classData.id}
                      label={`${classData.name} (Grade ${classData.grade})`}
                      value={classData.id}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.label, { color: theme.text }]}>Parent *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Picker
                  selectedValue={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                  style={[styles.picker, { color: theme.text }]}
                >
                  <Picker.Item label="Select a parent" value="" />
                  {parents.map((parent) => (
                    <Picker.Item
                      key={parent.id}
                      label={parent.user.name}
                      value={parent.id}
                    />
                  ))}
                </Picker>
              </View>

              {/* Parent Selection Options */}
              {!editingStudent && (
                <View>
                  <Text style={[styles.label, { color: theme.text }]}>Parent Options</Text>
                  <View style={styles.parentOptionContainer}>
                    <TouchableOpacity
                      style={[
                        styles.parentOptionButton,
                        {
                          backgroundColor: !useNewParent ? theme.primary : theme.surface,
                          borderColor: theme.border
                        }
                      ]}
                      onPress={() => setUseNewParent(false)}
                    >
                      <Text style={[
                        styles.parentOptionText,
                        { color: !useNewParent ? theme.surface : theme.text }
                      ]}>
                        Select Existing
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.parentOptionButton,
                        {
                          backgroundColor: useNewParent ? theme.primary : theme.surface,
                          borderColor: theme.border
                        }
                      ]}
                      onPress={() => setUseNewParent(true)}
                    >
                      <Text style={[
                        styles.parentOptionText,
                        { color: useNewParent ? theme.surface : theme.text }
                      ]}>
                        Create New
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* New Parent Form */}
              {useNewParent && !editingStudent && (
                <View style={[styles.parentSection, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Text style={[styles.sectionTitle, { color: theme.primary }]}>Parent Information</Text>
                  
                  <Text style={[styles.label, { color: theme.text }]}>Parent Name *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    value={parentFormData.parentName}
                    onChangeText={(text) => setParentFormData({ ...parentFormData, parentName: text })}
                    placeholder="Enter parent name"
                    placeholderTextColor={theme.textSecondary}
                  />

                  <Text style={[styles.label, { color: theme.text }]}>Parent Email *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    value={parentFormData.parentEmail}
                    onChangeText={(text) => setParentFormData({ ...parentFormData, parentEmail: text })}
                    placeholder="Enter parent email"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="email-address"
                  />

                  <Text style={[styles.label, { color: theme.text }]}>Parent Phone</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    value={parentFormData.parentPhone}
                    onChangeText={(text) => setParentFormData({ ...parentFormData, parentPhone: text })}
                    placeholder="Enter parent phone number"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                  />

                  <Text style={[styles.label, { color: theme.text }]}>Parent Address</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    value={parentFormData.parentAddress}
                    onChangeText={(text) => setParentFormData({ ...parentFormData, parentAddress: text })}
                    placeholder="Enter parent address"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={2}
                  />

                  <Text style={[styles.label, { color: theme.text }]}>Occupation</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    value={parentFormData.occupation}
                    onChangeText={(text) => setParentFormData({ ...parentFormData, occupation: text })}
                    placeholder="Enter parent occupation"
                    placeholderTextColor={theme.textSecondary}
                  />

                  <Text style={[styles.label, { color: theme.text }]}>Emergency Contact</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    value={parentFormData.emergencyContact}
                    onChangeText={(text) => setParentFormData({ ...parentFormData, emergencyContact: text })}
                    placeholder="Enter emergency contact number"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
              )}

              <Text style={[styles.label, { color: theme.text }]}>Date of Birth</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                value={formData.dateOfBirth}
                onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
              <View style={[styles.pickerContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  style={[styles.picker, { color: theme.text }]}
                >
                  <Picker.Item label="Select gender" value="" />
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>

              <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter phone number"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
              />

              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter email address"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
              />

              <Text style={[styles.label, { color: theme.text }]}>Address</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Enter address"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.textSecondary }]}
                onPress={closeModal}
              >
                <Text style={[styles.buttonText, { color: theme.surface }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSubmit}
              >
                <Text style={[styles.buttonText, { color: theme.surface }]}>
                  {editingStudent ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  // Parent form styles
  parentOptionContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  parentOptionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  parentOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  parentSection: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
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
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    padding: 15,
    paddingBottom: 10,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  studentCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  rollNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  studentDetail: {
    fontSize: 14,
    marginBottom: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    maxHeight: '90%',
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    maxHeight: 500,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManageStudents;