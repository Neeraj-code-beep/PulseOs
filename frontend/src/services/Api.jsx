import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

console.log(import.meta.env.VITE_API_URL);

export default API;
