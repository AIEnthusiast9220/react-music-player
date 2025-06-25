import React from 'react';
import { View, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

interface SliderProps {
  style?: any;
  value: number;
  maximumValue: number;
  minimumValue?: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbStyle?: any;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
}

export default function Slider({
  style,
  value,
  maximumValue,
  minimumValue = 0,
  minimumTrackTintColor = '#8B5CF6',
  maximumTrackTintColor = '#333333',
  thumbStyle,
  onValueChange,
  onSlidingComplete,
}: SliderProps) {
  const translateX = useSharedValue(0);
  const sliderWidth = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      // Calculate initial position based on current value
      const percentage = (value - minimumValue) / (maximumValue - minimumValue);
      translateX.value = percentage * sliderWidth.value;
    },
    onActive: (event) => {
      const newTranslateX = Math.max(0, Math.min(sliderWidth.value, event.translationX + translateX.value));
      translateX.value = newTranslateX;
      
      if (onValueChange) {
        const percentage = newTranslateX / sliderWidth.value;
        const newValue = minimumValue + percentage * (maximumValue - minimumValue);
        runOnJS(onValueChange)(newValue);
      }
    },
    onEnd: () => {
      if (onSlidingComplete) {
        const percentage = translateX.value / sliderWidth.value;
        const newValue = minimumValue + percentage * (maximumValue - minimumValue);
        runOnJS(onSlidingComplete)(newValue);
      }
    },
  });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const trackAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value,
    };
  });

  return (
    <View style={[styles.container, style]}>
      <View
        style={[styles.maximumTrack, { backgroundColor: maximumTrackTintColor }]}
        onLayout={(event) => {
          sliderWidth.value = event.nativeEvent.layout.width - 16; // Account for thumb width
          const percentage = (value - minimumValue) / (maximumValue - minimumValue);
          translateX.value = percentage * sliderWidth.value;
        }}
      >
        <Animated.View
          style={[
            styles.minimumTrack,
            { backgroundColor: minimumTrackTintColor },
            trackAnimatedStyle,
          ]}
        />
      </View>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.thumb, thumbStyle, thumbAnimatedStyle]} />
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  maximumTrack: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  minimumTrack: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    position: 'absolute',
    top: -6,
  },
});