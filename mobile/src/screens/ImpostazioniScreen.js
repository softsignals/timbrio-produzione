import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { timbratureAPI } from '../services/api';

const ImpostazioniScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [loadingExport, setLoadingExport] = useState(null);

  // Debug: log per verificare il ruolo utente
  React.useEffect(() => {
    console.log('ImpostazioniScreen - User ruolo:', user?.ruolo);
    console.log('ImpostazioniScreen - User completo:', user);
  }, [user]);

  const handleClearData = () => {
    Alert.alert(
      'Cancella Dati',
      'Sei sicuro di voler cancellare tutti i dati locali? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Cancella',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['@timbrature', '@currentTimbrata']);
              Alert.alert('Successo', 'Dati cancellati con successo');
            } catch (error) {
              Alert.alert('Errore', 'Impossibile cancellare i dati');
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Vuoi uscire dall\'applicazione?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const handleExport = async (format) => {
    if (loadingExport) return;

    setLoadingExport(format);
    try {
      const data = await timbratureAPI.exportTimbrature(format);
      const today = new Date().toISOString().split('T')[0];
      const filename = `timbrature_${today}.${format}`;

      await Share.share({
        message: data,
        title: filename,
      });

      Alert.alert('Successo', `Esportazione ${format.toUpperCase()} completata con successo`);
    } catch (error) {
      console.error('Errore esportazione:', error);
      Alert.alert(
        'Errore',
        `Impossibile esportare i dati: ${error.message || 'Errore sconosciuto'}`
      );
    } finally {
      setLoadingExport(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Impostazioni</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profilo Utente */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Profilo
          </Text>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.nome.charAt(0)}{user.cognome.charAt(0)}
              </Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: theme.text }]}>
                {user.nome} {user.cognome}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>
                {user.email}
              </Text>
              <Text style={[styles.profileBadge, { color: theme.textTertiary }]}>
                {user.badge} • {user.reparto}
              </Text>
            </View>
          </View>
        </View>

        {/* Aspetto */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Aspetto
          </Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                🌙 Modalità Scura
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Attiva il tema scuro per ridurre l'affaticamento degli occhi
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={isDark ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Orario di Lavoro */}
        {user.orarioTurno && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Orario di Lavoro
            </Text>
            <View style={styles.scheduleRow}>
              <Text style={[styles.scheduleLabel, { color: theme.textSecondary }]}>
                Entrata:
              </Text>
              <Text style={[styles.scheduleValue, { color: theme.text }]}>
                {user.orarioTurno.entrata}
              </Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={[styles.scheduleLabel, { color: theme.textSecondary }]}>
                Uscita:
              </Text>
              <Text style={[styles.scheduleValue, { color: theme.text }]}>
                {user.orarioTurno.uscita}
              </Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={[styles.scheduleLabel, { color: theme.textSecondary }]}>
                Pausa Pranzo:
              </Text>
              <Text style={[styles.scheduleValue, { color: theme.text }]}>
                {user.orarioTurno.pausaPranzo}
              </Text>
            </View>
          </View>
        )}

        {/* Informazioni App */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Informazioni
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Versione App
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              1.0.0
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Ruolo
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {user.ruolo}
            </Text>
          </View>
        </View>

        {/* Esportazione Dati (solo Admin/Manager) */}
        {user && (user.ruolo === 'admin' || user.ruolo === 'manager') && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Esportazione Dati
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
              Esporta tutte le timbrature in formato TXT o CSV. I dati sono ordinati per cognome in ordine alfabetico.
            </Text>
            
            <TouchableOpacity
              style={[styles.exportButton, { borderColor: theme.primary }]}
              onPress={() => handleExport('txt')}
              disabled={loadingExport !== null}
            >
              <View style={styles.exportButtonContent}>
                {loadingExport === 'txt' ? (
                  <ActivityIndicator size="small" color={theme.primary} style={styles.exportLoader} />
                ) : (
                  <Text style={styles.exportIcon}>📄</Text>
                )}
                <View style={styles.exportTextContainer}>
                  <Text style={[styles.exportButtonText, { color: theme.text }]}>
                    Esporta in TXT
                  </Text>
                  <Text style={[styles.exportButtonSubtext, { color: theme.textSecondary }]}>
                    Formato di testo con separatori tab
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportButton, styles.exportButtonLast, { borderColor: theme.success || '#10B981' }]}
              onPress={() => handleExport('csv')}
              disabled={loadingExport !== null}
            >
              <View style={styles.exportButtonContent}>
                {loadingExport === 'csv' ? (
                  <ActivityIndicator size="small" color={theme.success || '#10B981'} style={styles.exportLoader} />
                ) : (
                  <Text style={styles.exportIcon}>📊</Text>
                )}
                <View style={styles.exportTextContainer}>
                  <Text style={[styles.exportButtonText, { color: theme.text }]}>
                    Esporta in CSV
                  </Text>
                  <Text style={[styles.exportButtonSubtext, { color: theme.textSecondary }]}>
                    Formato CSV compatibile con Excel
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Azioni */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Azioni
          </Text>
          
          {(user.ruolo === 'receptionist' || user.ruolo === 'admin') && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('QRDisplay')}
            >
              <Text style={[styles.actionText, { color: theme.primary }]}>
                📱 Schermata QR Code
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearData}
          >
            <Text style={[styles.actionText, { color: theme.warning }]}>
              🗑️ Cancella Dati Locali
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonLast]}
            onPress={handleLogout}
          >
            <Text style={[styles.actionText, { color: theme.error }]}>
              🚪 Esci dall'Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            Timbrio © 2025
          </Text>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            Sistema di Gestione Presenze
          </Text>
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
  backText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  profileBadge: {
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  scheduleLabel: {
    fontSize: 16,
  },
  scheduleValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  actionButtonLast: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerText: {
    fontSize: 12,
    marginVertical: 2,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  exportButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderStyle: 'dashed',
  },
  exportButtonLast: {
    marginBottom: 0,
  },
  exportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  exportLoader: {
    marginRight: 16,
  },
  exportTextContainer: {
    flex: 1,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exportButtonSubtext: {
    fontSize: 12,
  },
});

export default ImpostazioniScreen;

