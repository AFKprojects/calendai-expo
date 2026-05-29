import React, { useState } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TEAR_THRESHOLD = 150;

interface PageTearBoxProps {
  isTorn: boolean;
  onTearOff: () => void;
  bottomPage: React.ReactNode;
  topPage: React.ReactNode;
}

export const PageTearBox: React.FC<PageTearBoxProps> = ({
  isTorn,
  onTearOff,
  bottomPage,
  topPage,
}) => {
  const [removed, setRemoved] = useState(false);

  // Reanimated shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const hapticTriggered = useSharedValue(false);

  const triggerLightHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const triggerSuccessHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const finalizeTearOff = () => {
    setRemoved(true);
    onTearOff();
  };

  // Pan Gesture handler
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      hapticTriggered.value = false;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      
      // Rotate card slightly based on drag amount
      rotation.value = translateX.value / 15;

      // Gentle haptic when crossing the threshold
      const distance = Math.sqrt(
        translateX.value * translateX.value + translateY.value * translateY.value
      );
      if (distance > TEAR_THRESHOLD && !hapticTriggered.value) {
        hapticTriggered.value = true;
        runOnJS(triggerLightHaptic)();
      }
    })
    .onEnd(() => {
      isDragging.value = false;
      const dragY = translateY.value;
      const dragX = translateX.value;
      const distance = Math.sqrt(dragX * dragX + dragY * dragY);

      if (distance > TEAR_THRESHOLD) {
        // Run success tear haptic
        runOnJS(triggerSuccessHaptic)();

        // Animate flying off the screen
        const targetY = dragY >= 0 ? SCREEN_HEIGHT * 1.5 : -SCREEN_HEIGHT * 1.5;
        const targetX = dragX >= 0 ? SCREEN_WIDTH * 1.2 : -SCREEN_WIDTH * 1.2;
        const targetRot = dragX >= 0 ? 45 : -45;

        translateX.value = withTiming(targetX, { duration: 400 });
        rotation.value = withTiming(targetRot, { duration: 400 });
        translateY.value = withTiming(targetY, { duration: 400 }, (finished) => {
          if (finished) {
            runOnJS(finalizeTearOff)();
          }
        });
      } else {
        // Snap back to center
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        rotation.value = withSpring(0, { damping: 15 });
      }
    });

  // Animated styles for the tearing page
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      isDragging.value ? 1 : 0,
      [0, 1],
      [1, 1.02]
    );

    const shadowOpacity = interpolate(
      isDragging.value ? 1 : 0,
      [0, 1],
      [0.2, 0.4]
    );

    const shadowRadius = interpolate(
      isDragging.value ? 1 : 0,
      [0, 1],
      [5, 12]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
        { scale },
      ],
      shadowOpacity,
      shadowRadius,
      elevation: isDragging.value ? 12 : 4,
    };
  });

  const showTopPage = !isTorn && !removed;

  return (
    <View style={styles.container}>
      {/* Bottom Layer - revealed page */}
      <View style={styles.layer}>
        {bottomPage}
      </View>

      {/* Top Layer - yesterday's page being torn */}
      {showTopPage && (
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cardContainer, animatedStyle]}>
            <View style={styles.pageContent}>
              {topPage}

              {/* Traditional torn paper fringe simulation at the top edge */}
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.08)', 'transparent']}
                style={styles.fringeShadow}
              />
            </View>
          </Animated.View>
        </GestureDetector>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  cardContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: '#FCF9F2',
    // iOS Shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    // Android Shadow
    elevation: 4,
  },
  pageContent: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FCF9F2',
  },
  fringeShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    zIndex: 10,
  },
});
