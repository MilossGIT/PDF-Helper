import { openDB } from 'idb';

const DB_NAME = 'PDFHelperDB';
const STORE_NAME = 'pdfs';
const DB_VERSION = 1;

export const createDB = async () => {
  return await openDB(DB_NAME, DB_VERSION, {
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
      data: file.data, // Store as ArrayBuffer directly
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
      data: file.data, // Return ArrayBuffer directly
    }));
  } catch (error) {
    console.error('Error getting files:', error);
    return [];
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
