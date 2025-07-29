import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parentService } from '../services/parentService';

const ParentDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const [children, setChildren] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [childrenData, summaryData, todayData] = await Promise.all([
        parentService.getMyChildren(),
        parentService.getAttendanceSummary(),
        parentService.getChildTodayAttendance()
      ]);

      setChildren(childrenData);
      setAttendanceSummary(summaryData);
      setTodayAttendance(todayData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    try {
      await parentService.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to change password');
    }
  };

  const handleMenuPress = (item) => {
    if (item.action) {
      item.action();
    } else {
      navigation.navigate(item.screen);
    }
  };

  const menuItems = [
    { title: 'View Children', icon: '👶', screen: 'ViewChildren' },
    { title: 'Attendance History', icon: '📅', screen: 'AttendanceHistory' },
    { title: 'Monthly Reports', icon: '📊', screen: 'MonthlyReports' },
    { title: 'Change Password', icon: '🔐', action: () => setShowPasswordModal(true) },
    { title: 'Contact Teacher', icon: '📞', screen: 'ContactTeacher' },
    { title: 'School Notifications', icon: '📢', screen: 'Notifications' },
    { title: 'System Settings', icon: '⚙️', screen: 'SystemSettings' },
  ];

  const styles = getStyles(theme);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: '#FF9800' }]}>
        <Text style={[styles.title, { color: theme.surface }]}>Parent Dashboard</Text>
        <Text style={[styles.welcome, { color: theme.surface }]}>Welcome, {user?.name}</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('SystemSettings')}>
          <Text style={[styles.settingsText, { color: theme.surface }]}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.childrenContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Children</Text>
        {loading ? (
          <View style={[styles.childCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.childName, { color: theme.text }]}>Loading...</Text>
          </View>
        ) : children.length === 0 ? (
          <View style={[styles.childCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.childName, { color: theme.text }]}>No children registered</Text>
            <Text style={[styles.childInfo, { color: theme.textSecondary }]}>Contact admin to add your children</Text>
          </View>
        ) : (
          children.map((child, index) => (
            <View key={index} style={[styles.childCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.childName, { color: theme.text }]}>{child.name}</Text>
              <Text style={[styles.childInfo, { color: theme.textSecondary }]}>
                Roll No: {child.rollNumber} • Class: {child.class?.name}
              </Text>
              <Text style={[styles.childInfo, { color: theme.textSecondary }]}>
                Teacher: {child.class?.teacher?.user?.name}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {loading ? '...' : attendanceSummary.totalChildren || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Children</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {loading ? '...' : `${attendanceSummary.overallAttendance || 0}%`}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Overall Attendance</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {loading ? '...' : todayAttendance.filter(a => a.status === 'PRESENT').length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Present Today</Text>
        </View>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Status</Text>
        {loading ? (
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>Loading...</Text>
          </View>
        ) : todayAttendance.length === 0 ? (
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>No Children Registered</Text>
            <Text style={[styles.summaryText, { color: theme.textSecondary }]}>Contact admin to add your children</Text>
          </View>
        ) : (
          todayAttendance.map((child, index) => (
            <View key={index} style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>{child.studentName}</Text>
              <Text style={[styles.summaryText, { 
                color: child.status === 'PRESENT' ? '#4CAF50' : 
                       child.status === 'ABSENT' ? '#F44336' : theme.textSecondary 
              }]}>
                {child.status === 'NOT_MARKED' ? 'Attendance not marked yet' : 
                 child.status === 'PRESENT' ? '✅ Present' : '❌ Absent'}
              </Text>
              {child.remarks && (
                <Text style={[styles.summaryText, { color: theme.textSecondary, fontSize: 12, marginTop: 5 }]}>
                  Note: {child.remarks}
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.menuContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>All Features</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => handleMenuPress(item)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={[styles.menuText, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.arrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Change Password</Text>
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Current Password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="New Password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Confirm New Password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveButtonText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  welcome: {
    fontSize: 16,
    opacity: 0.9,
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  settingsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  childrenContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  childCard: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  childInfo: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    justifyContent: 'space-between',
  },
  statCard: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  quickActionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  menuContainer: {
    padding: 20,
    paddingTop: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  arrow: {
    fontSize: 20,
    color: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#FF9800',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default ParentDashboard;