import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { BOOKINGS, COLORS } from '../data';
import { Badge } from '../components/SharedComponents';

export default function BookingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>My Bookings</Text>
      {BOOKINGS.map(b => (
        <View key={b.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>{b.img}</Text>
            </View>
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text style={styles.equipName}>{b.equipment}</Text>
                <Badge
                  color={b.status === 'Confirmed' ? '#065f46' : COLORS.gray700}
                  bg={b.status === 'Confirmed' ? COLORS.successLight : COLORS.gray100}
                >
                  {b.status}
                </Badge>
              </View>
              <Text style={styles.ownerText}>by {b.owner}</Text>
              <View style={styles.metaGrid}>
                {[['📅 From', b.from], ['📅 To', b.to], ['💰 Total', `₹${b.total.toLocaleString('en-IN')}`]].map(([label, val]) => (
                  <View key={label} style={styles.metaCell}>
                    <Text style={styles.metaLabel}>{label}</Text>
                    <Text style={styles.metaVal}>{val}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <Text style={styles.bookingId}>Booking ID: {b.id}</Text>
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
});
