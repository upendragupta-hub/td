import axios from 'axios';
import { API_BASE_URL } from './runtime';

axios.defaults.withCredentials = true;

if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
}

export default axios;
