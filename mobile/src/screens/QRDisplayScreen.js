import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { timbratureAPI } from '../services/api';
import { getTokenRefreshInterval, generateQRData, getWelcomeMessage, getGreetingMessage } from '../utils/qrUtils';
import { formatTime } from '../utils/dateUtils';
import Card from '../components/Card';

const { width } = Dimensions.get('window');

const QRDisplayScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [qrToken, setQrToken] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Verifica permessi
  if (user.ruolo !== 'receptionist' && user.ruolo !== 'admin') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Schermata QR Code</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.noAccessContainer}>
          <Ionicons name="lock-closed" size={64} color={theme.textSecondary} />
          <Text style={[styles.noAccessText, { color: theme.text }]}>
            Non hai i permessi per accedere a questa sezione
          </Text>
          <Text style={[styles.noAccessSubtext, { color: theme.textSecondary }]}>
            Solo receptionist e admin possono visualizzare la schermata QR code
          </Text>
        </View>
      </View>
    );
  }

  useEffect(() => {
    loadQRToken();
    loadRecentEntries();
    
    // Refresh automatico del token
    const refreshInterval = getTokenRefreshInterval();
    const tokenInterval = setInterval(() => {
      loadQRToken();
    }, refreshInterval);

    // Refresh lista entrate ogni 30 secondi
    const entriesInterval = setInterval(() => {
      loadRecentEntries();
    }, 30000);

    return () => {
      clearInterval(tokenInterval);
      clearInterval(entriesInterval);
    };
  }, []);

  const loadQRToken = async () => {
    try {
      const response = await timbratureAPI.getQRToken();
      if (response.success && response.data) {
        setQrToken(response.data.token);
        const data = generateQRData(response.data.token, response.data.timestamp);
        setQrData(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Errore caricamento token QR:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentEntries = async () => {
    try {
      const response = await timbratureAPI.getRecentEntries(10);
      if (response.success && response.data) {
        setRecentEntries(response.data);
      }
    } catch (error) {
      console.error('Errore caricamento entrate recenti:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadQRToken(), loadRecentEntries()]);
    setRefreshing(false);
  };

  const qrSize = width * 0.65;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      <LinearGradient
        colors={theme.gradients.primary}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Timbratura</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Messaggi Benvenuto */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>{getWelcomeMessage()}</Text>
          <Text style={styles.greetingText}>{getGreetingMessage()}</Text>
        </View>

        {/* QR Code Card */}
        <Card style={styles.qrCard}>
          {loading ? (
            <View style={styles.qrLoadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.qrLoadingText, { color: theme.textSecondary }]}>
                Caricamento QR Code...
              </Text>
            </View>
          ) : qrData ? (
            <View style={styles.qrContainer}>
              <QRCode
                value={qrData}
                size={qrSize}
                color={theme.primary}
                backgroundColor="transparent"
              />
              <Text style={[styles.qrInfo, { color: theme.textSecondary }]}>
                Scansiona questo codice per timbrare
              </Text>
              {lastUpdate && (
                <Text style={[styles.qrUpdateTime, { color: theme.textTertiary }]}>
                  Aggiornato alle {formatTime(lastUpdate.toTimeString())}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.qrErrorContainer}>
              <Ionicons name="alert-circle" size={48} color={theme.error} />
              <Text style={[styles.qrErrorText, { color: theme.text }]}>
                Errore nel caricamento del QR code
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                onPress={loadQRToken}
              >
                <Text style={styles.retryButtonText}>Riprova</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Ultimi Colleghi Entrati */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Ultimi Colleghi Entrati
            </Text>
          </View>

          {recentEntries.length > 0 ? (
            <Card style={styles.entriesCard}>
              {recentEntries.map((entry, index) => (
                <View
                  key={index}
                  style={[
                    styles.entryItem,
                    index < recentEntries.length - 1 && styles.entryItemBorder,
                  ]}
                >
                  <View style={styles.entryInfo}>
                    <Text style={[styles.entryName, { color: theme.text }]}>
                      {entry.nome} {entry.cognome}
                    </Text>
                    <Text style={[styles.entryBadge, { color: theme.textSecondary }]}>
                      Badge: {entry.badge}
                    </Text>
                  </View>
                  <View style={styles.entryTimeContainer}>
                    {entry.uscita ? (
                      <>
                        <View style={styles.timeRow}>
                          <Ionicons name="log-in" size={16} color={theme.success} />
                          <Text style={[styles.entryTime, { color: theme.success }]}>
                            {formatTime(entry.entrata)}
                          </Text>
                        </View>
                        <View style={styles.timeRow}>
                          <Ionicons name="log-out" size={16} color={theme.error} />
                          <Text style={[styles.entryTime, { color: theme.error }]}>
                            {formatTime(entry.uscita)}
                          </Text>
                        </View>
                        <View style={[styles.checkmark, { backgroundColor: theme.success }]}>
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.timeRow}>
                          <Ionicons name="log-in" size={16} color={theme.primary} />
                          <Text style={[styles.entryTime, { color: theme.primary }]}>
                            {formatTime(entry.entrata)}
                          </Text>
                        </View>
                        <View style={[styles.checkmark, { backgroundColor: theme.warning }]}>
                          <Ionicons name="time" size={16} color="#FFFFFF" />
                        </View>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </Card>
          ) : (
            <Card style={styles.emptyEntriesCard}>
              <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyEntriesText, { color: theme.textSecondary }]}>
                Nessuna entrata registrata oggi
              </Text>
            </Card>
          )}
        </View>
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
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  qrCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
    minHeight: 400,
    justifyContent: 'center',
  },
  qrLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 350,
  },
  qrLoadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  qrContainer: {
    alignItems: 'center',
    width: '100%',
  },
  qrInfo: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  qrUpdateTime: {
    marginTop: 8,
    fontSize: 12,
  },
  qrErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 350,
  },
  qrErrorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  entriesCard: {
    padding: 0,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  entryItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  entryBadge: {
    fontSize: 12,
  },
  entryTimeContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyEntriesCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEntriesText: {
    marginTop: 16,
    fontSize: 16,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noAccessText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  noAccessSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default QRDisplayScreen;

