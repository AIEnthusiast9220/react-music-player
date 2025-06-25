import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, Music, Play, Pause } from 'lucide-react-native';
import { useMusic } from '@/contexts/MusicContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function SearchScreen() {
  const { state, playSong, pauseMusic, resumeMusic } = useMusic();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return state.songs.filter(
      song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.album.toLowerCase().includes(query)
    );
  }, [state.songs, searchQuery]);

  const togglePlayPause = async () => {
    if (state.isPlaying) {
      await pauseMusic();
    } else if (state.currentSong) {
      await resumeMusic();
    }
  };

  const handleSongPress = async (song: typeof state.songs[0]) => {
    await playSong(song, filteredSongs.length > 0 ? filteredSongs : state.songs);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#000000']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search Music</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <SearchIcon size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search songs, artists, albums..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
          </View>
        </View>

        <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
          {searchQuery.trim() === '' ? (
            <View style={styles.emptyState}>
              <SearchIcon size={64} color="#6B7280" />
              <Text style={styles.emptyTitle}>Find Your Music</Text>
              <Text style={styles.emptyDescription}>
                Search for songs, artists, or albums in your library
              </Text>
            </View>
          ) : filteredSongs.length === 0 ? (
            <View style={styles.emptyState}>
              <SearchIcon size={64} color="#6B7280" />
              <Text style={styles.emptyTitle}>No Results Found</Text>
              <Text style={styles.emptyDescription}>
                Try searching with different keywords
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultCount}>
                {filteredSongs.length} result{filteredSongs.length !== 1 ? 's' : ''}
              </Text>
              {filteredSongs.map((song) => (
                <TouchableOpacity
                  key={song.id}
                  style={[
                    styles.songItem,
                    state.currentSong?.id === song.id && styles.currentSongItem,
                  ]}
                  onPress={() => handleSongPress(song)}
                >
                  <View style={styles.albumArtContainer}>
                    <Music size={24} color="#8B5CF6" />
                  </View>
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>
                      {song.title}
                    </Text>
                    <Text style={styles.songArtist} numberOfLines={1}>
                      {song.artist} • {song.album}
                    </Text>
                  </View>
                  {state.currentSong?.id === song.id && (
                    <TouchableOpacity onPress={togglePlayPause}>
                      {state.isPlaying ? (
                        <Pause size={20} color="#8B5CF6" />
                      ) : (
                        <Play size={20} color="#8B5CF6" />
                      )}
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  results: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultCount: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    gap: 12,
  },
  currentSongItem: {
    backgroundColor: '#2D1B69',
  },
  albumArtContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#333333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  songArtist: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
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