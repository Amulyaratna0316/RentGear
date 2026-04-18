import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import api from '../services/api';
import { COLORS } from '../data';
import { Badge } from '../components/SharedComponents';
import { useAuth } from '../context/AuthContext';

export default function ListingsScreen({ onAdd }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (user?.role === 'owner') {
      const fetchListingsAndBookings = async () => {
        try {
          const [eqRes, bookRes] = await Promise.all([
            api.get('/equipment'),
            api.get(`/bookings?ownerId=${user?.id}`)
          ]);

          if (mounted) {
            const mapped = (eqRes.data || []).map(item => ({
              id: item._id,
              name: item.title || item.name || 'Unknown Item',
              status: item.status || (item.available ? 'available' : 'unavailable'),
              category: item.category || 'Other',
              price: item.price !== undefined ? item.price : item.pricePerDay || 0,
              unit: item.unit || 'day',
              earnings: item.earnings || 0,
              rentals: item.rentals || 0,
              img: item.imageEmoji || '🛠️',
            }));
            setListings(mapped);
            setOwnerBookings(Array.isArray(bookRes.data) ? bookRes.data : []);
          }
        } catch (error) {
          console.error('[ListingsScreen] Fetch error:', error);
        } finally {
          if (mounted) setLoading(false);
        }
      };
      fetchListingsAndBookings();
    } else {
      setLoading(false);
    }
    return () => { mounted = false; };
  }, [user?.role]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Fallback UI for Customer Accounts
  if (user?.role !== 'owner') {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyTitle}>Switch to Owner Mode</Text>
        <Text style={styles.emptySubText}>
          To list equipment and start earning, please switch to Owner Mode in settings.
        </Text>
      </View>
    );
  }

  const totalEarnings = listings.reduce((a, l) => a + l.earnings, 0);
  const totalRentals = listings.reduce((a, l) => a + l.rentals, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.titleRow}>
        <Text style={styles.heading}>My Listings</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAdd();
          }}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Earnings Banner */}
      <View style={styles.earningsBanner}>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsAmount}>₹{totalEarnings.toLocaleString('en-IN')}</Text>
        <Text style={styles.earningsSub}>{totalRentals} completed rentals</Text>
      </View>

      {/* Owner Dashboard Rentals Tracker */}
      {ownerBookings.length > 0 && (
        <View style={styles.bookingAlertsTrack}>
          <Text style={styles.bookingAlertsHeader}>Recent Rentals</Text>
          {ownerBookings.map(b => (
            <View key={b._id} style={styles.bookingAlertNode}>
              <Text style={styles.bookingAlertIcon}>🔔</Text>
              <Text style={styles.bookingAlertMessage}>
                Your <Text style={{ fontWeight: '800' }}>{b.equipmentName || 'Equipment'}</Text> has been rented by <Text style={{ fontWeight: '800' }}>Customer {b.userId ? String(b.userId).substring(0,4) : 'User'}</Text>.
              </Text>
            </View>
          ))}
        </View>
      )}

      {listings.length === 0 ? (
        <View style={styles.emptyStateBox}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>📤</Text>
          <Text style={styles.emptyTitle}>No listings yet.</Text>
        </View>
      ) : (
        listings.map(l => (
          <View key={l.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.iconBox}>
                <Text style={styles.icon}>{l.img}</Text>
              </View>
              <View style={styles.info}>
                <View style={styles.titleRowInner}>
                  <Text style={styles.equipName}>{l.name}</Text>
                  <Badge color="#065f46" bg={COLORS.successLight}>{l.status}</Badge>
                </View>
                <Text style={styles.category}>{l.category}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statVal}>₹{l.earnings.toLocaleString('en-IN')}</Text>
                    <Text style={styles.statLbl}>earned</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statVal}>{l.rentals}</Text>
                    <Text style={styles.statLbl}>rentals</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statVal}>₹{l.price.toLocaleString('en-IN')}</Text>
                    <Text style={styles.statLbl}>/{l.unit}</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => Haptics.selectionAsync()}
              >
                <Text style={styles.editBtnText}>✏️  Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)}
              >
                <Text style={styles.deleteBtnText}>🗑️  Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerAll: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 8, textAlign: 'center' },
  emptySubText: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', lineHeight: 22 },
  emptyStateBox: { alignItems: 'center', marginVertical: 32 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { fontSize: 22, fontWeight: '800', color: '#111' },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  earningsBanner: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 20, marginBottom: 20 },
  earningsLabel: { color: '#bfdbfe', fontSize: 13, marginBottom: 4 },
  earningsAmount: { color: '#fff', fontWeight: '800', fontSize: 30 },
  earningsSub: { color: '#93c5fd', fontSize: 13, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  iconBox: { backgroundColor: '#dbeafe', borderRadius: 12, width: 54, height: 54, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 28 },
  info: { flex: 1 },
  titleRowInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  equipName: { fontWeight: '700', fontSize: 15, flex: 1, marginRight: 8 },
  category: { fontSize: 12, color: COLORS.gray500, marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  statItem: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  statVal: { fontWeight: '700', color: COLORS.primary, fontSize: 13 },
  statLbl: { fontSize: 11, color: COLORS.gray500 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: { flex: 1, backgroundColor: COLORS.gray100, borderRadius: 10, padding: 10, alignItems: 'center' },
  editBtnText: { fontWeight: '600', fontSize: 13, color: COLORS.gray700 },
  deleteBtn: { flex: 1, backgroundColor: COLORS.dangerLight, borderRadius: 10, padding: 10, alignItems: 'center' },
  deleteBtnText: { fontWeight: '600', fontSize: 13, color: COLORS.danger },
  bookingAlertsTrack: { marginBottom: 20 },
  bookingAlertsHeader: { fontWeight: '800', fontSize: 16, marginBottom: 8, color: '#1e293b' },
  bookingAlertNode: { backgroundColor: '#f0fdf4', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  bookingAlertIcon: { fontSize: 18, marginRight: 8 },
  bookingAlertMessage: { fontSize: 13, color: '#166534', flex: 1, lineHeight: 18 },
});
