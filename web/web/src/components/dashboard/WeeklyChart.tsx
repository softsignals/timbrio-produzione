import { useEffect, useState } from 'react';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { timbratureAPI } from '../../services/api';
import { Timbratura } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { format, startOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

interface WeeklyChartProps {
  userId?: string;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ userId }) => {
  const { colors, mode } = useTheme();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyData();
  }, [userId]);

  const loadWeeklyData = async () => {
    try {
      const response = userId
        ? await timbratureAPI.getAllTimbrature({ userId })
        : await timbratureAPI.getMyTimbrature(1, 100);

      if (response.success && response.data) {
        const timbrature = response.data as Timbratura[];
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekDays = eachDayOfInterval({
          start: weekStart,
          end: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
        });

        const weeklyData = weekDays.map((day) => {
          const dayTimbrature = timbrature.filter(
            (t) => format(parseISO(t.data), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          );

          const totalHours = dayTimbrature.reduce((sum, t) => sum + (t.oreTotali || 0), 0);
          const count = dayTimbrature.length;

          return {
            day: format(day, 'EEE', { locale: it }),
            fullDate: format(day, 'dd/MM'),
            ore: totalHours,
            timbrature: count,
          };
        });

        setData(weeklyData);
      }
    } catch (error) {
      console.error('Errore caricamento dati settimanali:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Paper
        sx={{
          p: 3,
          background: mode === 'light'
            ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%)',
          border: `1px solid ${mode === 'light' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(59, 130, 246, 0.2)'}`,
        }}
      >
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        background: mode === 'light'
          ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%)',
        border: `1px solid ${mode === 'light' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(59, 130, 246, 0.2)'}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${colors.gradients.primary[0]}, ${colors.gradients.primary[1]})`,
        },
      }}
      className="fade-in"
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Ore Lavorate - Settimana Corrente
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorOre" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={mode === 'light' ? '#e2e8f0' : '#334155'} />
          <XAxis
            dataKey="day"
            stroke={mode === 'light' ? '#64748b' : '#94a3b8'}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke={mode === 'light' ? '#64748b' : '#94a3b8'}
            style={{ fontSize: '12px' }}
            label={{ value: 'Ore', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: mode === 'light' ? '#fff' : '#1e293b',
              border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
              borderRadius: '12px',
              padding: '12px',
            }}
            formatter={(value: number) => [`${value.toFixed(1)}h`, 'Ore']}
          />
          <Area
            type="monotone"
            dataKey="ore"
            stroke={colors.primary}
            strokeWidth={3}
            fill="url(#colorOre)"
            dot={{ fill: colors.primary, r: 5 }}
            activeDot={{ r: 7, fill: colors.primaryLight }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default WeeklyChart;

