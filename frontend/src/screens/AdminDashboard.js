import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SimpleButton from '../components/SimpleButton';

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

  const statsData = [
    { title: 'Total Teachers', value: '45', icon: '👨‍🏫', color: 'success' },
    { title: 'Total Students', value: '890', icon: '👨‍🎓', color: 'warning' },
    { title: 'Total Classes', value: '25', icon: '📚', color: 'primary' },
  ];

  const menuItems = [
    { 
      title: 'Take Attendance', 
      icon: '✅', 
      screen: 'TakeAttendance',
      description: 'Mark student attendance',
      color: 'success'
    },
    { 
      title: 'Attendance History', 
      icon: '📊', 
      screen: 'AdminAttendanceHistory',
      description: 'View attendance reports',
      color: 'primary'
    },
    { 
      title: 'Send Notifications', 
      icon: '📢', 
      screen: 'SendNotifications',
      description: 'Send alerts to parents',
      color: 'warning'
    },
    { 
      title: 'Manage Teachers', 
      icon: '👨‍🏫', 
      screen: 'ManageTeachers',
      description: 'Teacher profiles & assignments',
      color: 'success'
    },
    { 
      title: 'Manage Classes', 
      icon: '📚', 
      screen: 'ManageClasses',
      description: 'Create and organize classes',
      color: 'warning'
    },
    { 
      title: 'Manage Students', 
      icon: '👨‍🎓', 
      screen: 'ManageStudents',
      description: 'Student enrollment & info',
      color: 'primary'
    },
    { 
      title: 'View Reports', 
      icon: '📊', 
      screen: 'ViewReports',
      description: 'Analytics and insights',
      color: 'danger'
    },
    { 
      title: 'System Settings', 
      icon: '⚙️', 
      screen: 'SystemSettings',
      description: 'App configuration',
      color: 'primary'
    },
  ];

  const getMenuColor = (color) => {
    switch (color) {
      case 'primary': return theme.primary;
      case 'success': return theme.success;
      case 'warning': return theme.warning;
      case 'danger': return theme.danger;
      default: return theme.primary;
    }
  };

  const getStatColor = (color) => {
    switch (color) {
      case 'primary': return { bg: theme.primaryLight, text: theme.primary, iconBg: theme.primary };
      case 'success': return { bg: theme.successLight, text: theme.success, iconBg: theme.success };
      case 'warning': return { bg: theme.warningLight, text: theme.warning, iconBg: theme.warning };
      default: return { bg: theme.primaryLight, text: theme.primary, iconBg: theme.primary };
    }
  };

  const styles = getStyles(theme);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={theme.gradient.primary}
          style={styles.gradientHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Good Morning</Text>
                <Text style={styles.userName}>{user?.name}</Text>
              </View>
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => navigation.navigate('SystemSettings')}
              >
                <Text style={styles.profileIcon}>👤</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Let's manage your school efficiently</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {statsData.map((stat, index) => {
          const colors = getStatColor(stat.color);
          return (
            <View key={index} style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.iconBg }]}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{stat.title}</Text>
            </View>
          );
        })}
      </View>

      {/* Quick Actions Section */}
      <View style={styles.actionsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuCard, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIconContainer, { backgroundColor: getMenuColor(item.color) }]}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
                <Text style={[styles.menuTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.menuDescription, { color: theme.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <SimpleButton
          title="Logout"
          icon="🚪"
          variant="danger"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 20,
  },
  gradientHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '400',
    lineHeight: 22,
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...theme.elevation.medium,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '48%',
    marginBottom: 15,
    minHeight: 120,
    borderRadius: 16,
    padding: 20,
    ...theme.elevation.medium,
    borderWidth: 1,
    borderColor: theme.border,
  },
  menuItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    marginTop: 10,
  },
});

export default AdminDashboard;