import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { useComunicazioni } from '../context/ComunicazioniContext';
import { usersAPI } from '../services/api';
import Card from '../components/Card';

const TIPI_COMUNICAZIONE = [
  { value: 'Comunicazione', label: 'Comunicazione', icon: 'megaphone-outline' },
  { value: 'Documento', label: 'Documento', icon: 'document-text-outline' },
  { value: 'Circolare', label: 'Circolare', icon: 'newspaper-outline' },
  { value: 'Avviso', label: 'Avviso', icon: 'warning-outline' },
  { value: 'Procedura', label: 'Procedura', icon: 'list-outline' },
];

const PRIORITA_OPTIONS = [
  { value: 'alta', label: 'Alta', color: '#EF4444' },
  { value: 'normale', label: 'Normale', color: '#3B82F6' },
  { value: 'bassa', label: 'Bassa', color: '#6B7280' },
];

const RUOLI_OPTIONS = [
  { value: 'dipendente', label: 'Dipendenti' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'receptionist', label: 'Receptionist' },
];

const NuovaComunicazioneScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { creaComunicazione } = useComunicazioni();

  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [tipo, setTipo] = useState('Comunicazione');
  const [priorita, setPriorita] = useState('normale');
  const [richiediConferma, setRichiediConferma] = useState(false);
  const [file, setFile] = useState(null);
  
  // Destinatari
  const [destinatariTutti, setDestinatariTutti] = useState(true);
  const [ruoliSelezionati, setRuoliSelezionati] = useState([]);
  const [repartiDisponibili, setRepartiDisponibili] = useState([]);
  const [repartiSelezionati, setRepartiSelezionati] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingReparti, setLoadingReparti] = useState(true);

  // Carica reparti disponibili
  useEffect(() => {
    const loadReparti = async () => {
      try {
        const result = await usersAPI.getAllUsers({ attivo: true });
        if (result.success) {
          const reparti = [...new Set(result.data
            .filter(u => u.reparto)
            .map(u => u.reparto)
          )];
          setRepartiDisponibili(reparti);
        }
      } catch (error) {
        console.error('Errore caricamento reparti:', error);
      } finally {
        setLoadingReparti(false);
      }
    };
    loadReparti();
  }, []);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Verifica dimensione (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (asset.size > maxSize) {
          Alert.alert('Errore', 'Il file è troppo grande. Dimensione massima: 10MB');
          return;
        }
        
        setFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType || 'application/octet-stream',
        });
      }
    } catch (error) {
      console.error('Errore selezione file:', error);
      Alert.alert('Errore', 'Impossibile selezionare il file');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const toggleRuolo = (ruolo) => {
    setRuoliSelezionati(prev => 
      prev.includes(ruolo)
        ? prev.filter(r => r !== ruolo)
        : [...prev, ruolo]
    );
  };

  const toggleReparto = (reparto) => {
    setRepartiSelezionati(prev =>
      prev.includes(reparto)
        ? prev.filter(r => r !== reparto)
        : [...prev, reparto]
    );
  };

  const handleSubmit = async () => {
    if (!titolo.trim()) {
      Alert.alert('Errore', 'Inserisci un titolo per la comunicazione');
      return;
    }

    setLoading(true);

    try {
      const comunicazioneData = {
        titolo: titolo.trim(),
        descrizione: descrizione.trim() || null,
        tipo,
        priorita,
        richiede_conferma: richiediConferma,
        file: file || null,
        destinatari_ruoli: destinatariTutti ? null : (ruoliSelezionati.length > 0 ? ruoliSelezionati : null),
        destinatari_reparti: destinatariTutti ? null : (repartiSelezionati.length > 0 ? repartiSelezionati : null),
        pubblicato: true,
      };

      const result = await creaComunicazione(comunicazioneData);

      if (result.success) {
        Alert.alert('Successo', 'Comunicazione pubblicata con successo', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Errore', result.error || 'Errore durante la pubblicazione');
      }
    } catch (error) {
      Alert.alert('Errore', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      {/* Header */}
      <LinearGradient
        colors={theme.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuova Comunicazione</Text>
          <View style={{ width: 28 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Titolo */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <Text style={[styles.label, { color: theme.text }]}>Titolo *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="Inserisci il titolo..."
            placeholderTextColor={theme.textTertiary}
            value={titolo}
            onChangeText={setTitolo}
            maxLength={255}
          />
        </Animated.View>

        {/* Descrizione */}
        <Animated.View entering={FadeInUp.delay(150)}>
          <Text style={[styles.label, { color: theme.text }]}>Descrizione</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="Inserisci una descrizione dettagliata..."
            placeholderTextColor={theme.textTertiary}
            value={descrizione}
            onChangeText={setDescrizione}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Animated.View>

        {/* Tipo */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <Text style={[styles.label, { color: theme.text }]}>Tipo</Text>
          <View style={styles.tipoContainer}>
            {TIPI_COMUNICAZIONE.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.tipoChip,
                  { backgroundColor: tipo === t.value ? theme.primary : theme.card, borderColor: theme.border }
                ]}
                onPress={() => setTipo(t.value)}
              >
                <Ionicons
                  name={t.icon}
                  size={18}
                  color={tipo === t.value ? '#FFFFFF' : theme.textSecondary}
                />
                <Text style={[
                  styles.tipoText,
                  { color: tipo === t.value ? '#FFFFFF' : theme.text }
                ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Priorità */}
        <Animated.View entering={FadeInUp.delay(250)}>
          <Text style={[styles.label, { color: theme.text }]}>Priorità</Text>
          <View style={styles.prioritaContainer}>
            {PRIORITA_OPTIONS.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.prioritaChip,
                  { 
                    backgroundColor: priorita === p.value ? p.color : theme.card,
                    borderColor: p.color,
                  }
                ]}
                onPress={() => setPriorita(p.value)}
              >
                <Text style={[
                  styles.prioritaText,
                  { color: priorita === p.value ? '#FFFFFF' : p.color }
                ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* File Allegato */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <Text style={[styles.label, { color: theme.text }]}>Allegato</Text>
          {file ? (
            <Card style={styles.fileCard}>
              <View style={styles.fileInfo}>
                <Ionicons name="document" size={24} color={theme.primary} />
                <View style={styles.fileDetails}>
                  <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                    {formatFileSize(file.size)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveFile}>
                <Ionicons name="close-circle" size={24} color={theme.error} />
              </TouchableOpacity>
            </Card>
          ) : (
            <TouchableOpacity
              style={[styles.uploadButton, { borderColor: theme.primary, backgroundColor: theme.card }]}
              onPress={handlePickFile}
            >
              <Ionicons name="cloud-upload-outline" size={32} color={theme.primary} />
              <Text style={[styles.uploadText, { color: theme.primary }]}>
                Tocca per allegare un file
              </Text>
              <Text style={[styles.uploadHint, { color: theme.textTertiary }]}>
                PDF, Word, Excel, Immagini, CSV (max 10MB)
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Conferma Lettura */}
        <Animated.View entering={FadeInUp.delay(350)}>
          <Card style={styles.switchCard}>
            <View style={styles.switchContent}>
              <View style={styles.switchInfo}>
                <Ionicons name="checkmark-circle-outline" size={24} color={theme.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.switchLabel, { color: theme.text }]}>
                    Richiedi conferma di lettura
                  </Text>
                  <Text style={[styles.switchHint, { color: theme.textSecondary }]}>
                    Traccia chi ha visualizzato questa comunicazione
                  </Text>
                </View>
              </View>
              <Switch
                value={richiediConferma}
                onValueChange={setRichiediConferma}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={richiediConferma ? theme.primary : '#f4f3f4'}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Destinatari */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Destinatari</Text>
          
          <Card style={styles.switchCard}>
            <View style={styles.switchContent}>
              <View style={styles.switchInfo}>
                <Ionicons name="people-outline" size={24} color={theme.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.switchLabel, { color: theme.text }]}>
                    Invia a tutti gli utenti
                  </Text>
                </View>
              </View>
              <Switch
                value={destinatariTutti}
                onValueChange={setDestinatariTutti}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={destinatariTutti ? theme.primary : '#f4f3f4'}
              />
            </View>
          </Card>

          {!destinatariTutti && (
            <>
              {/* Filtro per Ruolo */}
              <Text style={[styles.subLabel, { color: theme.textSecondary }]}>Per Ruolo</Text>
              <View style={styles.chipContainer}>
                {RUOLI_OPTIONS.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[
                      styles.selectChip,
                      { 
                        backgroundColor: ruoliSelezionati.includes(r.value) ? theme.primary : theme.card,
                        borderColor: theme.border,
                      }
                    ]}
                    onPress={() => toggleRuolo(r.value)}
                  >
                    <Text style={[
                      styles.selectChipText,
                      { color: ruoliSelezionati.includes(r.value) ? '#FFFFFF' : theme.text }
                    ]}>
                      {r.label}
                    </Text>
                    {ruoliSelezionati.includes(r.value) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filtro per Reparto */}
              {repartiDisponibili.length > 0 && (
                <>
                  <Text style={[styles.subLabel, { color: theme.textSecondary }]}>Per Reparto</Text>
                  <View style={styles.chipContainer}>
                    {loadingReparti ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      repartiDisponibili.map((reparto) => (
                        <TouchableOpacity
                          key={reparto}
                          style={[
                            styles.selectChip,
                            { 
                              backgroundColor: repartiSelezionati.includes(reparto) ? theme.primary : theme.card,
                              borderColor: theme.border,
                            }
                          ]}
                          onPress={() => toggleReparto(reparto)}
                        >
                          <Text style={[
                            styles.selectChipText,
                            { color: repartiSelezionati.includes(reparto) ? '#FFFFFF' : theme.text }
                          ]}>
                            {reparto}
                          </Text>
                          {repartiSelezionati.includes(reparto) && (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </>
              )}

              {ruoliSelezionati.length === 0 && repartiSelezionati.length === 0 && (
                <Text style={[styles.warningText, { color: theme.warning }]}>
                  ⚠️ Seleziona almeno un ruolo o un reparto, oppure attiva "Invia a tutti"
                </Text>
              )}
            </>
          )}
        </Animated.View>

        {/* Bottone Pubblica */}
        <Animated.View entering={FadeInUp.delay(450)}>
          <TouchableOpacity
            style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={theme.gradients.primary}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={24} color="#FFFFFF" />
                  <Text style={styles.submitText}>Pubblica Comunicazione</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 16,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  tipoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tipoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  prioritaContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  prioritaChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  prioritaText: {
    fontSize: 14,
    fontWeight: '700',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 12,
    marginTop: 4,
  },
  switchCard: {
    padding: 16,
    marginTop: 8,
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  switchHint: {
    fontSize: 12,
    marginTop: 2,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});

export default NuovaComunicazioneScreen;

