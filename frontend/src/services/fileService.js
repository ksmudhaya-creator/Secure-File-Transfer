import api from './api';

export const uploadFile = async (file, sessionId, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  if (sessionId) {
    formData.append('sessionId', sessionId);
  }

  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

export const getFiles = async () => {
  const response = await api.get('/files');
  return response.data;
};

export const downloadFile = async (fileId, fileName) => {
  const response = await api.get(`/files/${fileId}/download`, {
    responseType: 'blob',
  });

  // Extract hash & decryption header
  const sha256 = response.headers['x-file-sha256'];
  const decryptionStatus = response.headers['x-decryption-status'];

  // Trigger browser download
  const blob = new Blob([response.data]);
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);

  return {
    sha256,
    decryptionStatus,
  };
};

export const verifyFile = async (fileId) => {
  const response = await api.get(`/files/${fileId}/verify`);
  return response.data;
};

export const deleteFile = async (fileId) => {
  const response = await api.delete(`/files/${fileId}`);
  return response.data;
};
