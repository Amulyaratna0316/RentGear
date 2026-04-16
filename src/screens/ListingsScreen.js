import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MY_LISTINGS, COLORS } from '../data';
import { Badge } from '../components/SharedComponents';

export default function ListingsScreen({ onAdd }) {
  const totalEarnings = MY_LISTINGS.reduce((a, l) => a + l.earnings, 0);
  const totalRentals = MY_LISTINGS.reduce((a, l) => a + l.rentals, 0);

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

      {MY_LISTINGS.map(l => (
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
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
});
