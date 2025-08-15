import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { useEffect, useState } from "react";
import { Alert, Button, FlatList, Modal, Text, TextInput, View } from "react-native";

const isWeb = typeof window !== "undefined";

// 转义 ID 生成安全文件名
const safeId = (id) => (id ? String(id).replace(/[^a-z0-9_-]/gi, "_") : "unknown");

// 生成存储 Key（Web 用）
const storageKey = (userId) => `NOTES_STORAGE-${safeId(userId)}`;

// 生成文件路径（Native 用）
const getNotesFilePath = (userId) =>
  `${FileSystem.documentDirectory}notes-${safeId(userId)}.json`;

// 详细错误序列化
const serializeError = (err) => {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  return JSON.stringify(
    {
      name: err.name || "Error",
      message: err.message || String(err),
      stack: err.stack,
    },
    null,
    2
  );
};

// 保存
const saveNotes = async (userId, updatedNotes) => {
  const dataStr = JSON.stringify(updatedNotes);

  if (isWeb) {
    await AsyncStorage.setItem(storageKey(userId), dataStr);
  } else {
    const filePath = getNotesFilePath(userId);
    await FileSystem.writeAsStringAsync(filePath, dataStr, { encoding: FileSystem.EncodingType.UTF8 });
  }
};

// 读取
const loadNotes = async (userId) => {
  if (isWeb) {
    const saved = await AsyncStorage.getItem(storageKey(userId));
    return saved ? JSON.parse(saved) : [];
  } else {
    const filePath = getNotesFilePath(userId);
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) return [];
    const content = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.UTF8 });
    return content ? JSON.parse(content) : [];
  }
};

// 主组件
export default function NotesApp({ user }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // 包装的安全保存方法
  const saveNotesSafe = async (updatedNotes) => {
    if (!user || !user.$id) {
      throw new Error("Cannot save notes: user ID is missing");
    }
    await saveNotes(user.$id, updatedNotes);
  };

  // 初始化加载
  useEffect(() => {
    (async () => {
      try {
        if (!user || !user.$id) return;
        const loaded = await loadNotes(user.$id);
        setNotes(loaded);
      } catch (e) {
        console.error("loadNotes error:", serializeError(e));
        Alert.alert("Error", `Failed to load notes\n${serializeError(e)}`);
      }
    })();
  }, [user]);

  // 添加
  const addNote = async () => {
    if (newNote.trim() === "") return;
    const note = { $id: `${Date.now()}-${Math.floor(Math.random() * 1e9)}`, text: newNote };
    const updated = [...notes, note];
    setNotes(updated);
    try {
      await saveNotesSafe(updated);
      setNewNote("");
      setModalVisible(false);
    } catch (e) {
      console.error("saveNotes (add) error:", serializeError(e));
      Alert.alert("Error", `Failed to save notes\n${serializeError(e)}`);
    }
  };

  // 删除
  const deleteNote = async (id) => {
    const updated = notes.filter((n) => n.$id !== id);
    setNotes(updated);
    try {
      await saveNotesSafe(updated);
    } catch (e) {
      console.error("saveNotes (delete) error:", serializeError(e));
      Alert.alert("Error", `Failed to delete note\n${serializeError(e)}`);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Add Note" onPress={() => setModalVisible(true)} />
      <FlatList
        data={notes}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
            <Text>{item.text}</Text>
            <Button title="Delete" onPress={() => deleteNote(item.$id)} />
          </View>
        )}
      />
      <Modal visible={modalVisible} animationType="slide">
        <View style={{ padding: 20 }}>
          <TextInput
            placeholder="Enter note"
            value={newNote}
            onChangeText={setNewNote}
            style={{ borderBottomWidth: 1, marginBottom: 20 }}
          />
          <Button title="Save" onPress={addNote} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}
