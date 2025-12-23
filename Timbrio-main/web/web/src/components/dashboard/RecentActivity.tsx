import { Paper, Typography, List, ListItem, ListItemText, Box, Chip, Avatar } from '@mui/material';
import { AccessTime, CheckCircle, Schedule } from '@mui/icons-material';
import { Timbratura } from '../../types';
import { format, isToday, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useTheme } from '../../context/ThemeContext';

interface RecentActivityProps {
  timbrature: Timbratura[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ timbrature }) => {
  const { colors, mode } = useTheme();
  const recentTimbrature = timbrature.slice(0, 5);

  return (
    <Paper
      sx={{
        p: 3,
        background: mode === 'light'
          ? `linear-gradient(135deg, ${colors.gradients.secondary[0]}08 0%, ${colors.gradients.secondary[1]}08 100%)`
          : `linear-gradient(135deg, ${colors.gradients.secondary[0]}15 0%, ${colors.gradients.secondary[1]}15 100%)`,
        border: `1px solid ${mode === 'light' ? `${colors.secondary}20` : `${colors.secondary}30`}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${colors.gradients.secondary[0]}, ${colors.gradients.secondary[1]})`,
        },
      }}
      className="fade-in"
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Attività Recenti
      </Typography>
      {recentTimbrature.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            color: 'text.secondary',
          }}
        >
          <AccessTime sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
          <Typography variant="body2">Nessuna timbratura recente</Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {recentTimbrature.map((timbratura, index) => {
            const isTodayTimbratura = isToday(parseISO(timbratura.data));
            const isComplete = !!timbratura.entrata && !!timbratura.uscita;

            return (
              <ListItem
                key={timbratura._id}
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  background: mode === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(30, 41, 59, 0.5)',
                  border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    boxShadow: mode === 'light'
                      ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      : '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                  },
                }}
                className="slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Avatar
                  sx={{
                    bgcolor: isComplete ? colors.success : colors.primary,
                    width: 40,
                    height: 40,
                    mr: 2,
                  }}
                >
                  <AccessTime />
                </Avatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {timbratura.entrata}
                        {timbratura.uscita && ` - ${timbratura.uscita}`}
                      </Typography>
                      {isTodayTimbratura && (
                        <Chip label="Oggi" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
                      )}
                      {isComplete && (
                        <CheckCircle sx={{ fontSize: 18, color: colors.success }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {format(parseISO(timbratura.data), 'dd MMMM yyyy', { locale: it })}
                      </Typography>
                      {timbratura.oreTotali && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Schedule sx={{ fontSize: 14, color: colors.success }} />
                          <Typography variant="caption" sx={{ color: colors.success, fontWeight: 600 }}>
                            {timbratura.oreTotali.toFixed(1)}h
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
};

export default RecentActivity;

