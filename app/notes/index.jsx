import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

// 生成可写路径
const getNotesFilePath = (userId) => {
  const safeUserId = userId || 'temp_user';
  return `${FileSystem.documentDirectory}notes-${safeUserId}.json`;
};

export const saveNotes = async (updatedNotes, user) => {
  try {
    // 如果没有 user 或 ID，则使用临时 ID
    const userId = user?.$id || 'temp_user';
    const filePath = getNotesFilePath(userId);

    // 写入文件
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(updatedNotes), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    console.log(`✅ Notes saved to ${filePath}`);
  } catch (e) {
    console.error('❌ Failed to save notes:', e);
    Alert.alert("Error", `Failed to save notes: ${e?.message || 'Unknown error'}`);
  }
};

export const loadNotes = async (user) => {
  try {
    const userId = user?.$id || 'temp_user';
    const filePath = getNotesFilePath(userId);

    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      return []; // 没有文件时返回空数组
    }

    const content = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return JSON.parse(content);
  } catch (e) {
    console.error('❌ Failed to load notes:', e);
    Alert.alert("Error", `Failed to load notes: ${e?.message || 'Unknown error'}`);
    return [];
  }
};
