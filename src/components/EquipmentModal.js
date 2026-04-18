import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, TextInput, ActivityIndicator,
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

  const parseDate = (str) => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const days =
    dateFrom && dateTo && dateFrom < dateTo
      ? Math.max(1, Math.ceil((parseDate(dateTo) - parseDate(dateFrom)) / 86400000))
      : null;

  const handleBooking = async () => {
    if (!eq.available || submitting) return;

    if (!dateFrom.trim() || !dateTo.trim()) {
      setError('Please enter both start and end dates.');
      return;
    }

    const start = parseDate(dateFrom);
    const end = parseDate(dateTo);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('Invalid date format. Use YYYY-MM-DD.');
      return;
    }
    if (end < start) {
      setError('End date cannot be before start date.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post('/api/bookings', {
        equipmentId: eq.id,
        startDate: dateFrom.trim(),
        endDate: dateTo.trim(),
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setBooked(true);
      if (onBooked) onBooked();
    } catch (apiError) {
      const message =
        apiError?.response?.data?.message ||
        apiError?.message ||
        'Failed to create booking. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
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
                  style={[styles.bookBtn, !eq.available && styles.bookBtnDisabled]}
                  onPress={handleBooking}
                  disabled={!eq.available || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
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
  bookBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  bookBtnDisabled: { backgroundColor: COLORS.gray400 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  bookedBox: { backgroundColor: COLORS.successLight, borderRadius: 12, padding: 24, alignItems: 'center' },
  bookedIcon: { fontSize: 44, marginBottom: 8 },
  bookedTitle: { fontWeight: '800', color: '#065f46', fontSize: 18 },
  bookedSub: { color: COLORS.success, fontSize: 14, marginTop: 4 },
});
