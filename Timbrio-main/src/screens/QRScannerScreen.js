import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, Camera, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTimbrature } from '../context/TimbratureContext';
import { useTheme } from '../context/ThemeContext';
import { decodeQRData, isQRTokenValid } from '../utils/qrUtils';
import { timbratureAPI, turniAPI } from '../services/api';
import { formatTime } from '../utils/dateUtils';
import { FlatList } from 'react-native';
import Card from '../components/Card';

const { width, height } = Dimensions.get('window');

const QRScannerScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { timbraDaQR, reloadTimbrature, getAllTimbrature } = useTimbrature();
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [timbratureRecenti, setTimbratureRecenti] = useState([]);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    loadTimbratureRecenti();
  }, [permission]);

  // Aggiorna le timbrature quando cambiano nel context
  const timbrature = getAllTimbrature();
  useEffect(() => {
    loadTimbratureRecenti();
  }, [timbrature.length]);

  const loadTimbratureRecenti = () => {
    const tutte = getAllTimbrature();
    // Prendi le ultime 10 timbrature ordinate per data
    const recenti = tutte
      .filter(t => t.userId === user?.id)
      .sort((a, b) => {
        const dateA = new Date(`${a.data}T${a.entrata || '00:00:00'}`);
        const dateB = new Date(`${b.data}T${b.entrata || '00:00:00'}`);
        return dateB - dateA;
      })
      .slice(0, 10);
    setTimbratureRecenti(recenti);
  };

  const handleBarCodeScanned = async ({ data }) => {
    // Previeni scansioni multiple
    if (scanned || loading || processing) return;
    
    setScanned(true);
    setLoading(true);
    setProcessing(true);

    try {
      // Decodifica dati QR
      const qrData = decodeQRData(data);
      
      if (!qrData) {
        Alert.alert('Errore', 'QR Code non valido. Assicurati di scansionare un codice Timbrio.');
        setScanned(false);
        setLoading(false);
        setProcessing(false);
        return;
      }

      // Valida token
      if (!isQRTokenValid(qrData.token, qrData.timestamp)) {
        Alert.alert('Errore', 'Token QR scaduto. Il codice è stato generato troppo tempo fa.');
        setScanned(false);
        setLoading(false);
        setProcessing(false);
        return;
      }

      // Determina l'azione in base al tipo di QR code
      let result;
      let messaggioSuccesso = '';
      
      if (qrData.action === 'turno' && qrData.turnoId) {
        // Gestione turni - Avvia/termina turno
        // Prima verifica se c'è un turno attivo
        const turniAttiviResponse = await turniAPI.getTurniAttivi();
        
        if (turniAttiviResponse.success && turniAttiviResponse.data && turniAttiviResponse.data.length > 0) {
          const turnoAttivo = turniAttiviResponse.data[0];
          
          if (turnoAttivo.stato === 'in_pausa') {
            // Riprendi turno dalla pausa
            result = await turniAPI.riprendiTurno(qrData.token);
            messaggioSuccesso = 'Turno ripreso con successo';
          } else if (turnoAttivo.stato === 'in_corso') {
            // Termina turno (riscansionato per chiudere)
            result = await turniAPI.fermaTurno(qrData.token);
            messaggioSuccesso = 'Turno terminato con successo';
          }
        } else {
          // Inizia nuovo turno
          result = await turniAPI.iniziaTurno(qrData.turnoId, qrData.token);
          messaggioSuccesso = 'Turno iniziato con successo';
        }
      } else {
        // Timbratura normale - chiama direttamente l'API del server
        try {
          const response = await timbratureAPI.timbraDaQR(qrData.token);
          result = response;
          
          if (response.success && response.data) {
            const tipo = response.data.uscita ? 'Uscita' : 'Entrata';
            const ora = response.data.uscita || response.data.entrata;
            messaggioSuccesso = `${tipo} registrata alle ${formatTime(ora)}`;
          }
        } catch (error) {
          console.error('Errore timbratura:', error);
          // Se è un errore di rate limit, riprova dopo un breve delay
          if (error.message && error.message.includes('Rate limit')) {
            console.log('Rate limit rilevato, riprovo dopo 500ms...');
            await new Promise(resolve => setTimeout(resolve, 500));
            try {
              const retryResponse = await timbratureAPI.timbraDaQR(qrData.token);
              result = retryResponse;
              if (retryResponse.success && retryResponse.data) {
                const tipo = retryResponse.data.uscita ? 'Uscita' : 'Entrata';
                const ora = retryResponse.data.uscita || retryResponse.data.entrata;
                messaggioSuccesso = `${tipo} registrata alle ${formatTime(ora)}`;
              }
            } catch (retryError) {
              result = { success: false, error: retryError.message || 'Errore durante la timbratura' };
            }
          } else {
            result = { success: false, error: error.message || 'Errore durante la timbratura' };
          }
        }
      }
      
      if (result && result.success) {
        // Aggiungi un piccolo delay per assicurarsi che il server abbia processato la richiesta
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Ricarica le timbrature dal server per aggiornare la lista
        // NON fare reload qui - sarà fatto quando si torna alla Dashboard
        loadTimbratureRecenti();
        
        // Mostra messaggio di successo e chiudi lo scanner
        Alert.alert(
          '✓ Successo',
          messaggioSuccesso,
          [
            {
              text: 'OK',
              onPress: () => {
                // Chiudi la schermata - useFocusEffect nella Dashboard farà il reload
                navigation.goBack();
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          'Errore', 
          result?.error || 'Errore durante l\'operazione',
          [
            {
              text: 'OK',
              onPress: () => {
                setScanned(false);
                setLoading(false);
                setProcessing(false);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Errore scansione QR:', error);
      Alert.alert('Errore', 'Errore durante la scansione del QR code');
      setScanned(false);
      setLoading(false);
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.background }]}>
        <Ionicons name="camera-outline" size={64} color={theme.textSecondary} />
        <Text style={[styles.permissionText, { color: theme.text }]}>
          L'applicazione ha bisogno della fotocamera per scansionare i QR code
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: theme.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Concedi Permesso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
        <Text style={styles.headerTitle}>Scansiona QR Code</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <CameraView
        style={[styles.camera, { flex: 0.6 }]}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={(scanned || loading || processing) ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleOverlay}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <Text style={styles.instructionText}>
              Posiziona il QR code all'interno del riquadro
            </Text>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.loadingText}>Elaborazione...</Text>
              </View>
            )}
          </View>
        </View>
      </CameraView>

      {!scanned && !loading && (
        <TouchableOpacity
          style={[styles.scanAgainButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            setScanned(false);
            loadTimbratureRecenti();
          }}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.scanAgainText}>Ricarica</Text>
        </TouchableOpacity>
      )}

      {/* Lista Timbrature Recenti */}
      <View style={[styles.timbratureContainer, { backgroundColor: theme.card }]}>
        <View style={styles.timbratureHeader}>
          <Ionicons name="time-outline" size={20} color={theme.text} />
          <Text style={[styles.timbratureTitle, { color: theme.text }]}>
            Timbrature Recenti
          </Text>
        </View>
        {timbratureRecenti.length > 0 ? (
          <FlatList
            data={timbratureRecenti}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.timbrataRow, { borderBottomColor: theme.border }]}>
                <View style={styles.timbrataInfo}>
                  <Text style={[styles.timbrataData, { color: theme.text }]}>
                    {new Date(item.data).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                  <View style={styles.timbrataOrari}>
                    {item.entrata && (
                      <Text style={[styles.timbrataOra, { color: theme.textSecondary }]}>
                        Entrata: {formatTime(item.entrata)}
                      </Text>
                    )}
                    {item.uscita && (
                      <Text style={[styles.timbrataOra, { color: theme.textSecondary }]}>
                        Uscita: {formatTime(item.uscita)}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={[
                  styles.timbrataStatus,
                  { backgroundColor: item.uscita ? theme.success + '20' : theme.warning + '20' }
                ]}>
                  <Text style={[
                    styles.timbrataStatusText,
                    { color: item.uscita ? theme.success : theme.warning }
                  ]}>
                    {item.uscita ? '✓' : '⏱'}
                  </Text>
                </View>
              </View>
            )}
            style={styles.timbratureList}
            contentContainerStyle={styles.timbratureListContent}
          />
        ) : (
          <View style={styles.emptyTimbrature}>
            <Text style={[styles.emptyTimbratureText, { color: theme.textSecondary }]}>
              Nessuna timbratura recente
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topOverlay: {
    flex: 1,
  },
  middleOverlay: {
    flexDirection: 'row',
    height: 250,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    marginLeft: -60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  scanAgainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timbratureContainer: {
    flex: 0.4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  timbratureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  timbratureTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  timbratureList: {
    maxHeight: height * 0.3,
  },
  timbratureListContent: {
    paddingBottom: 8,
  },
  timbrataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  timbrataInfo: {
    flex: 1,
  },
  timbrataData: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  timbrataOrari: {
    gap: 2,
  },
  timbrataOra: {
    fontSize: 12,
  },
  timbrataStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  timbrataStatusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyTimbrature: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTimbratureText: {
    fontSize: 14,
  },
});

export default QRScannerScreen;

