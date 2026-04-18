import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../data';
import { Badge } from '../components/SharedComponents';
import api from '../services/api';

const toDisplayDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().slice(0, 10);
};

export default function BookingsScreen({ refreshKey = 0 }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/api/bookings');
      setBookings(Array.isArray(data) ? data : []);
    } catch (apiError) {
      const message =
        apiError?.response?.data?.message ||
        apiError?.message ||
        'Failed to load bookings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings, refreshKey]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>My Bookings</Text>
      {loading && (
        <View style={styles.centerWrap}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      {!loading && !error && bookings.length === 0 && (
        <Text style={styles.emptyText}>No bookings yet. Create one from Browse.</Text>
      )}
      {bookings.map((b) => (
        <View key={b._id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>{b?.equipment?.imageEmoji || '🛠️'}</Text>
            </View>
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text style={styles.equipName}>{b?.equipment?.title || 'Equipment'}</Text>
                <Badge
                  color={b.status === 'confirmed' ? '#065f46' : COLORS.gray700}
                  bg={b.status === 'confirmed' ? COLORS.successLight : COLORS.gray100}
                >
                  {b.status}
                </Badge>
              </View>
              <Text style={styles.ownerText}>by {b?.owner?.name || 'Owner'}</Text>
              <View style={styles.metaGrid}>
                {[
                  ['📅 From', toDisplayDate(b.startDate)],
                  ['📅 To', toDisplayDate(b.endDate)],
                  ['💰 Total', `₹${Number(b.totalPrice || 0).toLocaleString('en-IN')}`],
                ].map(([label, val]) => (
                  <View key={label} style={styles.metaCell}>
                    <Text style={styles.metaLabel}>{label}</Text>
                    <Text style={styles.metaVal}>{val}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <Text style={styles.bookingId}>Booking ID: {b._id}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heading: { fontSize: 22, fontWeight: '800', marginBottom: 16, color: '#111' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  iconBox: { backgroundColor: '#dbeafe', borderRadius: 12, width: 54, height: 54, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 26 },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  equipName: { fontWeight: '700', fontSize: 15, flex: 1, marginRight: 8 },
  ownerText: { fontSize: 12, color: COLORS.gray500, marginTop: 3, marginBottom: 8 },
  metaGrid: { flexDirection: 'row', gap: 6 },
  metaCell: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 8, padding: 8, alignItems: 'center' },
  metaLabel: { fontSize: 10, color: COLORS.gray500 },
  metaVal: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  bookingId: { fontSize: 11, color: COLORS.gray400, marginTop: 10 },
  centerWrap: { paddingVertical: 20, alignItems: 'center' },
  errorText: { color: COLORS.danger, marginBottom: 12, fontWeight: '600' },
  emptyText: { color: COLORS.gray500, fontWeight: '600' },
});
