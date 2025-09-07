import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../services/apiClient';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      let response;
      if (user.role === 'PARENT') {
        response = await apiClient.get('/parents/profile');
      } else if (user.role === 'TEACHER') {
        response = await apiClient.get('/teachers/profile');
      } else {
        // For admin, just use user data
        setProfileData({
          name: user.name,
          email: user.email,
          role: user.role
        });
        setLoading(false);
        return;
      }

      setProfileData(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      let response;
      if (user.role === 'PARENT') {
        response = await apiClient.put('/parents/profile', profileData);
      } else if (user.role === 'TEACHER') {
        response = await apiClient.put('/teachers/profile', profileData);
      }

      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      if (response) {
        setProfileData(response.data);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const renderField = (label, key, value, editable = true, multiline = false) => (
    <View style={[styles.fieldContainer, { borderBottomColor: theme.borderColor }]}>
      <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
      {editing && editable ? (
        <TextInput
          style={[
            styles.fieldInput,
            {
              backgroundColor: theme.surface,
              color: theme.text,
              borderColor: theme.borderColor
            },
            multiline && styles.multilineInput
          ]}
          value={value || ''}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, [key]: text }))}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={theme.placeholder}
        />
      ) : (
        <Text style={[styles.fieldValue, { color: theme.text }]}>
          {value || 'Not set'}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => editing ? saveProfile() : setEditing(true)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.editText}>{editing ? 'Save' : 'Edit'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Content */}
        <View style={[styles.content, { backgroundColor: theme.surface }]}>
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Basic Information</Text>
            
            {renderField('Full Name', 'name', user.name || profileData.name)}
            {renderField('Email', 'email', user.email || profileData.email, false)}
            {renderField('Role', 'role', user.role, false)}
            
            {user.role === 'PARENT' && (
              <>
                {renderField('Phone', 'phone', profileData.phone)}
                {renderField('Alternate Phone', 'alternatePhone', profileData.alternatePhone)}
                {renderField('Address', 'address', profileData.address, true, true)}
                {renderField('Occupation', 'occupation', profileData.occupation)}
                {renderField('Work Address', 'workAddress', profileData.workAddress, true, true)}
                {renderField('Emergency Contact Name', 'emergencyContactName', profileData.emergencyContactName)}
                {renderField('Emergency Contact', 'emergencyContact', profileData.emergencyContact)}
                {renderField('Relationship', 'relationship', profileData.relationship)}
              </>
            )}
            
            {user.role === 'TEACHER' && (
              <>
                {renderField('Employee ID', 'employeeId', profileData.employeeId, false)}
                {renderField('Phone', 'phone', profileData.phone)}
                {renderField('Address', 'address', profileData.address, true, true)}
                {renderField('Qualification', 'qualification', profileData.qualification)}
                {renderField('Experience (years)', 'experience', profileData.experience?.toString())}
                {renderField('Joining Date', 'joiningDate', profileData.joiningDate ? new Date(profileData.joiningDate).toLocaleDateString() : '', false)}
              </>
            )}
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Settings</Text>
            
            {/* Theme Toggle */}
            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomColor: theme.borderColor }]}
              onPress={toggleTheme}
            >
              <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
              <View style={[
                styles.toggle,
                { backgroundColor: isDark ? theme.primary : theme.borderColor }
              ]}>
                <View style={[
                  styles.toggleButton,
                  { 
                    backgroundColor: 'white',
                    transform: [{ translateX: isDark ? 20 : 0 }]
                  }
                ]} />
              </View>
            </TouchableOpacity>

            {user.role === 'PARENT' && (
              <>
                <TouchableOpacity 
                  style={[styles.settingItem, { borderBottomColor: theme.borderColor }]}
                  onPress={() => {
                    const newValue = !profileData.notifications;
                    setProfileData(prev => ({ ...prev, notifications: newValue }));
                    if (editing) {
                      // Auto-save notification preference
                      setTimeout(() => saveProfile(), 500);
                    }
                  }}
                >
                  <Text style={[styles.settingLabel, { color: theme.text }]}>
                    Push Notifications
                  </Text>
                  <View style={[
                    styles.toggle,
                    { backgroundColor: profileData.notifications ? theme.primary : theme.borderColor }
                  ]}>
                    <View style={[
                      styles.toggleButton,
                      { 
                        backgroundColor: 'white',
                        transform: [{ translateX: profileData.notifications ? 20 : 0 }]
                      }
                    ]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.settingItem, { borderBottomColor: theme.borderColor }]}
                  onPress={() => {
                    const newValue = !profileData.whatsappOptIn;
                    setProfileData(prev => ({ ...prev, whatsappOptIn: newValue }));
                    if (editing) {
                      setTimeout(() => saveProfile(), 500);
                    }
                  }}
                >
                  <Text style={[styles.settingLabel, { color: theme.text }]}>
                    WhatsApp Notifications
                  </Text>
                  <View style={[
                    styles.toggle,
                    { backgroundColor: profileData.whatsappOptIn ? theme.primary : theme.borderColor }
                  ]}>
                    <View style={[
                      styles.toggleButton,
                      { 
                        backgroundColor: 'white',
                        transform: [{ translateX: profileData.whatsappOptIn ? 20 : 0 }]
                      }
                    ]} />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  editText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  fieldContainer: {
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
  },
  fieldInput: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 5,
  },
  logoutButton: {
    backgroundColor: '#ff4757',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;