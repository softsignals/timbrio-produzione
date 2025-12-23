import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { timbratureAPI } from '../services/api';

const ProfiloScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  
  const [modalPassword, setModalPassword] = useState(false);
  const [vecchiaPassword, setVecchiaPassword] = useState('');
  const [nuovaPassword, setNuovaPassword] = useState('');
  const [confermaPassword, setConfermaPassword] = useState('');
  const [loadingExport, setLoadingExport] = useState(null);

  const handleCambiaPassword = () => {
    if (!vecchiaPassword || !nuovaPassword || !confermaPassword) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }

    if (nuovaPassword !== confermaPassword) {
      Alert.alert('Errore', 'Le password non coincidono');
      return;
    }

    if (nuovaPassword.length < 6) {
      Alert.alert('Errore', 'La password deve essere di almeno 6 caratteri');
      return;
    }

    // TODO: Implementare cambio password reale
    Alert.alert('✓ Successo', 'Password cambiata con successo!');
    setModalPassword(false);
    setVecchiaPassword('');
    setNuovaPassword('');
    setConfermaPassword('');
  };

  const handleLogout = () => {
    Alert.alert(
      'Conferma Logout',
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Esci', onPress: logout, style: 'destructive' }
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

  const InfoRow = ({ icon, label, value, iconColor, iconLib = 'Ionicons' }) => (
    <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
      <View style={styles.infoLeft}>
        {iconLib === 'MaterialCommunityIcons' ? (
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        ) : (
          <Ionicons name={icon} size={20} color={iconColor} />
        )}
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.infoValue, { color: theme.text }]}>
        {value}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      {/* Header con Gradiente - Layout Compatto */}
      <LinearGradient
        colors={theme.gradients.secondary}
        style={styles.header}
      >
        <View style={styles.headerContentCompact}>
          {/* Avatar a sinistra */}
          <Animated.View entering={FadeInUp.delay(100)}>
            <LinearGradient
              colors={theme.gradients.cosmic}
              style={styles.avatarCompact}
            >
              <Text style={styles.avatarTextCompact}>
                {user.nome.charAt(0)}{user.cognome.charAt(0)}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Info Utente a destra */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.userInfoCompact}>
            <Text style={styles.userNameCompact}>{user.nome} {user.cognome}</Text>
            <View style={styles.roleBadgeCompact}>
              <Ionicons name="briefcase" size={12} color="#FFFFFF" />
              <Text style={styles.roleTextCompact}>{user.ruolo}</Text>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Esportazione Dati (solo Admin/Manager) */}
        {user && (user.ruolo === 'admin' || user.ruolo === 'manager') && (
          <Animated.View entering={FadeInUp.delay(250)}>
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="download-outline" size={24} color={theme.success || '#10B981'} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Esportazione Dati
                </Text>
              </View>

              <Text style={[styles.exportDescription, { color: theme.textSecondary }]}>
                Esporta tutte le timbrature in formato TXT o CSV. I dati sono ordinati per cognome in ordine alfabetico.
              </Text>

              <TouchableOpacity
                style={[styles.exportButton, { borderColor: theme.primary }]}
                onPress={() => handleExport('txt')}
                disabled={loadingExport !== null}
              >
                <View style={styles.exportButtonContent}>
                  {loadingExport === 'txt' ? (
                    <ActivityIndicator size="small" color={theme.primary} />
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
                  <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportButton, styles.exportButtonLast, { borderColor: theme.success || '#10B981' }]}
                onPress={() => handleExport('csv')}
                disabled={loadingExport !== null}
              >
                <View style={styles.exportButtonContent}>
                  {loadingExport === 'csv' ? (
                    <ActivityIndicator size="small" color={theme.success || '#10B981'} />
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
                  <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                </View>
              </TouchableOpacity>
            </Card>
          </Animated.View>
        )}

        {/* Informazioni Personali */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Informazioni Personali
              </Text>
            </View>

            <InfoRow
              icon="person-outline"
              label="Nome Completo"
              value={`${user.nome} ${user.cognome}`}
              iconColor={theme.primary}
            />
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={user.email}
              iconColor={theme.info}
            />
            <InfoRow
              icon="call-outline"
              label="Telefono"
              value={user.telefono || 'Non specificato'}
              iconColor={theme.success}
            />
            <InfoRow
              icon="card-outline"
              label="Badge"
              value={user.badge}
              iconColor={theme.warning}
            />
          </Card>
        </Animated.View>

        {/* Informazioni Lavorative */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="business" size={24} color={theme.secondary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Informazioni Lavorative
              </Text>
            </View>

            <InfoRow
              icon="briefcase-outline"
              label="Ruolo"
              value={user.ruolo.charAt(0).toUpperCase() + user.ruolo.slice(1)}
              iconColor={theme.secondary}
            />
            <InfoRow
              icon="office"
              iconLib="MaterialCommunityIcons"
              label="Reparto"
              value={user.reparto || 'Non specificato'}
              iconColor={theme.accent}
            />
            <InfoRow
              icon="location-outline"
              label="Sede"
              value={user.sede || 'Non specificato'}
              iconColor={theme.error}
            />
          </Card>
        </Animated.View>

        {/* Impostazioni */}
        <Animated.View entering={FadeInUp.delay(500)}>
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={24} color={theme.warning} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Impostazioni
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.settingRow, { borderBottomColor: theme.border }]}
              onPress={toggleTheme}
            >
              <View style={styles.settingLeft}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={theme.warning} />
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  Tema Scuro
                </Text>
              </View>
              <View style={[
                styles.toggle,
                { backgroundColor: isDark ? theme.primary : theme.border }
              ]}>
                <View style={[
                  styles.toggleCircle,
                  { transform: [{ translateX: isDark ? 20 : 0 }] }
                ]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => setModalPassword(true)}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="lock-closed" size={20} color={theme.info} />
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  Modifica Password
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </Card>
        </Animated.View>

        {/* Pulsante Logout */}
        <Animated.View entering={FadeInUp.delay(600)}>
          <Button
            onPress={handleLogout}
            title="Esci dall'Account"
            variant="danger"
            style={styles.logoutButton}
            icon={<Ionicons name="log-out-outline" size={24} color="#FFFFFF" />}
          />
        </Animated.View>

        {/* Versione App */}
        <Animated.View entering={FadeInUp.delay(700)}>
          <Text style={[styles.versionText, { color: theme.textTertiary }]}>
            Timbrio v1.0.0
          </Text>
          <Text style={[styles.copyrightText, { color: theme.textTertiary }]}>
            © 2025 Tutti i diritti riservati
          </Text>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal Cambio Password */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalPassword}
        onRequestClose={() => setModalPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={FadeIn}
            style={[styles.modalContent, { backgroundColor: theme.card }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Modifica Password
              </Text>
              <TouchableOpacity onPress={() => setModalPassword(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Vecchia Password
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Inserisci vecchia password"
                  placeholderTextColor={theme.textTertiary}
                  value={vecchiaPassword}
                  onChangeText={setVecchiaPassword}
                  secureTextEntry
                />
              </View>

              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Nuova Password
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Inserisci nuova password"
                  placeholderTextColor={theme.textTertiary}
                  value={nuovaPassword}
                  onChangeText={setNuovaPassword}
                  secureTextEntry
                />
              </View>

              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Conferma Password
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Conferma nuova password"
                  placeholderTextColor={theme.textTertiary}
                  value={confermaPassword}
                  onChangeText={setConfermaPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.passwordHint}>
                <Ionicons name="information-circle" size={16} color={theme.info} />
                <Text style={[styles.hintText, { color: theme.textSecondary }]}>
                  La password deve essere di almeno 6 caratteri
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                onPress={() => setModalPassword(false)}
                title="Annulla"
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                gradient
                onPress={handleCambiaPassword}
                title="Salva"
                variant="gradient"
                style={styles.modalButton}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContentCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCompact: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextCompact: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfoCompact: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameCompact: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roleBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleTextCompact: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  headerContent: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  logoutButton: {
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  modalBody: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  passwordHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 13,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalButton: {
    flex: 1,
  },
  bottomSpacer: {
    height: 100,
  },
  exportDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
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
    fontSize: 28,
    marginRight: 12,
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

export default ProfiloScreen;

