import { openDB } from 'idb';

const DB_NAME = 'PDFHelperDB';
const STORE_NAME = 'pdfs';
const DB_VERSION = 1;

const arrayBufferToString = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const stringToArrayBuffer = (str) => {
  const binaryString = atob(str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const createDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
      }
    },
  });
};

export const saveFile = async (file) => {
  try {
    const fileToStore = {
      ...file,
      data: arrayBufferToString(file.data),
      bookmarks: file.bookmarks || [],
    };

    const db = await createDB();
    await db.put(STORE_NAME, fileToStore);
    return true;
  } catch (error) {
    console.error('Error saving file:', error);
    return false;
  }
};

export const getFiles = async () => {
  try {
    const db = await createDB();
    const files = await db.getAll(STORE_NAME);
    return files.map((file) => ({
      ...file,
      data: stringToArrayBuffer(file.data),
    }));
  } catch (error) {
    console.error('Error getting files:', error);
    return [];
  }
};

export const updateBookmarks = async (timestamp, bookmarks) => {
  try {
    const db = await createDB();
    const file = await db.get(STORE_NAME, timestamp);
    if (file) {
      file.bookmarks = bookmarks;
      await db.put(STORE_NAME, file);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating bookmarks:', error);
    return false;
  }
};

export const deleteFile = async (timestamp) => {
  try {
    const db = await createDB();
    await db.delete(STORE_NAME, timestamp);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};
