import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  Music,
} from 'lucide-react-native';
import { useMusic } from '@/contexts/MusicContext';
import Slider from '@/components/Slider';

const { width } = Dimensions.get('window');
const ALBUM_ART_SIZE = width - 80;

export default function NowPlayingScreen() {
  const {
    state,
    pauseMusic,
    resumeMusic,
    nextSong,
    previousSong,
    seekTo,
    setVolume,
    dispatch,
  } = useMusic();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (state.isPlaying) {
      rotation.value = withRepeat(withTiming(360, { duration: 10000 }), -1);
      scale.value = withSpring(1.05);
    } else {
      rotation.value = withTiming(rotation.value);
      scale.value = withSpring(1);
    }
  }, [state.isPlaying]);

  const animatedAlbumStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  const togglePlayPause = async () => {
    if (state.isPlaying) {
      await pauseMusic();
    } else {
      await resumeMusic();
    }
  };

  const toggleShuffle = () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' });
  };

  const cycleRepeatMode = () => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
    const currentIndex = modes.indexOf(state.repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    dispatch({ type: 'SET_REPEAT_MODE', payload: nextMode });
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = async (value: number) => {
    await seekTo(value);
  };

  const handleVolumeChange = async (value: number) => {
    await setVolume(value);
  };

  if (!state.currentSong) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1a1a1a', '#000000']} style={styles.gradient}>
          <View style={styles.emptyState}>
            <Music size={64} color="#6B7280" />
            <Text style={styles.emptyTitle}>No Song Playing</Text>
            <Text style={styles.emptyDescription}>
              Select a song from your library to start listening
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#2D1B69', '#8B5CF6', '#000000']} style={styles.gradient}>
        <View style={styles.content}>
          {/* Album Art */}
          <View style={styles.albumArtContainer}>
            <Animated.View style={[styles.albumArt, animatedAlbumStyle]}>
              {state.currentSong.artwork ? (
                <Image source={{ uri: state.currentSong.artwork }} style={styles.albumImage} />
              ) : (
                <View style={styles.placeholderArt}>
                  <Music size={80} color="#8B5CF6" />
                </View>
              )}
            </Animated.View>
          </View>

          {/* Song Info */}
          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={2}>
              {state.currentSong.title}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {state.currentSong.artist}
            </Text>
            <Text style={styles.songAlbum} numberOfLines={1}>
              {state.currentSong.album}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(state.position)}</Text>
            <View style={styles.progressBar}>
              <Slider
                style={styles.slider}
                value={state.position}
                maximumValue={state.duration}
                minimumTrackTintColor="#8B5CF6"
                maximumTrackTintColor="#333333"
                thumbStyle={styles.sliderThumb}
                onSlidingComplete={handleSeek}
              />
            </View>
            <Text style={styles.timeText}>{formatTime(state.duration)}</Text>
          </View>

          {/* Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity onPress={toggleShuffle} style={styles.controlButton}>
              <Shuffle size={24} color={state.isShuffled ? '#8B5CF6' : '#9CA3AF'} />
            </TouchableOpacity>

            <TouchableOpacity onPress={previousSong} style={styles.controlButton}>
              <SkipBack size={32} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
              {state.isPlaying ? (
                <Pause size={32} color="#000000" />
              ) : (
                <Play size={32} color="#000000" />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={nextSong} style={styles.controlButton}>
              <SkipForward size={32} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={cycleRepeatMode} style={styles.controlButton}>
              <Repeat
                size={24}
                color={state.repeatMode !== 'off' ? '#8B5CF6' : '#9CA3AF'}
              />
              {state.repeatMode === 'one' && (
                <View style={styles.repeatOneIndicator}>
                  <Text style={styles.repeatOneText}>1</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Volume Control */}
          <View style={styles.volumeContainer}>
            <TouchableOpacity
              onPress={() => setShowVolumeSlider(!showVolumeSlider)}
              style={styles.volumeButton}
            >
              <Volume2 size={20} color="#9CA3AF" />
            </TouchableOpacity>
            {showVolumeSlider && (
              <View style={styles.volumeSliderContainer}>
                <Slider
                  style={styles.volumeSlider}
                  value={state.volume}
                  maximumValue={1}
                  minimumValue={0}
                  minimumTrackTintColor="#8B5CF6"
                  maximumTrackTintColor="#333333"
                  thumbStyle={styles.sliderThumb}
                  onValueChange={handleVolumeChange}
                />
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'space-around',
  },
  albumArtContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  albumArt: {
    width: ALBUM_ART_SIZE,
    height: ALBUM_ART_SIZE,
    borderRadius: ALBUM_ART_SIZE / 2,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  albumImage: {
    width: '100%',
    height: '100%',
    borderRadius: ALBUM_ART_SIZE / 2,
  },
  placeholderArt: {
    width: '100%',
    height: '100%',
    borderRadius: ALBUM_ART_SIZE / 2,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  songArtist: {
    fontSize: 18,
    color: '#E5E7EB',
    textAlign: 'center',
    marginBottom: 4,
  },
  songAlbum: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  timeText: {
    color: '#9CA3AF',
    fontSize: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
  },
  slider: {
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#8B5CF6',
    width: 16,
    height: 16,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 40,
  },
  controlButton: {
    padding: 12,
    position: 'relative',
  },
  playButton: {
    backgroundColor: '#FFFFFF',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  repeatOneIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatOneText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  volumeContainer: {
    alignItems: 'center',
  },
  volumeButton: {
    padding: 12,
  },
  volumeSliderContainer: {
    width: 200,
    marginTop: 12,
  },
  volumeSlider: {
    height: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
});