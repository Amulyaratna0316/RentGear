import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://rentgear-production-1055.up.railway.app',
  timeout: 10000,
});

// Eagerly restore the auth token from storage when the module first loads.
// This prevents a race condition where BookingsScreen (or any other screen)
// fires an API call before the AuthContext useEffect([token]) has had a
// chance to set api.defaults.headers.common.Authorization.
(async () => {
  try {
    const raw = await AsyncStorage.getItem('rentgear_auth');
    if (raw) {
      const { token } = JSON.parse(raw);
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        console.log('[api.js] Eagerly restored Authorization header from storage.');
      }
    }
  } catch (e) {
    console.warn('[api.js] Could not restore token from storage:', e.message);
  }
})();

export default api;
