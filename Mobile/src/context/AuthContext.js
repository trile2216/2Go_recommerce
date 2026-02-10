import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useState, useEffect } from "react";
import { login, register, logout, loginWithOAuth } from "../service/auth/api.auth";
import { getUserInfo } from "../service/home/api.user";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Bootstrap - lấy token từ storage khi app start
  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const savedToken = await AsyncStorage.getItem("token");
      const savedUser = await AsyncStorage.getItem("user");
      const savedRefreshToken = await AsyncStorage.getItem("refreshToken");
      const savedRole = await AsyncStorage.getItem("role");

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setRefreshToken(savedRefreshToken);
        setRole(savedRole);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Error bootstrapping auth:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      // Try with identifier field (required by API)
      let response;
      try {
        console.log("[Auth] Attempting login with identifier...");
        response = await login({
          identifier: credentials.email,
          password: credentials.password,
        });
      } catch (firstError) {
        console.error("[Auth] Identifier format failed:", firstError.response?.data?.errors);
        throw firstError;
      }

      const { accessToken, refreshToken: newRefreshToken, userId, email, phone, role: userRole } = response;
      
      console.log("[Auth] Login response - accessToken exists:", !!accessToken, "length:", accessToken?.length);

      const userData = {
        userId,
        email: email || credentials.email,
        phone,
        role: userRole,
        fullName: (email || credentials.email)?.split("@")[0],
      };

      // Save to storage
      await AsyncStorage.setItem("token", accessToken);
      console.log("[Auth] Token saved to AsyncStorage");
      
      // Verify token was saved
      const verifyToken = await AsyncStorage.getItem("token");
      console.log("[Auth] Verify token in storage:", !!verifyToken, "length:", verifyToken?.length);
      
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      if (newRefreshToken) await AsyncStorage.setItem("refreshToken", newRefreshToken);
      await AsyncStorage.setItem("role", userRole);

      // Update state
      setToken(accessToken);
      setUser(userData);
      setRefreshToken(newRefreshToken);
      setRole(userRole);
      setIsLoggedIn(true);

      // Fetch full profile
      try {
        const fullProfile = await getUserInfo();
        setUser((prev) => ({ ...prev, ...fullProfile }));
        await AsyncStorage.setItem("user", JSON.stringify({ ...userData, ...fullProfile }));
      } catch (err) {
        console.error("Failed to fetch full profile after login:", err);
      }

      return { success: true, user: userData };
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      throw error;
    }
  };

  const handleRegister = async (userInfo) => {
    try {
      const response = await register(userInfo);
      const { accessToken, refreshToken: newRefreshToken, userId, email, phone, role: userRole } = response;

      const userData = {
        userId,
        email,
        phone,
        role: userRole,
        fullName: email?.split("@")[0],
      };

      await AsyncStorage.setItem("token", accessToken);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      if (newRefreshToken) await AsyncStorage.setItem("refreshToken", newRefreshToken);
      await AsyncStorage.setItem("role", userRole);

      setToken(accessToken);
      setUser(userData);
      setRefreshToken(newRefreshToken);
      setRole(userRole);
      setIsLoggedIn(true);

      return { success: true, user: userData };
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout(refreshToken);
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("role");

      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setRole(null);
      setIsLoggedIn(false);
    }
  };

  const handleLoginWithOAuth = async (oauthData) => {
    try {
      const response = await loginWithOAuth(oauthData);
      const { accessToken, refreshToken: newRefreshToken, userId, email, phone, role: userRole } = response;
      
      console.log("[Auth OAuth] accessToken exists:", !!accessToken, "length:", accessToken?.length);

      const userData = {
        userId,
        email,
        phone,
        role: userRole,
        fullName: email?.split("@")[0],
      };

      await AsyncStorage.setItem("token", accessToken);
      console.log("[Auth OAuth] Token saved to AsyncStorage");
      
      // Verify token was saved
      const verifyToken = await AsyncStorage.getItem("token");
      console.log("[Auth OAuth] Verify token in storage:", !!verifyToken, "length:", verifyToken?.length);
      
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      if (newRefreshToken) await AsyncStorage.setItem("refreshToken", newRefreshToken);
      await AsyncStorage.setItem("role", userRole);

      setToken(accessToken);
      setUser(userData);
      setRefreshToken(newRefreshToken);
      setRole(userRole);
      setIsLoggedIn(true);

      return { success: true, user: userData };
    } catch (error) {
      console.error("OAuth login error:", error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    refreshToken,
    role,
    isLoggedIn,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    loginWithOAuth: handleLoginWithOAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
