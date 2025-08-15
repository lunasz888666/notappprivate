// useAuth.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

// 模拟生成本地用户ID
const generateUserId = () => {
  return "local-" + Math.random().toString(36).substring(2, 12);
};

export function useAuth() {
  const [user, setUser] = useState(null); // { $id: string, name: string }
  const [loading, setLoading] = useState(true);

  // 初始化加载用户
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("localUser");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // 没有存储的用户就自动生成一个
          const newUser = {
            $id: generateUserId(),
            name: "Guest",
          };
          await AsyncStorage.setItem("localUser", JSON.stringify(newUser));
          setUser(newUser);
        }
      } catch (err) {
        console.error("加载用户失败:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 模拟登出
  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("localUser");
    const newUser = {
      $id: generateUserId(),
      name: "Guest",
    };
    await AsyncStorage.setItem("localUser", JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  return {
    user,
    loading,
    logout,
    setUser, // 如果要更新本地用户信息
  };
}
