import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CATEGORIES, COLORS } from '../data';
import AIVerificationModal from '../components/AIVerificationModal';

export default function AddListingScreen({ visible, onClose }) {
  const [form, setForm] = useState({ name: '', price: '', category: '', desc: '' });
  const [showAI, setShowAI] = useState(false);
  const [verified, setVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const reset = () => {
    setForm({ name: '', price: '', category: '', desc: '' });
    setVerified(false);
    setSubmitted(false);
    onClose();
  };

  const canSubmit = verified && form.name && form.price;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={reset}>
      <AIVerificationModal
        visible={showAI}
        onClose={() => setShowAI(false)}
        onSuccess={() => { setVerified(true); setShowAI(false); }}
      />
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.topRow}>
            <Text style={styles.heading}>List Your Equipment</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={reset}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={styles.successState}>
              <Text style={{ fontSize: 60 }}>🚀</Text>
              <Text style={styles.successTitle}>Listing Published!</Text>
              <Text style={styles.successSub}>Your equipment is now visible to renters.</Text>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  reset();
                }}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text style={styles.label}>Equipment Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Excavator JD 350G"
                placeholderTextColor={COLORS.gray400}
                value={form.name}
                onChangeText={v => set('name', v)}
              />

              {/* Price */}
              <Text style={styles.label}>Price per Day (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 4500"
                placeholderTextColor={COLORS.gray400}
                keyboardType="numeric"
                value={form.price}
                onChangeText={v => set('price', v)}
              />

              {/* Category */}
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catChip, form.category === c && styles.catChipActive]}
                    onPress={() => set('category', c)}
                  >
                    <Text style={[styles.catText, form.category === c && { color: '#fff' }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Description */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe condition, specs, accessories..."
                placeholderTextColor={COLORS.gray400}
                multiline
                numberOfLines={4}
                value={form.desc}
                onChangeText={v => set('desc', v)}
              />

              {/* AI Verification */}
              <View style={[styles.verifyBox, verified && styles.verifyBoxDone]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.verifyTitle, verified && { color: '#065f46' }]}>
                    {verified ? '✅ AI Verification Complete' : '📷 AI Photo Verification'}
                  </Text>
                  <Text style={styles.verifySub}>
                    {verified ? 'Your equipment photo is authenticated' : 'Required to publish listing'}
                  </Text>
                </View>
                {!verified && (
                  <TouchableOpacity
                    style={styles.verifyBtn}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowAI(true);
                    }}
                  >
                    <Text style={styles.verifyBtnText}>Verify</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                onPress={() => {
                  if (!canSubmit) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSubmitted(true);
                }}
                disabled={!canSubmit}
              >
                <Text style={styles.submitBtnText}>Publish Listing</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  verifyBox: { borderWidth: 2, borderColor: COLORS.gray200, borderStyle: 'dashed', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#fafafa' },
  verifyBoxDone: { borderColor: COLORS.success, backgroundColor: '#f0fdf4' },
  verifyTitle: { fontWeight: '700', fontSize: 14 },
  verifySub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  verifyBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  verifyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: COLORS.gray400 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  successState: { alignItems: 'center', paddingVertical: 40 },
  successTitle: { fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  successSub: { color: COLORS.gray500, fontSize: 14, textAlign: 'center' },
  doneBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 40, paddingVertical: 14, marginTop: 24 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
