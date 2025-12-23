import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { validateEmail, validatePassword } from '../utils/validation';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();

  const handleLogin = async () => {
    // Validazione
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    if (!emailValidation.isValid || !passwordValidation.isValid) {
      setErrors({
        email: emailValidation.error,
        password: passwordValidation.error,
      });
      return;
    }
    
    setErrors({});
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Errore', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Timbrio</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Sistema di Gestione Presenze
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors({ ...errors, email: null });
            }}
            error={errors.email}
            placeholder="mario.rossi@timbrio.com"
            keyboardType="email-address"
            autoComplete="email"
            leftIcon={<Text style={styles.icon}>📧</Text>}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors({ ...errors, password: null });
            }}
            error={errors.password}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            leftIcon={<Text style={styles.icon}>🔒</Text>}
          />

          <Button
            title="Accedi"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.hint, { color: theme.textTertiary }]}>
            Credenziali di test:
          </Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            admin@timbrio.com / Admin@123456
          </Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            dipendente@timbrio.com / dipendente123
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  button: {
    marginTop: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
  },
  hint: {
    fontSize: 12,
    marginVertical: 2,
  },
});

export default LoginScreen;

