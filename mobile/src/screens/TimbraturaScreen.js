import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';

import { useAuth } from '../context/AuthContext';
import { useTimbrature } from '../context/TimbratureContext';
import { useTheme } from '../context/ThemeContext';
import { formatTime, getCurrentTime, getToday } from '../utils/dateUtils';
import Card from '../components/Card';
import Button from '../components/Button';

const { width } = Dimensions.get('window');

const TimbraturaScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { 
    currentTimbrata, 
    timbraEntrata, 
    timbraUscita, 
    iniziaPausa, 
    terminaPausa,
    getAllTimbrature 
  } = useTimbrature();
  const { theme } = useTheme();
  
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [timbratureRecenti, setTimbratureRecenti] = useState([]);
  const [statistiche, setStatistiche] = useState({ 
    oreMese: 0, 
    giorniLavorati: 0, 
    oreTarget: 160, 
    oreMancanti: 0,
    percentualeCompletamento: 0
  });

  // Animazione grafico
  const progressAnimation = useSharedValue(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    loadTimbratureRecenti();
    
    // Anima la progressione del grafico
    progressAnimation.value = withTiming(75, {
      duration: 1500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    return () => clearInterval(interval);
  }, [currentTimbrata]);

  const loadTimbratureRecenti = () => {
    const tutte = getAllTimbrature();
    // Prendi gli ultimi 3 giorni
    const ultimi3Giorni = tutte.slice(0, 3);
    setTimbratureRecenti(ultimi3Giorni);
    
    // Calcola statistiche del mese corrente
    const oggi = new Date();
    const primoGiornoMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
    
    const timbratureMese = tutte.filter(t => {
      const data = new Date(t.data);
      return data >= primoGiornoMese && data <= oggi;
    });
    
    let oreTotaliMese = 0;
    let giorniConOre = 0;
    
    timbratureMese.forEach(t => {
      if (t.oreTotali) {
        // Gestisci sia stringhe che numeri
        let oreValue = t.oreTotali;
        if (typeof oreValue === 'string') {
          oreValue = oreValue.replace('h', '').replace(',', '.');
        }
        const ore = parseFloat(oreValue);
        if (!isNaN(ore)) {
          oreTotaliMese += ore;
          giorniConOre++;
        }
      }
    });
    
    // Calcola ore target del mese (giorni lavorativi * 8)
    const giorniLavorativiMese = 20; // Media approssimativa
    const oreTarget = giorniLavorativiMese * 8; // 160 ore
    const oreMancanti = Math.max(0, oreTarget - oreTotaliMese);
    
    setStatistiche({
      oreMese: oreTotaliMese.toFixed(0),
      giorniLavorati: giorniConOre,
      oreTarget: oreTarget,
      oreMancanti: oreMancanti.toFixed(0),
      percentualeCompletamento: ((oreTotaliMese / oreTarget) * 100).toFixed(0)
    });
  };

  const handleTimbraEntrata = async () => {
    const result = await timbraEntrata(user.id);
    if (result.success) {
      Alert.alert('✓ Successo', 'Entrata registrata!');
      loadTimbratureRecenti();
    } else {
      Alert.alert('✗ Errore', result.error);
    }
  };

  const handleTimbraUscita = async () => {
    Alert.alert(
      'Conferma Uscita',
      'Vuoi timbrare l\'uscita?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Conferma',
          onPress: async () => {
            const result = await timbraUscita();
            if (result.success) {
              Alert.alert('✓ Successo', `Ore lavorate: ${result.timbrata.oreTotali}`);
              loadTimbratureRecenti();
            } else {
              Alert.alert('✗ Errore', result.error);
            }
          }
        }
      ]
    );
  };

  const handlePausa = async () => {
    if (currentTimbrata?.pausaInizio && !currentTimbrata?.pausaFine) {
      const result = await terminaPausa();
      if (result.success) {
        Alert.alert('✓ Successo', 'Pausa terminata');
      }
    } else {
      const result = await iniziaPausa();
      if (result.success) {
        Alert.alert('✓ Successo', 'Pausa iniziata');
      }
    }
  };

  const inPausa = currentTimbrata?.pausaInizio && !currentTimbrata?.pausaFine;

  // Calcola ore lavorate e percentuale di completamento turno
  const calcolaOreEPercentuale = () => {
    if (!currentTimbrata || !currentTimbrata.entrata) return { oreLavorate: '0.0', percentuale: 0 };
    
    try {
      const entrata = new Date(currentTimbrata.entrata);
      const ora = currentTimbrata.uscita ? new Date(currentTimbrata.uscita) : new Date();
      
      // Calcola minuti lavorati
      let minutiTotali = Math.floor((ora - entrata) / (1000 * 60));
      
      // Assicurati che sia un numero valido
      if (isNaN(minutiTotali) || minutiTotali < 0) {
        return { oreLavorate: '0.0', percentuale: 0 };
      }
      
      // Sottrai eventuali pause
      if (currentTimbrata.pausaInizio && currentTimbrata.pausaFine) {
        const pausaInizio = new Date(currentTimbrata.pausaInizio);
        const pausaFine = new Date(currentTimbrata.pausaFine);
        const minutiPausa = Math.floor((pausaFine - pausaInizio) / (1000 * 60));
        if (!isNaN(minutiPausa)) {
          minutiTotali -= minutiPausa;
        }
      } else if (currentTimbrata.pausaInizio && !currentTimbrata.pausaFine) {
        // Pausa in corso
        const pausaInizio = new Date(currentTimbrata.pausaInizio);
        const minutiPausa = Math.floor((new Date() - pausaInizio) / (1000 * 60));
        if (!isNaN(minutiPausa)) {
          minutiTotali -= minutiPausa;
        }
      }
      
      const oreLavorate = (minutiTotali / 60).toFixed(1);
      const percentuale = Math.min(Math.max((minutiTotali / (8 * 60)) * 100, 0), 100);
      
      return { oreLavorate, percentuale: Math.round(percentuale) };
    } catch (error) {
      return { oreLavorate: '0.0', percentuale: 0 };
    }
  };

  const { oreLavorate, percentuale } = calcolaOreEPercentuale();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.primary}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Timbratura</Text>
        <Text style={styles.headerSubtitle}>{getToday()}</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Orologio Centrato */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <Card style={[styles.clockCard, { backgroundColor: theme.primary, ...styles.cardShadow }]}>
            <Text style={styles.clockTime}>{formatTime(currentTime)}</Text>
            <Text style={styles.companyName}>LA GIOVANE S.C.p.A.</Text>
            {currentTimbrata ? (
              <View style={styles.clockSubInfo}>
                <Ionicons name="log-in-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.clockSubText}>
                  In: {formatTime(currentTimbrata.entrata)}
                </Text>
              </View>
            ) : (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Pulsanti Azione e Progress */}
        <Animated.View entering={FadeInUp.delay(150)}>
          <Card style={styles.actionsCard}>
            {!currentTimbrata ? (
              <Button
                gradient
                onPress={() => navigation.navigate('QRScanner')}
                title="SCANSIONA QR CODE"
                variant="gradient"
                style={styles.mainActionButton}
                icon={<Ionicons name="qr-code-outline" size={28} color="#FFFFFF" />}
              />
            ) : (
              <>
                {/* Progress Bar Completamento Turno */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <View style={styles.progressInfo}>
                      <Ionicons name="time-outline" size={20} color={theme.primary} />
                      <Text style={[styles.progressLabel, { color: theme.text }]}>
                        Turno di oggi
                      </Text>
                    </View>
                    <Text style={[styles.progressValue, { color: theme.primary }]}>
                      {oreLavorate}h / 8h
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <LinearGradient
                      colors={percentuale >= 100 ? ['#10B981', '#059669'] : theme.gradients.primary}
                      style={[styles.progressBarFill, { width: `${Math.max(percentuale, 5)}%` }]}
                    />
                  </View>
                  <Text style={[styles.progressPercentageText, { color: theme.textSecondary }]}>
                    {percentuale}% completato
                  </Text>
                </View>

                {inPausa && (
                  <View style={[styles.pausaBanner, { backgroundColor: theme.warningLight }]}>
                    <MaterialCommunityIcons name="pause-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.pausaText}>In Pausa</Text>
                  </View>
                )}

                {/* Pulsanti Azione */}
                <View style={styles.actionButtons}>
                  <Button
                    onPress={handleTimbraUscita}
                    title="TIMBRA USCITA"
                    variant="danger"
                    style={styles.mainActionButton}
                    icon={<Ionicons name="exit-outline" size={24} color="#FFFFFF" />}
                  />

                  <Button
                    onPress={handlePausa}
                    title={inPausa ? 'Riprendi' : 'Pausa'}
                    variant="warning"
                    style={styles.secondaryActionButton}
                    icon={
                      <MaterialCommunityIcons 
                        name={inPausa ? 'play-circle' : 'pause-circle'} 
                        size={20} 
                        color="#FFFFFF" 
                      />
                    }
                  />
                </View>
              </>
            )}
          </Card>
        </Animated.View>

        {/* Timbratura di Oggi */}
        {currentTimbrata && (
          <Animated.View entering={FadeInUp.delay(200)}>
            <Card style={styles.todayCard}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Timbratura di Oggi
              </Text>
              <View style={styles.todayContent}>
                <View style={styles.todayItem}>
                  <Ionicons name="enter-outline" size={20} color={theme.success} />
                  <Text style={[styles.todayLabel, { color: theme.textSecondary }]}>
                    Entrata
                  </Text>
                  <Text style={[styles.todayValue, { color: theme.text }]}>
                    {formatTime(currentTimbrata.entrata)}
                  </Text>
                </View>
                
                {currentTimbrata.pausaInizio && (
                  <View style={styles.todayItem}>
                    <MaterialCommunityIcons name="pause-circle" size={20} color={theme.warning} />
                    <Text style={[styles.todayLabel, { color: theme.textSecondary }]}>
                      Pausa
                    </Text>
                    <Text style={[styles.todayValue, { color: theme.text }]}>
                      {formatTime(currentTimbrata.pausaInizio)}
                    </Text>
                  </View>
                )}

                {currentTimbrata.uscita && (
                  <View style={styles.todayItem}>
                    <Ionicons name="exit-outline" size={20} color={theme.error} />
                    <Text style={[styles.todayLabel, { color: theme.textSecondary }]}>
                      Uscita
                    </Text>
                    <Text style={[styles.todayValue, { color: theme.text }]}>
                      {formatTime(currentTimbrata.uscita)}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Timbrature Recenti */}
        <Animated.View entering={FadeInUp.delay(250)}>
          <View style={styles.recentiHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recenti
            </Text>
            <Button
              onPress={() => navigation.navigate('Storico')}
              title="Storico completo"
              variant="secondary"
              style={styles.storicoButton}
              textStyle={styles.storicoButtonText}
            />
          </View>

          {timbratureRecenti.length > 0 ? (
            timbratureRecenti.map((timbrata, index) => (
              <Card 
                key={timbrata.id} 
                style={styles.timbrataCard}
                animationType="up"
                delay={600 + index * 50}
              >
                <View style={styles.timbrataHeader}>
                  <View>
                    <Text style={[styles.timbrataData, { color: theme.text }]}>
                      {new Date(timbrata.data).toLocaleDateString('it-IT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </Text>
                    {timbrata.oreTotali && (
                      <Text style={[styles.timbrataOre, { color: theme.success }]}>
                        ⏱️ {timbrata.oreTotali}
                      </Text>
                    )}
                  </View>
                  <LinearGradient
                    colors={theme.gradients.primary}
                    style={styles.timbrataIconContainer}
                  >
                    <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </View>

                <View style={styles.timbrataDettagli}>
                  <View style={styles.timbrataDettaglio}>
                    <Text style={[styles.dettaglioLabel, { color: theme.textSecondary }]}>
                      Entrata
                    </Text>
                    <Text style={[styles.dettaglioValue, { color: theme.text }]}>
                      {formatTime(timbrata.entrata)}
                    </Text>
                  </View>
                  {timbrata.uscita && (
                    <View style={styles.timbrataDettaglio}>
                      <Text style={[styles.dettaglioLabel, { color: theme.textSecondary }]}>
                        Uscita
                      </Text>
                      <Text style={[styles.dettaglioValue, { color: theme.text }]}>
                        {formatTime(timbrata.uscita)}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nessuna timbratura recente
              </Text>
            </Card>
          )}
        </Animated.View>

        <View style={styles.bottomSpacer} />
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
    padding: 16,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  clockCard: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginBottom: 12,
  },
  clockTime: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    textAlign: 'center',
  },
  clockSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clockSubText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 11,
    fontWeight: '600',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionsCard: {
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  mainActionButton: {
    flex: 2,
    height: 56,
  },
  secondaryActionButton: {
    flex: 1,
    height: 56,
  },
  todayCard: {
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  todayContent: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  todayItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  todayLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  todayValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: 0,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentageText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'right',
  },
  pausaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  pausaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  recentiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
    marginTop: 4,
  },
  storicoButton: {
    height: 32,
    paddingHorizontal: 24,
  },
  storicoButtonText: {
    fontSize: 12,
  },
  timbrataCard: {
    marginBottom: 8,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  timbrataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timbrataData: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
    textTransform: 'capitalize',
  },
  timbrataOre: {
    fontSize: 14,
    fontWeight: '700',
  },
  timbrataIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timbrataDettagli: {
    flexDirection: 'row',
    gap: 10,
  },
  timbrataDettaglio: {
    flex: 1,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 10,
  },
  dettaglioLabel: {
    fontSize: 11,
    marginBottom: 3,
  },
  dettaglioValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default TimbraturaScreen;

