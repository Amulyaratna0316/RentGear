import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, ActivityIndicator, Alert
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CATEGORIES, COLORS } from '../data';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AIVerificationModal from '../components/AIVerificationModal';

export default function AddListingScreen({ visible, onClose, onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', price: '', category: 'Tools', desc: '', totalQuantity: '1' });
  const [showAI, setShowAI] = useState(false);
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const reset = () => {
    setForm({ name: '', price: '', category: 'Tools', desc: '', totalQuantity: '1' });
    setVerified(false);
    setSubmitting(false);
    setError('');
    onClose();
  };

  const handleVerifySim = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('AI Verification', 'AI Verification Simulated: Item looks good!');
    setVerified(true);
  };

  const handlePublish = async () => {
    if (!form.name || !form.price) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const payload = {
        ...form,
        totalQuantity: Math.max(1, Number(form.totalQuantity) || 1),
        ownerId: user?.id || user?._id,
      };

      console.log('[AddListingScreen] Sending payload:', payload);
      await api.post('/equipment', payload);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (onSuccess) onSuccess();
      reset();
    } catch (err) {
      console.error('[AddListingScreen] Error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to publish listing');
    } finally {
      setSubmitting(false);
    }
  };

  const priceParsed = parseFloat(form.price);
  const priceError = form.price && (isNaN(priceParsed) || priceParsed <= 0) 
    ? 'Please enter a valid positive price' : '';

  const qtyParsed = parseInt(form.totalQuantity, 10);
  const qtyError = form.totalQuantity && (isNaN(qtyParsed) || qtyParsed < 1) 
    ? 'Quantity must be at least 1' : '';

  const nameError = form.name && (form.name.length < 3 || /^\d+$/.test(form.name)) 
    ? 'Name must be at least 3 characters and contain text' : '';

  const canSubmit = form.name && form.price && form.totalQuantity && !nameError && !priceError && !qtyError && !submitting;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={reset}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.topRow}>
            <Text style={styles.heading}>List Your Equipment</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={reset} disabled={submitting}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={styles.label}>Equipment Name</Text>
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              placeholder="e.g. Excavator JD 350G"
              placeholderTextColor={COLORS.gray400}
              value={form.name}
              onChangeText={v => set('name', v)}
              editable={!submitting}
            />
            {!!nameError && <Text style={styles.inlineError}>{nameError}</Text>}

            {/* Price */}
            <Text style={styles.label}>Price per Day (₹)</Text>
            <TextInput
              style={[styles.input, priceError && styles.inputError]}
              placeholder="e.g. 4500"
              placeholderTextColor={COLORS.gray400}
              keyboardType="numeric"
              value={form.price}
              onChangeText={v => set('price', v)}
              editable={!submitting}
            />
            {!!priceError && <Text style={styles.inlineError}>{priceError}</Text>}

            {/* Total Quantity */}
            <Text style={styles.label}>Total Quantity (units you own)</Text>
            <TextInput
              style={[styles.input, qtyError && styles.inputError]}
              placeholder="e.g. 3"
              placeholderTextColor={COLORS.gray400}
              keyboardType="numeric"
              value={form.totalQuantity}
              onChangeText={v => set('totalQuantity', v)}
              editable={!submitting}
            />
            {!!qtyError && <Text style={styles.inlineError}>{qtyError}</Text>}

            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, form.category === c && styles.catChipActive]}
                  onPress={() => set('category', c)}
                  disabled={submitting}
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
              editable={!submitting}
            />

            {/* AI Verification */}
            <View style={[styles.verifyBox, verified && styles.verifyBoxDone]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.verifyTitle, verified && { color: '#059669' }]}>
                  {verified ? '✅ AI Verification Complete' : '📷 AI Photo Verification'}
                </Text>
                <Text style={styles.verifySub}>
                  {verified ? 'Your equipment photo is authenticated' : 'Highly recommended for credibility'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.verifyBtn, verified && { backgroundColor: '#d1fae5' }]}
                onPress={handleVerifySim}
                disabled={submitting}
              >
                <Text style={[styles.verifyBtnText, verified && { color: '#059669' }]}>
                  {verified ? 'Done' : 'Verify'}
                </Text>
              </TouchableOpacity>
            </View>

            {!!error && <Text style={styles.errorText}>⚠️ {error}</Text>}

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitBtn, 
                !canSubmit && styles.submitBtnDisabled,
                canSubmit && { backgroundColor: '#2563eb' } // High-contrast Blue
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handlePublish();
              }}
              disabled={!canSubmit}
            >
              {submitting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Publishing...</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>Publish Listing</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
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
  inputError: { borderColor: COLORS.danger, backgroundColor: '#fef2f2', marginBottom: 4 },
  inlineError: { color: COLORS.danger, fontSize: 12, marginBottom: 12 },
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
