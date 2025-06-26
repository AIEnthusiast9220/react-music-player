import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Audio } from 'expo-av';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  uri: string;
  artwork?: string;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  artwork?: string;
}

interface MusicState {
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  currentPlaylist: Song[];
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: 'off' | 'one' | 'all';
  playedSongs: Set<string>;
  shuffleHistory: string[];
}

type MusicAction =
  | { type: 'SET_SONGS'; payload: Song[] }
  | { type: 'SET_CURRENT_SONG'; payload: Song | null }
  | { type: 'SET_CURRENT_PLAYLIST'; payload: Song[] }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_POSITION'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'SET_REPEAT_MODE'; payload: 'off' | 'one' | 'all' }
  | { type: 'ADD_TO_PLAYED'; payload: string }
  | { type: 'RESET_PLAYED_SONGS' }
  | { type: 'SET_SHUFFLE_HISTORY'; payload: string[] }
  | { type: 'ADD_PLAYLIST'; payload: Playlist }
  | { type: 'DELETE_PLAYLIST'; payload: string };

const initialState: MusicState = {
  songs: [],
  playlists: [],
  currentSong: null,
  currentPlaylist: [],
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  volume: 1.0,
  isShuffled: false,
  repeatMode: 'off',
  playedSongs: new Set(),
  shuffleHistory: [],
};

function musicReducer(state: MusicState, action: MusicAction): MusicState {
  switch (action.type) {
    case 'SET_SONGS':
      return { ...state, songs: action.payload };
    case 'SET_CURRENT_SONG':
      return { ...state, currentSong: action.payload };
    case 'SET_CURRENT_PLAYLIST':
      return { ...state, currentPlaylist: action.payload };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_POSITION':
      return { ...state, position: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'TOGGLE_SHUFFLE':
      return { ...state, isShuffled: !state.isShuffled };
    case 'SET_REPEAT_MODE':
      return { ...state, repeatMode: action.payload };
    case 'ADD_TO_PLAYED':
      return {
        ...state,
        playedSongs: new Set([...state.playedSongs, action.payload]),
      };
    case 'RESET_PLAYED_SONGS':
      return { ...state, playedSongs: new Set(), shuffleHistory: [] };
    case 'SET_SHUFFLE_HISTORY':
      return { ...state, shuffleHistory: action.payload };
    case 'ADD_PLAYLIST':
      return { ...state, playlists: [...state.playlists, action.payload] };
    case 'DELETE_PLAYLIST':
      return {
        ...state,
        playlists: state.playlists.filter(p => p.id !== action.payload),
      };
    default:
      return state;
  }
}

interface MusicContextType {
  state: MusicState;
  dispatch: React.Dispatch<MusicAction>;
  sound: Audio.Sound | null;
  loadSongs: (songs: Song[]) => void;
  playSong: (song: Song, playlist?: Song[]) => Promise<void>;
  pauseMusic: () => Promise<void>;
  resumeMusic: () => Promise<void>;
  stopMusic: () => Promise<void>;
  nextSong: () => Promise<void>;
  previousSong: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  getSmartNext: () => Song | null;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(musicReducer, initialState);
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadSongs = (songs: Song[]) => {
    dispatch({ type: 'SET_SONGS', payload: songs });
    if (songs.length > 0 && !state.currentPlaylist.length) {
      dispatch({ type: 'SET_CURRENT_PLAYLIST', payload: songs });
    }
  };

  const playSong = async (song: Song, playlist?: Song[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true, volume: state.volume }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          dispatch({ type: 'SET_POSITION', payload: status.positionMillis || 0 });
          dispatch({ type: 'SET_DURATION', payload: status.durationMillis || 0 });
          dispatch({ type: 'SET_PLAYING', payload: status.isPlaying || false });

          if (status.didJustFinish) {
            nextSong();
          }
        }
      });

      setSound(newSound);
      dispatch({ type: 'SET_CURRENT_SONG', payload: song });
      if (playlist) {
        dispatch({ type: 'SET_CURRENT_PLAYLIST', payload: playlist });
      }
      dispatch({ type: 'SET_PLAYING', payload: true });
      dispatch({ type: 'ADD_TO_PLAYED', payload: song.id });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Error playing song:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const pauseMusic = async () => {
    if (sound) {
      await sound.pauseAsync();
    }
  };

  const resumeMusic = async () => {
    if (sound) {
      await sound.playAsync();
    }
  };

  const stopMusic = async () => {
    if (sound) {
      await sound.stopAsync();
      dispatch({ type: 'SET_PLAYING', payload: false });
      dispatch({ type: 'SET_POSITION', payload: 0 });
    }
  };

  const getSmartNext = (): Song | null => {
    if (!state.currentPlaylist.length) return null;

    if (state.repeatMode === 'one' && state.currentSong) {
      return state.currentSong;
    }

    if (state.isShuffled) {
      const unplayedSongs = state.currentPlaylist.filter(
        song => !state.playedSongs.has(song.id)
      );

      if (unplayedSongs.length === 0) {
        // All songs played, reset and start over
        dispatch({ type: 'RESET_PLAYED_SONGS' });
        return state.currentPlaylist[Math.floor(Math.random() * state.currentPlaylist.length)];
      }

      return unplayedSongs[Math.floor(Math.random() * unplayedSongs.length)];
    }

    const currentIndex = state.currentSong
      ? state.currentPlaylist.findIndex(s => s.id === state.currentSong!.id)
      : -1;

    if (currentIndex === -1) return state.currentPlaylist[0];

    const nextIndex = currentIndex + 1;
    if (nextIndex >= state.currentPlaylist.length) {
      return state.repeatMode === 'all' ? state.currentPlaylist[0] : null;
    }

    return state.currentPlaylist[nextIndex];
  };

  const nextSong = async () => {
    const nextSong = getSmartNext();
    if (nextSong) {
      await playSong(nextSong);
    }
  };

  const previousSong = async () => {
    if (!state.currentPlaylist.length || !state.currentSong) return;

    const currentIndex = state.currentPlaylist.findIndex(
      s => s.id === state.currentSong!.id
    );

    if (currentIndex <= 0) {
      if (state.repeatMode === 'all') {
        const lastSong = state.currentPlaylist[state.currentPlaylist.length - 1];
        await playSong(lastSong);
      }
      return;
    }

    const previousSong = state.currentPlaylist[currentIndex - 1];
    await playSong(previousSong);
  };

  const seekTo = async (position: number) => {
    if (sound) {
      await sound.setPositionAsync(position);
    }
  };

  const setVolume = async (volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume });
    if (sound) {
      await sound.setVolumeAsync(volume);
    }
  };

  const value = {
    state,
    dispatch,
    sound,
    loadSongs,
    playSong,
    pauseMusic,
    resumeMusic,
    stopMusic,
    nextSong,
    previousSong,
    seekTo,
    setVolume,
    getSmartNext,
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}