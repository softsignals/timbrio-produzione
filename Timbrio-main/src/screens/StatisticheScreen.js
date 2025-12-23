import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTimbrature } from '../context/TimbratureContext';
import { useTheme } from '../context/ThemeContext';
import { getCurrentWeekRange, getCurrentMonthRange } from '../utils/dateUtils';
import { calcolaStatistiche, generaReportMensile } from '../utils/statisticsUtils';

const { width } = Dimensions.get('window');

const StatisticheScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { getTimbratureByUser, getTimbratureByUserAndDateRange } = useTimbrature();
  const { theme } = useTheme();
  const [periodo, setPeriodo] = useState('settimana'); // settimana, mese, tutto

  const getTimbratureFiltrate = () => {
    if (periodo === 'settimana') {
      const { start, end } = getCurrentWeekRange();
      return getTimbratureByUserAndDateRange(user.id, start, end);
    } else if (periodo === 'mese') {
      const { start, end } = getCurrentMonthRange();
      return getTimbratureByUserAndDateRange(user.id, start, end);
    } else {
      return getTimbratureByUser(user.id);
    }
  };

  const timbrature = getTimbratureFiltrate();
  const oreLavorativePreviste = 8; // Da prendere dal profilo utente
  const stats = calcolaStatistiche(timbrature, oreLavorativePreviste);
  const reportMensile = generaReportMensile(getTimbratureByUser(user.id), oreLavorativePreviste);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistiche</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Filtro Periodo */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: periodo === 'settimana' ? theme.primary : theme.card }
            ]}
            onPress={() => setPeriodo('settimana')}
          >
            <Text
              style={[
                styles.filterText,
                { color: periodo === 'settimana' ? '#FFFFFF' : theme.text }
              ]}
            >
              Settimana
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: periodo === 'mese' ? theme.primary : theme.card }
            ]}
            onPress={() => setPeriodo('mese')}
          >
            <Text
              style={[
                styles.filterText,
                { color: periodo === 'mese' ? '#FFFFFF' : theme.text }
              ]}
            >
              Mese
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: periodo === 'tutto' ? theme.primary : theme.card }
            ]}
            onPress={() => setPeriodo('tutto')}
          >
            <Text
              style={[
                styles.filterText,
                { color: periodo === 'tutto' ? '#FFFFFF' : theme.text }
              ]}
            >
              Tutto
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card Statistiche */}
        <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Riepilogo {periodo === 'settimana' ? 'Settimanale' : periodo === 'mese' ? 'Mensile' : 'Totale'}
          </Text>

          <View style={styles.statsGrid}>
            <StatItem
              icon="📅"
              label="Giorni Lavorati"
              value={stats.totaleDays}
              theme={theme}
            />
            <StatItem
              icon="⏰"
              label="Ore Totali"
              value={`${stats.totaleOre}h`}
              theme={theme}
            />
            <StatItem
              icon="📊"
              label="Media Giornaliera"
              value={`${stats.mediaOreGiorno}h`}
              theme={theme}
            />
            <StatItem
              icon="⚡"
              label="Straordinari"
              value={`${stats.straordinari}h`}
              theme={theme}
              highlight={parseFloat(stats.straordinari) > 0}
            />
            <StatItem
              icon="⏱️"
              label="Ritardi"
              value={stats.ritardi}
              theme={theme}
              warning={stats.ritardi > 0}
            />
            <StatItem
              icon="❌"
              label="Assenze"
              value={stats.assenze}
              theme={theme}
            />
          </View>
        </View>

        {/* Report Mensili */}
        {periodo === 'tutto' && reportMensile.length > 0 && (
          <View style={[styles.reportCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Report Mensili
            </Text>

            {reportMensile.map((report, index) => (
              <View key={index} style={[styles.reportRow, { borderBottomColor: theme.border }]}>
                <View style={styles.reportHeader}>
                  <Text style={[styles.reportPeriodo, { color: theme.text }]}>
                    {report.periodo}
                  </Text>
                  <Text style={[styles.reportOre, { color: theme.primary }]}>
                    {report.totaleOre}h
                  </Text>
                </View>
                <View style={styles.reportDetails}>
                  <Text style={[styles.reportDetail, { color: theme.textSecondary }]}>
                    {report.totaleDays} giorni • Media {report.mediaOreGiorno}h/giorno
                  </Text>
                  {parseFloat(report.straordinari) > 0 && (
                    <Text style={[styles.reportDetail, { color: theme.success }]}>
                      ⚡ {report.straordinari}h straordinari
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Info Turno */}
        {user.orarioTurno && (
          <View style={[styles.turnoCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Il Tuo Turno
            </Text>
            <View style={styles.turnoInfo}>
              <View style={styles.turnoRow}>
                <Text style={[styles.turnoLabel, { color: theme.textSecondary }]}>
                  Entrata:
                </Text>
                <Text style={[styles.turnoValue, { color: theme.text }]}>
                  {user.orarioTurno.entrata}
                </Text>
              </View>
              <View style={styles.turnoRow}>
                <Text style={[styles.turnoLabel, { color: theme.textSecondary }]}>
                  Uscita:
                </Text>
                <Text style={[styles.turnoValue, { color: theme.text }]}>
                  {user.orarioTurno.uscita}
                </Text>
              </View>
              <View style={styles.turnoRow}>
                <Text style={[styles.turnoLabel, { color: theme.textSecondary }]}>
                  Pausa Pranzo:
                </Text>
                <Text style={[styles.turnoValue, { color: theme.text }]}>
                  {user.orarioTurno.pausaPranzo}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const StatItem = ({ icon, label, value, theme, highlight, warning }) => (
  <View style={styles.statItem}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    <Text
      style={[
        styles.statValue,
        {
          color: warning
            ? theme.error
            : highlight
            ? theme.success
            : theme.text
        }
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
  content: {
    flex: 1,
    padding: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: (width - 76) / 3,
    alignItems: 'center',
    padding: 12,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  reportCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportPeriodo: {
    fontSize: 16,
    fontWeight: '600',
  },
  reportOre: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportDetails: {
    gap: 4,
  },
  reportDetail: {
    fontSize: 14,
  },
  turnoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  turnoInfo: {
    gap: 12,
  },
  turnoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turnoLabel: {
    fontSize: 16,
  },
  turnoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StatisticheScreen;

