import PostItImage from "@/assets/images/post-it.png";
import { useRouter } from "expo-router";
import {
  Image,
  NativeModules,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import 'react-native-get-random-values';
const { VungleModule } = NativeModules;
const HomeScreen = () => {
  // const { user, loading } = useAuth();
  const router = useRouter();
  // 初始化 SDK
  VungleModule?.initSdk('688e212cb59f5ddbdc827058');
  // 播放广告
  VungleModule?.loadInterstitial('NOTEBOOK_INTERSTITIAL_1-6114492');
  // 播放插屏
  VungleModule?.playInterstitial();
  // router.replace("/notes");


  // if (loading) {
  //   return (
  //     <View style={styles.centeredContainter}>
  //       <ActivityIndicator size="large" color="#007bff" />
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      <Image source={PostItImage} style={styles.image} />
      <Text style={styles.title}>Welcome to Notes App</Text>
      <Text style={styles.subtitle}>
        Capture your thoughts anytime anywhere
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/notes")}
      >
        {/* 开始记录按钮 */}
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  centeredContainter: {
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
});

export default HomeScreen;
