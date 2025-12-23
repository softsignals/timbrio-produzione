import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';

const DipendenteDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { dipendenteId } = route.params;
  
  const [dipendente, setDipendente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisibile, setModalVisibile] = useState(false);
  const [tipoModal, setTipoModal] = useState(''); // 'ferie', 'documenti', 'turni'
  const [noteModal, setNoteModal] = useState('');

  // Dati di esempio per il dipendente
  const dipendenteEsempio = {
    id: dipendenteId,
    nome: 'Mario',
    cognome: 'Rossi',
    email: 'mario.rossi@azienda.com',
    badge: 'EMP001',
    ruolo: 'dipendente',
    reparto: 'Sviluppo',
    sede: 'Milano',
    telefono: '+39 123 456 7890',
    dataAssunzione: '2023-01-15',
    pagaOraria: 25.50,
    attivo: true,
    fotoProfilo: null,
    oreSettimanali: 40.0,
    ultimaTimbratura: '2025-01-15T17:30:00Z',
  };

  // Dati di esempio per timbrature
  const timbratureEsempio = [
    {
      id: '1',
      userId: dipendenteId,
      data: '2025-01-15',
      entrata: '09:00:00',
      uscita: '18:00:00',
      pausaInizio: '13:00:00',
      pausaFine: '14:00:00',
      oreTotali: 8.0,
      note: '',
      approvata: false,
      approvataDa: null,
      dataApprovazione: null,
    },
    {
      id: '2',
      userId: dipendenteId,
      data: '2025-01-14',
      entrata: '08:30:00',
      uscita: '17:30:00',
      pausaInizio: '12:30:00',
      pausaFine: '13:30:00',
      oreTotali: 8.0,
      location: {
        type: 'Point',
        coordinates: [9.1859, 45.4654]
      },
      note: '',
      approvata: true,
      approvataDa: user?.id,
      dataApprovazione: '2025-01-14T18:00:00Z',
    },
    {
      id: '3',
      userId: dipendenteId,
      data: '2025-01-13',
      entrata: '09:15:00',
      uscita: '17:45:00',
      pausaInizio: '13:00:00',
      pausaFine: '14:00:00',
      oreTotali: 7.5,
      location: {
        type: 'Point',
        coordinates: [9.1859, 45.4654]
      },
      note: 'Ritardo per traffico',
      approvata: false,
      approvataDa: null,
      dataApprovazione: null,
    },
  ];

  // Dati di esempio per richieste ferie
  const richiesteFerieEsempio = [
    {
      id: '1',
      userId: dipendenteId,
      tipo: 'ferie',
      dataInizio: '2025-02-10',
      dataFine: '2025-02-14',
      giorni: 5,
      motivazione: 'Vacanze invernali',
      stato: 'in_attesa',
      approvatoDa: null,
      dataRisposta: null,
      noteApprovazione: '',
      dataRichiesta: '2025-01-10T10:00:00Z',
    },
    {
      id: '2',
      userId: dipendenteId,
      tipo: 'permesso',
      dataInizio: '2025-01-20',
      dataFine: '2025-01-20',
      giorni: 1,
      motivazione: 'Visita medica',
      stato: 'approvata',
      approvatoDa: user?.id,
      dataRisposta: '2025-01-15T14:30:00Z',
      noteApprovazione: 'Approvato',
      dataRichiesta: '2025-01-15T09:00:00Z',
    },
  ];

  useEffect(() => {
    loadDipendente();
  }, [dipendenteId]);

  const loadDipendente = async () => {
    setLoading(true);
    // Simula caricamento dati
    setTimeout(() => {
      setDipendente(dipendenteEsempio);
      setLoading(false);
    }, 1000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDipendente();
    setRefreshing(false);
  };

  // Funzioni per gestire le azioni
  const apriModal = (tipo) => {
    setTipoModal(tipo);
    setModalVisibile(true);
  };

  const chiudiModal = () => {
    setModalVisibile(false);
    setTipoModal('');
    setNoteModal('');
  };

  const approvaTimbratura = (timbraturaId) => {
    Alert.alert(
      'Approva Timbratura',
      'Sei sicuro di voler approvare questa timbratura?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Approva', 
          onPress: () => {
            // TODO: Implementare chiamata API per approvare timbratura
            console.log('Timbratura approvata:', timbraturaId);
            Alert.alert('Successo', 'Timbratura approvata con successo');
          }
        },
      ]
    );
  };

  const rifiutaTimbratura = (timbraturaId) => {
    Alert.alert(
      'Rifiuta Timbratura',
      'Sei sicuro di voler rifiutare questa timbratura?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Rifiuta', 
          onPress: () => {
            // TODO: Implementare chiamata API per rifiutare timbratura
            console.log('Timbratura rifiutata:', timbraturaId);
            Alert.alert('Successo', 'Timbratura rifiutata');
          }
        },
      ]
    );
  };

  const approvaRichiestaFerie = (richiestaId) => {
    Alert.alert(
      'Approva Richiesta',
      'Sei sicuro di voler approvare questa richiesta di ferie?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Approva', 
          onPress: () => {
            // TODO: Implementare chiamata API per approvare richiesta
            console.log('Richiesta approvata:', richiestaId);
            Alert.alert('Successo', 'Richiesta di ferie approvata');
          }
        },
      ]
    );
  };

  const rifiutaRichiestaFerie = (richiestaId) => {
    Alert.alert(
      'Rifiuta Richiesta',
      'Sei sicuro di voler rifiutare questa richiesta di ferie?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Rifiuta', 
          onPress: () => {
            // TODO: Implementare chiamata API per rifiutare richiesta
            console.log('Richiesta rifiutata:', richiestaId);
            Alert.alert('Successo', 'Richiesta di ferie rifiutata');
          }
        },
      ]
    );
  };

  const renderTimbratura = (timbratura) => (
    <Animated.View entering={FadeInUp.delay(100)} key={timbratura.id}>
      <Card style={styles.timbraturaCard}>
        <View style={styles.timbraturaHeader}>
          <View style={styles.timbraturaInfo}>
            <Text style={[styles.timbraturaData, { color: theme.text }]}>
              {new Date(timbratura.data).toLocaleDateString('it-IT')}
            </Text>
            <Text style={[styles.timbraturaOre, { color: theme.textSecondary }]}>
              {timbratura.entrata} - {timbratura.uscita} ({timbratura.oreTotali}h)
            </Text>
            {timbratura.note && (
              <Text style={[styles.timbraturaNote, { color: theme.warning }]}>
                {timbratura.note}
              </Text>
            )}
          </View>
          <View style={styles.timbraturaActions}>
            {!timbratura.approvata ? (
              <>
                <TouchableOpacity
                  style={[styles.approveButton, { backgroundColor: theme.success }]}
                  onPress={() => approvaTimbratura(timbratura.id)}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectButton, { backgroundColor: theme.error }]}
                  onPress={() => rifiutaTimbratura(timbratura.id)}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={[styles.approvedBadge, { backgroundColor: theme.success }]}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.approvedText}>Approvata</Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </Animated.View>
  );

  const renderRichiestaFerie = (richiesta) => (
    <Animated.View entering={FadeInUp.delay(100)} key={richiesta.id}>
      <Card style={styles.richiestaCard}>
        <View style={styles.richiestaHeader}>
          <View style={styles.richiestaInfo}>
            <Text style={[styles.richiestaTipo, { color: theme.text }]}>
              {richiesta.tipo === 'ferie' ? 'Ferie' : 'Permesso'}
            </Text>
            <Text style={[styles.richiestaDate, { color: theme.textSecondary }]}>
              {new Date(richiesta.dataInizio).toLocaleDateString('it-IT')} - {new Date(richiesta.dataFine).toLocaleDateString('it-IT')}
            </Text>
            <Text style={[styles.richiestaMotivazione, { color: theme.textTertiary }]}>
              {richiesta.motivazione}
            </Text>
          </View>
          <View style={styles.richiestaActions}>
            {richiesta.stato === 'in_attesa' ? (
              <>
                <TouchableOpacity
                  style={[styles.approveButton, { backgroundColor: theme.success }]}
                  onPress={() => approvaRichiestaFerie(richiesta.id)}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectButton, { backgroundColor: theme.error }]}
                  onPress={() => rifiutaRichiestaFerie(richiesta.id)}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={[
                styles.statusBadge, 
                { backgroundColor: richiesta.stato === 'approvata' ? theme.success : theme.error }
              ]}>
                <Text style={styles.statusText}>
                  {richiesta.stato === 'approvata' ? 'Approvata' : 'Rifiutata'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Caricamento dipendente...
          </Text>
        </View>
      </View>
    );
  }

  if (!dipendente) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            Dipendente non trovato
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.emerald}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {dipendente.nome} {dipendente.cognome}
            </Text>
            <Text style={styles.headerSubtitle}>
              {dipendente.reparto} - {dipendente.badge}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Info Dipendente */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <Card style={styles.infoCard}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={dipendente.attivo ? theme.gradients.primary : theme.gradients.secondary}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {dipendente.nome.charAt(0)}{dipendente.cognome.charAt(0)}
                </Text>
              </LinearGradient>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>
                {dipendente.nome} {dipendente.cognome}
              </Text>
              <Text style={[styles.infoSubtitle, { color: theme.textSecondary }]}>
                {dipendente.email}
              </Text>
              <Text style={[styles.infoSubtitle, { color: theme.textSecondary }]}>
                {dipendente.telefono}
              </Text>
              <View style={styles.infoStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {dipendente.oreSettimanali}h
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Ore settimanali
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    €{dipendente.pagaOraria}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Paga oraria
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {dipendente.sede}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Sede
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Azioni Rapide */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <Card style={styles.actionsCard}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Azioni Rapide
            </Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.warning + '20' }]}
                onPress={() => apriModal('ferie')}
              >
                <MaterialCommunityIcons name="beach" size={24} color={theme.warning} />
                <Text style={[styles.actionText, { color: theme.warning }]}>Ferie</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.info + '20' }]}
                onPress={() => apriModal('documenti')}
              >
                <MaterialCommunityIcons name="file-document" size={24} color={theme.info} />
                <Text style={[styles.actionText, { color: theme.info }]}>Documenti</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.success + '20' }]}
                onPress={() => apriModal('turni')}
              >
                <MaterialCommunityIcons name="clock-check" size={24} color={theme.success} />
                <Text style={[styles.actionText, { color: theme.success }]}>Turni</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>

        {/* Timbrature Recenti */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Timbrature Recenti
            </Text>
            {timbratureEsempio.map((timbratura) => renderTimbratura(timbratura))}
          </Card>
        </Animated.View>

        {/* Richieste Ferie */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Richieste Ferie
            </Text>
            {richiesteFerieEsempio.map((richiesta) => renderRichiestaFerie(richiesta))}
          </Card>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal per azioni */}
      <Modal
        visible={modalVisibile}
        transparent={true}
        animationType="fade"
        onRequestClose={chiudiModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {tipoModal === 'ferie' ? 'Gestisci Ferie' : 
                 tipoModal === 'documenti' ? 'Gestisci Documenti' : 
                 'Gestisci Turni'}
              </Text>
              <TouchableOpacity onPress={chiudiModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                Funzionalità in sviluppo...
              </Text>
            </View>
          </View>
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
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  infoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  actionsCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionCard: {
    marginBottom: 20,
  },
  timbraturaCard: {
    marginBottom: 12,
  },
  timbraturaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timbraturaInfo: {
    flex: 1,
    gap: 4,
  },
  timbraturaData: {
    fontSize: 16,
    fontWeight: '600',
  },
  timbraturaOre: {
    fontSize: 14,
  },
  timbraturaNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  timbraturaActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  approvedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  richiestaCard: {
    marginBottom: 12,
  },
  richiestaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  richiestaInfo: {
    flex: 1,
    gap: 4,
  },
  richiestaTipo: {
    fontSize: 16,
    fontWeight: '600',
  },
  richiestaDate: {
    fontSize: 14,
  },
  richiestaMotivazione: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  richiestaActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
});

export default DipendenteDetailScreen;
