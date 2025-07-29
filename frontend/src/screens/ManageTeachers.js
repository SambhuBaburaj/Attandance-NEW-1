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
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from "../services/teacherService";

const ManageTeachers = ({ navigation }) => {
  const { theme } = useTheme();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    phone: "",
    address: "",
    qualification: "",
    experience: "",
    salary: "",
    joiningDate: "",
  });

  const styles = getStyles(theme);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const data = await getAllTeachers();
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      Alert.alert("Error", "Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeachers();
    setRefreshing(false);
  };

  const openModal = (teacherData = null) => {
    if (teacherData) {
      setEditingTeacher(teacherData);
      setFormData({
        name: teacherData.user.name,
        email: teacherData.user.email,
        password: "", // Don't populate password for editing
        employeeId: teacherData.employeeId,
        phone: teacherData.phone || "",
        address: teacherData.address || "",
        qualification: teacherData.qualification || "",
        experience: teacherData.experience?.toString() || "",
        salary: teacherData.salary?.toString() || "",
        joiningDate: teacherData.joiningDate || "",
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        employeeId: "",
        phone: "",
        address: "",
        qualification: "",
        experience: "",
        salary: "",
        joiningDate: "",
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTeacher(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      employeeId: "",
      phone: "",
      address: "",
      qualification: "",
      experience: "",
      salary: "",
      joiningDate: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.employeeId) {
      Alert.alert("Error", "Name, email, and employee ID are required");
      return;
    }

    if (!editingTeacher && !formData.password) {
      Alert.alert("Error", "Password is required for new teachers");
      return;
    }

    try {
      const data = {
        ...formData,
        experience: formData.experience ? parseInt(formData.experience) : null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
      };

      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, data);
        Alert.alert("Success", "Teacher updated successfully");
      } else {
        await createTeacher(data);
        Alert.alert("Success", "Teacher created successfully");
      }

      closeModal();
      fetchTeachers();
    } catch (error) {
      console.error("Error saving teacher:", error);
      Alert.alert("Error", "Failed to save teacher");
    }
  };

  const handleDelete = (teacherData) => {
    Alert.alert(
      "Delete Teacher",
      `Are you sure you want to delete "${teacherData.user.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTeacher(teacherData.id);
              Alert.alert("Success", "Teacher deleted successfully");
              fetchTeachers();
            } catch (error) {
              console.error("Error deleting teacher:", error);
              Alert.alert("Error", "Failed to delete teacher");
            }
          },
        },
      ]
    );
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
          Manage Teachers
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
        {teachers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No teachers found. Tap "Add" to create your first teacher.
            </Text>
          </View>
        ) : (
          teachers.map((teacher) => (
            <View
              key={teacher.id}
              style={[
                styles.teacherCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.teacherHeader}>
                <Text style={[styles.teacherName, { color: theme.text }]}>
                  {teacher.user.name}
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.editButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => openModal(teacher)}
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
                    onPress={() => handleDelete(teacher)}
                  >
                    <Text style={[styles.actionText, { color: theme.surface }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.teacherInfo, { color: theme.textSecondary }]}>
                🆔 {teacher.employeeId}
              </Text>
              <Text style={[styles.teacherInfo, { color: theme.textSecondary }]}>
                ✉️ {teacher.user.email}
              </Text>
              {teacher.phone && (
                <Text style={[styles.teacherInfo, { color: theme.textSecondary }]}>
                  📞 {teacher.phone}
                </Text>
              )}
              {teacher.qualification && (
                <Text style={[styles.teacherInfo, { color: theme.textSecondary }]}>
                  🎓 {teacher.qualification}
                </Text>
              )}
              {teacher.experience && (
                <Text style={[styles.teacherInfo, { color: theme.textSecondary }]}>
                  💼 {teacher.experience} years experience
                </Text>
              )}
              <Text style={[styles.teacherInfo, { color: theme.textSecondary }]}>
                📚 Classes: {teacher._count?.classes || 0}
              </Text>
              <Text style={[styles.teacherInfo, { 
                color: teacher.isActive ? theme.success : theme.danger 
              }]}>
                {teacher.isActive ? "✅ Active" : "❌ Inactive"}
              </Text>
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
              {editingTeacher ? "Edit Teacher" : "Add New Teacher"}
            </Text>

            <ScrollView style={styles.form}>
              <Text style={[styles.label, { color: theme.text }]}>
                Full Name *
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
                placeholder="Enter teacher's full name"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.text }]}>Email *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                placeholder="Enter email address"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
              />

              {!editingTeacher && (
                <>
                  <Text style={[styles.label, { color: theme.text }]}>
                    Password *
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
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData({ ...formData, password: text })
                    }
                    placeholder="Enter password"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                  />
                </>
              )}

              <Text style={[styles.label, { color: theme.text }]}>
                Employee ID *
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
                value={formData.employeeId}
                onChangeText={(text) =>
                  setFormData({ ...formData, employeeId: text })
                }
                placeholder="Enter employee ID"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
                placeholder="Enter phone number"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
              />

              <Text style={[styles.label, { color: theme.text }]}>Address</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.address}
                onChangeText={(text) =>
                  setFormData({ ...formData, address: text })
                }
                placeholder="Enter address"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.label, { color: theme.text }]}>Qualification</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.qualification}
                onChangeText={(text) =>
                  setFormData({ ...formData, qualification: text })
                }
                placeholder="Enter qualification"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.text }]}>
                Experience (Years)
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
                value={formData.experience}
                onChangeText={(text) =>
                  setFormData({ ...formData, experience: text })
                }
                placeholder="Enter years of experience"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />

              <Text style={[styles.label, { color: theme.text }]}>Salary</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.salary}
                onChangeText={(text) =>
                  setFormData({ ...formData, salary: text })
                }
                placeholder="Enter salary"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
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
                  {editingTeacher ? "Update" : "Create"}
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
    teacherCard: {
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
    teacherHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    teacherName: {
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
    teacherInfo: {
      fontSize: 14,
      marginBottom: 3,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "90%",
      maxHeight: "85%",
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

export default ManageTeachers;