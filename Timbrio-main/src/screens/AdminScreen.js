import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTimbrature } from '../context/TimbratureContext';
import { useUsers } from '../context/UsersContext';
import { useTheme } from '../context/ThemeContext';
import { formatDate, formatTime } from '../utils/dateUtils';

const AdminScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { timbrature, getTimbratureByUser, getTimbratureByDate } = useTimbrature();
  const { users, loading: usersLoading, loadUsers } = useUsers();
  const { theme } = useTheme();
  const [filtroUtente, setFiltroUtente] = useState('tutti');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Verifica permessi
  if (user.ruolo !== 'admin' && user.ruolo !== 'manager') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.noAccess, { color: theme.text }]}>
          Non hai i permessi per accedere a questa sezione
        </Text>
      </View>
    );
  }

  const getTimbratureFiltrate = () => {
    if (filtroUtente === 'tutti') {
      return timbrature;
    } else {
      return getTimbratureByUser(filtroUtente);
    }
  };

  const timbratureFiltrate = getTimbratureFiltrate().sort((a, b) =>
    b.data.localeCompare(a.data)
  );

  const getUserInfo = (userId) => {
    // Cerca per _id (MongoDB) o id (locale)
    return users.find(u => String(u._id) === String(userId) || String(u.id) === String(userId));
  };

  const renderTimbratura = ({ item }) => {
    const userInfo = getUserInfo(item.userId);
    if (!userInfo) return null;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card }]}
        onPress={() => {
          setSelectedUser(userInfo);
          setShowUserModal(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.userName, { color: theme.text }]}>
              {userInfo.nome} {userInfo.cognome}
            </Text>
            <Text style={[styles.userBadge, { color: theme.textSecondary }]}>
              {userInfo.badge} • {userInfo.reparto}
            </Text>
          </View>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(item.data)}
          </Text>
        </View>

        <View style={styles.timeInfo}>
          <View style={styles.timeRow}>
            <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>
              Entrata:
            </Text>
            <Text style={[styles.timeValue, { color: theme.success }]}>
              {formatTime(item.entrata)}
            </Text>
          </View>

          {item.uscita && (
            <View style={styles.timeRow}>
              <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>
                Uscita:
              </Text>
              <Text style={[styles.timeValue, { color: theme.error }]}>
                {formatTime(item.uscita)}
              </Text>
            </View>
          )}

          {item.oreTotali && (
            <View style={styles.timeRow}>
              <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>
                Ore Totali:
              </Text>
              <Text style={[styles.timeValue, { color: theme.primary, fontWeight: 'bold' }]}>
                {item.oreTotali}h
              </Text>
            </View>
          )}
        </View>

      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard Admin</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Statistiche Generali */}
      <View style={[styles.statsContainer, { backgroundColor: theme.card }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>
            {usersData.users.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Utenti
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: theme.success }]}>
            {timbrature.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Timbrature
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: theme.warning }]}>
            {timbrature.filter(t => t.tipo === 'in_corso').length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            In Corso
          </Text>
        </View>
      </View>

      {/* Filtri */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: filtroUtente === 'tutti' ? theme.primary : theme.card,
              borderColor: theme.border
            }
          ]}
          onPress={() => setFiltroUtente('tutti')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filtroUtente === 'tutti' ? '#FFFFFF' : theme.text }
            ]}
          >
            Tutti
          </Text>
        </TouchableOpacity>

        {usersData.users.map(u => (
          <TouchableOpacity
            key={u.id}
            style={[
              styles.filterButton,
              {
                backgroundColor: filtroUtente === u.id ? theme.primary : theme.card,
                borderColor: theme.border
              }
            ]}
            onPress={() => setFiltroUtente(u.id)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filtroUtente === u.id ? '#FFFFFF' : theme.text }
              ]}
            >
              {u.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista Timbrature */}
      {timbratureFiltrate.length > 0 ? (
        <FlatList
          data={timbratureFiltrate}
          renderItem={renderTimbratura}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Nessuna timbratura trovata
          </Text>
        </View>
      )}

      {/* Modal Dettagli Utente */}
      <Modal
        visible={showUserModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {selectedUser && (
              <ScrollView>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {selectedUser.nome} {selectedUser.cognome}
                </Text>

                <View style={styles.modalSection}>
                  <InfoRow label="Email" value={selectedUser.email} theme={theme} />
                  <InfoRow label="Badge" value={selectedUser.badge} theme={theme} />
                  <InfoRow label="Ruolo" value={selectedUser.ruolo} theme={theme} />
                  <InfoRow label="Reparto" value={selectedUser.reparto} theme={theme} />
                </View>

                {selectedUser.orarioTurno && (
                  <>
                    <Text style={[styles.modalSectionTitle, { color: theme.text }]}>
                      Orario di Lavoro
                    </Text>
                    <View style={styles.modalSection}>
                      <InfoRow
                        label="Entrata"
                        value={selectedUser.orarioTurno.entrata}
                        theme={theme}
                      />
                      <InfoRow
                        label="Uscita"
                        value={selectedUser.orarioTurno.uscita}
                        theme={theme}
                      />
                      <InfoRow
                        label="Pausa"
                        value={selectedUser.orarioTurno.pausaPranzo}
                        theme={theme}
                      />
                    </View>
                  </>
                )}

                <Text style={[styles.modalSectionTitle, { color: theme.text }]}>
                  Statistiche
                </Text>
                <View style={styles.modalSection}>
                  <InfoRow
                    label="Totale Timbrature"
                    value={getTimbratureByUser(selectedUser.id).length}
                    theme={theme}
                  />
                  <InfoRow
                    label="Ore Totali"
                    value={`${getTimbratureByUser(selectedUser.id)
                      .filter(t => t.oreTotali)
                      .reduce((sum, t) => sum + parseFloat(t.oreTotali), 0)
                      .toFixed(2)}h`}
                    theme={theme}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: theme.primary }]}
                  onPress={() => setShowUserModal(false)}
                >
                  <Text style={styles.closeButtonText}>Chiudi</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const InfoRow = ({ label, value, theme }) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
      {label}:
    </Text>
    <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
  </View>
);

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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  filterScroll: {
    maxHeight: 60,
    marginTop: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userBadge: {
    fontSize: 12,
    marginTop: 4,
  },
  date: {
    fontSize: 14,
  },
  timeInfo: {
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  noAccess: {
    fontSize: 18,
    textAlign: 'center',
    padding: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  modalSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminScreen;

