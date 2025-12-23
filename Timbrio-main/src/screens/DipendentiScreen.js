import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../context/UsersContext';
import Card from '../components/Card';
import Button from '../components/Button';

const DipendentiScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { users, loading, error, loadUsers } = useUsers();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroReparto, setFiltroReparto] = useState('tutti');
  const [filtroStato, setFiltroStato] = useState('tutti');

  // Carica i dipendenti quando la schermata si monta
  useEffect(() => {
    if (user && (user.ruolo === 'admin' || user.ruolo === 'manager')) {
      loadUsers();
    }
  }, [user, loadUsers]);

  // Filtra i dipendenti in base ai filtri applicati
  const dipendentiFiltrati = users.filter((dipendente) => {
    const matchesSearch = 
      (dipendente.nome || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dipendente.cognome || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dipendente.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dipendente.badge || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesReparto = filtroReparto === 'tutti' || dipendente.reparto === filtroReparto;
    const matchesStato = filtroStato === 'tutti' || 
      (filtroStato === 'attivo' && dipendente.attivo !== false) ||
      (filtroStato === 'inattivo' && dipendente.attivo === false);
    
    return matchesSearch && matchesReparto && matchesStato;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const getReparti = () => {
    const reparti = [...new Set(users.map(d => d.reparto).filter(Boolean))];
    return reparti;
  };

  // Funzioni per gestire le azioni
  const handleGestisciDipendente = (dipendente) => {
    const dipendenteId = dipendente._id || dipendente.id;
    navigation.navigate('DipendenteDetail', { dipendenteId });
  };

  const handleCaricaDocumenti = (dipendente) => {
    Alert.alert(
      'Carica Documenti',
      `Carica documenti per ${dipendente.nome} ${dipendente.cognome}`,
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Busta Paga', onPress: () => console.log('Carica busta paga') },
        { text: 'Contratto', onPress: () => console.log('Carica contratto') },
        { text: 'Altro', onPress: () => console.log('Carica altro documento') },
      ]
    );
  };

  const handleInviaNotifica = (dipendente) => {
    Alert.alert(
      'Invia Notifica',
      `Invia notifica a ${dipendente.nome} ${dipendente.cognome}`,
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Invia', onPress: () => console.log('Invia notifica') },
      ]
    );
  };

  const renderDipendente = (dipendente, index) => {
    const dipendenteId = dipendente._id || dipendente.id;
    return (
    <Animated.View
      key={dipendenteId}
      entering={FadeInUp.delay(index * 100).springify()}
    >
      <Card style={styles.dipendenteCard}>
        <View style={styles.dipendenteHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={dipendente.attivo !== false ? theme.gradients.primary : theme.gradients.secondary}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {dipendente.nome?.charAt(0) || ''}{dipendente.cognome?.charAt(0) || ''}
              </Text>
            </LinearGradient>
            {dipendente.attivo === false && (
              <View style={[styles.statusBadge, { backgroundColor: theme.error }]}>
                <Text style={styles.statusBadgeText}>Inattivo</Text>
              </View>
            )}
          </View>
          
          <View style={styles.dipendenteInfo}>
            <Text style={[styles.dipendenteName, { color: theme.text }]}>
              {dipendente.nome} {dipendente.cognome}
            </Text>
            <Text style={[styles.dipendenteEmail, { color: theme.textSecondary }]}>
              {dipendente.email}
            </Text>
            <View style={styles.badgesContainer}>
              <View style={[styles.badge, { backgroundColor: theme.success + '20' }]}>
                <Text style={[styles.badgeText, { color: theme.success }]}>
                  {dipendente.badge}
                </Text>
              </View>
              {dipendente.reparto && (
                <View style={[styles.badge, { backgroundColor: theme.info + '20' }]}>
                  <Text style={[styles.badgeText, { color: theme.info }]}>
                    {dipendente.reparto}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.dipendenteStats}>
          {dipendente.pagaOraria && (
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="currency-eur" size={16} color={theme.textSecondary} />
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Paga oraria</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                €{dipendente.pagaOraria}
              </Text>
            </View>
          )}
          {dipendente.sede && (
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="map-marker" size={16} color={theme.textSecondary} />
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Sede</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {dipendente.sede}
              </Text>
            </View>
          )}
          {dipendente.ruolo && (
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-circle" size={16} color={theme.textSecondary} />
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Ruolo</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {dipendente.ruolo}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.dipendenteActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => handleGestisciDipendente(dipendente)}
          >
            <Ionicons name="person" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              Dettagli
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.info + '20' }]}
            onPress={() => handleCaricaDocumenti(dipendente)}
          >
            <Ionicons name="document-attach" size={20} color={theme.info} />
            <Text style={[styles.actionButtonText, { color: theme.info }]}>
              Documenti
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.warning + '20' }]}
            onPress={() => handleInviaNotifica(dipendente)}
          >
            <Ionicons name="notifications" size={20} color={theme.warning} />
            <Text style={[styles.actionButtonText, { color: theme.warning }]}>
              Notifica
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
    );
  };

  if (loading && users.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Caricamento dipendenti...
        </Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Dipendenti</Text>
        <Text style={styles.headerSubtitle}>
          Gestisci i tuoi dipendenti ({dipendentiFiltrati.length})
        </Text>
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
        {/* Search Bar */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <Card style={styles.searchCard}>
            <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Cerca per nome, email o badge..."
                placeholderTextColor={theme.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* Filtri */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <View style={styles.filtriContainer}>
            {/* Filtro Reparto */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filtroScroll}
            >
              <TouchableOpacity
                style={[
                  styles.filtroChip,
                  { 
                    backgroundColor: filtroReparto === 'tutti' ? theme.primary : theme.card,
                    borderColor: theme.border,
                  }
                ]}
                onPress={() => setFiltroReparto('tutti')}
              >
                <Text style={[
                  styles.filtroText,
                  { color: filtroReparto === 'tutti' ? '#FFFFFF' : theme.text }
                ]}>
                  Tutti i reparti
                </Text>
              </TouchableOpacity>
              {getReparti().map(reparto => (
                <TouchableOpacity
                  key={reparto}
                  style={[
                    styles.filtroChip,
                    { 
                      backgroundColor: filtroReparto === reparto ? theme.primary : theme.card,
                      borderColor: theme.border,
                    }
                  ]}
                  onPress={() => setFiltroReparto(reparto)}
                >
                  <Text style={[
                    styles.filtroText,
                    { color: filtroReparto === reparto ? '#FFFFFF' : theme.text }
                  ]}>
                    {reparto}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filtro Stato */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filtroScroll}
            >
              {['tutti', 'attivo', 'inattivo'].map(stato => (
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
                    {stato.charAt(0).toUpperCase() + stato.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        {/* Lista Dipendenti */}
        <View style={styles.listaContainer}>
          {error && (
            <Card style={styles.errorCard}>
              <Ionicons name="alert-circle" size={24} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>
                {error}
              </Text>
              <Button
                title="Riprova"
                onPress={loadUsers}
                style={styles.retryButton}
              />
            </Card>
          )}

          {!error && dipendentiFiltrati.length > 0 ? (
            dipendentiFiltrati.map((dipendente, index) => renderDipendente(dipendente, index))
          ) : !error ? (
            <Animated.View entering={FadeInUp.delay(300)}>
              <Card style={styles.emptyCard}>
                <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Nessun dipendente trovato
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
                  {searchQuery || filtroReparto !== 'tutti' || filtroStato !== 'tutti'
                    ? 'Prova a modificare i filtri di ricerca'
                    : 'Inizia aggiungendo il primo dipendente'}
                </Text>
              </Card>
            </Animated.View>
          ) : null}
        </View>

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
    marginTop: 16,
  },
  searchCard: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filtriContainer: {
    gap: 12,
    marginBottom: 20,
  },
  filtroScroll: {
    marginBottom: 8,
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
  listaContainer: {
    marginBottom: 20,
  },
  dipendenteCard: {
    marginBottom: 16,
  },
  dipendenteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dipendenteInfo: {
    flex: 1,
  },
  dipendenteName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  dipendenteEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dipendenteStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  dipendenteActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default DipendentiScreen;
