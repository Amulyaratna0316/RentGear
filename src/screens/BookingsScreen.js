import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { COLORS } from '../data';
import { Badge } from '../components/SharedComponents';
import api from '../services/api';

const toDisplayDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().slice(0, 10);
};

/**
 * BookingsScreen
 *
 * isActive  — passed by the custom tab switcher in App.js.
 *             Becomes `true` every time the Bookings tab is focused.
 *             The useEffect below re-fetches whenever this flips to true,
 *             acting as the equivalent of useFocusEffect from React Navigation.
 *
 * API endpoint: GET /api/bookings
 *   The server (bookingRoutes.js) filters by `renter: req.user.id`
 *   automatically from the JWT, so no extra query param is needed.
 */
export default function BookingsScreen({ isActive = true }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Core fetch ────────────────────────────────────────────────────────────
  const loadBookings = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      console.log('[BookingsScreen] Fetching GET /api/bookings...');
      const { data } = await api.get('/api/bookings');
      console.log('[BookingsScreen] Response:', JSON.stringify(data));
      if (isMounted.current) {
        setBookings(Array.isArray(data) ? data : []);
      }
    } catch (apiError) {
      console.error('[BookingsScreen] Fetch error:', apiError?.response?.status, apiError?.response?.data || apiError?.message);
      if (isMounted.current) {
        const message =
          apiError?.response?.data?.message ||
          apiError?.message ||
          'Failed to load bookings. Check your connection.';
        setError(message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // ── Focus effect (replaces useFocusEffect from @react-navigation) ─────────
  // Because the custom tab switcher uses conditional rendering
  //   {tab === 'bookings' && <BookingsScreen isActive={true} />}
  // this component unmounts when hidden and remounts when shown.
  // The effect below fires on mount (isActive = true) AND if the parent
  // ever keeps it mounted and just toggles isActive.
  useEffect(() => {
    if (isActive) {
      loadBookings();
    }
  }, [isActive, loadBookings]);

  // ── Pull-to-refresh handler ───────────────────────────────────────────────
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings({ silent: true });
  }, [loadBookings]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      <Text style={styles.heading}>My Bookings</Text>

      {loading && (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      )}

      {!!error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {!loading && !error && bookings.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={styles.emptyText}>No bookings yet.</Text>
          <Text style={styles.emptySubText}>Go to Browse and rent some equipment!</Text>
        </View>
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

      <View style={{ height: 20 }} />
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
  centerWrap: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { color: COLORS.gray500, marginTop: 8, fontSize: 13 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, marginBottom: 12 },
  errorText: { color: COLORS.danger, fontWeight: '600', fontSize: 13 },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#111', fontWeight: '700', fontSize: 16, marginTop: 12 },
  emptySubText: { color: COLORS.gray500, fontSize: 13, marginTop: 4 },
});
