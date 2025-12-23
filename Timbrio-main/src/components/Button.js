import React from 'react';
import { Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Componente Button moderno con animazioni fluide
 */
const Button = ({
  onPress,
  title,
  variant = 'primary', // primary, secondary, danger, success
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  ...props
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const getBackgroundColor = () => {
    if (disabled) return theme.border;
    switch (variant) {
      case 'primary': return theme.primary;
      case 'secondary': return theme.card;
      case 'danger': return theme.error;
      case 'success': return theme.success;
      case 'warning': return theme.warning;
      default: return theme.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.textTertiary;
    return variant === 'secondary' ? theme.text : theme.textInverse;
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <AnimatedPressable
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'secondary' && { 
          borderWidth: 2, 
          borderColor: theme.border 
        },
        animatedStyle,
        style
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={getTextColor()}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.buttonText, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 10,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default Button;

