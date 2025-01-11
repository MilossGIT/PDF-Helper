import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const createBlobUrl = (data) => {
  const blob = new Blob([new Uint8Array(data)], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
};

export const revokeUrl = (url) => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const truncateString = (str, length = 30) => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};
