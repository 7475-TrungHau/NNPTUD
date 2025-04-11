import { getApp, postApp, putApp, deleteApp, postFormData, putFormData } from "./api";

export const getData = async (url, params) => getApp('admin/' + url, params);
export const postData = async (url, data) => postApp('admin/' + url, data);
export const putData = async (url, data) => putApp('admin/' + url, data);
export const deleteData = async (url) => deleteApp('admin/' + url);
export const postFormDataApi = async (url, data) => postFormData('admin/' + url, data);
export const putFormDataApi = async (url, data) => putFormData('admin/' + url, data);


