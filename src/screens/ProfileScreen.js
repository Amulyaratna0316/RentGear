import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../data';

const MENU = [
  { icon: '📋', title: 'Rental History', sub: 'View all past rentals' },
  { icon: '🔔', title: 'Notifications', sub: 'Manage alerts' },
  { icon: '🛡️', title: 'Verification Status', sub: 'KYC & ID verified ✅' },
  { icon: '💳', title: 'Payment Methods', sub: 'UPI, Bank Transfer' },
  { icon: '⚙️', title: 'Settings', sub: 'Account preferences' },
  { icon: '📞', title: 'Support', sub: 'Get help' },
];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Profile Banner */}
      <View style={styles.banner}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>👷</Text>
        </View>
        <Text style={styles.name}>Arjun Mehta</Text>
        <Text style={styles.email}>arjun.mehta@example.com · Mumbai</Text>
        <View style={styles.statsRow}>
          {[['8', 'Rentals'], ['2', 'Listings'], ['4.8★', 'Rating']].map(([v, l]) => (
            <View key={l} style={styles.statItem}>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLbl}>{l}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Menu Items */}
      {MENU.map(({ icon, title, sub }) => (
        <TouchableOpacity key={title} style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>{icon}</Text>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>{title}</Text>
            <Text style={styles.menuSub}>{sub}</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  banner: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 72, height: 72, backgroundColor: COLORS.accent, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarEmoji: { fontSize: 36 },
  name: { color: '#fff', fontWeight: '800', fontSize: 22, marginBottom: 4 },
  email: { color: '#93c5fd', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 32, marginTop: 16 },
  statItem: { alignItems: 'center' },
  statVal: { color: '#fff', fontWeight: '800', fontSize: 20 },
  statLbl: { color: '#93c5fd', fontSize: 12 },
  menuItem: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  menuIcon: { fontSize: 22, marginRight: 14 },
  menuText: { flex: 1 },
  menuTitle: { fontWeight: '600', fontSize: 14, color: '#111' },
  menuSub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  menuArrow: { color: COLORS.gray400, fontSize: 20 },
});
