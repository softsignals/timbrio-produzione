import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { timbratureAPI } from '../services/api';
import { getTokenRefreshInterval, generateQRData, getWelcomeMessage, getGreetingMessage } from '../utils/qrUtils';

import { useAuth } from '../context/AuthContext';
import { useTimbrature } from '../context/TimbratureContext';
import { useTheme } from '../context/ThemeContext';
import { useDocumenti } from '../context/DocumentiContext';
import { formatTime, getCurrentTime, getToday } from '../utils/dateUtils';
import Card from '../components/Card';
import Button from '../components/Button';
import WeeklyCandlestickChart from '../components/WeeklyCandlestickChart';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { currentTimbrata, timbraEntrata, timbraUscita, getAllTimbrature, haTimbratoOggi, getTimbratureOggiByUser, reloadTimbrature, timbrature } = useTimbrature();
  const { theme } = useTheme();
  const { getUltimaBustaPaga, getDocumentiNuovi, segnaLetto, documenti, bustePaga } = useDocumenti();
  
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [refreshing, setRefreshing] = useState(false);
  const [oreSettimanali, setOreSettimanali] = useState([]);
  const [ultimiTurni, setUltimiTurni] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastReloadTime, setLastReloadTime] = useState(0);

  // Ricarica i dati quando si torna alla schermata (dopo scansione QR)
  useFocusEffect(
    React.useCallback(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.js:52',message:'useFocusEffect triggered',data:{lastReloadTime,timeSinceLastReload:Date.now()-lastReloadTime,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Previeni troppe richieste: ricarica solo se passati almeno 3 secondi dall'ultima
      const now = Date.now();
      const shouldReload = now - lastReloadTime > 3000; // 3 secondi per evitare 429
      
      if (shouldReload) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.js:58',message:'Calling reloadTimbrature from useFocusEffect',data:{timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        setLastReloadTime(now);
        // Usa un delay per assicurarsi che le timbrature dal server siano pronte
        setTimeout(() => {
          reloadTimbrature().then(() => {
            // Forza re-render dopo il reload
            setRefreshKey(prev => prev + 1);
            calcolaOreSettimanali();
            getUltimiTurni();
          }).catch(() => {
            // Anche in caso di errore, aggiorna la UI
            setRefreshKey(prev => prev + 1);
            calcolaOreSettimanali();
            getUltimiTurni();
          });
        }, 800);
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.js:64',message:'Reload skipped - too soon, but still update UI',data:{timeSinceLastReload:now-lastReloadTime,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // Anche se non facciamo reload, aggiorniamo comunque la UI con i dati esistenti
        setRefreshKey(prev => prev + 1);
        calcolaOreSettimanali();
        getUltimiTurni();
      }
    }, [reloadTimbrature, lastReloadTime])
  );

  // Aggiorna quando cambiano le timbrature (senza ricaricare dal server)
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.js:77',message:'Timbrature changed effect',data:{timbratureCount:timbrature.length,hasCurrentTimbrata:!!currentTimbrata,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    calcolaOreSettimanali();
    getUltimiTurni();
    setRefreshKey(prev => prev + 1); // Force re-render per aggiornare lo status
  }, [timbrature, currentTimbrata, calcolaOreSettimanali, getUltimiTurni]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    calcolaOreSettimanali();
    getUltimiTurni();
    return () => clearInterval(interval);
  }, []);

  const calcolaOreSettimanali = () => {
    const timbrature = getAllTimbrature();
    const oggi = new Date();
    const inizioSettimana = new Date(oggi);
    inizioSettimana.setDate(oggi.getDate() - oggi.getDay() + 1); // Lunedì
    
    // Raggruppa le timbrature per giorno
    const orePerGiorno = {};
    timbrature.forEach(t => {
      const dataTimbrata = new Date(t.data);
      if (dataTimbrata >= inizioSettimana && t.oreTotali) {
        const dataKey = dataTimbrata.toDateString();
        const ore = parseFloat(t.oreTotali);
        if (!isNaN(ore)) {
          orePerGiorno[dataKey] = (orePerGiorno[dataKey] || 0) + ore;
        }
      }
    });
    
    // Converti in array per il grafico
    const oreArray = Object.entries(orePerGiorno).map(([data, ore]) => ({
      data,
      oreTotali: ore.toFixed(1)
    }));
    
    setOreSettimanali(oreArray);
  };


  const getUltimiTurni = () => {
    // Simulazione ultimi turni - in un'app reale questi verrebbero dal backend
    const turni = [
      { id: 1, data: '2024-01-15', tipo: 'Mattina', inizio: '08:00', fine: '16:00', ore: 8 },
      { id: 2, data: '2024-01-14', tipo: 'Pomeriggio', inizio: '14:00', fine: '22:00', ore: 8 },
      { id: 3, data: '2024-01-13', tipo: 'Notte', inizio: '22:00', fine: '06:00', ore: 8 },
    ];
    setUltimiTurni(turni);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const now = Date.now();
    // Previeni troppe richieste anche durante il refresh manuale
    if (now - lastReloadTime > 2000) {
      setLastReloadTime(now);
      await reloadTimbrature();
    }
    calcolaOreSettimanali();
    getUltimiTurni();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleScansionaQR = () => {
    navigation.navigate('QRScanner');
  };

  // Stato per QR code (solo per receptionist)
  const [qrToken, setQrToken] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [qrLoading, setQrLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [exitCode, setExitCode] = useState('');
  const [codeError, setCodeError] = useState(false);

  const isReceptionist = user?.ruolo === 'receptionist';
  const EXIT_CODE = '1111'; // Codice per accedere alle impostazioni

  // Carica QR token e recent entries se receptionist
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.js:151',message:'Receptionist useEffect triggered',data:{isReceptionist,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (isReceptionist) {
      // Delay iniziale per evitare sovrapposizione con altre chiamate all'avvio
      const initialDelay = setTimeout(() => {
        loadQRToken();
        loadRecentEntries();
      }, 1000);
      
      const refreshInterval = getTokenRefreshInterval();
      const tokenInterval = setInterval(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.js:160',message:'Token interval triggered',data:{refreshInterval,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        loadQRToken();
      }, refreshInterval);

      const entriesInterval = setInterval(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.js:166',message:'Entries interval triggered',data:{timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        loadRecentEntries();
      }, 30000);

      return () => {
        clearTimeout(initialDelay);
        clearInterval(tokenInterval);
        clearInterval(entriesInterval);
      };
    }
  }, [isReceptionist]);

  const loadQRToken = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.js:172',message:'loadQRToken called',data:{timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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
      // Fallback: genera token locale per testing
      const now = Date.now();
      const refreshInterval = getTokenRefreshInterval();
      const timestamp = Math.floor(now / refreshInterval) * refreshInterval;
      const mockToken = `mock_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      const data = generateQRData(mockToken, timestamp);
      setQrData(data);
      setQrToken(mockToken);
      setLastUpdate(new Date());
    } finally {
      setQrLoading(false);
    }
  };

  const loadRecentEntries = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.js:197',message:'loadRecentEntries called',data:{timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    try {
      const response = await timbratureAPI.getRecentEntries(10);
      if (response.success && response.data) {
        setRecentEntries(response.data);
      }
    } catch (error) {
      console.error('Errore caricamento entrate recenti:', error);
      // Fallback: dati mock per testing
      setRecentEntries([
        {
          userId: '1',
          nome: 'Mario',
          cognome: 'Rossi',
          badge: 'BAD001',
          entrata: '08:30:00',
          uscita: null,
        },
        {
          userId: '2',
          nome: 'Laura',
          cognome: 'Bianchi',
          badge: 'BAD002',
          entrata: '08:45:00',
          uscita: '17:30:00',
        },
        {
          userId: '3',
          nome: 'Giuseppe',
          cognome: 'Verdi',
          badge: 'BAD003',
          entrata: '09:00:00',
          uscita: null,
        },
      ]);
    }
  };

  // Handler per mostrare il modal del codice
  const handleShowExitCode = () => {
    setCodeModalVisible(true);
    setExitCode('');
    setCodeError(false);
  };

  // Handler per validare il codice ed uscire
  const handleValidateCode = () => {
    console.log('Validazione codice - Inserito:', exitCode, 'Atteso:', EXIT_CODE, 'Match:', exitCode === EXIT_CODE);
    if (exitCode === EXIT_CODE) {
      setCodeModalVisible(false);
      setExitCode('');
      setCodeError(false);
      navigation.navigate('ImpostazioniStack');
    } else {
      setCodeError(true);
      setExitCode('');
      setTimeout(() => setCodeError(false), 2000);
    }
  };

  // Aggiorna il codice quando cambia
  const handleCodeChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
    setExitCode(numericText);
    setCodeError(false);
    
    // Auto-submit quando si inseriscono 4 cifre
    if (numericText.length === 4) {
      setTimeout(() => {
        console.log('Auto-validazione - Inserito:', numericText, 'Atteso:', EXIT_CODE, 'Match:', numericText === EXIT_CODE);
        if (numericText === EXIT_CODE) {
          setCodeModalVisible(false);
          setExitCode('');
          setCodeError(false);
          navigation.navigate('ImpostazioniStack');
        } else {
          setCodeError(true);
          setExitCode('');
          setTimeout(() => setCodeError(false), 2000);
        }
      }, 100);
    }
  };

  // Se è receptionist, mostra schermata QR fissa a schermo intero
  if (isReceptionist) {
    const qrSize = width * 0.5;
    
    return (
      <View style={[styles.container, styles.receptionistFullscreen, { backgroundColor: theme.background }]}>
        <StatusBar hidden />
          
          {/* Header fisso a schermo intero */}
          <LinearGradient
            colors={theme.gradients.primary}
            style={styles.receptionistHeaderFullscreen}
          >
            <Text style={styles.receptionistWelcomeText}>{getWelcomeMessage()}</Text>
            <Text style={styles.receptionistGreetingText}>{getGreetingMessage()}</Text>
            
            {/* Pulsante per uscire (semi-trasparente in alto a destra) */}
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleShowExitCode}
            >
              <Ionicons name="settings-outline" size={24} color="rgba(255, 255, 255, 0.8)" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Contenuto fisso con scroll limitato per lista */}
          <ScrollView 
            style={styles.receptionistContentFullscreen}
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.receptionistScrollContent}
          >
            {/* QR Code */}
            <View style={styles.receptionistQRCardFullscreen}>
              {qrLoading ? (
                <View style={styles.receptionistQRLoading}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.receptionistQRLoadingText, { color: theme.textSecondary }]}>
                    Caricamento QR Code...
                  </Text>
                </View>
              ) : qrData ? (
                <View style={styles.receptionistQRContainer}>
                  <QRCode
                    value={qrData}
                    size={qrSize}
                    color={theme.primary}
                    backgroundColor="transparent"
                  />
                  {lastUpdate && (
                    <Text style={[styles.receptionistQRUpdateTime, { color: theme.textTertiary }]}>
                      Aggiornato alle {formatTime(lastUpdate.toTimeString())}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.receptionistQRError}>
                  <Ionicons name="alert-circle" size={48} color={theme.error} />
                  <Text style={[styles.receptionistQRErrorText, { color: theme.text }]}>
                    Errore nel caricamento del QR code
                  </Text>
                </View>
              )}
            </View>

            {/* Ultimi Colleghi Entrati */}
            <View style={styles.receptionistRecentSection}>
              <View style={styles.receptionistSectionHeader}>
                <Ionicons name="people" size={24} color={theme.primary} />
                <Text style={[styles.receptionistSectionTitle, { color: theme.text }]}>
                  Ultimi Colleghi Entrati
                </Text>
              </View>

              {recentEntries.length > 0 ? (
                <View style={styles.receptionistEntriesCard}>
                  {recentEntries.map((entry, index) => (
                    <View
                      key={index}
                      style={[
                        styles.receptionistEntryItem,
                        index < recentEntries.length - 1 && styles.receptionistEntryItemBorder,
                      ]}
                    >
                      <View style={styles.receptionistEntryInfo}>
                        <Text style={[styles.receptionistEntryName, { color: theme.text }]}>
                          {entry.nome} {entry.cognome}
                        </Text>
                        <Text style={[styles.receptionistEntryBadge, { color: theme.textSecondary }]}>
                          Badge: {entry.badge}
                        </Text>
                      </View>
                      <View style={styles.receptionistEntryTimeContainer}>
                        {entry.uscita ? (
                          <>
                            <View style={styles.receptionistTimeRow}>
                              <Ionicons name="log-in" size={16} color={theme.success} />
                              <Text style={[styles.receptionistEntryTime, { color: theme.success }]}>
                                {formatTime(entry.entrata)}
                              </Text>
                            </View>
                            <View style={styles.receptionistTimeRow}>
                              <Ionicons name="log-out" size={16} color={theme.error} />
                              <Text style={[styles.receptionistEntryTime, { color: theme.error }]}>
                                {formatTime(entry.uscita)}
                              </Text>
                            </View>
                            <View style={[styles.receptionistCheckmark, { backgroundColor: theme.success }]}>
                              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            </View>
                          </>
                        ) : (
                          <>
                            <View style={styles.receptionistTimeRow}>
                              <Ionicons name="log-in" size={16} color={theme.primary} />
                              <Text style={[styles.receptionistEntryTime, { color: theme.primary }]}>
                                {formatTime(entry.entrata)}
                              </Text>
                            </View>
                            <View style={[styles.receptionistCheckmark, { backgroundColor: theme.warning }]}>
                              <Ionicons name="time" size={16} color="#FFFFFF" />
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.receptionistEmptyEntriesCard}>
                  <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
                  <Text style={[styles.receptionistEmptyEntriesText, { color: theme.textSecondary }]}>
                    Nessuna entrata registrata oggi
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Modal per codice di uscita */}
          <Modal
            visible={codeModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
              setCodeModalVisible(false);
              setExitCode('');
              setCodeError(false);
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.codeModalOverlay}
            >
              <TouchableOpacity
                style={styles.codeModalBackdrop}
                activeOpacity={1}
                onPress={() => {
                  setCodeModalVisible(false);
                  setExitCode('');
                  setCodeError(false);
                }}
              >
                <View style={[styles.codeModalContent, { backgroundColor: theme.card }]}>
                  <View style={styles.codeModalHeader}>
                    <Ionicons name="lock-closed" size={32} color={theme.primary} />
                    <Text style={[styles.codeModalTitle, { color: theme.text }]}>
                      Inserisci Codice
                    </Text>
                    <Text style={[styles.codeModalSubtitle, { color: theme.textSecondary }]}>
                      Inserisci il codice a 4 cifre per accedere alle impostazioni
                    </Text>
                  </View>

                  <View style={styles.codeInputContainer}>
                    <TextInput
                      style={[
                        styles.codeInput,
                        {
                          backgroundColor: theme.background,
                          color: theme.text,
                          borderColor: codeError ? theme.error : theme.border,
                        },
                      ]}
                      value={exitCode}
                      onChangeText={handleCodeChange}
                      keyboardType="number-pad"
                      maxLength={4}
                      autoFocus
                      secureTextEntry
                      placeholder="0000"
                      placeholderTextColor={theme.textTertiary}
                    />
                    {codeError && (
                      <Text style={[styles.codeErrorText, { color: theme.error }]}>
                        Codice errato, riprova
                      </Text>
                    )}
                  </View>

                  <View style={styles.codeModalActions}>
                    <TouchableOpacity
                      style={[styles.codeCancelButton, { backgroundColor: theme.background }]}
                      onPress={() => {
                        setCodeModalVisible(false);
                        setExitCode('');
                        setCodeError(false);
                      }}
                    >
                      <Text style={[styles.codeCancelText, { color: theme.textSecondary }]}>
                        Annulla
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.codeConfirmButton, { backgroundColor: theme.primary }]}
                      onPress={handleValidateCode}
                    >
                      <Text style={styles.codeConfirmText}>Conferma</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </Modal>
      </View>
    );
  }

  // Dashboard normale per altri ruoli
  const ultimaBusta = getUltimaBustaPaga();
  const documentiNuovi = getDocumentiNuovi();
  const haTimbratoOggiCompleto = haTimbratoOggi(user.id);

  // Funzioni per gestire i documenti
  const handleDocumentoPress = (doc) => {
    segnaLetto(doc.id);
    // TODO: Aprire il documento specifico
    Alert.alert('Documento', `Apertura di: ${doc.nome}`);
  };

  const handleBustaPagaPress = (busta) => {
    // TODO: Aprire la busta paga specifica
    Alert.alert('Busta Paga', `Apertura busta paga di: ${busta.mese}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      {/* Header con gradiente */}
      <LinearGradient
        colors={theme.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View entering={FadeInDown.delay(100)} style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Ciao, {user.nome}! 👋</Text>
            <Text style={styles.subtitle}>{getToday()}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Stato Timbratura */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader} key={refreshKey}>
              <View style={styles.statusInfo}>
                {(() => {
                  // Ricarica sempre i dati freschi
                  const tutteTimbrature = getAllTimbrature();
                  const oggi = new Date().toISOString().split('T')[0];
                  
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.js:555',message:'Checking turno status',data:{totalTimbrature:tutteTimbrature.length,userId:user?.id,oggi,timbratureUser:tutteTimbrature.filter(t=>t.userId===user?.id).length,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                  // #endregion
                  
                  // Verifica se c'è un turno in corso (entrata senza uscita) per oggi
                  // Nota: userId potrebbe essere stringa o ObjectId
                  const timbratureOggi = tutteTimbrature.filter(t => {
                    const userIdMatch = String(t.userId) === String(user?.id) || t.userId?._id === user?.id || t.userId === user?.id;
                    const dataMatch = t.data === oggi || (t.data && new Date(t.data).toISOString().split('T')[0] === oggi);
                    return userIdMatch && dataMatch;
                  });
                  
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.js:563',message:'Timbrature oggi filtered',data:{timbratureOggiCount:timbratureOggi.length,timbratureOggi:timbratureOggi.map(t=>({id:t.id,userId:t.userId,data:t.data,entrata:t.entrata,uscita:t.uscita})),timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                  // #endregion
                  
                  const turnoInCorso = timbratureOggi.some(t => t.entrata && !t.uscita);
                  const currentTimbrataOggi = timbratureOggi.find(t => t.entrata && !t.uscita);
                  
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.js:569',message:'Turno status check',data:{turnoInCorso,currentTimbrataOggi:currentTimbrataOggi?{id:currentTimbrataOggi.id,entrata:currentTimbrataOggi.entrata,uscita:currentTimbrataOggi.uscita}:null,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                  // #endregion
                  
                  // Se c'è un turno in corso, mostra lo stato "Turno in corso"
                  // Altrimenti mostra sempre "Scansiona per iniziare" (anche se c'è stata una timbratura completata)
                  if (turnoInCorso && currentTimbrataOggi) {
                    return (
                      <>
                        <Ionicons name="time-outline" size={28} color={theme.primary} />
                        <View style={styles.statusTextContainer}>
                          <Text style={[styles.statusTitle, { color: theme.text }]}>
                            Turno in corso
                          </Text>
                          <Text style={[styles.statusSubtitle, { color: theme.textSecondary }]}>
                            Riscansionare il codice per terminare
                          </Text>
                        </View>
                      </>
                    );
                  } else {
                    // Nessun turno in corso: mostra sempre il messaggio per iniziare
                    return (
                      <>
                        <Ionicons name="alert-circle-outline" size={28} color={theme.warning} />
                        <View style={styles.statusTextContainer}>
                          <Text style={[styles.statusTitle, { color: theme.text }]}>
                            Scansiona per iniziare il turno
                          </Text>
                          <Text style={[styles.statusSubtitle, { color: theme.textSecondary }]}>
                            Scansiona il QR code per timbrare
                          </Text>
                        </View>
                      </>
                    );
                  }
                })()}
              </View>
            </View>

            {/* Pulsante Scansiona QR Code */}
            <Button
              gradient
              onPress={handleScansionaQR}
              title="SCANSIONA QR CODE"
              variant="gradient"
              style={styles.timbraButton}
              icon={
                <Ionicons 
                  name="qr-code-outline" 
                  size={28} 
                  color="#FFFFFF" 
                />
              }
            />
          </Card>
        </Animated.View>

        {/* Sezione Ore e Turni - Layout Stupefacente */}
        <Animated.View entering={FadeInUp.delay(300)}>
          {/* Ultimi Turni Lavorati */}
          <Card style={styles.turniCard}>
            <View style={styles.turniHeader}>
              <View style={styles.turniHeaderLeft}>
                <LinearGradient
                  colors={theme.gradients.cosmic}
                  style={styles.turniIconContainer}
                >
                  <MaterialCommunityIcons name="clock-time-four" size={24} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.turniHeaderText}>
                  <Text style={[styles.turniTitle, { color: theme.text }]}>
                    Ultimi Turni
                  </Text>
                  <Text style={[styles.turniSubtitle, { color: theme.textSecondary }]}>
                    Cronologia lavorativa
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.turniLink}
                onPress={() => navigation.navigate('Turni')}
              >
                <Text style={[styles.turniLinkText, { color: theme.primary }]}>
                  Vedi tutti
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.turniList}>
              {ultimiTurni.slice(0, 2).map((turno, index) => (
                <Animated.View 
                  key={turno.id}
                  entering={FadeInUp.delay(350 + index * 100)}
                  style={styles.turnoItem}
                >
                  <View style={styles.turnoInfo}>
                    <View style={styles.turnoData}>
                      <Text style={[styles.turnoDataText, { color: theme.text }]}>
                        {new Date(turno.data).toLocaleDateString('it-IT', { 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </Text>
                      <Text style={[styles.turnoTipo, { color: theme.textSecondary }]}>
                        {turno.tipo}
                      </Text>
                    </View>
                    <View style={styles.turnoOrari}>
                      <Text style={[styles.turnoOrario, { color: theme.text }]}>
                        {turno.inizio} - {turno.fine}
                      </Text>
                      <Text style={[styles.turnoOre, { color: theme.primary }]}>
                        {turno.ore}h
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.turnoStatus, { 
                    backgroundColor: turno.tipo === 'Mattina' ? '#10B981' : 
                                   turno.tipo === 'Pomeriggio' ? '#F59E0B' : '#8B5CF6'
                  }]} />
                </Animated.View>
              ))}
            </View>
          </Card>

          {/* Grafico Ore Settimanali */}
          <Animated.View entering={FadeInUp.delay(400)}>
            <Card style={styles.chartCard}>
              <WeeklyCandlestickChart oreSettimanali={oreSettimanali} />
            </Card>
          </Animated.View>
        </Animated.View>

        {/* Notifiche/Comunicazioni */}
        {documentiNuovi.length > 0 && (
          <Animated.View entering={FadeInUp.delay(500)}>
            <Card style={styles.notificheCard}>
              <View style={styles.notificheHeader}>
                <Ionicons name="notifications" size={24} color={theme.warning} />
                <Text style={[styles.notificheTitle, { color: theme.text }]}>
                  Notifiche
                </Text>
              </View>
              {documentiNuovi.slice(0, 3).map((doc, index) => (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.notificaItem}
                  onPress={() => {
                    segnaLetto(doc.id);
                    navigation.navigate('Documenti');
                  }}
                >
                  <View style={[styles.notificaDot, { backgroundColor: theme.warning }]} />
                  <View style={styles.notificaContent}>
                    <Text style={[styles.notificaText, { color: theme.text }]}>
                      {doc.nome}
                    </Text>
                    <Text style={[styles.notificaData, { color: theme.textSecondary }]}>
                      {doc.data}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Sezione Documenti - Layout Orizzontale a Linea */}
        <Animated.View entering={FadeInUp.delay(600)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Documenti
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Documenti')}>
              <Text style={[styles.seeAllText, { color: theme.primary }]}>
                Vedi tutti →
              </Text>
            </TouchableOpacity>
          </View>

          {/* Documenti Aziendali */}
          {documenti.length > 0 && (
            <Card style={styles.documentiCard}>
              <Text style={[styles.documentiSectionTitle, { color: theme.textSecondary }]}>
                Documenti Aziendali
              </Text>
              {documenti.slice(0, 3).map((doc, index) => (
                <Animated.View 
                  key={doc.id}
                  entering={FadeInUp.delay(600 + index * 100)}
                >
                  <TouchableOpacity
                    style={styles.documentoLinea}
                    onPress={() => handleDocumentoPress(doc)}
                  >
                    <LinearGradient
                      colors={theme.gradients.emerald}
                      style={styles.documentoIconaLinea}
                    >
                      <MaterialCommunityIcons 
                        name={doc.tipo === 'Contratto' ? 'file-document-outline' : 'file-outline'} 
                        size={20} 
                        color="#FFFFFF" 
                      />
                      {doc.nuovo && (
                        <View style={styles.documentoBadgeLinea}>
                          <Text style={styles.documentoBadgeTextLinea}>!</Text>
                        </View>
                      )}
                    </LinearGradient>
                    <View style={styles.documentoInfoLinea}>
                      <Text style={[styles.documentoTitoloLinea, { color: theme.text }]} numberOfLines={1}>
                        {doc.nome}
                      </Text>
                      <Text style={[styles.documentoTipoLinea, { color: theme.textSecondary }]}>
                        {doc.tipo} • {new Date(doc.data).toLocaleDateString('it-IT')}
                      </Text>
                    </View>
                    <View style={styles.documentoActionLinea}>
                      <Ionicons name="eye-outline" size={18} color={theme.primary} />
                    </View>
                  </TouchableOpacity>
                  {index < documenti.slice(0, 3).length - 1 && (
                    <View style={[styles.documentoDivider, { backgroundColor: theme.borderLight }]} />
                  )}
                </Animated.View>
              ))}
            </Card>
          )}

          {/* Buste Paga */}
          {bustePaga.length > 0 && (
            <Card style={styles.documentiCard}>
              <Text style={[styles.documentiSectionTitle, { color: theme.textSecondary }]}>
                Buste Paga
              </Text>
              {bustePaga.slice(0, 3).map((busta, index) => (
                <Animated.View 
                  key={busta.id}
                  entering={FadeInUp.delay(700 + index * 100)}
                >
                  <TouchableOpacity
                    style={styles.documentoLinea}
                    onPress={() => handleBustaPagaPress(busta)}
                  >
                    <LinearGradient
                      colors={theme.gradients.sunset}
                      style={styles.documentoIconaLinea}
                    >
                      <MaterialCommunityIcons 
                        name="cash" 
                        size={20} 
                        color="#FFFFFF" 
                      />
                    </LinearGradient>
                    <View style={styles.documentoInfoLinea}>
                      <Text style={[styles.documentoTitoloLinea, { color: theme.text }]} numberOfLines={1}>
                        Busta Paga {busta.mese}
                      </Text>
                      <Text style={[styles.documentoTipoLinea, { color: theme.textSecondary }]}>
                        {busta.anno} • €{busta.importo}
                      </Text>
                    </View>
                    <View style={styles.documentoActionLinea}>
                      <Ionicons name="eye-outline" size={18} color={theme.primary} />
                    </View>
                  </TouchableOpacity>
                  {index < bustePaga.slice(0, 3).length - 1 && (
                    <View style={[styles.documentoDivider, { backgroundColor: theme.borderLight }]} />
                  )}
                </Animated.View>
              ))}
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  timeContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  currentTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    marginBottom: 20,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
  },
  timbraButton: {
    height: 70,
  },
  // Stili per la nuova sezione ore e turni
  turniCard: {
    marginBottom: 16,
  },
  chartCard: {
    marginBottom: 16,
  },
  turniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  turniHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  turniIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turniHeaderText: {
    gap: 2,
  },
  turniTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  turniSubtitle: {
    fontSize: 13,
  },
  turniLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  turniLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  turniList: {
    gap: 12,
  },
  turnoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    gap: 12,
  },
  turnoInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turnoData: {
    gap: 2,
  },
  turnoDataText: {
    fontSize: 15,
    fontWeight: '700',
  },
  turnoTipo: {
    fontSize: 13,
  },
  turnoOrari: {
    alignItems: 'flex-end',
    gap: 2,
  },
  turnoOrario: {
    fontSize: 14,
    fontWeight: '600',
  },
  turnoOre: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Stili per schermata Receptionist Fullscreen
  receptionistFullscreen: {
    paddingTop: 0,
  },
  receptionistHeaderFullscreen: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    minHeight: 180,
    justifyContent: 'center',
  },
  exitButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receptionistWelcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  receptionistGreetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  receptionistHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  receptionistContentFullscreen: {
    flex: 1,
  },
  receptionistScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  receptionistQRCardFullscreen: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    minHeight: 400,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  receptionistQRLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 350,
  },
  receptionistQRLoadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  receptionistQRContainer: {
    alignItems: 'center',
    width: '100%',
  },
  receptionistQRUpdateTime: {
    marginTop: 16,
    fontSize: 12,
  },
  receptionistQRError: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 350,
  },
  receptionistQRErrorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  receptionistRecentSection: {
    flex: 1,
  },
  receptionistSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  receptionistSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  receptionistEntriesCard: {
    padding: 0,
    maxHeight: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  receptionistEntryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  receptionistEntryItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  receptionistEntryInfo: {
    flex: 1,
  },
  receptionistEntryName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  receptionistEntryBadge: {
    fontSize: 12,
  },
  receptionistEntryTimeContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  receptionistTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receptionistEntryTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  receptionistCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  receptionistEmptyEntriesCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  receptionistEmptyEntriesText: {
    marginTop: 16,
    fontSize: 16,
  },
  // Stili per modal codice di uscita
  codeModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeModalBackdrop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeModalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  codeModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  codeModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  codeModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  codeInputContainer: {
    marginBottom: 24,
  },
  codeInput: {
    width: '100%',
    height: 60,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    borderRadius: 12,
    borderWidth: 2,
    letterSpacing: 8,
  },
  codeErrorText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  codeModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  codeCancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  codeConfirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  turnoStatus: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  gridItem: {
    width: (width - 56) / 2,
  },
  infoCard: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  infoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  infoSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  notificheCard: {
    marginBottom: 20,
  },
  notificheHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  notificheTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  notificaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  notificaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificaContent: {
    flex: 1,
  },
  notificaText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificaData: {
    fontSize: 13,
  },
  // Stili per la sezione documenti - Layout a Linea
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  documentiCard: {
    marginBottom: 16,
  },
  documentiSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  documentoLinea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  documentoIconaLinea: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  documentoBadgeLinea: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentoBadgeTextLinea: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  documentoInfoLinea: {
    flex: 1,
    gap: 2,
  },
  documentoTitoloLinea: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  documentoTipoLinea: {
    fontSize: 13,
    lineHeight: 16,
  },
  documentoActionLinea: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  documentoDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default DashboardScreen;

