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
      <LinearGradient
        colors={theme.gradient.primary}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🎓</Text>
            </View>
            <Text style={styles.appName}>SchoolSync</Text>
            <Text style={styles.tagline}>Smart Attendance Management</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>
                {isSignupMode ? 'Create Admin Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.formSubtitle}>
                {isSignupMode 
                  ? 'Set up your administrator account' 
                  : 'Sign in to continue to your dashboard'
                }
              </Text>

              <View style={styles.inputContainer}>
                {isSignupMode && (
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor={theme.textSecondary}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                )}
                
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                  />
                </View>
              </View>

              <SimpleButton
                title={isSignupMode ? 'Create Account' : 'Sign In'}
                icon={isSignupMode ? '🔐' : '👤'}
                onPress={isSignupMode ? handleSignup : handleLogin}
                loading={loading}
                variant="primary"
                size="large"
                style={styles.actionButton}
              />

              <TouchableOpacity
                style={styles.switchModeButton}
                onPress={() => {
                  setIsSignupMode(!isSignupMode);
                  setName('');
                  setEmail('');
                  setPassword('');
                }}
              >
                <Text style={styles.switchModeText}>
                  {isSignupMode 
                    ? 'Already have an account? Sign In' 
                    : 'Need admin access? Create Account'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSignupMode 
                ? '⚠️ Only authorized personnel should create admin accounts'
                : ''
              }
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
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 60,
    flex: 0.4,
    justifyContent: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoIcon: {
    fontSize: 50,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '400',
  },
  formSection: {
    flex: 0.5,
  },
  formContainer: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    fontSize: 16,
    color: theme.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButton: {
    marginBottom: 20,
  },
  switchModeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.primary,
    marginTop: 8,
  },
  switchModeText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flex: 0.1,
    justifyContent: 'flex-end',
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});

export default LoginScreen;