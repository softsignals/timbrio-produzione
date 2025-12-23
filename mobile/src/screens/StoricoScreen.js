import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTimbrature } from '../context/TimbratureContext';
import { useTheme } from '../context/ThemeContext';
import { formatDate, formatTime } from '../utils/dateUtils';

const StoricoScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { getTimbratureByUser } = useTimbrature();
  const { theme } = useTheme();
  const [selectedTimbrata, setSelectedTimbrata] = useState(null);

  const timbrature = getTimbratureByUser(user.id).sort((a, b) => 
    b.data.localeCompare(a.data)
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }]}
      onPress={() => setSelectedTimbrata(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.date, { color: theme.text }]}>
          {formatDate(item.data)}
        </Text>
        {item.tipo === 'completata' ? (
          <View style={[styles.badge, { backgroundColor: theme.success }]}>
            <Text style={styles.badgeText}>Completata</Text>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: theme.warning }]}>
            <Text style={styles.badgeText}>In Corso</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.timeRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Entrata:</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {formatTime(item.entrata)}
          </Text>
        </View>

        {item.uscita && (
          <View style={styles.timeRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Uscita:</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {formatTime(item.uscita)}
            </Text>
          </View>
        )}

        {item.oreTotali && (
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
              Ore Totali:
            </Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>
              {item.oreTotali}h
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Storico Timbrature</Text>
        <View style={styles.placeholder} />
      </View>

      {timbrature.length > 0 ? (
        <FlatList
          data={timbrature}
          renderItem={renderItem}
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

      {/* Modal Dettagli */}
      <Modal
        visible={!!selectedTimbrata}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTimbrata(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedTimbrata(null)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Dettagli Timbratura
            </Text>

            {selectedTimbrata && (
              <>
                <DetailRow
                  label="Data"
                  value={formatDate(selectedTimbrata.data)}
                  theme={theme}
                />
                <DetailRow
                  label="Entrata"
                  value={formatTime(selectedTimbrata.entrata)}
                  theme={theme}
                />
                {selectedTimbrata.uscita && (
                  <DetailRow
                    label="Uscita"
                    value={formatTime(selectedTimbrata.uscita)}
                    theme={theme}
                  />
                )}
                {selectedTimbrata.pausaInizio && (
                  <>
                    <DetailRow
                      label="Inizio Pausa"
                      value={formatTime(selectedTimbrata.pausaInizio)}
                      theme={theme}
                    />
                    {selectedTimbrata.pausaFine && (
                      <DetailRow
                        label="Fine Pausa"
                        value={formatTime(selectedTimbrata.pausaFine)}
                        theme={theme}
                      />
                    )}
                  </>
                )}
                {selectedTimbrata.oreTotali && (
                  <DetailRow
                    label="Ore Totali"
                    value={`${selectedTimbrata.oreTotali}h`}
                    theme={theme}
                    highlight
                  />
                )}
              </>
            )}

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.primary }]}
              onPress={() => setSelectedTimbrata(null)}
            >
              <Text style={styles.closeButtonText}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const DetailRow = ({ label, value, theme, highlight }) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
      {label}:
    </Text>
    <Text
      style={[
        styles.detailValue,
        { color: highlight ? theme.primary : theme.text },
        highlight && styles.detailValueHighlight
      ]}
    >
      {value}
    </Text>
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
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailValueHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
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

export default StoricoScreen;

