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

  // ==== 工具函数 ====
  const safeId = (id = "") => String(id).replace(/[^a-zA-Z0-9._-]/g, "_");
  const serializeError = (err) => {
    if (!err) return "Unknown error";
    const obj = {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack,
      cause: err.cause,
      toString: String(err),
    };
    try { return JSON.stringify(obj, null, 2); } catch { return String(err); }
  };

  const notesDir = `${FileSystem.documentDirectory || ""}notes/`;
  const getNotesFilePath = (userId) => `${notesDir}notes-${safeId(userId)}.json`;

  const ensureNotesDir = async () => {
    if (Platform.OS === "web") return; // web 无需创建目录
    const info = await FileSystem.getInfoAsync(notesDir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(notesDir, { intermediates: true });
    }
  };

  // Web 端（或 documentDirectory 不可用）回退到 localStorage
  const isWebOrNoDocDir = Platform.OS === "web" || !FileSystem.documentDirectory;

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      if (isWebOrNoDocDir) {
        const key = `notes-${safeId(user.$id)}`;
        const s = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
        setNotes(s ? JSON.parse(s) : []);
      } else {
        await ensureNotesDir();
        const filePath = getNotesFilePath(user.$id);
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          const txt = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.UTF8 });
          setNotes(txt ? JSON.parse(txt) : []);
        } else {
          setNotes([]);
        }
      }
      setError(null);
    } catch (e) {
      console.error("fetchNotes error:", serializeError(e));
      setError(`Failed to load notes\n${serializeError(e)}`);
    }
    setLoading(false);
  };

  const saveNotes = async (updatedNotes) => {
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
        await FileSystem.writeAsStringAsync(
          filePath,
          JSON.stringify(updatedNotes),
          { encoding: FileSystem.EncodingType.UTF8 }
        );
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
      // 同步抛出以便上层可观察
      throw e;
    }
  };

  const addNote = async () => {
    if (newNote.trim() === "") return;
    const makeId = () => `${Date.now()}-${Math.floor(Math.random()*1e9)}`;
    const note = { $id: makeId(), text: newNote };
    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    try {
      await saveNotes(updatedNotes);
      setNewNote("");
      setModalVisible(false);
    } catch {}
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
          try { await saveNotes(updatedNotes); } catch {}
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
    try { await saveNotes(updatedNotes); } catch {}
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
