import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const WeeklyCandlestickChart = ({ oreSettimanali }) => {
  const { theme } = useTheme();

  const giorniSettimana = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  const oggi = new Date();
  const currentDayIndex = (oggi.getDay() + 6) % 7; // Lunedì = 0, Domenica = 6

  // Calcola i dati per ogni giorno della settimana
  const datiGiorni = giorniSettimana.map((giorno, index) => {
    const dataGiorno = new Date(oggi);
    dataGiorno.setDate(oggi.getDate() - currentDayIndex + index);
    const dataKey = dataGiorno.toDateString();
    const ore = oreSettimanali.find(item => item.data === dataKey)?.oreTotali || 0;
    const oreNum = parseFloat(ore);
    
    return {
      giorno,
      ore: oreNum,
      isToday: index === currentDayIndex,
      isWeekend: index >= 5, // Sabato e Domenica
      isFuture: index > currentDayIndex,
    };
  });

  // Calcola statistiche
  const oreTotali = datiGiorni.reduce((sum, day) => sum + day.ore, 0);
  const giorniLavorati = datiGiorni.filter(day => day.ore > 0 && !day.isWeekend).length;
  const mediaGiornaliera = giorniLavorati > 0 ? oreTotali / giorniLavorati : 0;

  const maxOre = Math.max(8, ...datiGiorni.map(d => d.ore));

  return (
    <View style={styles.container}>
      {/* Header elegante con gradiente */}
      <LinearGradient
        colors={[theme.primary + '10', theme.primary + '05']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
              <MaterialCommunityIcons name="chart-line" size={20} color={theme.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Performance Settimanale
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Ultimi 7 giorni lavorativi
              </Text>
            </View>
          </View>
          
        </View>
      </LinearGradient>

      {/* Statistiche avanzate */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.success + '10' }]}>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: theme.text }]}>{oreTotali.toFixed(1)}h</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Totale</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.info + '10' }]}>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: theme.text }]}>{giorniLavorati}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Giorni</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.warning + '10' }]}>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: theme.text }]}>{mediaGiornaliera.toFixed(1)}h</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Media</Text>
            </View>
          </View>
        </View>
      </View>

        {/* Grafico a candele migliorato */}
        <View style={styles.chartSection}>
          <View style={styles.chart}>
          {/* Candele per ogni giorno */}
          {datiGiorni.map((giorno, index) => {
            const height = (giorno.ore / maxOre) * 100;
            const isActive = giorno.ore > 0;
            
            return (
              <View key={giorno.giorno} style={styles.candleContainer}>
                {/* Candela con gradiente blu */}
                <View style={[
                  styles.candle,
                  {
                    height: `${Math.max(height, 4)}%`,
                    opacity: giorno.isFuture ? 0.3 : 1,
                  }
                ]}>
                  {isActive && (
                    <LinearGradient
                      colors={
                        giorno.isFuture 
                          ? [theme.borderLight, theme.borderLight]
                          : [theme.primary, theme.primary + 'CC']
                      }
                      style={styles.candleGradient}
                    />
                  )}
                  
                  {/* Indicatore ore */}
                  {giorno.ore > 0 && (
                    <View style={[styles.oreIndicator, { 
                      backgroundColor: giorno.isFuture ? theme.borderLight : theme.card 
                    }]}>
                      <Text style={[styles.oreText, { 
                        color: giorno.isFuture ? theme.textTertiary : theme.text 
                      }]}>
                        {giorno.ore.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Label giorno con stile migliorato */}
                <View style={[
                  styles.dayLabelContainer,
                  { backgroundColor: giorno.isToday ? theme.primary + '20' : 'transparent' }
                ]}>
                  <Text style={[
                    styles.dayLabel,
                    { 
                      color: giorno.isToday ? theme.primary : theme.textSecondary,
                      fontWeight: giorno.isToday ? '700' : '500'
                    }
                  ]}>
                    {giorno.giorno}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
        
        {/* Legenda semplificata */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <LinearGradient
              colors={[theme.primary, theme.primary + 'CC']}
              style={styles.legendGradient}
            />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Ore lavorate</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.borderLight }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Non lavorato</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  // Header con gradiente
  headerGradient: {
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Sezione statistiche
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Sezione grafico
  chartSection: {
    gap: 16,
  },
  chart: {
    height: 180,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    paddingVertical: 16,
  },
  candleContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  candle: {
    width: 28,
    borderRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  candleGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
  },
  oreIndicator: {
    position: 'absolute',
    top: -20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  oreText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dayLabelContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Legenda
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendGradient: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default WeeklyCandlestickChart;
