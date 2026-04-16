import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../data';

export const Stars = ({ rating }) => (
  <View style={styles.starsRow}>
    <Text style={styles.starFilled}>{'★'.repeat(Math.floor(rating))}</Text>
    <Text style={styles.starEmpty}>{'☆'.repeat(5 - Math.floor(rating))}</Text>
    <Text style={styles.ratingNum}>{rating}</Text>
  </View>
);

export const Badge = ({ children, color = COLORS.primary, bg = '#dbeafe' }) => (
  <View style={[styles.badge, { backgroundColor: bg }]}>
    <Text style={[styles.badgeText, { color }]}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  starsRow: { flexDirection: 'row', alignItems: 'center' },
  starFilled: { color: COLORS.accent, fontSize: 13 },
  starEmpty: { color: COLORS.accent, fontSize: 13 },
  ratingNum: { color: COLORS.gray500, fontSize: 12, marginLeft: 4 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
