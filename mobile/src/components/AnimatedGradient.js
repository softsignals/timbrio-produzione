import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  useSharedValue,
  withSequence,
  Easing 
} from 'react-native-reanimated';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * Componente per gradienti animati e moderni
 */
const AnimatedGradient = ({ 
  colors, 
  style, 
  children,
  animated = true,
  angle = 45,
  ...props 
}) => {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    if (animated) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Converti l'angolo in coordinate start/end per il gradiente
  const getGradientCoordinates = (angle) => {
    const radians = (angle * Math.PI) / 180;
    return {
      start: { x: 0, y: 0 },
      end: { 
        x: Math.cos(radians), 
        y: Math.sin(radians) 
      }
    };
  };

  const coords = getGradientCoordinates(angle);

  return (
    <AnimatedLinearGradient
      colors={colors}
      style={[styles.gradient, animated && animatedStyle, style]}
      start={coords.start}
      end={coords.end}
      {...props}
    >
      {children}
    </AnimatedLinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});

export default AnimatedGradient;

