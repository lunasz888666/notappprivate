import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function AddNoteModal({
  modalVisible,
  setModalVisible,
  newNote,
  setNewNote,
  addNote
}) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)} // 安卓返回键关闭
    >
      <KeyboardAvoidingView
        style={styles.centeredView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Add Note</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your note..."
            value={newNote}
            onChangeText={setNewNote}
            multiline
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => {
                console.log("Save pressed with note:", newNote);
                addNote();
              }}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  modalView: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 15
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  button: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: "center"
  },
  cancelButton: {
    backgroundColor: "#ccc"
  },
  saveButton: {
    backgroundColor: "#007bff"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold"
  }
});
