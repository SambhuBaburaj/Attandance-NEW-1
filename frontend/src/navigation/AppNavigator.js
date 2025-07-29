import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import AdminDashboard from '../screens/AdminDashboard';
import TeacherDashboard from '../screens/TeacherDashboard';
import ParentDashboard from '../screens/ParentDashboard';
import LoadingScreen from '../screens/LoadingScreen';
import SystemSettings from '../screens/SystemSettings';
import ManageClasses from '../screens/ManageClasses';
import ManageStudents from '../screens/ManageStudents';
import TakeAttendance from '../screens/TakeAttendance';
import AttendanceHistory from '../screens/AttendanceHistory';
import ViewChildren from '../screens/ViewChildren';
import SendNotifications from '../screens/SendNotifications';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading, getUserRole } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const getDashboardScreen = () => {
    const role = getUserRole();
    switch (role) {
      case 'ADMIN':
        return 'AdminDashboard';
      case 'TEACHER':
        return 'TeacherDashboard';
      case 'PARENT':
        return 'ParentDashboard';
      default:
        return 'Login';
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={isAuthenticated ? getDashboardScreen() : 'Login'}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="TeacherDashboard" component={TeacherDashboard} />
        <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
        <Stack.Screen name="SystemSettings" component={SystemSettings} />
        <Stack.Screen name="ManageClasses" component={ManageClasses} />
        <Stack.Screen name="ManageStudents" component={ManageStudents} />
        <Stack.Screen name="TakeAttendance" component={TakeAttendance} />
        <Stack.Screen name="AttendanceHistory" component={AttendanceHistory} />
        <Stack.Screen name="ViewChildren" component={ViewChildren} />
        <Stack.Screen name="SendNotifications" component={SendNotifications} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;