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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { useFerie } from '../context/FerieContext';
import Card from '../components/Card';
import Button from '../components/Button';

// Configura calendario in italiano
LocaleConfig.locales['it'] = {
  monthNames: ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
  monthNamesShort: ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'],
  dayNames: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'],
  dayNamesShort: ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'],
  today: 'Oggi'
};
LocaleConfig.defaultLocale = 'it';

const FerieScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { 
    richieste, 
    giorniResiduiFerie, 
    giorniResiduiPermessi,
    richiediFeriePermesso,
    getCalendarioMarcato,
  } = useFerie();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [tipoRichiesta, setTipoRichiesta] = useState('ferie');
  const [dataInizio, setDataInizio] = useState('');
  const [dataFine, setDataFine] = useState('');
  const [motivazione, setMotivazione] = useState('');
  const [filtroStato, setFiltroStato] = useState('tutti'); // 'tutti', 'approvata', 'in_attesa', 'rifiutata'

  const calendarioMarcato = getCalendarioMarcato();

  const handleInviaRichiesta = async () => {
    if (!dataInizio || !dataFine) {
      Alert.alert('Errore', 'Seleziona le date');
      return;
    }

    const start = new Date(dataInizio);
    const end = new Date(dataFine);
    const giorni = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const result = await richiediFeriePermesso({
      tipo: tipoRichiesta,
      dataInizio,
      dataFine,
      giorni,
      motivazione,
    });

    if (result.success) {
      Alert.alert('✓ Successo', `Richiesta di ${tipoRichiesta} inviata!`);
      setModalVisible(false);
      setDataInizio('');
      setDataFine('');
      setMotivazione('');
    }
  };

  const richiesteFiltrate = filtroStato === 'tutti' 
    ? richieste 
    : richieste.filter(r => r.stato === filtroStato);

  const getStatoColor = (stato) => {
    switch (stato) {
      case 'approvata': return theme.success;
      case 'in_attesa': return theme.warning;
      case 'rifiutata': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const getStatoIcon = (stato) => {
    switch (stato) {
      case 'approvata': return 'checkmark-circle';
      case 'in_attesa': return 'time';
      case 'rifiutata': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const renderRichiesta = (richiesta, index) => (
    <Card
      key={richiesta.id}
      style={styles.richiestaCard}
      animationType="up"
      delay={index * 50}
    >
      <View style={styles.richiestaHeader}>
        <LinearGradient
          colors={richiesta.tipo === 'ferie' ? theme.gradients.sunset : theme.gradients.secondary}
          style={styles.richiestaIconContainer}
        >
          <MaterialCommunityIcons 
            name={richiesta.tipo === 'ferie' ? 'beach' : 'calendar-clock'} 
            size={24} 
            color="#FFFFFF" 
          />
        </LinearGradient>
        <View style={styles.richiestaInfo}>
          <Text style={[styles.richiestaTipo, { color: theme.text }]}>
            {richiesta.tipo.charAt(0).toUpperCase() + richiesta.tipo.slice(1)}
          </Text>
          <Text style={[styles.richiestaDate, { color: theme.textSecondary }]}>
            {new Date(richiesta.dataInizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} 
            {' → '}
            {new Date(richiesta.dataFine).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <View style={[styles.statoBadge, { backgroundColor: getStatoColor(richiesta.stato) + '20' }]}>
          <Ionicons name={getStatoIcon(richiesta.stato)} size={16} color={getStatoColor(richiesta.stato)} />
          <Text style={[styles.statoText, { color: getStatoColor(richiesta.stato) }]}>
            {richiesta.stato.replace('_', ' ')}
          </Text>
        </View>
      </View>
      <View style={styles.richiestaDettagli}>
        <View style={styles.richiestaDettaglio}>
          <Text style={[styles.dettaglioLabel, { color: theme.textSecondary }]}>
            Giorni richiesti
          </Text>
          <Text style={[styles.dettaglioValue, { color: theme.text }]}>
            {richiesta.giorni}
          </Text>
        </View>
        {richiesta.motivazione && (
          <View style={styles.richiestaMotivazione}>
            <Text style={[styles.motivazioneLabel, { color: theme.textSecondary }]}>
              Motivazione:
            </Text>
            <Text style={[styles.motivazioneText, { color: theme.text }]}>
              {richiesta.motivazione}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.sunset}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Ferie e Permessi</Text>
        <Text style={styles.headerSubtitle}>Gestisci le tue richieste</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contatori Residui */}
        <View style={styles.contatoriContainer}>
          <Animated.View entering={FadeInUp.delay(100)} style={styles.contatoreWrapper}>
            <Card gradient gradientColors={theme.gradients.sunset} style={styles.contatoreCard}>
              <MaterialCommunityIcons name="beach" size={32} color="#FFFFFF" />
              <Text style={styles.contatoreLabel}>Ferie Residue</Text>
              <Text style={styles.contatoreValue}>{giorniResiduiFerie}</Text>
              <Text style={styles.contatoreSubtext}>giorni</Text>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(150)} style={styles.contatoreWrapper}>
            <Card gradient gradientColors={theme.gradients.secondary} style={styles.contatoreCard}>
              <MaterialCommunityIcons name="calendar-clock" size={32} color="#FFFFFF" />
              <Text style={styles.contatoreLabel}>Permessi Residui</Text>
              <Text style={styles.contatoreValue}>{giorniResiduiPermessi}</Text>
              <Text style={styles.contatoreSubtext}>giorni</Text>
            </Card>
          </Animated.View>
        </View>

        {/* Pulsante Nuova Richiesta */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <Button
            gradient
            onPress={() => setModalVisible(true)}
            title="Richiedi Ferie/Permesso"
            variant="gradient"
            style={styles.richediButton}
            icon={<Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />}
          />
        </Animated.View>

        {/* Calendario */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <Card style={styles.calendarioCard}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Calendario
            </Text>
            <Calendar
              markedDates={calendarioMarcato}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: theme.textSecondary,
                selectedDayBackgroundColor: theme.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: theme.primary,
                dayTextColor: theme.text,
                textDisabledColor: theme.textTertiary,
                dotColor: theme.primary,
                selectedDotColor: '#ffffff',
                arrowColor: theme.primary,
                monthTextColor: theme.text,
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 15,
                textMonthFontSize: 17,
                textDayHeaderFontSize: 13,
              }}
            />
            <View style={styles.legenda}>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.legendaText, { color: theme.textSecondary }]}>Approvata</Text>
              </View>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaDot, { backgroundColor: theme.warning }]} />
                <Text style={[styles.legendaText, { color: theme.textSecondary }]}>In attesa</Text>
              </View>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaDot, { backgroundColor: theme.error }]} />
                <Text style={[styles.legendaText, { color: theme.textSecondary }]}>Rifiutata</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Filtri Stato */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtriContainer}
          >
            {['tutti', 'approvata', 'in_attesa', 'rifiutata'].map(stato => (
              <TouchableOpacity
                key={stato}
                style={[
                  styles.filtroChip,
                  { 
                    backgroundColor: filtroStato === stato ? theme.primary : theme.card,
                    borderColor: theme.border,
                  }
                ]}
                onPress={() => setFiltroStato(stato)}
              >
                <Text style={[
                  styles.filtroText,
                  { color: filtroStato === stato ? '#FFFFFF' : theme.text }
                ]}>
                  {stato.charAt(0).toUpperCase() + stato.slice(1).replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Lista Richieste */}
        <View style={styles.richiesteContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Le Tue Richieste ({richiesteFiltrate.length})
          </Text>
          {richiesteFiltrate.length > 0 ? (
            richiesteFiltrate.map((richiesta, index) => renderRichiesta(richiesta, index))
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nessuna richiesta trovata
              </Text>
            </Card>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal Nuova Richiesta */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={FadeIn}
            style={[styles.modalContent, { backgroundColor: theme.card }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Nuova Richiesta
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Tipo */}
              <Text style={[styles.inputLabel, { color: theme.text }]}>Tipo</Text>
              <View style={styles.tipoContainer}>
                <TouchableOpacity
                  style={[
                    styles.tipoButton,
                    { 
                      backgroundColor: tipoRichiesta === 'ferie' ? theme.primary : theme.background,
                      borderColor: theme.border,
                    }
                  ]}
                  onPress={() => setTipoRichiesta('ferie')}
                >
                  <Text style={[
                    styles.tipoText,
                    { color: tipoRichiesta === 'ferie' ? '#FFFFFF' : theme.text }
                  ]}>
                    Ferie
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tipoButton,
                    { 
                      backgroundColor: tipoRichiesta === 'permesso' ? theme.primary : theme.background,
                      borderColor: theme.border,
                    }
                  ]}
                  onPress={() => setTipoRichiesta('permesso')}
                >
                  <Text style={[
                    styles.tipoText,
                    { color: tipoRichiesta === 'permesso' ? '#FFFFFF' : theme.text }
                  ]}>
                    Permesso
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Date */}
              <Text style={[styles.inputLabel, { color: theme.text }]}>Data Inizio</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textTertiary}
                value={dataInizio}
                onChangeText={setDataInizio}
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Data Fine</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textTertiary}
                value={dataFine}
                onChangeText={setDataFine}
              />

              {/* Motivazione */}
              <Text style={[styles.inputLabel, { color: theme.text }]}>Motivazione (opzionale)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Descrivi la motivazione..."
                placeholderTextColor={theme.textTertiary}
                value={motivazione}
                onChangeText={setMotivazione}
                multiline
                numberOfLines={4}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                onPress={() => setModalVisible(false)}
                title="Annulla"
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                gradient
                onPress={handleInviaRichiesta}
                title="Invia Richiesta"
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
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
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
  contatoriContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  contatoreWrapper: {
    flex: 1,
  },
  contatoreCard: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  contatoreLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  contatoreValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  contatoreSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  richediButton: {
    marginBottom: 20,
    height: 64,
  },
  calendarioCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  legenda: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendaDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendaText: {
    fontSize: 13,
  },
  filtriContainer: {
    marginBottom: 20,
  },
  filtroChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  filtroText: {
    fontSize: 14,
    fontWeight: '700',
  },
  richiesteContainer: {
    marginBottom: 20,
  },
  richiestaCard: {
    marginBottom: 12,
  },
  richiestaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  richiestaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  richiestaInfo: {
    flex: 1,
  },
  richiestaTipo: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  richiestaDate: {
    fontSize: 14,
  },
  statoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statoText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  richiestaDettagli: {
    gap: 12,
  },
  richiestaDettaglio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dettaglioLabel: {
    fontSize: 14,
  },
  dettaglioValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  richiestaMotivazione: {
    gap: 4,
  },
  motivazioneLabel: {
    fontSize: 13,
  },
  motivazioneText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
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
    maxHeight: '90%',
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
  tipoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tipoButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  tipoText: {
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
});

export default FerieScreen;

