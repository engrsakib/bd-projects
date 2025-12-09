// axiosInstance.ts
import { API_BASE_URL, HARD_USER_TOKEN } from '@/config';
import axiosBase from 'axios';

const axios = axiosBase.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${HARD_USER_TOKEN}`,
  },
});

axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


axios.interceptors.response.use(
  (response) => response,
  (error) => {

    if (error.response?.status === 401) {
      console.warn('Unauthorized, redirect to login');
    }
    return Promise.reject(error);
  }
);

export default axios;