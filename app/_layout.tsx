import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from 'react-error-boundary';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { MusicProvider } from '@/contexts/MusicContext';

function ErrorFallback({error, resetErrorBoundary}: any) {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000'}}>
      <Text style={{color: '#fff', fontSize: 18, marginBottom: 20}}>Something went wrong:</Text>
      <Text style={{color: '#ff6b6b', fontSize: 14, marginBottom: 20}}>{error.message}</Text>
      <TouchableOpacity 
        onPress={resetErrorBoundary}
        style={{backgroundColor: '#8B5CF6', padding: 10, borderRadius: 8}}
      >
        <Text style={{color: '#fff'}}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
      <MusicProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" backgroundColor="#000000" />
      </MusicProvider>
    </ErrorBoundary>
  );
}