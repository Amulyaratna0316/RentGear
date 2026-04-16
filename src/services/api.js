import axios from 'axios';

const api = axios.create({
  baseURL: 'https://eggnog-underline-gorgeous.ngrok-free.app',
  timeout: 10000,
});

export default api;
