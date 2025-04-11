import axios from 'axios';

const API_URL = 'https://phimapi.com';
const API_APP = 'http://localhost:3000/';

let token = localStorage.getItem('token');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const apiApp = axios.create({
    baseURL: API_APP,
    headers: {
        Authorization: token ? `Bearer ${token}` : null,
        'Content-Type': 'application/json',
    }
});

export const setToken = (newToken) => {
    token = newToken;
    apiApp.defaults.headers['Authorization'] = token ? `Bearer ${token}` : null;
}


export const getApp = (url, params) => apiApp.get(url, { params });
export const postApp = (url, data) => apiApp.post(url, data);
export const putApp = (url, data) => apiApp.put(url, data);
export const deleteApp = (url) => apiApp.delete(url);
export const get = (url, params) => api.get(url, { params });
export const postFormData = (url, formData) => apiApp.post(url, formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
export const putFormData = (url, formData) => apiApp.put(url, formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
export default api;


