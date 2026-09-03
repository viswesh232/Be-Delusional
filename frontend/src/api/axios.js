import axios from 'axios';

const isLocalDev = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
<<<<<<< HEAD
const baseURL = import.meta.env.VITE_API_URL;
=======
const baseURL = import.meta.env.VITE_API_URL || (isLocalDev ? 'http://localhost:5000/api' : 'https://github.com/viswesh232/Be-Delusional.git');
>>>>>>> 3fb3a2db98e05dfda346e9208effa0983d4a6d94

const API = axios.create({
    baseURL,
});

// This automatically adds your JWT token to every request if you're logged in
API.interceptors.request.use((req) => {
    const profile = localStorage.getItem('userInfo');
    if (profile) {
        const { token } = JSON.parse(profile);
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API;
