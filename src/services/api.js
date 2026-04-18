import axios from 'axios';

const api = axios.create({
  baseURL: 'https://rentgear-production-1055.up.railway.app',
  timeout: 10000,
});

export default api;
