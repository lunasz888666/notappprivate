import AddNoteModal from "@/components/AddNoteModal";
import NoteList from "@/components/NoteList";
import { useAuth } from "@/contexts/AuthContext";
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

  const notesDir = `${FileSystem.documentDirectory || ""}notes/`;
  const isWebOrNoDocDir = Platform.OS === "web" || !FileSystem.documentDirectory;
  // ==== 工具函数 ====
  const safeId = (id = "") => String(id).replace(/[^a-zA-Z0-9._-]/g, "_");
  const getNotesFilePath = (userId) => `${notesDir}notes-${safeId(userId)}.json`;
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



  const ensureNotesDir = async () => {
    if (isWebOrNoDocDir) return; // Web 不需要目录
    try {
      // 目录存在时不会报错（intermediates: true）
      await FileSystem.makeDirectoryAsync(notesDir, { intermediates: true });
    } catch (e) {
      // 某些 ROM 会抛“已存在”，忽略
      const msg = String(e?.message || e);
      if (!/already exists|exists|EEXIST/i.test(msg)) {
        console.error("ensureNotesDir error:", serializeError(e));
        throw e;
      }
    }
  };
  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchNotes(user)
        .then(setNotes)
        .catch((e) => setError(String(e?.message || e)))
        .finally(() => setLoading(false));
    };
  }, [user]);

  const fetchNotes = async (user) => {
    try {
      if (isWebOrNoDocDir) {
        const key = `notes-${safeId(user.$id)}`;
        const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
        return raw ? JSON.parse(raw) : [];
      } else {
        await ensureNotesDir();
        const filePath = getNotesFilePath(user.$id);

        try {
          const txt = await FileSystem.readAsStringAsync(filePath, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          return txt ? JSON.parse(txt) : [];
        } catch (e) {
          const msg = String(e?.message || e);
          // 文件不存在 / 还没创建：返回空数组
          if (/No such file|ENOENT|cannot read file|EISDIR/i.test(msg)) {
            return [];
          }
          console.error("readAsStringAsync error:", serializeError(e));
          throw e;
        }
      }
    } catch (e) {
      const detail = serializeError(e);
      console.error("fetchNotes error:", {
        platform: Platform.OS,
        documentDirectory: FileSystem.documentDirectory,
        notesDir,
        error: detail,
      });
      throw new Error(`Failed to load notes\n${detail}`);
    }
  };


  const saveNotes = async (user, updatedNotes) => {
    try {
      if (isWebOrNoDocDir) {
        const key = `notes-${safeId(user.$id)}`;
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(key, JSON.stringify(updatedNotes));
        } else {
          throw new Error("localStorage not available on this platform");
        }
      } else {
        await ensureNotesDir();
        const filePath = getNotesFilePath(user.$id);
        await FileSystem.writeAsStringAsync(filePath, JSON.stringify(updatedNotes), {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }
    } catch (e) {
      const detail = serializeError(e);
      console.error("saveNotes error:", {
        platform: Platform.OS,
        documentDirectory: FileSystem.documentDirectory,
        notesDir,
        filePath: isWebOrNoDocDir ? `localStorage:notes-${safeId(user?.$id)}` : getNotesFilePath(user?.$id),
        error: detail,
      });
      Alert.alert("Error", `Failed to save notes\n${detail}`);
      throw e; // 保持可观测
    }
  };

  const addNote = async () => {
    if (newNote.trim() === "") return;
    const makeId = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const note = { $id: makeId(), text: newNote };
    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    try {
      await saveNotes(user, updatedNotes);
      setNewNote("");
      setModalVisible(false);
    } catch { }
  };

  const deleteNote = (id) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updatedNotes = notes.filter((n) => n.$id !== id);
          setNotes(updatedNotes);
          try { await saveNotes(updatedNotes); } catch { }
        },
      },
    ]);
  };

  const editNote = async (id, newText) => {
    if (!newText.trim()) {
      Alert.alert("Error", "Note text cannot be empty");
      return;
    }
    const updatedNotes = notes.map((n) => (n.$id === id ? { ...n, text: newText } : n));
    setNotes(updatedNotes);
    try { await saveNotes(updatedNotes); } catch { }
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
    position: "absolute", bottom: 70, left: 20, right: 20,
    backgroundColor: "#007bff", padding: 15, borderRadius: 8, alignItems: "center",
  },
  addButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  errorText: { color: "red", textAlign: "center", marginBottom: 10, fontSize: 16 },
  noNotesText: { textAlign: "center", fontSize: 18, fontWeight: "bold", color: "#555", marginTop: 15 },
});

export default NoteScreen;
