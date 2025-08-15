import AddNoteModal from "@/components/AddNoteModal";
import NoteList from "@/components/NoteList";
import { useAuth } from "@/contexts/AuthPContext";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const NoteScreen = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const safeId = (id = "guest") => String(id).replace(/[^a-zA-Z0-9._-]/g, "_");
  const isWeb = Platform.OS === "web";

  const getNotesFilePath = (userId) => {
    return `${FileSystem.documentDirectory || ""}notes_${safeId(userId)}.json`;
  };

  const serializeError = (err) => {
    if (!err) return "Unknown error";
    try {
      return JSON.stringify(
        {
          name: err.name,
          message: err.message,
          code: err.code,
          stack: err.stack,
          cause: err.cause,
          toString: String(err),
        },
        null,
        2
      );
    } catch {
      return String(err);
    }
  };

  // ===== 读取笔记（首次打开自动返回空数组） =====
  const loadNotes = async (userId) => {
    try {
      if (!userId) userId = "guest";
      const filePath = getNotesFilePath(userId);

      // 第二个参数必须传对象或不传
      const fileInfo = await FileSystem.getInfoAsync(filePath, {});
      if (!fileInfo.exists) {
        console.log("📂 Notes file does not exist, returning empty array.");
        return [];
      }

      const content = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return content ? JSON.parse(content) : [];
    } catch (e) {
      console.error("❌ Failed to load notes:", e);
      Alert.alert("Error", `Failed to load notes: ${e?.message || "Unknown error"}`);
      return [];
    }
  };

  // ===== 保存笔记（首次写入自动创建文件夹） =====
  const saveNotes = async (userId, updatedNotes) => {
    try {
      if (!userId) userId = "guest";
      const filePath = getNotesFilePath(userId);

      // 防御性检查 documentDirectory
      const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory, {});
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory, { intermediates: true });
      }

      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(updatedNotes), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      console.log(`✅ Notes saved to: ${filePath}`);
    } catch (e) {
      console.error("❌ Failed to save notes:", e);
      Alert.alert("Error", `Failed to save notes: ${e?.message || "Unknown error"}`);
    }
  };

  // ===== 路由/鉴权 =====
  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const list = await loadNotes(user.$id);
        setNotes(Array.isArray(list) ? list : []);
        setError(null);
      } catch (e) {
        console.error("loadNotes error:", serializeError(e));
        setError(`Failed to load notes\n${serializeError(e)}`);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  // ===== CRUD 操作 =====
  const addNote = async () => {
    if (newNote.trim() === "") return;
    const makeId = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const note = { $id: makeId(), text: newNote };
    const updated = [...notes, note];
    setNotes(updated);
    await saveNotes(user?.$id, updated);
    setNewNote("");
    setModalVisible(false);
  };

  const deleteNote = (id) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = notes.filter((n) => n.$id !== id);
          setNotes(updated);
          await saveNotes(user?.$id, updated);
        },
      },
    ]);
  };

  const editNote = async (id, newText) => {
    if (!newText.trim()) {
      Alert.alert("Error", "Note text cannot be empty");
      return;
    }
    const updated = notes.map((n) => (n.$id === id ? { ...n, text: newText } : n));
    setNotes(updated);
    await saveNotes(user?.$id, updated);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {notes.length === 0 ? (
            <Text style={styles.noNotesText}>You have no notes</Text>
          ) : (
            <NoteList notes={notes} onDelete={deleteNote} onEdit={editNote} />
          )}
        </>
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Add Note</Text>
      </TouchableOpacity>

      <AddNoteModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        newNote={newNote}
        setNewNote={setNewNote}
        addNote={addNote}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  addButton: {
    position: "absolute",
    bottom: 70,
    left: 20,
    right: 20,
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  errorText: { color: "red", textAlign: "center", marginBottom: 10, fontSize: 16 },
  noNotesText: { textAlign: "center", fontSize: 18, fontWeight: "bold", color: "#555", marginTop: 15 },
});

export default NoteScreen;
