import React, { useEffect, useState } from 'react';
import {
  Alert, View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, TextInput, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import api from '../services/api';
import { Stars, Badge } from './SharedComponents';
import { COLORS } from '../data';

export default function EquipmentModal({ eq, onClose, onBooked }) {
  // ── All hooks MUST come first, unconditionally ──────────────────────────
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [booked, setBooked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form whenever the selected equipment changes
  useEffect(() => {
    if (!eq) return;
    setDateFrom('');
    setDateTo('');
    setBooked(false);
    setSubmitting(false);
    setError('');
  }, [eq?.id]);
  // ── End of hooks ─────────────────────────────────────────────────────────

  // Conditional logic AFTER all hooks
  if (!eq) return null;

  /**
   * Strictly validates a date string:
   *  1. Must match YYYY-MM-DD regex
   *  2. Month must be 01-12, day must be 01-31
   *  3. Reconstructed Date must not overflow (e.g. Feb 30 → Mar 1)
   *  4. Date must be today or in the future
   * Returns { valid: boolean, date: Date|null, error: string }
   */
  const validateDate = (str, label) => {
    // Step 1: format check
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str.trim())) {
      return { valid: false, date: null, error: `${label}: use YYYY-MM-DD format.` };
    }
    const [y, m, d] = str.trim().split('-').map(Number);
    // Step 2: range check
    if (m < 1 || m > 12) {
      return { valid: false, date: null, error: `${label}: month must be between 01 and 12.` };
    }
    if (d < 1 || d > 31) {
      return { valid: false, date: null, error: `${label}: day must be between 01 and 31.` };
    }
    // Step 3: overflow check (e.g. Feb 30 silently becomes Mar 1)
    const constructed = new Date(y, m - 1, d);
    if (
      constructed.getFullYear() !== y ||
      constructed.getMonth() !== m - 1 ||
      constructed.getDate() !== d
    ) {
      return { valid: false, date: null, error: `${label}: '${str}' is not a real calendar date.` };
    }
    // Step 4: must not be in the past (compare date-only, ignoring time)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (constructed < todayStart) {
      return { valid: false, date: null, error: `${label}: date cannot be in the past.` };
    }
    return { valid: true, date: constructed, error: null };
  };

  const parseDate = (str) => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const days = (() => {
    if (!dateFrom || !dateTo) return null;
    const fromResult = validateDate(dateFrom, 'From date');
    const toResult = validateDate(dateTo, 'To date');
    if (!fromResult.valid || !toResult.valid) return null;
    const diff = toResult.date - fromResult.date;
    return diff > 0 ? Math.ceil(diff / 86400000) : null;
  })();

  const handleBooking = async () => {
    // Guard: bail if unavailable or already in-flight (prevents double-tap)
    if (!eq.available || submitting) return;

    // ── Step 1: Client-side validation ──────────────────────────────────────
    if (!dateFrom.trim() || !dateTo.trim()) {
      setError('Please enter both start and end dates.');
      return;
    }
    const fromResult = validateDate(dateFrom, 'From date');
    if (!fromResult.valid) {
      setError(fromResult.error);
      return;
    }
    const toResult = validateDate(dateTo, 'To date');
    if (!toResult.valid) {
      setError(toResult.error);
      return;
    }
    if (toResult.date <= fromResult.date) {
      setError('End date must be after the start date.');
      return;
    }

    // ── Step 2: Call the backend API ─────────────────────────────────────────
    try {
      setSubmitting(true); // Disables the button immediately
      setError('');

      await api.post('/api/bookings', {
        equipmentId: eq.id,
        startDate: dateFrom.trim(),
        endDate: dateTo.trim(),
      });
      // API returned 2xx — booking was created in the database

      // ── Step 3: Haptic + Success alert BEFORE any navigation ──────────────
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Alert.alert(
        '🎉 Booking Confirmed!',
        `Your rental request for "${eq.name}" has been sent. The owner will confirm within 2 hours.`,
        [
          {
            text: 'View My Bookings',
            onPress: () => {
              // Only navigate AFTER the user acknowledges the alert
              onClose?.();      // Close the modal
              onBooked?.();     // Switches tab to Bookings and triggers re-fetch
            },
          },
        ],
        { cancelable: false }
      );

      // Mark locally as booked so the in-modal success view also shows
      // (visible briefly before the alert dismisses the modal)
      setBooked(true);

    } catch (apiError) {
      // ── Step 4: Error alert with backend message ───────────────────────────
      const message =
        apiError?.response?.data?.message ||
        apiError?.message ||
        'Could not complete the booking. Please try again.';

      setError(message); // Inline error stays visible

      Alert.alert(
        'Booking Failed',
        `Server Error: ${message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false); // Re-enables the button after success or failure
    }
  };

  return (
    <Modal visible={!!eq} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eqIcon}>{eq.img}</Text>
                <Text style={styles.eqName}>{eq.name}</Text>
                <Text style={styles.eqSub}>{eq.category} · {eq.location}</Text>
                <View style={styles.ratingRow}>
                  <Stars rating={eq.rating} />
                  <Text style={styles.reviewCount}>({eq.reviews} reviews)</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.descBox}>
              <Text style={styles.descText}>{eq.desc}</Text>
            </View>

            {/* Tags */}
            <View style={styles.tagsRow}>
              {eq.tags.map(t => <Badge key={t}>{t}</Badge>)}
              <Badge color="#065f46" bg="#d1fae5">AI Verified ✓</Badge>
            </View>

            {/* Price card */}
            <View style={styles.priceCard}>
              <View>
                <Text style={styles.priceAmount}>₹{eq.price.toLocaleString('en-IN')}</Text>
                <Text style={styles.priceUnit}>per {eq.unit}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.listedByLabel}>Listed by</Text>
                <Text style={styles.listedByName}>{eq.owner}</Text>
              </View>
            </View>

            {!booked ? (
              <>
                {/* Date inputs */}
                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>From Date</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD"
                      value={dateFrom}
                      onChangeText={setDateFrom}
                      placeholderTextColor={COLORS.gray400}
                    />
                  </View>
                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>To Date</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD"
                      value={dateTo}
                      onChangeText={setDateTo}
                      placeholderTextColor={COLORS.gray400}
                    />
                  </View>
                </View>

                {days && (
                  <View style={styles.totalBox}>
                    <Text style={styles.totalDays}>{days} day{days > 1 ? 's' : ''} total</Text>
                    <Text style={styles.totalPrice}>₹{(eq.price * days).toLocaleString('en-IN')}</Text>
                  </View>
                )}

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={[
                    styles.bookBtn,
                    (!eq.available || submitting) && styles.bookBtnDisabled,
                  ]}
                  onPress={handleBooking}
                  disabled={!eq.available || submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <View style={styles.bookBtnInner}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={[styles.bookBtnText, { marginLeft: 8 }]}>Confirming...</Text>
                    </View>
                  ) : (
                    <Text style={styles.bookBtnText}>
                      {eq.available ? '📋  Request Rental' : 'Currently Unavailable'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.bookedBox}>
                <Text style={styles.bookedIcon}>🎉</Text>
                <Text style={styles.bookedTitle}>Rental Request Sent!</Text>
                <Text style={styles.bookedSub}>The owner will confirm within 2 hours.</Text>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingHorizontal: 20, paddingTop: 24 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  eqIcon: { fontSize: 44, marginBottom: 8 },
  eqName: { fontSize: 22, fontWeight: '800', color: '#111' },
  eqSub: { color: COLORS.gray500, fontSize: 14, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  reviewCount: { color: COLORS.gray500, fontSize: 12, marginLeft: 6 },
  closeBtn: { backgroundColor: COLORS.gray100, borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 16, color: COLORS.gray500 },
  descBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 16 },
  descText: { color: COLORS.gray700, fontSize: 14, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  priceCard: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  priceAmount: { color: '#fff', fontSize: 26, fontWeight: '800' },
  priceUnit: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  listedByLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  listedByName: { color: '#fff', fontWeight: '700' },
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 12, color: COLORS.gray500, fontWeight: '600', marginBottom: 4 },
  dateInput: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10, padding: 10, fontSize: 14, color: '#111' },
  totalBox: { backgroundColor: '#fef9c3', borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalDays: { color: '#92400e', fontSize: 14 },
  totalPrice: { color: '#92400e', fontWeight: '700', fontSize: 14 },
  errorText: { color: COLORS.danger, fontWeight: '600', marginBottom: 10 },
  bookBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 8 },
  bookBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  bookBtnDisabled: { backgroundColor: COLORS.gray400 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  bookedBox: { backgroundColor: COLORS.successLight, borderRadius: 12, padding: 24, alignItems: 'center' },
  bookedIcon: { fontSize: 44, marginBottom: 8 },
  bookedTitle: { fontWeight: '800', color: '#065f46', fontSize: 18 },
  bookedSub: { color: COLORS.success, fontSize: 14, marginTop: 4 },
});
