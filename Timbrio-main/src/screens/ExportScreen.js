import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTimbrature } from '../context/TimbratureContext';
import { useTheme } from '../context/ThemeContext';
import { exportToCSV, exportToJSON, exportToText } from '../utils/exportUtils';
import { calcolaStatistiche } from '../utils/statisticsUtils';
import { getCurrentMonthRange } from '../utils/dateUtils';
import Button from '../components/Button';
import Card from '../components/Card';

/**
 * Schermata per export dati
 */
const ExportScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { getTimbratureByUserAndDateRange, getTimbratureByUser } = useTimbrature();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleExport = async (format) => {
    setLoading(true);

    try {
      // Ottieni dati mese corrente
      const { start, end } = getCurrentMonthRange();
      const timbrature = getTimbratureByUserAndDateRange(user.id, start, end);
      const stats = calcolaStatistiche(timbrature);

      let exportData;
      switch (format) {
        case 'csv':
          exportData = exportToCSV(timbrature, user);
          break;
        case 'json':
          exportData = exportToJSON(timbrature, user, stats);
          break;
        case 'text':
          exportData = exportToText(timbrature, user, stats);
          break;
        default:
          throw new Error('Formato non supportato');
      }

      if (!exportData) {
        Alert.alert('Attenzione', 'Nessun dato da esportare');
        return;
      }

      // Condividi i dati
      await Share.share({
        message: exportData.data,
        title: exportData.filename,
      });

    } catch (error) {
      console.error('Errore export:', error);
      Alert.alert('Errore', 'Impossibile esportare i dati');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export Dati</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            📊 Esporta Report
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Scarica i tuoi dati in diversi formati per archiviazione o analisi
          </Text>
        </Card>

        <Card>
          <Text style={[styles.formatTitle, { color: theme.text }]}>
            📄 CSV (Excel)
          </Text>
          <Text style={[styles.formatDescription, { color: theme.textSecondary }]}>
            Formato compatibile con Excel e fogli di calcolo
          </Text>
          <Button
            title="Esporta CSV"
            onPress={() => handleExport('csv')}
            loading={loading}
            variant="primary"
            style={styles.exportButton}
          />
        </Card>

        <Card>
          <Text style={[styles.formatTitle, { color: theme.text }]}>
            💾 JSON
          </Text>
          <Text style={[styles.formatDescription, { color: theme.textSecondary }]}>
            Formato dati strutturato per applicazioni
          </Text>
          <Button
            title="Esporta JSON"
            onPress={() => handleExport('json')}
            loading={loading}
            variant="secondary"
            style={styles.exportButton}
          />
        </Card>

        <Card>
          <Text style={[styles.formatTitle, { color: theme.text }]}>
            📝 Testo
          </Text>
          <Text style={[styles.formatDescription, { color: theme.textSecondary }]}>
            Report leggibile in formato testo
          </Text>
          <Button
            title="Esporta TXT"
            onPress={() => handleExport('text')}
            loading={loading}
            variant="secondary"
            style={styles.exportButton}
          />
        </Card>

        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            ℹ️ I dati esportati includono le timbrature del mese corrente
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  formatTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  formatDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  exportButton: {
    marginTop: 8,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ExportScreen;

