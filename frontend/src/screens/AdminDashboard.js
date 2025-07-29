import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const AdminDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { title: 'Take Attendance', icon: '✅', screen: 'TakeAttendance' },
    { title: 'Send Notifications', icon: '📢', screen: 'SendNotifications' },
    { title: 'Manage Schools', icon: '🏫', screen: 'ManageSchools' },
    { title: 'Manage Teachers', icon: '👨‍🏫', screen: 'ManageTeachers' },
    { title: 'Manage Classes', icon: '📚', screen: 'ManageClasses' },
    { title: 'Manage Students', icon: '👨‍🎓', screen: 'ManageStudents' },
    { title: 'View Reports', icon: '📊', screen: 'ViewReports' },
    { title: 'System Settings', icon: '⚙️', screen: 'SystemSettings' },
  ];

  const styles = getStyles(theme);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.title, { color: theme.surface }]}>Admin Dashboard</Text>
        <Text style={[styles.welcome, { color: theme.surface }]}>Welcome, {user?.name}</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('SystemSettings')}>
          <Text style={[styles.settingsText, { color: theme.surface }]}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>0</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Schools</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>0</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Teachers</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>0</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Students</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={[styles.menuText, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.arrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  menuContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
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
  },
  arrow: {
    fontSize: 20,
  },
});

export default AdminDashboard;