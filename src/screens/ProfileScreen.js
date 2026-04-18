import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../data';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ProfileScreen({ onNavigate }) {
  const { user, logout, switchRole } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch enriched profile on mount ─────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const userId = user?.id || user?._id;
        if (!userId) {
          setLoading(false);
          return;
        }
        const { data } = await api.get(`/user/profile/${userId}`);
        if (mounted) setProfile(data);
      } catch (err) {
        console.error('[ProfileScreen] Fetch error:', err?.message);
        // Fallback: use the local auth user object
        if (mounted) {
          setProfile({
            name: user?.name,
            email: user?.email,
            role: user?.role,
            username: user?.username,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, [user?.id, user?._id]);

  // ── Logout handler ──────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            logout();
          },
        },
      ],
    );
  };

  // ── Menu action handler ─────────────────────────────────────────────────
  const handleMenuPress = (title) => {
    Haptics.selectionAsync();
    switch (title) {
      case 'Rental History':
        onNavigate?.('bookings');
        break;
      case 'My Listings':
        onNavigate?.('listings');
        break;
      case 'Logout':
        handleLogout();
        break;
      case 'Payment Methods':
        Alert.alert('Coming Soon', 'Payment methods will be available in a future update.');
        break;
      case 'Settings':
        Alert.alert(
          'Settings',
          `Switch to ${user?.role === 'customer' ? 'Owner' : 'Customer'} Mode?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Switch Mode', 
              onPress: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                switchRole();
              } 
            }
          ]
        );
        break;
      case 'Support':
        Alert.alert('Support', 'Reach us at support@rentgear.in');
        break;
      default:
        break;
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingWrap]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // ── Derive display data with null safety ────────────────────────────────
  const displayName   = profile?.name || user?.name || 'RentGear User';
  const displayEmail  = profile?.email || user?.email || '';
  const displayRole   = profile?.role || user?.role || 'customer';
  const isOwner       = displayRole === 'owner';
  const isVerified    = profile?.isVerified === true;
  const initial       = displayName?.[0]?.toUpperCase() || '👷';

  // Stats — role-adaptive
  const stats = isOwner
    ? [
        [String(profile?.listingsCount ?? 0), 'Listings'],
        [`${profile?.avgRating ?? '0.0'}★`, 'Rating'],
        [`₹${Number(profile?.totalEarnings ?? 0)?.toLocaleString?.('en-IN')}`, 'Earned'],
      ]
    : [
        [String(profile?.rentalsCount ?? 0), 'Rentals'],
        [`₹${Number(profile?.totalSpent ?? 0)?.toLocaleString?.('en-IN')}`, 'Spent'],
        ['4.8★', 'App Rating'],
      ];

  // Menu items — role-adaptive
  const menuItems = [
    ...(isOwner
      ? [{ icon: '📦', title: 'My Listings', sub: `${profile?.listingsCount ?? 0} active listings` }]
      : [{ icon: '📋', title: 'Rental History', sub: `${profile?.rentalsCount ?? 0} past rentals` }]
    ),
    { icon: '🔔', title: 'Notifications', sub: 'Manage alerts' },
    {
      icon: '🛡️',
      title: 'Verification Status',
      sub: isVerified ? 'KYC & ID verified ✅' : 'Not yet verified',
    },
    { icon: '💳', title: 'Payment Methods', sub: 'UPI, Bank Transfer' },
    { icon: '⚙️', title: 'Settings', sub: 'Account preferences' },
    { icon: '📞', title: 'Support', sub: 'Get help' },
    { icon: '🚪', title: 'Logout', sub: 'Sign out of your account' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Profile Banner */}
      <View style={styles.banner}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{displayEmail}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {isOwner ? '🏭 Owner' : '👤 Customer'}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {stats.map(([v, l]) => (
            <View key={l} style={styles.statItem}>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLbl}>{l}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Verification banner */}
      {isVerified && (
        <View style={styles.verifiedBanner}>
          <Text style={styles.verifiedIcon}>✅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.verifiedTitle}>Identity Verified</Text>
            <Text style={styles.verifiedSub}>KYC & Government ID verified</Text>
          </View>
        </View>
      )}

      {/* Member since */}
      {profile?.createdAt && (
        <Text style={styles.memberSince}>
          Member since {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </Text>
      )}

      {/* Menu Items */}
      {menuItems.map(({ icon, title, sub }) => (
        <TouchableOpacity
          key={title}
          style={[styles.menuItem, title === 'Logout' && styles.menuItemLogout]}
          activeOpacity={0.7}
          onPress={() => handleMenuPress(title)}
        >
          <Text style={styles.menuIcon}>{icon}</Text>
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, title === 'Logout' && styles.menuTitleLogout]}>
              {title}
            </Text>
            <Text style={styles.menuSub}>{sub}</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      ))}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingWrap: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.gray500, marginTop: 12, fontSize: 14 },

  // Banner
  banner: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 72, height: 72, backgroundColor: COLORS.accent,
    borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  name: { color: '#fff', fontWeight: '800', fontSize: 22, marginBottom: 4 },
  email: { color: '#93c5fd', fontSize: 14 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5, marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  roleBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 32, marginTop: 18 },
  statItem: { alignItems: 'center' },
  statVal: { color: '#fff', fontWeight: '800', fontSize: 20 },
  statLbl: { color: '#93c5fd', fontSize: 12, marginTop: 2 },

  // Verified
  verifiedBanner: {
    backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0',
  },
  verifiedIcon: { fontSize: 20, marginRight: 12 },
  verifiedTitle: { fontWeight: '700', fontSize: 14, color: '#065f46' },
  verifiedSub: { fontSize: 12, color: '#166534', marginTop: 1 },

  // Member since
  memberSince: { fontSize: 12, color: COLORS.gray500, textAlign: 'center', marginBottom: 16 },

  // Menu
  menuItem: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  menuItemLogout: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  menuIcon: { fontSize: 22, marginRight: 14 },
  menuText: { flex: 1 },
  menuTitle: { fontWeight: '600', fontSize: 14, color: '#111' },
  menuTitleLogout: { color: COLORS.danger, fontWeight: '700' },
  menuSub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  menuArrow: { color: COLORS.gray400, fontSize: 20 },
});
