import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../screens/LoadingScreen';

const ProtectedRoute = ({ children, allowedRoles = [], fallback = null }) => {
  const { isAuthenticated, loading, getUserRole } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.text}>Please log in to access this page</Text>
      </View>
    );
  }

  const userRole = getUserRole();
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.text}>Access denied. You don't have permission to view this page.</Text>
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ProtectedRoute;