import axios from "axios";

const locationApi = axios.create({
    baseURL: import.meta.env.VITE_PUBLIC_API_LOCATION,
    withCredentials: false,
});

export default locationApi;