import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet,
} from 'react-native';
import BrowseScreen from './src/screens/BrowseScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import ListingsScreen from './src/screens/ListingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AddListingScreen from './src/screens/AddListingScreen';
import AuthScreen from './src/screens/AuthScreen';
import { COLORS } from './src/data';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const NAV = [
  { id: 'browse', icon: '🔍', label: 'Browse' },
  { id: 'bookings', icon: '📋', label: 'Bookings' },
  { id: 'listings', icon: '📦', label: 'My Listings' },
  { id: 'profile', icon: '👤', label: 'Profile' },
];

function AppShell() {
  const [tab, setTab] = useState('browse');
  const { user, loading } = useAuth();
  const [role, setRole] = useState(user?.role || 'customer');
  const [showAddListing, setShowAddListing] = useState(false);

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.loaderWrap]}>
        <Text style={styles.loadingText}>Loading session...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>RentGear</Text>
          <Text style={styles.appTagline}>Equipment Rental Platform</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.roleToggle}
            onPress={() => setRole(r => r === 'customer' ? 'owner' : 'customer')}
          >
            <Text style={styles.roleToggleText}>
              {role === 'customer' ? '👤 Customer' : '🏭 Owner'}
            </Text>
          </TouchableOpacity>
          <View style={styles.avatarCircle}>
            <Text style={{ fontSize: 18 }}>{user?.name?.[0]?.toUpperCase() || '👷'}</Text>
          </View>
        </View>
      </View>

      {/* Screens */}
      <View style={styles.content}>
        <View style={styles.rentingPlaceholder}>
          <Text style={styles.rentingPlaceholderTitle}>Renting (Authenticated)</Text>
          <Text style={styles.rentingPlaceholderText}>
            Logged in as {user?.name || user?.username || user?.email || 'User'}
          </Text>
        </View>
        {tab === 'browse' && (
          <BrowseScreen role={role} onAddListing={() => setShowAddListing(true)} />
        )}
        {tab === 'bookings' && <BookingsScreen />}
        {tab === 'listings' && <ListingsScreen onAdd={() => setShowAddListing(true)} />}
        {tab === 'profile' && <ProfileScreen />}
      </View>

      {/* Add Listing Modal */}
      <AddListingScreen
        visible={showAddListing}
        onClose={() => setShowAddListing(false)}
      />

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {NAV.map(n => (
          <TouchableOpacity
            key={n.id}
            style={styles.navItem}
            onPress={() => setTab(n.id)}
          >
            <Text style={styles.navIcon}>{n.icon}</Text>
            <Text style={[styles.navLabel, tab === n.id && styles.navLabelActive]}>
              {n.label}
            </Text>
            {tab === n.id && <View style={styles.navIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  loaderWrap: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appName: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  appTagline: { color: '#93c5fd', fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleToggle: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  roleToggleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  avatarCircle: {
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, backgroundColor: COLORS.background },
  rentingPlaceholder: {
    margin: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    backgroundColor: '#eff6ff',
  },
  rentingPlaceholderTitle: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },
  rentingPlaceholderText: { color: COLORS.gray700, marginTop: 4, fontWeight: '600' },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingBottom: 4,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 10, fontWeight: '600', color: COLORS.gray400, marginTop: 2 },
  navLabelActive: { color: COLORS.primary },
  navIndicator: {
    width: 20,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginTop: 3,
  },
});
