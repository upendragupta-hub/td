import axios from 'axios';

let cachedKeyId;

export async function getRazorpayKeyId() {
  if (cachedKeyId) {
    return cachedKeyId;
  }

  const { data } = await axios.get('/api/config/razorpay');
  const keyId = data?.keyId;

  if (!keyId) {
    throw new Error('Razorpay key is not configured on the server.');
  }

  cachedKeyId = keyId;
  return cachedKeyId;
}

export function ensureRazorpayLoaded() {
  if (typeof window === 'undefined' || typeof window.Razorpay !== 'function') {
    throw new Error('Razorpay Checkout is not loaded.');
  }
}
