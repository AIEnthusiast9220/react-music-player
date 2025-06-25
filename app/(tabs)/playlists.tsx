import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Music, Play, Trash2, Edit3 } from 'lucide-react-native';
import { useMusic, Playlist, Song } from '@/contexts/MusicContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function PlaylistsScreen() {
  const { state, playSong, dispatch } = useMusic();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [showSongSelector, setShowSongSelector] = useState(false);

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    const selectedSongsList = state.songs.filter(song => 
      selectedSongs.has(song.id)
    );

    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`,
      name: newPlaylistName.trim(),
      songs: selectedSongsList,
    };

    dispatch({ type: 'ADD_PLAYLIST', payload: newPlaylist });
    setNewPlaylistName('');
    setSelectedSongs(new Set());
    setShowCreateModal(false);
    setShowSongSelector(false);
    Alert.alert('Success', 'Playlist created successfully!');
  };

  const deletePlaylist = (playlistId: string) => {
    Alert.alert(
      'Delete Playlist',
      'Are you sure you want to delete this playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch({ type: 'DELETE_PLAYLIST', payload: playlistId }),
        },
      ]
    );
  };

  const playPlaylist = async (playlist: Playlist) => {
    if (playlist.songs.length > 0) {
      await playSong(playlist.songs[0], playlist.songs);
    }
  };

  const toggleSongSelection = (songId: string) => {
    const newSelection = new Set(selectedSongs);
    if (newSelection.has(songId)) {
      newSelection.delete(songId);
    } else {
      newSelection.add(songId);
    }
    setSelectedSongs(newSelection);
  };

  const renderPlaylistItem = (playlist: Playlist) => (
    <View key={playlist.id} style={styles.playlistItem}>
      <TouchableOpacity
        style={styles.playlistContent}
        onPress={() => playPlaylist(playlist)}
      >
        <View style={styles.playlistArt}>
          <Music size={32} color="#8B5CF6" />
        </View>
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName}>{playlist.name}</Text>
          <Text style={styles.playlistDetails}>
            {playlist.songs.length} song{playlist.songs.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => playPlaylist(playlist)}
        >
          <Play size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deletePlaylist(playlist.id)}
      >
        <Trash2 size={16} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  const renderSongSelector = () => (
    <Modal
      visible={showSongSelector}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <LinearGradient colors={['#1a1a1a', '#000000']} style={styles.gradient}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Songs</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowSongSelector(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={createPlaylist}
                style={styles.createButton}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.songList}>
            {state.songs.map((song) => (
              <TouchableOpacity
                key={song.id}
                style={[
                  styles.songSelectItem,
                  selectedSongs.has(song.id) && styles.selectedSongItem
                ]}
                onPress={() => toggleSongSelection(song.id)}
              >
                <View style={styles.songSelectInfo}>
                  <Text style={styles.songSelectTitle}>{song.title}</Text>
                  <Text style={styles.songSelectArtist}>{song.artist}</Text>
                </View>
                <View style={[
                  styles.checkbox,
                  selectedSongs.has(song.id) && styles.checkedBox
                ]}>
                  {selectedSongs.has(song.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#000000']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Playlists</Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.addButton}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {state.playlists.length === 0 ? (
          <View style={styles.emptyState}>
            <Music size={64} color="#6B7280" />
            <Text style={styles.emptyTitle}>No Playlists Yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first playlist to organize your music
            </Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.createFirstButton}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createFirstButtonText}>Create Playlist</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.playlistsList} showsVerticalScrollIndicator={false}>
            {state.playlists.map(renderPlaylistItem)}
          </ScrollView>
        )}

        {/* Create Playlist Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <LinearGradient colors={['#1a1a1a', '#000000']} style={styles.gradient}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Playlist</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateModal(false);
                    setNewPlaylistName('');
                  }}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <TextInput
                  style={styles.playlistNameInput}
                  placeholder="Playlist name"
                  placeholderTextColor="#9CA3AF"
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  autoFocus
                />
                
                <TouchableOpacity
                  onPress={() => {
                    if (newPlaylistName.trim()) {
                      setShowSongSelector(true);
                    } else {
                      Alert.alert('Error', 'Please enter a playlist name');
                    }
                  }}
                  style={styles.nextButton}
                >
                  <Text style={styles.nextButtonText}>Next: Select Songs</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </SafeAreaView>
        </Modal>

        {renderSongSelector()}
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
  addButton: {
    backgroundColor: '#8B5CF6',
    padding: 10,
    borderRadius: 20,
  },
  playlistsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    paddingRight: 16,
  },
  playlistContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  playlistArt: {
    width: 60,
    height: 60,
    backgroundColor: '#333333',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  playlistDetails: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  playButton: {
    backgroundColor: '#8B5CF6',
    padding: 8,
    borderRadius: 16,
  },
  deleteButton: {
    padding: 8,
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
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  playlistNameInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  songList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  songSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedSongItem: {
    backgroundColor: '#2D1B69',
  },
  songSelectInfo: {
    flex: 1,
  },
  songSelectTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  songSelectArtist: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});