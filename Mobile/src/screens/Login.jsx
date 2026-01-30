import React, { useState } from "react";
import {
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { login } from "../service/auth/api.auth";

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await login({
        identifier: email,
        password: password,
      });

      if (response.accessToken && response.userId) {
        const userData = {
          userId: response.userId,
          email: response.email || email,
          phone: response.phone,
          fullName: response.fullName || email.split("@")[0],
        };

        // Save to AsyncStorage
        try {
          await AsyncStorage.setItem("token", response.accessToken);
          await AsyncStorage.setItem("refreshToken", response.refreshToken || "");
          await AsyncStorage.setItem("user", JSON.stringify(userData));
        } catch (storageError) {
          console.error("Error saving to storage:", storageError);
          setError("Lỗi khi lưu dữ liệu. Vui lòng thử lại.");
          setIsLoading(false);
          return;
        }

        // Navigate to home after successful login
        navigation.reset({
          index: 0,
          routes: [{ name: "MainApp" }],
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f7f8" }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            backgroundColor: "#f5f7f8",
          }}
        >

          {/* Header Image / Illustration */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
            <View
              style={{
                width: "100%",
                height: 192,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#e8ecf1",
                justifyContent: "flex-end",
              }}
            >
              <Image
                source={require("../../assets/background.png")}
                style={{
                  width: "100%",
                  height: "100%",
                  resizeMode: "cover",
                  position: "absolute",
                }}
              />
              {/* Gradient overlay */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#fff",
                    letterSpacing: 0.5,
                    textAlign: "center",
                  }}
                >
                  2Go Recommerce
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "rgba(255, 255, 255, 0.8)",
                    marginTop: 4,
                    textAlign: "center",
                  }}
                >
                  Mua bán hàng cũ dễ dàng
                </Text>
              </View>
            </View>
          </View>

          {/* Headline */}
          <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#111827",
                lineHeight: 34,
              }}
            >
              Chào mừng!
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View
              style={{
                marginHorizontal: 24,
                marginBottom: 16,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: "#fee2e2",
                borderRadius: 8,
                borderLeftWidth: 4,
                borderLeftColor: "#ef4444",
              }}
            >
              <Text style={{ color: "#991b1b", fontSize: 12, fontWeight: "500" }}>
                {error}
              </Text>
            </View>
          )}

          {/* Form Section */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, gap: 20 }}>
            {/* Email Field */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Email
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  height: 56,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color="#9ca3af"
                />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 16,
                    marginLeft: 8,
                    color: "#111827",
                  }}
                  placeholder="user@example.com"
                  placeholderTextColor="#d1d5db"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Mật khẩu
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  height: 56,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color="#9ca3af"
                />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 16,
                    marginLeft: 8,
                    color: "#111827",
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#d1d5db"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  style={{
                    padding: 8,
                  }}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#9ca3af"
                  />
                </Pressable>
              </View>

              {/* Forgot Password Link */}
              <View style={{ alignItems: "flex-end", marginTop: 4 }}>
                <Pressable disabled={isLoading}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#6b7280",
                    }}
                  >
                    Quên mật khẩu?
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={({ pressed }) => ({
                height: 56,
                borderRadius: 12,
                backgroundColor: "#359EFF",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 8,
                shadowColor: "#359EFF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
                opacity: pressed || isLoading ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#fff",
                }}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Text>
            </Pressable>

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 8,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "#e5e7eb",
                }}
              />
              <Text
                style={{
                  marginHorizontal: 12,
                  fontSize: 12,
                  fontWeight: "500",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Hoặc tiếp tục với
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "#e5e7eb",
                }}
              />
            </View>

            {/* Social Login Buttons */}
            <View
              style={{
                flexDirection: "row",
                gap: 16,
              }}
            >
              <Pressable
                disabled={isLoading}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "row",
                  gap: 8,
                  opacity: pressed || isLoading ? 0.7 : 1,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 2,
                  elevation: 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#374151",
                  }}
                >
                  G
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  Google
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer / Sign Up Link */}
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              paddingHorizontal: 24,
              paddingBottom: 20,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                }}
              >
                Chưa có tài khoản?{" "}
                <Text
                  style={{
                    fontWeight: "700",
                    color: "#359EFF",
                  }}
                  onPress={() => navigation.navigate("Register")}
                >
                  Đăng ký
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Login;
