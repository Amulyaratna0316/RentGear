import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import api from '../services/api';
import { CATEGORIES, COLORS } from '../data';
import { Badge } from '../components/SharedComponents';
import { useAuth } from '../context/AuthContext';

// ─── Edit Listing Modal ───────────────────────────────────────────────────────

function EditListingModal({ visible, item, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', price: '', description: '', category: 'Tools' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        name: item?.name || '',
        price: String(item?.price ?? ''),
        description: item?.description || '',
        category: item?.category || 'Tools',
      });
    }
  }, [item]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.price) {
      Alert.alert('Validation', 'Name and Price are required.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: form.name,
        price: Number(form.price),
        description: form.description,
        category: form.category,
      });
      onClose();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={editStyles.overlay}>
        <View style={editStyles.sheet}>
          <View style={editStyles.topRow}>
            <Text style={editStyles.heading}>Edit Listing</Text>
            <TouchableOpacity style={editStyles.closeBtn} onPress={onClose} disabled={saving}>
              <Text style={editStyles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={editStyles.label}>Equipment Name</Text>
            <TextInput
              style={editStyles.input}
              value={form.name}
              onChangeText={v => set('name', v)}
              placeholder="Equipment name"
              placeholderTextColor={COLORS.gray400}
              editable={!saving}
            />

            <Text style={editStyles.label}>Price per Day (₹)</Text>
            <TextInput
              style={editStyles.input}
              value={form.price}
              onChangeText={v => set('price', v)}
              placeholder="e.g. 4500"
              placeholderTextColor={COLORS.gray400}
              keyboardType="numeric"
              editable={!saving}
            />

            <Text style={editStyles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
              contentContainerStyle={{ gap: 8 }}
            >
              {(CATEGORIES || []).filter(c => c !== 'All').map(c => (
                <TouchableOpacity
                  key={c}
                  style={[editStyles.catChip, form.category === c && editStyles.catChipActive]}
                  onPress={() => set('category', c)}
                  disabled={saving}
                >
                  <Text style={[editStyles.catText, form.category === c && { color: '#fff' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={editStyles.label}>Description</Text>
            <TextInput
              style={[editStyles.input, editStyles.textArea]}
              value={form.description}
              onChangeText={v => set('description', v)}
              placeholder="Description..."
              placeholderTextColor={COLORS.gray400}
              multiline
              numberOfLines={4}
              editable={!saving}
            />

            <TouchableOpacity
              style={[editStyles.saveBtn, saving && { backgroundColor: COLORS.gray400 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSave();
              }}
              disabled={saving}
            >
              {saving ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                  <Text style={editStyles.saveBtnText}>Saving...</Text>
                </View>
              ) : (
                <Text style={editStyles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Listings Screen ──────────────────────────────────────────────────────────

export default function ListingsScreen({ onAdd, refreshKey }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Earnings state
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalRentals, setTotalRentals] = useState(0);
  const [itemEarningsMap, setItemEarningsMap] = useState({});

  // Edit modal state
  const [editItem, setEditItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (user?.role === 'owner') {
      const fetchAll = async () => {
        try {
          const ownerId = user?.id || user?._id;

          // Parallel fetches for listings, bookings (with renter names), earnings, and per-item earnings
          const [eqRes, bookRes, earningsRes, itemEarningsRes] = await Promise.all([
            api.get('/equipment'),
            api.get(`/bookings?ownerId=${ownerId}`),
            api.get(`/owner/earnings?ownerId=${ownerId}`),
            api.get(`/owner/equipment-earnings?ownerId=${ownerId}`),
          ]);

          if (mounted) {
            // Map equipment data
            const mapped = (eqRes?.data || [])
              .filter(item => String(item?.ownerId) === String(ownerId))
              .map(item => ({
                id: item?._id,
                name: item?.title || item?.name || 'Unknown Item',
                status: item?.status || (item?.available ? 'available' : 'unavailable'),
                category: item?.category || 'Other',
                price: item?.price !== undefined ? item?.price : (item?.pricePerDay || 0),
                unit: item?.unit || 'day',
                description: item?.description || '',
                totalQuantity: item?.totalQuantity ?? 1,
                availableStock: item?.availableStock ?? (item?.stock ?? 1),
                img: item?.imageEmoji || '🛠️',
              }));
            setListings(mapped);

            // Owner bookings (with renterName from $lookup)
            setOwnerBookings(Array.isArray(bookRes?.data) ? bookRes.data : []);

            // Total earnings
            setTotalEarnings(earningsRes?.data?.totalEarnings ?? 0);
            setTotalRentals(earningsRes?.data?.totalRentals ?? 0);

            // Per-item earnings map: { equipmentId: { totalEarned, rentalCount } }
            setItemEarningsMap(itemEarningsRes?.data || {});
          }
        } catch (error) {
          console.error('[ListingsScreen] Fetch error:', error);
        } finally {
          if (mounted) setLoading(false);
        }
      };
      fetchAll();
    } else {
      setLoading(false);
    }
    return () => { mounted = false; };
  }, [user?.role, refreshKey]);

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = (item) => {
    Alert.alert(
      'Remove Listing',
      `Are you sure you want to delete "${item?.name || 'this item'}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const ownerId = user?.id || user?._id;
              await api.delete(`/equipment/${item?.id}?ownerId=${ownerId}`);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              // Remove from local state
              setListings(prev => prev.filter(l => l?.id !== item?.id));
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  // ── Edit handler ──────────────────────────────────────────────────────────
  const handleEdit = (item) => {
    setEditItem(item);
    setShowEditModal(true);
    Haptics.selectionAsync();
  };

  const handleEditSave = async (updatedFields) => {
    const ownerId = user?.id || user?._id;
    const res = await api.put(`/equipment/${editItem?.id}`, {
      ...updatedFields,
      ownerId,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Update local state with the returned updated equipment
    const updatedEq = res?.data?.equipment;
    setListings(prev =>
      prev.map(l => {
        if (l?.id !== editItem?.id) return l;
        return {
          ...l,
          name: updatedEq?.name || updatedFields?.name || l?.name,
          price: updatedEq?.price ?? updatedFields?.price ?? l?.price,
          description: updatedEq?.description || updatedFields?.description || l?.description,
          category: updatedEq?.category || updatedFields?.category || l?.category,
          img: updatedEq?.imageEmoji || l?.img,
        };
      })
    );
  };

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Edit Modal */}
      <EditListingModal
        visible={showEditModal}
        item={editItem}
        onClose={() => {
          setShowEditModal(false);
          setEditItem(null);
        }}
        onSave={handleEditSave}
      />

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

      {/* Earnings Banner — dynamic data from aggregation */}
      <View style={styles.earningsBanner}>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsAmount}>₹{(totalEarnings ?? 0)?.toLocaleString?.('en-IN') || '0'}</Text>
        <Text style={styles.earningsSub}>{totalRentals ?? 0} completed rentals</Text>
      </View>

      {/* Owner Dashboard Rentals Tracker — with human-readable names */}
      {ownerBookings?.length > 0 && (
        <View style={styles.bookingAlertsTrack}>
          <Text style={styles.bookingAlertsHeader}>Recent Rentals</Text>
          {ownerBookings.map(b => (
            <View key={b?._id} style={styles.bookingAlertNode}>
              <Text style={styles.bookingAlertIcon}>🔔</Text>
              <Text style={styles.bookingAlertMessage}>
                Your <Text style={{ fontWeight: '800' }}>{b?.equipmentName || 'Equipment'}</Text> has been rented by{' '}
                <Text style={{ fontWeight: '800' }}>{b?.renterName || 'Customer'}</Text>
                {b?.totalPrice ? ` for ₹${Number(b?.totalPrice)?.toLocaleString?.('en-IN') || '0'}` : ''}.
              </Text>
            </View>
          ))}
        </View>
      )}

      {listings?.length === 0 ? (
        <View style={styles.emptyStateBox}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>📤</Text>
          <Text style={styles.emptyTitle}>No listings yet.</Text>
        </View>
      ) : (
        listings.map(l => {
          // Per-item earnings from the aggregation map
          const itemEarnings = itemEarningsMap?.[l?.id] || {};
          const earned = itemEarnings?.totalEarned ?? 0;
          const rentals = itemEarnings?.rentalCount ?? 0;

          return (
            <View key={l?.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>{l?.img}</Text>
                </View>
                <View style={styles.info}>
                  <View style={styles.titleRowInner}>
                    <Text style={styles.equipName}>{l?.name || 'Unnamed'}</Text>
                    <Badge color="#065f46" bg={COLORS.successLight}>{l?.status || 'unknown'}</Badge>
                  </View>
                  <Text style={styles.category}>{l?.category || 'Other'}</Text>

                  {/* Stock indicator */}
                  <Text style={styles.stockText}>
                    📦 {l?.availableStock ?? 0}/{l?.totalQuantity ?? 1} in stock
                  </Text>

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statVal}>₹{(earned ?? 0)?.toLocaleString?.('en-IN') || '0'}</Text>
                      <Text style={styles.statLbl}>earned</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statVal}>{rentals ?? 0}</Text>
                      <Text style={styles.statLbl}>rentals</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statVal}>₹{(l?.price ?? 0)?.toLocaleString?.('en-IN') || '0'}</Text>
                      <Text style={styles.statLbl}>/{l?.unit || 'day'}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => handleEdit(l)}
                >
                  <Text style={styles.editBtnText}>✏️  Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(l)}
                >
                  <Text style={styles.deleteBtnText}>🗑️  Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  stockText: { fontSize: 12, color: COLORS.primaryLight, fontWeight: '600', marginTop: 4 },
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

// ─── Edit Modal Styles ────────────────────────────────────────────────────────

const editStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', padding: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: '800', color: '#111' },
  closeBtn: { backgroundColor: COLORS.gray100, borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 16, color: COLORS.gray500 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: '#111', marginBottom: 16 },
  textArea: { height: 90, textAlignVertical: 'top' },
  catChip: { backgroundColor: COLORS.gray100, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  catChipActive: { backgroundColor: COLORS.primary },
  catText: { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
