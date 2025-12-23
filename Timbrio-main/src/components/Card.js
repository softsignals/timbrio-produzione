import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.View;

/**
 * Componente Card moderno con animazioni fluide
 */
const Card = ({ 
  children, 
  onPress, 
  style, 
  elevated = true,
  gradient = false,
  gradientColors = null,
  animationType = 'fade', // 'fade', 'up', 'down', 'scale'
  delay = 0,
  pressableChildren = false, // Abilita tocchi sui figli quando la Card non ha onPress
  ...props 
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(elevated ? 0.08 : 0);

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      shadowOpacity.value = withTiming(0.15, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      shadowOpacity.value = withTiming(elevated ? 0.08 : 0, { duration: 100 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      shadowOpacity: shadowOpacity.value,
    };
  });

  // Seleziona l'animazione di entrata
  const getEnteringAnimation = () => {
    switch (animationType) {
      case 'up':
        return FadeInUp.delay(delay).springify();
      case 'down':
        return FadeInDown.delay(delay).springify();
      case 'fade':
      default:
        return FadeIn.delay(delay).duration(400);
    }
  };

  const Container = onPress ? AnimatedPressable : AnimatedView;

  const cardStyle = [
    styles.card,
    {
      backgroundColor: gradient ? 'transparent' : theme.card,
      shadowColor: theme.shadowStrong,
      borderColor: theme.border,
    },
    elevated && styles.elevated,
    animatedStyle,
    style,
  ];

  // Determina pointerEvents: "box-none" permette ai figli di ricevere tocchi
  const getPointerEvents = () => {
    if (onPress) return "auto";
    if (pressableChildren) return "box-none";
    return "auto";
  };

  if (gradient) {
    return (
      <Container
        style={cardStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={true}
        accessibilityRole={onPress ? "button" : "none"}
        entering={getEnteringAnimation()}
        pointerEvents={getPointerEvents()}
        {...props}
      >
        <LinearGradient
          colors={gradientColors || theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {children}
        </LinearGradient>
      </Container>
    );
  }

  return (
    <Container
      style={cardStyle}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessible={true}
      accessibilityRole={onPress ? "button" : "none"}
      entering={getEnteringAnimation()}
      pointerEvents={getPointerEvents()}
      {...props}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  elevated: {
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  gradientContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
});

export default Card;

