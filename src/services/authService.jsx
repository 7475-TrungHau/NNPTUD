import axios from "axios";
import { getApp, postApp, postFormData } from "./api";



export const registerUser = async (data) => postApp("/auth/register", data);

export const loginUser = async (data) => postApp('/auth/login', data);

export const getUserInfo = async () => getApp('/auth/me');
export const getUserProfileData = async (typeData) => getApp('/user/' + typeData);
export const updateProfile = (formData) => postFormData('/user/update', formData);
export const changePassword = async (data) => postApp('/user/change-password', data);
