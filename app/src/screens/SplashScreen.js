import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function SplashScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo atau Icon Aplikasi */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🌡️</Text>
          <Text style={styles.appName}>IOTWatch</Text>
        </View>
        
        {/* Tagline */}
        <Text style={styles.tagline}>Smart Temperature Monitoring</Text>
        
        {/* Loading Indicator */}
        <View style={styles.loadingSection}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>

        {/* Version Info */}
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 60,
  },
  loadingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  versionText: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: '#9ca3af',
  },
});