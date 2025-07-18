// src/api/pdfService.ts

import api from "./axios"; // Your existing configured axios instance
import { BASE_URL } from "./var";

const getAuthHeaders = () => {
  return {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
};

export const fetchPdfsAPI = async () => {
  const response = await api.get(`${BASE_URL}/list_uuids`, {
    headers: getAuthHeaders(),
  });
  return response.data.pdfs;
};

export const uploadPdfAPI = async (uuid: string, file: File, onUploadProgress: (progress: number) => void) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(`${BASE_URL}/upload/${uuid}`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(progress);
      }
    },
  });
};

export const downloadPdfAPI = async (uuid: string) => {
  const response = await api.get(`${BASE_URL}/download/${uuid}`, {
    headers: getAuthHeaders(),
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${uuid}.pdf`); // You might want to get the real filename here
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url); // Clean up the object URL
};

export const deletePdfAPI = async (uuid: string) => {
  return api.delete(`${BASE_URL}/delete/${uuid}`, {
    headers: getAuthHeaders(),
  });
};

export const queryLlmAPI = async (uuid: string, query: string) => {
  const response = await api.get(`${BASE_URL}/query/${uuid}`, {
    headers: getAuthHeaders(),
    params: { query },
  });
  return response.data.llm_response;
};