import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, User, Satellite, Info } from 'lucide-react-native';
import { useAuth, TEST_USERS } from '@/context/AuthContext';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTestCredentials, setShowTestCredentials] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      let success = false;

      if (isLogin) {
        success = await login(email.trim(), password);
        if (success) {
          router.replace('/(tabs)');
        } else {
          Alert.alert('Login Failed', 'Invalid email or password');
        }
      } else {
        success = await signup(email.trim(), password, name.trim());
        if (success) {
          router.replace('/(tabs)');
        } else {
          Alert.alert('Signup Failed', 'User already exists or invalid data');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = (userIndex: number) => {
    const user = TEST_USERS[userIndex];
    setEmail(user.email);
    setPassword(user.password);
    setName(user.name);
    setShowTestCredentials(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // Clear form when switching modes
    setEmail('');
    setPassword('');
    setName('');
    setShowPassword(false);
  };

  return (
    <LinearGradient
      colors={['#0B1426', '#1A0B2E', '#2D1B4E']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <LinearGradient
                colors={['#7C3AED', '#3B82F6']}
                style={styles.logo}
              >
                <Satellite size={40} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.appName}>VayuDrishti</Text>
              <Text style={styles.subtitle}>Swasth Jeevan ki Shrishti!</Text>
            </View>

            {/* Auth Form */}
            <View style={styles.formContainer}>
              <LinearGradient
                colors={['rgba(124, 58, 237, 0.1)', 'rgba(59, 130, 246, 0.05)']}
                style={styles.formCard}
              >
                <Text style={styles.formTitle}>
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {isLogin 
                    ? 'Sign in to VayuDrishti for clean air insights' 
                    : 'Join VayuDrishti for healthier living'
                  }
                </Text>

                {/* Name Field (Signup only) */}
                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIcon}>
                      <User size={20} color="#7C3AED" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#64748B"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                {/* Email Field */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Mail size={20} color="#7C3AED" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#64748B"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password Field */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Lock size={20} color="#7C3AED" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#64748B" />
                    ) : (
                      <Eye size={20} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Auth Button */}
                <TouchableOpacity
                  style={styles.authButton}
                  onPress={handleAuth}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#7C3AED', '#3B82F6']}
                    style={styles.authButtonGradient}
                  >
                    <Text style={styles.authButtonText}>
                      {isLoading 
                        ? 'Please wait...' 
                        : isLogin 
                          ? 'Sign In' 
                          : 'Create Account'
                      }
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Test Credentials Button */}
                {isLogin && (
                  <TouchableOpacity
                    style={styles.testCredentialsButton}
                    onPress={() => setShowTestCredentials(!showTestCredentials)}
                  >
                    <Info size={16} color="#7C3AED" />
                    <Text style={styles.testCredentialsText}>
                      Show Test Credentials
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Test Credentials List */}
                {showTestCredentials && (
                  <View style={styles.testCredentialsList}>
                    <Text style={styles.testCredentialsTitle}>Test Accounts:</Text>
                    {TEST_USERS.map((user, index) => (
                      <TouchableOpacity
                        key={user.id}
                        style={styles.testCredentialItem}
                        onPress={() => fillTestCredentials(index)}
                      >
                        <View>
                          <Text style={styles.testCredentialEmail}>{user.email}</Text>
                          <Text style={styles.testCredentialRole}>{user.role} • {user.password}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Toggle Mode */}
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleText}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                  </Text>
                  <TouchableOpacity onPress={toggleMode}>
                    <Text style={styles.toggleLink}>
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to VayuDrishti's Terms of Service and Privacy Policy
              </Text>
              <Text style={styles.poweredBy}>Powered by ISRO Satellite Technology</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    minHeight: height,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 30,
  },
  formCard: {
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  inputIcon: {
    padding: 15,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 15,
    paddingRight: 15,
  },
  eyeIcon: {
    padding: 15,
  },
  authButton: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  authButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testCredentialsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  testCredentialsText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '500',
  },
  testCredentialsList: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  testCredentialsTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  testCredentialItem: {
    padding: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  testCredentialEmail: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  testCredentialRole: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  toggleText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  toggleLink: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  poweredBy: {
    color: '#475569',
    fontSize: 10,
    fontStyle: 'italic',
  },
});
