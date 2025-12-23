import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import { ReactNode } from 'react';
import { useTheme as useCustomTheme } from '../../context/ThemeContext';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
  gradient?: 'primary' | 'secondary' | 'success' | 'ocean' | 'emerald' | 'sunset';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  gradient = 'primary',
  trend,
}) => {
  const muiTheme = useTheme();
  const { colors, mode } = useCustomTheme();
  const gradientColors = colors.gradients[gradient];

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: color
          ? undefined
          : mode === 'light'
          ? `linear-gradient(135deg, ${gradientColors[0]}15 0%, ${gradientColors[1]}15 100%)`
          : `linear-gradient(135deg, ${gradientColors[0]}20 0%, ${gradientColors[1]}20 100%)`,
        border: `1px solid ${mode === 'light' ? `${gradientColors[0]}20` : `${gradientColors[0]}30`}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${gradientColors[0]}, ${gradientColors[1]})`,
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
      className="fade-in"
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              color="text.secondary"
              gutterBottom
              variant="body2"
              sx={{ fontWeight: 500, mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              component="div"
              sx={{
                fontWeight: 700,
                background: color
                  ? undefined
                  : `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
                WebkitBackgroundClip: color ? undefined : 'text',
                WebkitTextFillColor: color ? undefined : 'transparent',
                backgroundClip: color ? undefined : 'text',
                color: color || undefined,
                mb: trend ? 1 : 0,
              }}
            >
              {value}
            </Typography>
            {trend && (
              <Typography
                variant="body2"
                sx={{
                  color: trend.isPositive ? colors.success : colors.error,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 0.5,
                }}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              color: color || gradientColors[0],
              fontSize: 56,
              opacity: 0.2,
              position: 'absolute',
              right: 16,
              top: 16,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;

