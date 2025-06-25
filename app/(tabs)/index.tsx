import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, Music, Album, User, Shuffle, Play, Pause, Folder } from 'lucide-react-native';
import { useMusic, Song } from '@/contexts/MusicContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function LibraryScreen() {
  const { state, playSong, pauseMusic, resumeMusic, loadSongs, dispatch } = useMusic();
  const [viewMode, setViewMode] = useState<'songs' | 'albums' | 'artists'>('songs');
  const [isImporting, setIsImporting] = useState(false);

  const importMusic = async () => {
    try {
      setIsImporting(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newSongs: Song[] = result.assets.map((asset, index) => ({
          id: `song_${Date.now()}_${index}`,
          title: asset.name.replace(/\.[^/.]+$/, '') || 'Unknown Title',
          artist: 'Unknown Artist',
          album: 'Unknown Album',
          duration: 0,
          uri: asset.uri,
        }));

        const allSongs = [...state.songs, ...newSongs];
        loadSongs(allSongs);
        Alert.alert('Success', `Imported ${newSongs.length} songs!`);
      }
    } catch (error) {
      console.error('Error importing music:', error);
      Alert.alert('Error', 'Failed to import music files');
    } finally {
      setIsImporting(false);
    }
  };

  const importFolder = async () => {
    try {
      setIsImporting(true);
      
      // Show options for folder import
      Alert.alert(
        'Import Music Folder',
        'Choose how you want to import your music:',
        [
          {
            text: 'Select Multiple Files',
            onPress: async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  type: 'audio/*',
                  multiple: true,
                  copyToCacheDirectory: false,
                });

                if (!result.canceled && result.assets) {
                  const newSongs: Song[] = result.assets.map((asset, index) => {
                    // Extract metadata from filename if possible
                    const fileName = asset.name.replace(/\.[^/.]+$/, '');
                    let title = fileName;
                    let artist = 'Unknown Artist';
                    let album = 'Unknown Album';

                    // Try to parse common filename formats
                    // Format: "Artist - Title"
                    if (fileName.includes(' - ')) {
                      const parts = fileName.split(' - ');
                      if (parts.length >= 2) {
                        artist = parts[0].trim();
                        title = parts.slice(1).join(' - ').trim();
                      }
                    }
                    // Format: "Artist_Title" or "Artist_Album_Title"
                    else if (fileName.includes('_')) {
                      const parts = fileName.split('_');
                      if (parts.length >= 2) {
                        artist = parts[0].trim();
                        if (parts.length >= 3) {
                          album = parts[1].trim();
                          title = parts.slice(2).join('_').trim();
                        } else {
                          title = parts.slice(1).join('_').trim();
                        }
                      }
                    }

                    return {
                      id: `song_${Date.now()}_${index}`,
                      title,
                      artist,
                      album,
                      duration: 0,
                      uri: asset.uri,
                    };
                  });

                  const allSongs = [...state.songs, ...newSongs];
                  loadSongs(allSongs);
                  Alert.alert('Success', `Imported ${newSongs.length} songs from folder!`);
                }
              } catch (error) {
                console.error('Error importing folder:', error);
                Alert.alert('Error', 'Failed to import music folder');
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error importing folder:', error);
      Alert.alert('Error', 'Failed to import music folder');
    } finally {
      setIsImporting(false);
    }
  };

  const togglePlayPause = async () => {
    if (state.isPlaying) {
      await pauseMusic();
    } else if (state.currentSong) {
      await resumeMusic();
    }
  };

  const playAllSongs = async () => {
    if (state.songs.length > 0) {
      const firstSong = state.isShuffled 
        ? state.songs[Math.floor(Math.random() * state.songs.length)]
        : state.songs[0];
      await playSong(firstSong, state.songs);
    }
  };

  const toggleShuffle = () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' });
  };

  const groupedByAlbum = state.songs.reduce((acc, song) => {
    if (!acc[song.album]) {
      acc[song.album] = [];
    }
    acc[song.album].push(song);
    return acc;
  }, {} as Record<string, Song[]>);

  const groupedByArtist = state.songs.reduce((acc, song) => {
    if (!acc[song.artist]) {
      acc[song.artist] = [];
    }
    acc[song.artist].push(song);
    return acc;
  }, {} as Record<string, Song[]>);

  const renderSongItem = (song: Song) => (
    <TouchableOpacity
      key={song.id}
      style={[
        styles.songItem,
        state.currentSong?.id === song.id && styles.currentSongItem,
      ]}
      onPress={() => playSong(song, state.songs)}
    >
      <View style={styles.albumArtContainer}>
        <Music size={24} color="#8B5CF6" />
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {song.artist}
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
  );

  const renderAlbumView = () => (
    <ScrollView>
      {Object.entries(groupedByAlbum).map(([album, songs]) => (
        <View key={album} style={styles.albumSection}>
          <TouchableOpacity
            style={styles.albumHeader}
            onPress={() => playSong(songs[0], songs)}
          >
            <View style={styles.albumArtLarge}>
              <Album size={32} color="#8B5CF6" />
            </View>
            <View style={styles.albumInfo}>
              <Text style={styles.albumTitle}>{album}</Text>
              <Text style={styles.albumDetails}>
                {songs[0].artist} • {songs.length} songs
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderArtistView = () => (
    <ScrollView>
      {Object.entries(groupedByArtist).map(([artist, songs]) => (
        <TouchableOpacity
          key={artist}
          style={styles.artistItem}
          onPress={() => playSong(songs[0], songs)}
        >
          <View style={styles.artistAvatar}>
            <User size={24} color="#8B5CF6" />
          </View>
          <View style={styles.artistInfo}>
            <Text style={styles.artistName}>{artist}</Text>
            <Text style={styles.artistDetails}>{songs.length} songs</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#000000']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Library</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleShuffle} style={styles.shuffleButton}>
              <Shuffle size={20} color={state.isShuffled ? '#8B5CF6' : '#6B7280'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={importFolder} style={styles.folderButton} disabled={isImporting}>
              <Folder size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={importMusic} style={styles.importButton} disabled={isImporting}>
              <Upload size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {state.songs.length > 0 && (
          <View style={styles.playAllContainer}>
            <TouchableOpacity onPress={playAllSongs} style={styles.playAllButton}>
              <Play size={16} color="#FFFFFF" />
              <Text style={styles.playAllText}>Play All</Text>
            </TouchableOpacity>
            <Text style={styles.songCount}>{state.songs.length} songs</Text>
          </View>
        )}

        <View style={styles.viewToggle}>
          {(['songs', 'albums', 'artists'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.viewButton, viewMode === mode && styles.activeViewButton]}
              onPress={() => setViewMode(mode)}
            >
              <Text
                style={[styles.viewButtonText, viewMode === mode && styles.activeViewButtonText]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {state.songs.length === 0 ? (
          <View style={styles.emptyState}>
            <Music size={64} color="#6B7280" />
            <Text style={styles.emptyTitle}>No Music Found</Text>
            <Text style={styles.emptyDescription}>
              Import your music files or folders to get started
            </Text>
            <View style={styles.importButtonsContainer}>
              <TouchableOpacity onPress={importMusic} style={styles.importButtonLarge} disabled={isImporting}>
                <Upload size={20} color="#FFFFFF" />
                <Text style={styles.importButtonText}>
                  {isImporting ? 'Importing...' : 'Import Files'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={importFolder} style={styles.folderButtonLarge} disabled={isImporting}>
                <Folder size={20} color="#FFFFFF" />
                <Text style={styles.importButtonText}>
                  {isImporting ? 'Importing...' : 'Import Folder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            {viewMode === 'songs' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {state.songs.map(renderSongItem)}
              </ScrollView>
            )}
            {viewMode === 'albums' && renderAlbumView()}
            {viewMode === 'artists' && renderArtistView()}
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shuffleButton: {
    padding: 8,
  },
  folderButton: {
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 20,
  },
  importButton: {
    backgroundColor: '#8B5CF6',
    padding: 10,
    borderRadius: 20,
  },
  playAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  playAllText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  songCount: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeViewButton: {
    backgroundColor: '#8B5CF6',
  },
  viewButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  activeViewButtonText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  albumSection: {
    marginBottom: 20,
  },
  albumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    gap: 16,
  },
  albumArtLarge: {
    width: 60,
    height: 60,
    backgroundColor: '#333333',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumInfo: {
    flex: 1,
  },
  albumTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  albumDetails: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  artistAvatar: {
    width: 50,
    height: 50,
    backgroundColor: '#333333',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  artistDetails: {
    color: '#9CA3AF',
    fontSize: 14,
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
    marginBottom: 32,
  },
  importButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  importButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  folderButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});