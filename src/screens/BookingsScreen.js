import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { COLORS } from '../data';
import { Badge } from '../components/SharedComponents';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Formats a raw date value (ISO string, Date object, or timestamp) to a clean
 * locale-aware string like "18 Apr 2026". Falls back to '-' if the value is
 * missing or invalid.
 */
const toDisplayDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * BookingsScreen
 *
 * isActive — passed by the custom tab switcher in App.js.
 *            Becomes `true` every time the Bookings tab is focused.
 *            The useEffect below re-fetches whenever this flips to true,
 *            acting as the equivalent of useFocusEffect from React Navigation.
 *
 * API endpoint: GET /api/bookings?userId=...
 *   The server runs a 3-collection aggregation pipeline and returns enriched
 *   fields: equipmentName, imageEmoji, ownerName, startDate, endDate, totalPrice.
 */
export default function BookingsScreen({ isActive = true }) {
  const { user } = useAuth();
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

      const userId = user?.id || user?._id;
      console.log(`[BookingsScreen] Fetching GET /bookings?userId=${userId}...`);

      const { data } = await api.get(`/bookings?userId=${userId}`);
      console.log('[BookingsScreen] Response count:', Array.isArray(data) ? data.length : data);

      if (isMounted.current) {
        setBookings(Array.isArray(data) ? data : []);
      }
    } catch (apiError) {
      console.error(
        '[BookingsScreen] Fetch error:',
        apiError?.response?.status,
        apiError?.response?.data || apiError?.message,
      );
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
  }, [user?.id, user?._id]);

  // ── Re-fetch whenever this tab becomes active ─────────────────────────────
  // The custom tab switcher unmounts/remounts the screen when hidden/shown,
  // so this fires on every tab switch automatically.
  useEffect(() => {
    if (isActive && user?.role !== 'owner') {
      loadBookings();
    }
  }, [isActive, loadBookings, user?.role]);

  // ── Pull-to-refresh handler ───────────────────────────────────────────────
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (user?.role !== 'owner') {
      loadBookings({ silent: true });
    } else {
      setRefreshing(false);
    }
  }, [loadBookings, user?.role]);

  // ── Owner guard ───────────────────────────────────────────────────────────
  if (user?.role === 'owner') {
    return (
      <View style={[styles.container, styles.centerWrap]}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>🚫</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 8, textAlign: 'center' }}>
          Owner Mode
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.gray500, textAlign: 'center', lineHeight: 22 }}>
          Please login as a Customer to browse gear or view your rentals.
        </Text>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
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

      {/* Loading indicator */}
      {loading && (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      )}

      {/* Error state */}
      {!!error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Empty state */}
      {!loading && !error && bookings.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={styles.emptyText}>No bookings yet.</Text>
          <Text style={styles.emptySubText}>Go to Browse and rent some equipment!</Text>
        </View>
      )}

      {/* Booking cards */}
      {bookings.map((b) => {
        // ── All data is enriched by the backend aggregation pipeline ───────
        // Safe fallbacks via optional chaining for the transition period
        const equipmentName  = b?.equipmentName  || 'Unknown Equipment';
        const ownerName      = b?.ownerName      || 'Verified Owner';
        const imageEmoji     = b?.imageEmoji      || '🛠️';
        const status         = b?.status          || 'confirmed';
        const fromDate       = toDisplayDate(b?.startDate);
        const toDate         = toDisplayDate(b?.endDate);
        const totalPrice     = Number(b?.totalPrice ?? 0);

        const isConfirmed = status === 'confirmed';

        return (
          <View key={b?._id} style={styles.card}>
            <View style={styles.cardTop}>
              {/* Equipment icon */}
              <View style={styles.iconBox}>
                <Text style={styles.icon}>{imageEmoji}</Text>
              </View>

              <View style={styles.info}>
                {/* Title row */}
                <View style={styles.titleRow}>
                  <Text style={styles.equipName} numberOfLines={2}>{equipmentName}</Text>
                  <Badge
                    color={isConfirmed ? '#065f46' : COLORS.gray700}
                    bg={isConfirmed ? COLORS.successLight : COLORS.gray100}
                  >
                    {status}
                  </Badge>
                </View>

                {/* Owner */}
                <Text style={styles.ownerText}>by {ownerName}</Text>

                {/* Meta grid — dates + price */}
                <View style={styles.metaGrid}>
                  {[
                    ['📅 From', fromDate],
                    ['📅 To',   toDate],
                    ['💰 Total', `₹${totalPrice.toLocaleString('en-IN')}`],
                  ].map(([label, val]) => (
                    <View key={label} style={styles.metaCell}>
                      <Text style={styles.metaLabel}>{label}</Text>
                      <Text style={styles.metaVal}>{val}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Booking ID footer */}
            <Text style={styles.bookingId}>Booking ID: {b?._id}</Text>
          </View>
        );
      })}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  heading:      { fontSize: 22, fontWeight: '800', marginBottom: 16, color: '#111' },

  // Card
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  cardTop:      { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  iconBox:      { backgroundColor: '#dbeafe', borderRadius: 12, width: 54, height: 54, justifyContent: 'center', alignItems: 'center' },
  icon:         { fontSize: 26 },
  info:         { flex: 1 },
  titleRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  equipName:    { fontWeight: '700', fontSize: 15, flex: 1, marginRight: 8, color: '#111' },
  ownerText:    { fontSize: 12, color: COLORS.gray500, marginTop: 3, marginBottom: 8 },

  // Meta grid (From / To / Total)
  metaGrid:     { flexDirection: 'row', gap: 6 },
  metaCell:     { flex: 1, backgroundColor: '#f8fafc', borderRadius: 8, padding: 8, alignItems: 'center' },
  metaLabel:    { fontSize: 10, color: COLORS.gray500 },
  metaVal:      { fontSize: 11, fontWeight: '700', marginTop: 2, color: '#111' },

  // Footer
  bookingId:    { fontSize: 11, color: COLORS.gray400, marginTop: 10 },

  // States
  centerWrap:   { paddingVertical: 40, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText:  { color: COLORS.gray500, marginTop: 8, fontSize: 13 },
  errorBox:     { backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, marginBottom: 12 },
  errorText:    { color: COLORS.danger, fontWeight: '600', fontSize: 13 },
  emptyWrap:    { alignItems: 'center', paddingVertical: 60 },
  emptyText:    { color: '#111', fontWeight: '700', fontSize: 16, marginTop: 12 },
  emptySubText: { color: COLORS.gray500, fontSize: 13, marginTop: 4 },
});
