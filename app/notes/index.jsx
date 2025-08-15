import AddNoteModal from "@/components/AddNoteModal";
import NoteList from "@/components/NoteList";
import { useAuth } from "@/contexts/AuthContext";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  // 获取文件路径
  const getNotesFilePath = (userId) =>
    `${FileSystem.documentDirectory}notes-${userId}.json`;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const filePath = getNotesFilePath(user.$id);
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        const fileContent = await FileSystem.readAsStringAsync(filePath);
        setNotes(JSON.parse(fileContent));
      } else {
        setNotes([]);
      }
      setError(null);
    } catch (e) {
      setError("Failed to load notes");
    }
    setLoading(false);
  };

  const saveNotes = async (updatedNotes) => {
    try {
      const filePath = getNotesFilePath(user.$id);
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(updatedNotes));
    } catch (e) {
      Alert.alert("Error", "Failed to save notes");
    }
  };

  const addNote = async () => {
    if (newNote.trim() === "") return;
    const makeId = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const note = { $id: makeId(), text: newNote };
    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
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
          const updatedNotes = notes.filter((note) => note.$id !== id);
          setNotes(updatedNotes);
          await saveNotes(updatedNotes);
        },
      },
    ]);
  };

  const editNote = async (id, newText) => {
    if (!newText.trim()) {
      Alert.alert("Error", "Note text cannot be empty");
      return;
    }
    const updatedNotes = notes.map((note) =>
      note.$id === id ? { ...note, text: newText } : note
    );
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
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

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
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
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
    fontSize: 16,
  },
  noNotesText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginTop: 15,
  },
});

export default NoteScreen;
