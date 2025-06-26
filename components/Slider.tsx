
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

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

  React.useEffect(() => {
    const normalizedValue = ((value - minimumValue) / (maximumValue - minimumValue)) * sliderWidth.value;
    translateX.value = normalizedValue;
  }, [value, maximumValue, minimumValue, sliderWidth.value]);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {},
    onActive: (event) => {
      const newX = Math.max(0, Math.min(sliderWidth.value, event.x));
      translateX.value = newX;
      
      const normalizedValue = (newX / sliderWidth.value) * (maximumValue - minimumValue) + minimumValue;
      if (onValueChange) {
        runOnJS(onValueChange)(normalizedValue);
      }
    },
    onEnd: () => {
      const normalizedValue = (translateX.value / sliderWidth.value) * (maximumValue - minimumValue) + minimumValue;
      if (onSlidingComplete) {
        runOnJS(onSlidingComplete)(normalizedValue);
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
        style={[styles.track, { backgroundColor: maximumTrackTintColor }]}
        onLayout={(event) => {
          sliderWidth.value = event.nativeEvent.layout.width;
        }}
      >
        <Animated.View
          style={[
            styles.minimumTrack,
            { backgroundColor: minimumTrackTintColor },
            trackAnimatedStyle,
          ]}
        />
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.thumb, thumbStyle, thumbAnimatedStyle]} />
        </PanGestureHandler>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  minimumTrack: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: -8,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
