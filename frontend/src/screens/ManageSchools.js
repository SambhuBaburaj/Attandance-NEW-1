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
  getAllSchools,
  createSchool,
  updateSchool,
  deleteSchool,
} from "../services/schoolService";

const ManageSchools = ({ navigation }) => {
  const { theme } = useTheme();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    principalName: "",
    establishedYear: "",
    website: "",
  });

  const styles = getStyles(theme);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const data = await getAllSchools();
      setSchools(data);
    } catch (error) {
      console.error("Error fetching schools:", error);
      Alert.alert("Error", "Failed to fetch schools");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchools();
    setRefreshing(false);
  };

  const openModal = (schoolData = null) => {
    if (schoolData) {
      setEditingSchool(schoolData);
      setFormData({
        name: schoolData.name,
        address: schoolData.address,
        phone: schoolData.phone || "",
        email: schoolData.email || "",
        principalName: schoolData.principalName || "",
        establishedYear: schoolData.establishedYear?.toString() || "",
        website: schoolData.website || "",
      });
    } else {
      setEditingSchool(null);
      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
        principalName: "",
        establishedYear: "",
        website: "",
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingSchool(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      principalName: "",
      establishedYear: "",
      website: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.address) {
      Alert.alert("Error", "Name and address are required");
      return;
    }

    try {
      const data = {
        ...formData,
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : null,
      };

      if (editingSchool) {
        await updateSchool(editingSchool.id, data);
        Alert.alert("Success", "School updated successfully");
      } else {
        await createSchool(data);
        Alert.alert("Success", "School created successfully");
      }

      closeModal();
      fetchSchools();
    } catch (error) {
      console.error("Error saving school:", error);
      Alert.alert("Error", "Failed to save school");
    }
  };

  const handleDelete = (schoolData) => {
    Alert.alert(
      "Delete School",
      `Are you sure you want to delete "${schoolData.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSchool(schoolData.id);
              Alert.alert("Success", "School deleted successfully");
              fetchSchools();
            } catch (error) {
              console.error("Error deleting school:", error);
              Alert.alert("Error", "Failed to delete school");
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
          Manage Schools
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
        {schools.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No schools found. Tap "Add" to create your first school.
            </Text>
          </View>
        ) : (
          schools.map((school) => (
            <View
              key={school.id}
              style={[
                styles.schoolCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.schoolHeader}>
                <Text style={[styles.schoolName, { color: theme.text }]}>
                  {school.name}
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.editButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => openModal(school)}
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
                    onPress={() => handleDelete(school)}
                  >
                    <Text style={[styles.actionText, { color: theme.surface }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.schoolInfo, { color: theme.textSecondary }]}>
                📍 {school.address}
              </Text>
              {school.phone && (
                <Text style={[styles.schoolInfo, { color: theme.textSecondary }]}>
                  📞 {school.phone}
                </Text>
              )}
              {school.email && (
                <Text style={[styles.schoolInfo, { color: theme.textSecondary }]}>
                  ✉️ {school.email}
                </Text>
              )}
              {school.principalName && (
                <Text style={[styles.schoolInfo, { color: theme.textSecondary }]}>
                  👨‍💼 Principal: {school.principalName}
                </Text>
              )}
              <Text style={[styles.schoolInfo, { color: theme.textSecondary }]}>
                📚 Classes: {school._count?.classes || 0}
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
              {editingSchool ? "Edit School" : "Add New School"}
            </Text>

            <ScrollView style={styles.form}>
              <Text style={[styles.label, { color: theme.text }]}>
                School Name *
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
                placeholder="Enter school name"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.text }]}>Address *</Text>
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
                placeholder="Enter school address"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
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

              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
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

              <Text style={[styles.label, { color: theme.text }]}>Principal Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.principalName}
                onChangeText={(text) =>
                  setFormData({ ...formData, principalName: text })
                }
                placeholder="Enter principal name"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.text }]}>
                Established Year
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
                value={formData.establishedYear}
                onChangeText={(text) =>
                  setFormData({ ...formData, establishedYear: text })
                }
                placeholder="Enter established year"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />

              <Text style={[styles.label, { color: theme.text }]}>Website</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.website}
                onChangeText={(text) =>
                  setFormData({ ...formData, website: text })
                }
                placeholder="Enter website URL"
                placeholderTextColor={theme.textSecondary}
                keyboardType="url"
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
                  {editingSchool ? "Update" : "Create"}
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
    schoolCard: {
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
    schoolHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    schoolName: {
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
    schoolInfo: {
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

export default ManageSchools;