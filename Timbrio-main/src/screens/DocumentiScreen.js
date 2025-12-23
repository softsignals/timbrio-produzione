import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDocumenti } from '../context/DocumentiContext';
import { useComunicazioni } from '../context/ComunicazioniContext';
import Card from '../components/Card';

const { width } = Dimensions.get('window');

const PRIORITA_COLORS = {
  alta: '#EF4444',
  normale: '#3B82F6',
  bassa: '#6B7280',
};

const TIPO_ICONS = {
  Comunicazione: 'megaphone-outline',
  Documento: 'document-text-outline',
  Circolare: 'newspaper-outline',
  Avviso: 'warning-outline',
  Procedura: 'list-outline',
};

const DocumentiScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { documenti, bustePaga, segnaLetto, refresh: refreshDocumenti, refreshing: refreshingDocumenti } = useDocumenti();
  const {
    comunicazioni,
    loading: loadingComunicazioni,
    refreshing: refreshingComunicazioni,
    refresh: refreshComunicazioni,
    segnaComeLetta,
    getConfermeLettura,
    eliminaComunicazione,
    downloadFile,
    countNonLette,
    isManagerOrAdmin,
  } = useComunicazioni();
  
  const [annoSelezionato, setAnnoSelezionato] = useState(2025);
  const [searchQuery, setSearchQuery] = useState('');
  const [importiVisibili, setImportiVisibili] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState('tutti'); // 'tutti', 'documenti', 'buste', 'comunicazioni'

  // Modal per comunicazione selezionata
  const [selectedComunicazione, setSelectedComunicazione] = useState(null);
  const [showLetture, setShowLetture] = useState(false);
  const [lettureData, setLettureData] = useState(null);
  const [loadingLetture, setLoadingLetture] = useState(false);

  // Filtra documenti per anno e ricerca
  const documentiAnno = documenti.filter(d => {
    const matchAnno = new Date(d.data).getFullYear() === annoSelezionato;
    const matchSearch = !searchQuery || 
      d.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tipo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchAnno && matchSearch;
  });

  // Filtra buste paga per anno e ricerca
  const bustePagaAnno = bustePaga.filter(b => {
    const matchAnno = b.anno === annoSelezionato;
    const matchSearch = !searchQuery || 
      b.mese.toLowerCase().includes(searchQuery.toLowerCase());
    return matchAnno && matchSearch;
  });

  // Filtra comunicazioni per ricerca
  const comunicazioniFiltrate = comunicazioni.filter(c => {
    if (!searchQuery) return true;
    return c.titolo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.descrizione?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Ordina comunicazioni: priorità alta prima, poi non lette
  const comunicazioniOrdinate = [...comunicazioniFiltrate].sort((a, b) => {
    if (a.priorita === 'alta' && b.priorita !== 'alta') return -1;
    if (b.priorita === 'alta' && a.priorita !== 'alta') return 1;
    if (!a.letta && b.letta) return -1;
    if (a.letta && !b.letta) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Calcola totale stipendi anno
  const totaleStipendi = bustePagaAnno.reduce((sum, b) => sum + (b.importo || 0), 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshComunicazioni(), refreshDocumenti()]);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleDocumentoPress = async (doc) => {
    if (doc.nuovo) {
      await segnaLetto(doc.id);
    }
    Alert.alert('Documento', `Apertura: ${doc.nome}`);
  };

  const handleBustaPagaPress = async (busta) => {
    if (busta.nuovo) {
      await segnaLetto(busta.id);
    }
    Alert.alert('Busta Paga', `Apertura busta paga: ${busta.mese} ${busta.anno}`);
  };

  const handleComunicazionePress = async (comunicazione) => {
    setSelectedComunicazione(comunicazione);
    if (!comunicazione.letta) {
      await segnaComeLetta(comunicazione.id);
    }
  };

  const handleDownload = async () => {
    if (!selectedComunicazione?.file_path) return;
    try {
      const result = await downloadFile(selectedComunicazione.file_path);
      if (result.success) {
        await Linking.openURL(result.data.url);
      } else {
        Alert.alert('Errore', 'Impossibile scaricare il file');
      }
    } catch (error) {
      Alert.alert('Errore', 'Errore durante il download');
    }
  };

  const handleViewLetture = async () => {
    if (!selectedComunicazione) return;
    setLoadingLetture(true);
    setShowLetture(true); // Mostra subito la vista letture
    try {
      const result = await getConfermeLettura(selectedComunicazione.id);
      if (result.success) {
        setLettureData(result.data);
      } else {
        Alert.alert('Errore', 'Impossibile caricare le conferme di lettura');
        setShowLetture(false); // Torna indietro in caso di errore
      }
    } catch (error) {
      Alert.alert('Errore', error.message);
      setShowLetture(false);
    } finally {
      setLoadingLetture(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedComunicazione(null);
    setShowLetture(false);
    setLettureData(null);
  };

  const handleBackFromLetture = () => {
    setShowLetture(false);
    setLettureData(null);
  };

  const handleDeleteComunicazione = () => {
    Alert.alert(
      'Elimina Comunicazione',
      'Sei sicuro di voler eliminare questa comunicazione?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            const result = await eliminaComunicazione(selectedComunicazione.id);
            if (result.success) {
              setSelectedComunicazione(null);
              Alert.alert('Successo', 'Comunicazione eliminata');
            } else {
              Alert.alert('Errore', result.error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const anni = [2025, 2024, 2023];

  const renderComunicazioneItem = (comunicazione, index, total) => (
    <TouchableOpacity
      key={comunicazione.id}
      style={[
        styles.documentoItem,
        index < total - 1 && styles.documentoItemBorder,
        !comunicazione.letta && styles.comunicazioneNonLetta,
      ]}
      onPress={() => handleComunicazionePress(comunicazione)}
    >
      <View style={[
        styles.documentoIcona,
        { backgroundColor: PRIORITA_COLORS[comunicazione.priorita] + '20' }
      ]}>
        <Ionicons
          name={TIPO_ICONS[comunicazione.tipo] || 'megaphone-outline'}
          size={20}
          color={PRIORITA_COLORS[comunicazione.priorita]}
        />
        {!comunicazione.letta && (
          <View style={styles.badgeNuovo}>
            <Text style={styles.badgeText}>!</Text>
          </View>
        )}
      </View>
      <View style={styles.documentoInfo}>
        <View style={styles.comunicazioneTitleRow}>
          <Text style={[styles.documentoNome, { color: theme.text }]} numberOfLines={1}>
            {comunicazione.titolo}
          </Text>
          {comunicazione.priorita === 'alta' && (
            <Ionicons name="alert-circle" size={16} color={PRIORITA_COLORS.alta} />
          )}
        </View>
        <Text style={[styles.documentoMeta, { color: theme.textSecondary }]}>
          {comunicazione.tipo} • {formatDate(comunicazione.created_at)}
        </Text>
        {comunicazione.creatore && (
          <Text style={[styles.creatoDa, { color: theme.textTertiary }]}>
            Da: {comunicazione.creatore.nome} {comunicazione.creatore.cognome}
          </Text>
        )}
      </View>
      <View style={styles.comunicazioneIcons}>
        {comunicazione.file_path && (
          <Ionicons name="attach" size={16} color={theme.textTertiary} />
        )}
        {comunicazione.richiede_conferma && (
          <Ionicons name="checkmark-circle-outline" size={16} color={theme.primary} />
        )}
        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  // Singolo modal con due viste: dettagli e conferme lettura
  const renderComunicazioneModal = () => (
    <Modal
      visible={!!selectedComunicazione}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={showLetture ? handleBackFromLetture : handleCloseModal}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        {/* Header dinamico in base alla vista */}
        <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={showLetture ? handleBackFromLetture : handleCloseModal}>
            <Ionicons name={showLetture ? "arrow-back" : "close"} size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {showLetture ? 'Conferme di Lettura' : 'Dettaglio'}
          </Text>
          {!showLetture && user?.ruolo === 'admin' ? (
            <TouchableOpacity onPress={handleDeleteComunicazione}>
              <Ionicons name="trash-outline" size={24} color={theme.error} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}
        </View>

        {/* Vista Conferme di Lettura */}
        {showLetture ? (
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {loadingLetture ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Caricamento conferme...
                </Text>
              </View>
            ) : lettureData ? (
              <>
                {/* Stats */}
                <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: theme.primary }]}>
                        {lettureData.totale_destinatari}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                        Destinatari
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: theme.success }]}>
                        {lettureData.totale_letture}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                        Letture
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: theme.warning }]}>
                        {lettureData.percentuale}%
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                        Completamento
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
                  Dettaglio Destinatari
                </Text>
                
                {lettureData.destinatari && lettureData.destinatari.length > 0 ? (
                  lettureData.destinatari.map((item, index) => (
                    <View 
                      key={item.user?.id || index} 
                      style={[styles.destinatarioCard, { backgroundColor: theme.card }]}
                    >
                      <View style={styles.destinatarioRow}>
                        <View style={[
                          styles.statusIcon,
                          { backgroundColor: item.letto ? theme.success : theme.error }
                        ]}>
                          <Ionicons
                            name={item.letto ? 'checkmark' : 'close'}
                            size={14}
                            color="#FFFFFF"
                          />
                        </View>
                        <View style={styles.destinatarioInfo}>
                          <Text style={[styles.destinatarioNome, { color: theme.text }]}>
                            {item.user?.nome || 'N/A'} {item.user?.cognome || ''}
                          </Text>
                          <Text style={[styles.destinatarioEmail, { color: theme.textSecondary }]}>
                            {item.user?.email || 'Email non disponibile'}
                          </Text>
                        </View>
                        {item.letto && item.letto_il && (
                          <Text style={[styles.lettoIl, { color: theme.textTertiary }]}>
                            {formatDate(item.letto_il)}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyLetture}>
                    <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
                    <Text style={[styles.emptyLettureText, { color: theme.textSecondary }]}>
                      Nessun destinatario trovato
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyLetture}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
                <Text style={[styles.emptyLettureText, { color: theme.textSecondary }]}>
                  Impossibile caricare i dati
                </Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        ) : (
          /* Vista Dettagli Comunicazione */
          selectedComunicazione && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={[
                styles.prioritaBadge,
                { backgroundColor: PRIORITA_COLORS[selectedComunicazione.priorita] }
              ]}>
                <Text style={styles.prioritaBadgeText}>
                  {selectedComunicazione.priorita?.toUpperCase() || 'NORMALE'}
                </Text>
              </View>

              <Text style={[styles.detailTitolo, { color: theme.text }]}>
                {selectedComunicazione.titolo}
              </Text>

              <View style={styles.detailMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="folder-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {selectedComunicazione.tipo}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {formatDate(selectedComunicazione.created_at)}
                  </Text>
                </View>
                {selectedComunicazione.creatore && (
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                      {selectedComunicazione.creatore.nome} {selectedComunicazione.creatore.cognome}
                    </Text>
                  </View>
                )}
              </View>

              {selectedComunicazione.descrizione && (
                <View style={[styles.descriptionCard, { backgroundColor: theme.card }]}>
                  <Text style={[styles.descriptionText, { color: theme.text }]}>
                    {selectedComunicazione.descrizione}
                  </Text>
                </View>
              )}

              {selectedComunicazione.file_path && (
                <TouchableOpacity onPress={handleDownload} activeOpacity={0.7}>
                  <View style={[styles.fileCard, { backgroundColor: theme.card, borderColor: theme.primary }]}>
                    <Ionicons name="document-attach" size={24} color={theme.primary} />
                    <View style={styles.fileInfo}>
                      <Text style={[styles.fileName, { color: theme.text }]}>File allegato</Text>
                      <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                        Tocca per scaricare
                      </Text>
                    </View>
                    <Ionicons name="download-outline" size={24} color={theme.primary} />
                  </View>
                </TouchableOpacity>
              )}

              {selectedComunicazione.richiede_conferma && (
                <View style={[styles.confermaBox, { backgroundColor: theme.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                  <Text style={[styles.confermaText, { color: theme.success }]}>
                    Conferma di lettura richiesta
                  </Text>
                </View>
              )}

              {isManagerOrAdmin && (
                <TouchableOpacity
                  style={[styles.lettureButton, { backgroundColor: theme.primary }]}
                  onPress={handleViewLetture}
                  activeOpacity={0.7}
                >
                  <Ionicons name="eye" size={20} color="#FFFFFF" />
                  <Text style={styles.lettureButtonText}>Visualizza Conferme di Lettura</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          )
        )}
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.secondary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Documenti</Text>
            <Text style={styles.headerSubtitle}>
              Documenti e comunicazioni aziendali
            </Text>
          </View>
          <View style={styles.headerButtons}>
            {isManagerOrAdmin && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('NuovaComunicazione')}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setImportiVisibili(!importiVisibili)}
            >
              <Ionicons 
                name={importiVisibili ? 'eye' : 'eye-off'} 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Selettore Anno (per documenti) */}
        {tipoFiltro !== 'comunicazioni' && (
          <View style={styles.annoSelector}>
            {anni.map(anno => (
              <TouchableOpacity
                key={anno}
                style={[
                  styles.annoButton,
                  annoSelezionato === anno && styles.annoButtonActive
                ]}
                onPress={() => setAnnoSelezionato(anno)}
              >
                <Text style={[
                  styles.annoText,
                  annoSelezionato === anno && styles.annoTextActive
                ]}>
                  {anno}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || refreshingComunicazioni || refreshingDocumenti}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Barra di ricerca */}
        <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
          <Ionicons name="search" size={20} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cerca documenti..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtri */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtriScroll}>
          <View style={styles.filtriContainer}>
            {[
              { key: 'tutti', label: 'Tutti' },
              { key: 'comunicazioni', label: 'Comunicazioni', badge: countNonLette },
              { key: 'documenti', label: 'Documenti' },
              { key: 'buste', label: 'Buste Paga' },
            ].map(filtro => (
              <TouchableOpacity
                key={filtro.key}
                style={[
                  styles.filtroButton,
                  { backgroundColor: tipoFiltro === filtro.key ? theme.primary : theme.card }
                ]}
                onPress={() => setTipoFiltro(filtro.key)}
              >
                <Text style={[
                  styles.filtroText,
                  { color: tipoFiltro === filtro.key ? '#FFFFFF' : theme.text }
                ]}>
                  {filtro.label}
                </Text>
                {filtro.badge > 0 && tipoFiltro !== filtro.key && !selectedComunicazione && (
                  <View style={styles.filtroBadge}>
                    <Text style={styles.filtroBadgeText}>{filtro.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Comunicazioni Aziendali */}
        {(tipoFiltro === 'tutti' || tipoFiltro === 'comunicazioni') && comunicazioniOrdinate.length > 0 && (
          <Animated.View entering={FadeInUp.delay(100)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Comunicazioni Aziendali
              </Text>
              {countNonLette > 0 && !selectedComunicazione && (
                <View style={[styles.sectionBadge, { backgroundColor: theme.error }]}>
                  <Text style={styles.sectionBadgeText}>{countNonLette} nuove</Text>
                </View>
              )}
            </View>
            <Card style={styles.listaCard} pressableChildren>
              {comunicazioniOrdinate.map((com, index) => 
                renderComunicazioneItem(com, index, comunicazioniOrdinate.length)
              )}
            </Card>
          </Animated.View>
        )}

        {/* Riepilogo Buste Paga */}
        {(tipoFiltro === 'tutti' || tipoFiltro === 'buste') && bustePagaAnno.length > 0 && (
          <Animated.View entering={FadeInUp.delay(150)}>
            <Card style={styles.riepilogoCard}>
              <LinearGradient
                colors={theme.gradients.sunset}
                style={styles.riepilogoGradient}
              >
                <View style={styles.riepilogoHeader}>
                  <MaterialCommunityIcons name="cash-multiple" size={24} color="#FFFFFF" />
                  <Text style={styles.riepilogoTitle}>Riepilogo {annoSelezionato}</Text>
                </View>
                <View style={styles.riepilogoContent}>
                  <Text style={styles.riepilogoLabel}>Totale Stipendi</Text>
                  <Text style={styles.riepilogoValue}>
                    {importiVisibili ? `€ ${totaleStipendi.toLocaleString('it-IT')}` : '€ ••••••'}
                  </Text>
                  <Text style={styles.riepilogoCount}>
                    {bustePagaAnno.length} buste paga
                  </Text>
                </View>
              </LinearGradient>
            </Card>
          </Animated.View>
        )}

        {/* Buste Paga */}
        {(tipoFiltro === 'tutti' || tipoFiltro === 'buste') && bustePagaAnno.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200)}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Buste Paga {annoSelezionato}
            </Text>
            <Card style={styles.listaCard} pressableChildren>
              {bustePagaAnno.map((busta, index) => (
                <TouchableOpacity
                  key={busta.id}
                  style={[
                    styles.documentoItem,
                    index < bustePagaAnno.length - 1 && styles.documentoItemBorder
                  ]}
                  onPress={() => handleBustaPagaPress(busta)}
                >
                  <LinearGradient
                    colors={theme.gradients.sunset}
                    style={styles.documentoIcona}
                  >
                    <MaterialCommunityIcons name="file-document" size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.documentoInfo}>
                    <Text style={[styles.documentoNome, { color: theme.text }]}>
                      Busta Paga {busta.mese}
                    </Text>
                    <Text style={[styles.documentoMeta, { color: theme.textSecondary }]}>
                      {busta.anno}
                    </Text>
                  </View>
                  <View style={styles.documentoImporto}>
                    <Text style={[styles.importoText, { color: theme.success }]}>
                      {importiVisibili ? `€ ${busta.importo?.toLocaleString('it-IT')}` : '€ ••••'}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Documenti Aziendali */}
        {(tipoFiltro === 'tutti' || tipoFiltro === 'documenti') && documentiAnno.length > 0 && (
          <Animated.View entering={FadeInUp.delay(250)}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Documenti {annoSelezionato}
            </Text>
            <Card style={styles.listaCard} pressableChildren>
              {documentiAnno.map((doc, index) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.documentoItem,
                    index < documentiAnno.length - 1 && styles.documentoItemBorder
                  ]}
                  onPress={() => handleDocumentoPress(doc)}
                >
                  <LinearGradient
                    colors={theme.gradients.emerald}
                    style={styles.documentoIcona}
                  >
                    <MaterialCommunityIcons 
                      name={doc.tipo === 'Contratto' ? 'file-sign' : 'file-document-outline'} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                    {doc.nuovo && (
                      <View style={styles.badgeNuovo}>
                        <Text style={styles.badgeText}>!</Text>
                      </View>
                    )}
                  </LinearGradient>
                  <View style={styles.documentoInfo}>
                    <Text style={[styles.documentoNome, { color: theme.text }]} numberOfLines={1}>
                      {doc.nome}
                    </Text>
                    <Text style={[styles.documentoMeta, { color: theme.textSecondary }]}>
                      {doc.tipo} • {new Date(doc.data).toLocaleDateString('it-IT')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Empty State */}
        {((tipoFiltro === 'tutti' && documentiAnno.length === 0 && bustePagaAnno.length === 0 && comunicazioniOrdinate.length === 0) ||
          (tipoFiltro === 'documenti' && documentiAnno.length === 0) ||
          (tipoFiltro === 'buste' && bustePagaAnno.length === 0) ||
          (tipoFiltro === 'comunicazioni' && comunicazioniOrdinate.length === 0)) && (
          <Animated.View entering={FadeInDown} style={styles.emptyState}>
            <MaterialCommunityIcons 
              name={tipoFiltro === 'comunicazioni' ? 'mailbox-open-outline' : 'file-document-outline'} 
              size={64} 
              color={theme.textTertiary} 
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {tipoFiltro === 'comunicazioni' ? 'Nessuna comunicazione' : 'Nessun documento'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {tipoFiltro === 'comunicazioni' 
                ? 'Non ci sono comunicazioni disponibili'
                : `Non ci sono documenti per l'anno ${annoSelezionato}`}
            </Text>
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {renderComunicazioneModal()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  annoSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  annoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  annoButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  annoText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  annoTextActive: {
    color: '#0EA5E9',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtriScroll: {
    marginBottom: 20,
  },
  filtriContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filtroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filtroText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filtroBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filtroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  riepilogoCard: {
    marginBottom: 20,
    padding: 0,
    overflow: 'hidden',
  },
  riepilogoGradient: {
    padding: 20,
  },
  riepilogoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  riepilogoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  riepilogoContent: {
    alignItems: 'center',
  },
  riepilogoLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  riepilogoValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  riepilogoCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  listaCard: {
    marginBottom: 20,
    padding: 0,
  },
  documentoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  documentoItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  comunicazioneNonLetta: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  documentoIcona: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNuovo: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  documentoInfo: {
    flex: 1,
  },
  comunicazioneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  documentoNome: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    flex: 1,
  },
  documentoMeta: {
    fontSize: 13,
  },
  creatoDa: {
    fontSize: 12,
    marginTop: 2,
  },
  comunicazioneIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  documentoImporto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importoText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  prioritaBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  prioritaBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  detailTitolo: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  detailMeta: {
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
  },
  descriptionCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 16,
    borderRadius: 12,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  confermaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  confermaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lettureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  lettureButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Letture Modal
  statsCard: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  destinatarioCard: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  destinatarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  destinatarioInfo: {
    flex: 1,
  },
  destinatarioNome: {
    fontSize: 15,
    fontWeight: '600',
  },
  destinatarioEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  lettoIl: {
    fontSize: 11,
  },
  // Loading e Empty states per letture
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyLetture: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyLettureText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default DocumentiScreen;
