import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
  getAvailableTeachers,
} from "../services/classService";

const ManageClasses = ({ navigation }) => {
  const { theme } = useTheme();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    section: "A",
    capacity: "30",
    teacherId: "",
    description: "",
  });

  const styles = getStyles(theme);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await getAllClasses();
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      Alert.alert("Error", "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const data = await getAvailableTeachers();
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClasses();
    setRefreshing(false);
  };

  const openModal = (classData = null) => {
    if (classData) {
      setEditingClass(classData);
      setFormData({
        name: classData.name,
        grade: classData.grade,
        section: classData.section,
        capacity: classData.capacity.toString(),
        teacherId: classData.teacherId || "",
        description: classData.description || "",
      });
    } else {
      setEditingClass(null);
      setFormData({
        name: "",
        grade: "",
        section: "A",
        capacity: "30",
        teacherId: "",
        description: "",
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingClass(null);
    setFormData({
      name: "",
      grade: "",
      section: "A",
      capacity: "30",
      teacherId: "",
      description: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.grade) {
      Alert.alert("Error", "Name and grade are required");
      return;
    }

    try {
      const data = {
        ...formData,
        capacity: parseInt(formData.capacity) || 30,
        teacherId: formData.teacherId || null,
        // Let backend handle school assignment
      };

      if (editingClass) {
        await updateClass(editingClass.id, data);
        Alert.alert("Success", "Class updated successfully");
      } else {
        await createClass(data);
        Alert.alert("Success", "Class created successfully");
      }

      closeModal();
      fetchClasses();
    } catch (error) {
      console.error("Error saving class:", error);
      Alert.alert("Error", "Failed to save class");
    }
  };

  const handleDelete = (classData) => {
    Alert.alert(
      "Delete Class",
      `Are you sure you want to delete "${classData.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteClass(classData.id);
              Alert.alert("Success", "Class deleted successfully");
              fetchClasses();
            } catch (error) {
              console.error("Error deleting class:", error);
              Alert.alert("Error", "Failed to delete class");
            }
          },
        },
      ]
    );
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? teacher.user.name : "No teacher assigned";
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
          Manage Classes
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Text style={[styles.addButtonText, { color: theme.surface }]}>
            + Add
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {classes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No classes found. Tap "Add" to create your first class.
            </Text>
          </View>
        ) : (
          classes.map((classData) => (
            <View
              key={classData.id}
              style={[
                styles.classCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.classHeader}>
                <Text style={[styles.className, { color: theme.text }]}>
                  {classData.name}
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.editButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => openModal(classData)}
                  >
                    <Text style={[styles.actionText, { color: theme.surface }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      { backgroundColor: theme.danger },
                    ]}
                    onPress={() => handleDelete(classData)}
                  >
                    <Text style={[styles.actionText, { color: theme.surface }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.classInfo, { color: theme.textSecondary }]}>
                Grade: {classData.grade} | Section: {classData.section}
              </Text>
              <Text style={[styles.classInfo, { color: theme.textSecondary }]}>
                Capacity: {classData.capacity} students
              </Text>
              <Text style={[styles.classInfo, { color: theme.textSecondary }]}>
                Teacher: {getTeacherName(classData.teacherId)}
              </Text>
              <Text style={[styles.classInfo, { color: theme.textSecondary }]}>
                Students: {classData._count?.students || 0}
              </Text>
              {classData.description && (
                <Text
                  style={[
                    styles.classDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {classData.description}
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
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingClass ? "Edit Class" : "Add New Class"}
            </Text>

            <ScrollView style={styles.form}>
              <Text style={[styles.label, { color: theme.text }]}>
                Class Name *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                placeholder="Enter class name"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.text }]}>Grade *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.grade}
                onChangeText={(text) =>
                  setFormData({ ...formData, grade: text })
                }
                placeholder="Enter grade (e.g., 1, 2, 3)"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.text }]}>Section</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.section}
                onChangeText={(text) =>
                  setFormData({ ...formData, section: text })
                }
                placeholder="Enter section (e.g., A, B, C)"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.text }]}>
                Capacity
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.capacity}
                onChangeText={(text) =>
                  setFormData({ ...formData, capacity: text })
                }
                placeholder="Enter capacity"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />

              <Text style={[styles.label, { color: theme.text }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="Enter description (optional)"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { backgroundColor: theme.textSecondary },
                ]}
                onPress={closeModal}
              >
                <Text style={[styles.buttonText, { color: theme.surface }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSubmit}
              >
                <Text style={[styles.buttonText, { color: theme.surface }]}>
                  {editingClass ? "Update" : "Create"}
                </Text>
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
    addButton: {
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
    },
    addButtonText: {
      fontSize: 14,
      fontWeight: "600",
    },
    content: {
      flex: 1,
      padding: 20,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 100,
    },
    emptyText: {
      fontSize: 16,
      textAlign: "center",
    },
    classCard: {
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    classHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    className: {
      fontSize: 18,
      fontWeight: "bold",
      flex: 1,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
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
      fontWeight: "600",
    },
    classInfo: {
      fontSize: 14,
      marginBottom: 3,
    },
    classDescription: {
      fontSize: 14,
      marginTop: 8,
      fontStyle: "italic",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "90%",
      maxHeight: "80%",
      borderRadius: 15,
      padding: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 20,
    },
    form: {
      maxHeight: 400,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
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
      textAlignVertical: "top",
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
      gap: 15,
    },
    cancelButton: {
      flex: 1,
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
    },
    saveButton: {
      flex: 1,
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
    },
  });

export default ManageClasses;
