import AddNoteModal from "@/components/AddNoteModal";
import NoteList from "@/components/NoteList";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
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

  // ===== 工具函数 =====
  const safeId = (id = "") => String(id).replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = (userId) => `notes-${safeId(userId)}`;
  const isWeb = Platform.OS === "web";

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

  // ===== Web/原生各自实现 =====
  const webLoad = async (key) => {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      throw new Error(`Web load failed: ${serializeError(e)}`);
    }
  };

  const webSave = async (key, value) => {
    try {
      if (typeof localStorage === "undefined") throw new Error("localStorage not available");
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      throw new Error(`Web save failed: ${serializeError(e)}`);
    }
  };

  const nativeLoad = async (key) => {
    try {
      const raw = await SecureStore.getItemAsync(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      throw new Error(`SecureStore load failed: ${serializeError(e)}`);
    }
  };

  const nativeSave = async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, JSON.stringify(value));
    } catch (e) {
      // 少数机型如果数据过大（很少见），会抛异常
      throw new Error(`SecureStore save failed: ${serializeError(e)}`);
    }
  };

  const loadNotes = async (userId) => {
    const key = storageKey(userId);
    return isWeb ? webLoad(key) : nativeLoad(key);
  };

  const saveNotes = async (userId, updatedNotes) => {
    const key = storageKey(userId);
    return isWeb ? webSave(key, updatedNotes) : nativeSave(key, updatedNotes);
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

  // ===== CRUD =====
  const addNote = async () => {
    if (newNote.trim() === "") return;
    const makeId = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const note = { $id: makeId(), text: newNote };
    const updated = [...notes, note];
    setNotes(updated);
    try {
      await saveNotes(user.$id, updated);
      setNewNote("");
      setModalVisible(false);
    } catch (e) {
      const detail = serializeError(e);
      console.error("save(after add) error:", detail);
      Alert.alert("Error", `Failed to save notes\n${detail}`);
    }
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
          try {
            await saveNotes(user.$id, updated);
          } catch (e) {
            const detail = serializeError(e);
            console.error("save(after delete) error:", detail);
            Alert.alert("Error", `Failed to save notes\n${detail}`);
          }
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
    try {
      await saveNotes(user.$id, updated);
    } catch (e) {
      const detail = serializeError(e);
      console.error("save(after edit) error:", detail);
      Alert.alert("Error", `Failed to save notes\n${detail}`);
    }
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
