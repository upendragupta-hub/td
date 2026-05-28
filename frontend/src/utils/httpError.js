export function getRequestErrorMessage(error, fallbackMessage) {
  const responseMessage = error?.response?.data?.message || error?.response?.data?.error;
  if (responseMessage) {
    return responseMessage;
  }

  if (error?.response?.status === 404) {
    return 'Frontend abhi correct backend se connected nahi lag raha. Please redeploy the latest frontend build.';
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'Server tak reach nahi ho pa raha. Please thodi der baad retry karein.';
  }

  return fallbackMessage;
}
