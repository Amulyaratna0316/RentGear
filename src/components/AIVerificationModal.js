import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Animated, Easing,
} from 'react-native';
import { COLORS } from '../data';

export default function AIVerificationModal({ visible, onClose, onSuccess }) {
  const [step, setStep] = useState(0);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const steps = ['Position equipment in frame', 'Scanning for authenticity...', 'Verified ✓'];

  useEffect(() => {
    if (step === 1) {
      // Scan line animation
      Animated.loop(
        Animated.timing(scanAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true })
      ).start();
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
      const t = setTimeout(() => {
        setStep(2);
        scanAnim.stopAnimation();
        pulseAnim.stopAnimation();
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [step]);

  const handleClose = () => { setStep(0); onClose(); };
  const handleSuccess = () => { setStep(0); onSuccess(); };

  const scanTranslate = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>AI Photo Verification</Text>
          <Text style={styles.subtitle}>Ensure equipment authenticity with real-time AI scanning</Text>

          {/* Viewfinder */}
          <View style={styles.viewfinder}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {step === 1 && (
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanTranslate }] }]} />
            )}

            <View style={styles.viewfinderContent}>
              <Animated.Text style={[styles.viewfinderIcon, step === 1 && { opacity: pulseAnim }]}>
                {step === 0 ? '📷' : step === 1 ? '🔍' : '✅'}
              </Animated.Text>
              <Text style={styles.viewfinderText}>{steps[step]}</Text>
            </View>
          </View>

          {step === 0 && (
            <TouchableOpacity style={styles.captureBtn} onPress={() => setStep(1)}>
              <Text style={styles.captureBtnText}>📸  Capture & Verify</Text>
            </TouchableOpacity>
          )}
          {step === 1 && (
            <View style={styles.analyzingBox}>
              <Text style={styles.analyzingText}>AI is analyzing the image...</Text>
            </View>
          )}
          {step === 2 && (
            <>
              <View style={styles.successBox}>
                <Text style={styles.successIcon}>✅</Text>
                <View>
                  <Text style={styles.successTitle}>Verification Successful</Text>
                  <Text style={styles.successSub}>Equipment photo is authentic and live-captured</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.continueBtn} onPress={handleSuccess}>
                <Text style={styles.continueBtnText}>Continue →</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420 },
  title: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 4 },
  subtitle: { color: COLORS.gray500, fontSize: 14, marginBottom: 20 },
  viewfinder: { backgroundColor: '#0f172a', borderRadius: 16, height: 200, marginBottom: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  corner: { position: 'absolute', width: 22, height: 22 },
  cornerTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderColor: COLORS.accent },
  cornerTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderColor: COLORS.accent },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: COLORS.accent },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderColor: COLORS.accent },
  scanLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: COLORS.accent, opacity: 0.8 },
  viewfinderContent: { alignItems: 'center' },
  viewfinderIcon: { fontSize: 44 },
  viewfinderText: { color: '#94a3b8', fontSize: 13, marginTop: 8 },
  captureBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  captureBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  analyzingBox: { padding: 14, alignItems: 'center' },
  analyzingText: { color: COLORS.gray500, fontSize: 14 },
  successBox: { backgroundColor: COLORS.successLight, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  successIcon: { fontSize: 22 },
  successTitle: { fontWeight: '700', color: '#065f46' },
  successSub: { fontSize: 12, color: COLORS.success },
  continueBtn: { backgroundColor: COLORS.success, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 12, padding: 10, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { color: COLORS.gray500 },
});
