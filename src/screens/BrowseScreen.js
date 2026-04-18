import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import api from '../services/api';
import { CATEGORIES, COLORS, EQUIPMENT } from '../data';
import { Stars, Badge } from '../components/SharedComponents';
import EquipmentModal from '../components/EquipmentModal';

export default function BrowseScreen({ role, onAddListing, onBookingCreated }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedEq, setSelectedEq] = useState(null);
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    const loadEquipment = async () => {
      try {
        const { data } = await api.get('/equipment');
        const mapped = data.map((item) => ({
          id: item._id,
          name: item.title || item.name || 'Unknown Item',
          category: item.category || 'Other',
          price: item.pricePerDay !== undefined ? item.pricePerDay : item.price,
          unit: item.unit || 'day',
          owner: item.owner?.name || 'Owner',
          location: item.location || 'Unknown',
          rating: item.rating || 4.7,
          reviews: item.reviews || 10,
          status: item.status || (item.available ? 'available' : 'unavailable'),
          stock: item.stock !== undefined ? item.stock : 1,
          available: item.available !== false && item.status !== 'unavailable',
          img: item.imageEmoji || '🛠️',
          tags: [item.category?.toLowerCase()],
          desc: item.description || '',
        }));
        setEquipment(mapped);
      } catch (_error) {
        setEquipment(EQUIPMENT);
      }
    };

    loadEquipment();
  }, []);

  const filtered = useMemo(() => equipment.filter(e =>
    (category === 'All' || e.category === category) &&
    ((e.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.tags || []).some(t => t.includes(search.toLowerCase())))
  ), [equipment, category, search]);

  if (role === 'owner') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>🚫</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 8, textAlign: 'center' }}>Owner Mode</Text>
        <Text style={{ fontSize: 14, color: COLORS.gray500, textAlign: 'center', lineHeight: 22 }}>
          Please login as a Customer to browse gear or view your rentals.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EquipmentModal
        eq={selectedEq}
        onClose={() => setSelectedEq(null)}
        onBooked={onBookingCreated}
      />

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search equipment, tools..."
          placeholderTextColor={COLORS.gray400}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.catChip, category === c && styles.catChipActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setCategory(c);
              }}
            >
              <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { val: filtered.filter(e => e.available).length, label: 'Available' },
            { val: '4.6★', label: 'Avg Rating' },
            { val: '2hr', label: 'Avg Response' },
          ].map(({ val, label }) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statVal}>{val}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Owner CTA */}
        {role === 'owner' && (
          <TouchableOpacity
            style={styles.ownerCTA}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAddListing();
            }}
          >
            <View>
              <Text style={styles.ownerCTATitle}>List your equipment</Text>
              <Text style={styles.ownerCTASub}>Earn money from idle machinery</Text>
            </View>
            <View style={styles.ownerCTABtn}>
              <Text style={styles.ownerCTABtnText}>+ Add</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Grid */}
        <View style={styles.grid}>
          {filtered.map(eq => (
            <TouchableOpacity
              key={eq.id}
              style={[styles.card, { opacity: eq.available ? 1 : 0.75 }]}
              onPress={() => setSelectedEq(eq)}
              activeOpacity={0.85}
            >
              <View style={styles.cardImg}>
                <Text style={styles.cardEmoji}>{eq.img}</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName} numberOfLines={2}>{eq.name}</Text>
                  {!eq.available && <Badge color="#991b1b" bg="#fee2e2">Rented</Badge>}
                </View>
                <Text style={styles.cardLocation}>{eq.location}</Text>
                <Stars rating={eq.rating || 0} />
                <View style={styles.cardPriceRow}>
                  <Text style={styles.cardPrice}>₹{eq.price?.toLocaleString('en-IN') || '0'}</Text>
                  <Text style={styles.cardUnit}>/{eq.unit}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🔍</Text>
            <Text style={styles.emptyText}>No equipment found</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, marginHorizontal: 16, marginBottom: 4, paddingHorizontal: 12, height: 46 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111' },
  catScroll: { paddingVertical: 12 },
  catChip: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  catChipActive: { backgroundColor: COLORS.primary },
  catChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
  catChipTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  statVal: { fontWeight: '800', fontSize: 18, color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.gray500, marginTop: 2 },
  ownerCTA: { marginHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  ownerCTATitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ownerCTASub: { color: '#bfdbfe', fontSize: 12, marginTop: 2 },
  ownerCTABtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  ownerCTABtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', width: '47.5%', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  cardImg: { backgroundColor: '#dbeafe', height: 90, justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 40 },
  cardBody: { padding: 10 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardName: { fontWeight: '700', fontSize: 13, flex: 1, marginRight: 4, lineHeight: 18 },
  cardLocation: { fontSize: 11, color: COLORS.gray500, marginBottom: 5 },
  cardPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  cardPrice: { fontWeight: '800', fontSize: 15, color: COLORS.primary },
  cardUnit: { fontSize: 10, color: COLORS.gray500, marginLeft: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, color: COLORS.gray400, marginTop: 12 },
});
