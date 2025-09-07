import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SimpleButton from '../components/SimpleButton';

const LoginScreen = ({ navigation }) => {
  const { login, adminSignup } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  
  const { width, height } = Dimensions.get('window');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password);
      
      // Navigation will be handled automatically by AppNavigator based on role
      switch (response.user.role) {
        case 'ADMIN':
          navigation.replace('AdminDashboard');
          break;
        case 'TEACHER':
          navigation.replace('TeacherDashboard');
          break;
        case 'PARENT':
          navigation.replace('ParentDashboard');
          break;
        default:
          Alert.alert('Error', 'Invalid user role');
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await adminSignup(email, password, name);
      Alert.alert('Success', 'Admin account created successfully!', [
        { 
          text: 'Login Now', 
          onPress: () => {
            setIsSignupMode(false);
            setName('');
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a855f7']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#ffffff20', '#ffffff10']}
                style={styles.logoGradient}
              >
                <Text style={styles.logoIcon}>🎓</Text>
              </LinearGradient>
            </View>
            <Text style={styles.appName}>AttendanceApp</Text>
            <Text style={styles.tagline}>Smart School Management</Text>
          </View>

          {/* Card Container */}
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['#ffffff', '#fafafa']}
              style={styles.card}
            >
              {/* Form Header */}
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  {isSignupMode ? '👋 Create Account' : '🎉 Welcome Back'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {isSignupMode 
                    ? 'Setup your admin account to get started' 
                    : 'Sign in to access your dashboard'
                  }
                </Text>
              </View>

              {/* Input Fields */}
              <View style={styles.inputContainer}>
                {isSignupMode && (
                  <View style={styles.inputGroup}>
                    <View style={styles.inputIcon}>
                      <Text style={styles.iconText}>👤</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#9ca3af"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                )}
                
                <View style={styles.inputGroup}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>📧</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>🔐</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                  />
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.actionButton, loading && styles.buttonDisabled]}
                onPress={isSignupMode ? handleSignup : handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? ['#d1d5db', '#9ca3af'] : ['#6366f1', '#8b5cf6']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.buttonIcon}>
                        {isSignupMode ? '🚀' : '✨'}
                      </Text>
                      <Text style={styles.buttonText}>
                        {isSignupMode ? 'Create Account' : 'Sign In'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Switch Mode */}
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setIsSignupMode(!isSignupMode);
                  setName('');
                  setEmail('');
                  setPassword('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.switchText}>
                  {isSignupMode 
                    ? 'Already have an account? Sign In' 
                    : 'Need access? Create Account'
                  }
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSignupMode && '🔒 Admin accounts require authorization'}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  logoIcon: {
    fontSize: 60,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '300',
  },
  cardContainer: {
    flex: 1,
    marginBottom: 40,
  },
  card: {
    borderRadius: 28,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 15,
  },
  formHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  switchText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontWeight: '400',
  },
});

export default LoginScreen;