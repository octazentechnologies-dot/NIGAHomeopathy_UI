export const buildAudioDownloadFileName = (patientName, sessionId, extension = 'webm') => {
  const safeName = String(patientName || 'Patient')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 40) || 'Patient';
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const sessionPart = sessionId ? String(sessionId).slice(0, 8) : stamp;
  return `${safeName}_${sessionPart}_${stamp}.${extension}`;
};

export const downloadLocalAudioBlob = (blob, fileName) => {
  if (!blob) {
    return;
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName || 'recording.webm';
  anchor.style.visibility = 'hidden';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const getExtensionFromFile = (file) => getExtensionFromFileName(file?.name);

export const getExtensionFromFileName = (fileName, fallback = 'webm') => {
  const match = String(fileName || '').match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : fallback;
};

export const resolveAudioDownloadBlob = (response) => {
  if (response instanceof Blob) {
    return response;
  }
  if (response?.data instanceof Blob) {
    return response.data;
  }
  return null;
};
