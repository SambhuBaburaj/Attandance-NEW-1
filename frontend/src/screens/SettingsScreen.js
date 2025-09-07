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
  Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../services/apiClient';

const SettingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
    principalName: '',
    sessionStartTime: '09:00',
    sessionEndTime: '15:00',
    autoMarkAbsentAfter: '10:00',
    lateThresholdMinutes: 15,
    notificationEnabled: true,
    dailySummaryTime: '18:00',
    weeklySummaryDay: 5,
  });

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [schoolResponse, attendanceResponse] = await Promise.all([
        apiClient.get('/admin/school-settings').catch(() => ({ data: {} })),
        apiClient.get('/admin/attendance-settings').catch(() => ({ data: {} })),
      ]);

      setSettings(prev => ({
        ...prev,
        ...schoolResponse.data,
        ...attendanceResponse.data,
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const schoolSettings = {
        schoolName: settings.schoolName,
        schoolAddress: settings.schoolAddress,
        schoolPhone: settings.schoolPhone,
        schoolEmail: settings.schoolEmail,
        principalName: settings.principalName,
        sessionStartTime: settings.sessionStartTime,
        sessionEndTime: settings.sessionEndTime,
      };

      const attendanceSettings = {
        autoMarkAbsentAfter: settings.autoMarkAbsentAfter,
        lateThresholdMinutes: parseInt(settings.lateThresholdMinutes),
        notificationEnabled: settings.notificationEnabled,
        dailySummaryTime: settings.dailySummaryTime,
        weeklySummaryDay: parseInt(settings.weeklySummaryDay),
      };

      await Promise.all([
        apiClient.post('/admin/school-settings', schoolSettings),
        apiClient.post('/admin/attendance-settings', attendanceSettings),
      ]);

      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (title, children) => (
    <View style={[styles.section, { backgroundColor: theme.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.primary }]}>{title}</Text>
      {children}
    </View>
  );

  const renderTextInput = (label, key, placeholder, keyboardType = 'default') => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: theme.background,
            borderColor: theme.borderColor,
            color: theme.text,
          },
        ]}
        value={settings[key]?.toString() || ''}
        onChangeText={(text) => setSettings(prev => ({ ...prev, [key]: text }))}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        keyboardType={keyboardType}
      />
    </View>
  );

  const renderTimeInput = (label, key) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: theme.background,
            borderColor: theme.borderColor,
            color: theme.text,
          },
        ]}
        value={settings[key] || ''}
        onChangeText={(text) => setSettings(prev => ({ ...prev, [key]: text }))}
        placeholder="HH:MM"
        placeholderTextColor={theme.placeholder}
      />
    </View>
  );

  const renderSwitch = (label, key) => (
    <View style={styles.switchContainer}>
      <Text style={[styles.switchLabel, { color: theme.text }]}>{label}</Text>
      <Switch
        value={settings[key] || false}
        onValueChange={(value) => setSettings(prev => ({ ...prev, [key]: value }))}
        trackColor={{ false: theme.borderColor, true: theme.primary }}
        thumbColor={theme.surface}
      />
    </View>
  );

  if (user?.role !== 'ADMIN') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <View style={styles.centeredContainer}>
          <Text style={[styles.noAccessText, { color: theme.text }]}>
            Only administrators can access system settings.
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Settings</Text>
        <TouchableOpacity
          onPress={saveSettings}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* School Information */}
        {renderSection(
          'School Information',
          <>
            {renderTextInput('School Name', 'schoolName', 'Enter school name')}
            {renderTextInput('School Address', 'schoolAddress', 'Enter school address')}
            {renderTextInput('School Phone', 'schoolPhone', 'Enter phone number', 'phone-pad')}
            {renderTextInput('School Email', 'schoolEmail', 'Enter email address', 'email-address')}
            {renderTextInput("Principal's Name", 'principalName', "Enter principal's name")}
          </>,
        )}

        {/* Session Timings */}
        {renderSection(
          'Session Timings',
          <>
            {renderTimeInput('Session Start Time', 'sessionStartTime')}
            {renderTimeInput('Session End Time', 'sessionEndTime')}
          </>,
        )}

        {/* Attendance Settings */}
        {renderSection(
          'Attendance Settings',
          <>
            {renderTimeInput('Auto Mark Absent After', 'autoMarkAbsentAfter')}
            {renderTextInput(
              'Late Threshold (Minutes)',
              'lateThresholdMinutes',
              'Enter minutes',
              'numeric',
            )}
            {renderSwitch('Enable Notifications', 'notificationEnabled')}
            {renderTimeInput('Daily Summary Time', 'dailySummaryTime')}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Weekly Summary Day (1=Monday, 7=Sunday)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.borderColor,
                    color: theme.text,
                  },
                ]}
                value={settings.weeklySummaryDay?.toString() || ''}
                onChangeText={(text) =>
                  setSettings(prev => ({ ...prev, weeklySummaryDay: text }))
                }
                placeholder="1-7"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
              />
            </View>
          </>,
        )}

        {/* Quick Actions */}
        {renderSection(
          'Quick Actions',
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('ViewReports')}
            >
              <Text style={styles.quickActionText}>View Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#3742fa' }]}
              onPress={() => navigation.navigate('SendNotifications')}
            >
              <Text style={styles.quickActionText}>Send Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#2ed573' }]}
              onPress={() => navigation.navigate('ManageTeachers')}
            >
              <Text style={styles.quickActionText}>Manage Teachers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#ffa502' }]}
              onPress={() => navigation.navigate('ManageStudents')}
            >
              <Text style={styles.quickActionText}>Manage Students</Text>
            </TouchableOpacity>
          </View>,
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  saveButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  noAccessText: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    borderRadius: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    flex: 1,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SettingsScreen;