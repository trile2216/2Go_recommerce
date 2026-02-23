import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../context/AuthContext";
import { getUserInfo, updateUserProfile, changePassword } from "../service/home/api.user";
import { uploadImageAndGetUrl } from "../service/upload/api.upload";

const GENDERS = [
  { value: "", label: "Chọn giới tính" },
  { value: "Male", label: "Nam" },
  { value: "Female", label: "Nữ" },
  { value: "Other", label: "Khác" },
];

const Profile = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  // States
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    birthday: "",
    gender: "",
    address: "",
    bio: "",
    avatarUrl: "",
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Load user info
  const loadUserInfo = useCallback(async () => {
    try {
      const data = await getUserInfo();
      setUserInfo(data);
      setProfileForm({
        fullName: data.profile?.fullName || "",
        birthday: data.profile?.birthday || "",
        gender: data.profile?.gender || "",
        address: data.profile?.address || "",
        bio: data.profile?.bio || "",
        avatarUrl: data.profile?.avatarUrl || "",
      });
    } catch (err) {
      console.error("Error loading user info:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserInfo();
    }, [loadUserInfo])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserInfo();
    setRefreshing(false);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Avatar upload
  const handleAvatarPick = async () => {
    if (!isEditing) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setUploadingAvatar(true);
      try {
        const file = {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: `avatar_${Date.now()}.jpg`,
        };
        const url = await uploadImageAndGetUrl(file);
        setProfileForm((prev) => ({ ...prev, avatarUrl: url }));
        Alert.alert("Thành công", "Tải ảnh lên thành công!");
      } catch (err) {
        console.error("Error uploading avatar:", err);
        Alert.alert("Lỗi", "Tải ảnh lên thất bại, vui lòng thử lại");
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    if (!profileForm.fullName?.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateUserProfile(profileForm);
      setUserInfo(updated);
      Alert.alert("Thành công", "Cập nhật hồ sơ thành công!");
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      Alert.alert("Lỗi", err.response?.data?.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (passwordForm.newPassword.length < 8) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(passwordForm.newPassword);
    const hasDigit = /\d/.test(passwordForm.newPassword);
    if (!hasLetter || !hasDigit) {
      Alert.alert("Lỗi", "Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số");
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      Alert.alert("Thành công", "Đổi mật khẩu thành công!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordModal(false);
    } catch (err) {
      console.error("Error changing password:", err);
      Alert.alert("Lỗi", err.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
  };

  // Logout
  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  // Start editing
  const startEditing = () => {
    setProfileForm({
      fullName: userInfo?.profile?.fullName || "",
      birthday: userInfo?.profile?.birthday || "",
      gender: userInfo?.profile?.gender || "",
      address: userInfo?.profile?.address || "",
      bio: userInfo?.profile?.bio || "",
      avatarUrl: userInfo?.profile?.avatarUrl || "",
    });
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setProfileForm({
      fullName: userInfo?.profile?.fullName || "",
      birthday: userInfo?.profile?.birthday || "",
      gender: userInfo?.profile?.gender || "",
      address: userInfo?.profile?.address || "",
      bio: userInfo?.profile?.bio || "",
      avatarUrl: userInfo?.profile?.avatarUrl || "",
    });
  };

  const getGenderLabel = (value) => {
    const gender = GENDERS.find((g) => g.value === value);
    return gender?.label || "Chưa cập nhật";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#359EFF" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        {!isEditing ? (
          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton} onPress={startEditing}>
              <MaterialCommunityIcons name="account-edit" size={20} color="#359EFF" />
            </Pressable>
            <Pressable
              style={styles.headerButton}
              onPress={() => setShowPasswordModal(true)}
            >
              <MaterialCommunityIcons name="lock-reset" size={20} color="#359EFF" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.headerActions}>
            <Pressable style={styles.cancelButton} onPress={cancelEditing}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleUpdateProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#359EFF"]}
          />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Pressable style={styles.avatarContainer} onPress={handleAvatarPick}>
            <Image
              source={{
                uri:
                  (isEditing ? profileForm.avatarUrl : userInfo?.profile?.avatarUrl) ||
                  "https://via.placeholder.com/150?text=Avatar",
              }}
              style={styles.avatar}
            />
            {isEditing && (
              <View style={styles.avatarOverlay}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="camera" size={24} color="#fff" />
                )}
              </View>
            )}
          </Pressable>

          <Text style={styles.profileName}>
            {userInfo?.profile?.fullName || "Chưa cập nhật"}
          </Text>
          <Text style={styles.profileRole}>{userInfo?.role}</Text>

          {/* Status Badges */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                userInfo?.status === "Active" && styles.statusActive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  userInfo?.status === "Active" && styles.statusActiveText,
                ]}
              >
                {userInfo?.status === "Active" ? "Hoạt động" : userInfo?.status}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                userInfo?.emailVerified ? styles.statusVerified : styles.statusUnverified,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  userInfo?.emailVerified && styles.statusVerifiedText,
                ]}
              >
                {userInfo?.emailVerified ? "✓ Email" : "Email chưa xác minh"}
              </Text>
            </View>
          </View>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Ngày tạo TK</Text>
              <Text style={styles.metaValue}>{formatDate(userInfo?.createdAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Đăng nhập cuối</Text>
              <Text style={styles.metaValue}>{formatDate(userInfo?.lastLoginAt)}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tabButton, activeTab === "overview" && styles.tabButtonActive]}
            onPress={() => setActiveTab("overview")}
          >
            <Text
              style={[styles.tabText, activeTab === "overview" && styles.tabTextActive]}
            >
              Tổng quan
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === "details" && styles.tabButtonActive]}
            onPress={() => setActiveTab("details")}
          >
            <Text
              style={[styles.tabText, activeTab === "details" && styles.tabTextActive]}
            >
              Chi tiết
            </Text>
          </Pressable>
        </View>

        {/* Overview Tab */}
        {activeTab === "overview" && !isEditing && (
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={[styles.infoIcon, { backgroundColor: "#dbeafe" }]}>
                <MaterialCommunityIcons name="email" size={24} color="#2563eb" />
              </View>
              <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userInfo?.email || "Chưa cập nhật"}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={[styles.infoIcon, { backgroundColor: "#dcfce7" }]}>
                <MaterialCommunityIcons name="phone" size={24} color="#16a34a" />
              </View>
              <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>{userInfo?.phone || "Chưa cập nhật"}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={[styles.infoIcon, { backgroundColor: "#fef3c7" }]}>
                <MaterialCommunityIcons name="map-marker" size={24} color="#d97706" />
              </View>
              <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>
                  {userInfo?.profile?.address || "Chưa cập nhật"}
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={[styles.infoIcon, { backgroundColor: "#fce7f3" }]}>
                <MaterialCommunityIcons name="cake-variant" size={24} color="#db2777" />
              </View>
              <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>Ngày sinh</Text>
                <Text style={styles.infoValue}>
                  {userInfo?.profile?.birthday || "Chưa cập nhật"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Details Tab */}
        {activeTab === "details" && !isEditing && (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Họ và tên</Text>
              <Text style={styles.detailValue}>
                {userInfo?.profile?.fullName || "Chưa cập nhật"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{userInfo?.email || "Chưa cập nhật"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Số điện thoại</Text>
              <Text style={styles.detailValue}>{userInfo?.phone || "Chưa cập nhật"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Giới tính</Text>
              <Text style={styles.detailValue}>
                {getGenderLabel(userInfo?.profile?.gender)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Địa chỉ</Text>
              <Text style={styles.detailValue}>
                {userInfo?.profile?.address || "Chưa cập nhật"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngày sinh</Text>
              <Text style={styles.detailValue}>
                {userInfo?.profile?.birthday || "Chưa cập nhật"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vai trò</Text>
              <Text style={styles.detailValue}>{userInfo?.role}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Giới thiệu</Text>
              <Text style={styles.detailValue}>
                {userInfo?.profile?.bio || "Chưa có giới thiệu"}
              </Text>
            </View>
          </View>
        )}

        {/* Edit Form */}
        {isEditing && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Chỉnh sửa hồ sơ</Text>

            <Text style={styles.label}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#999"
              value={profileForm.fullName}
              onChangeText={(text) =>
                setProfileForm((prev) => ({ ...prev, fullName: text }))
              }
            />

            <Text style={styles.label}>Giới tính</Text>
            <Pressable
              style={styles.selectInput}
              onPress={() => setShowGenderModal(true)}
            >
              <Text
                style={[
                  styles.selectText,
                  !profileForm.gender && styles.placeholder,
                ]}
              >
                {getGenderLabel(profileForm.gender)}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
            </Pressable>

            <Text style={styles.label}>Ngày sinh</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              value={profileForm.birthday}
              onChangeText={(text) =>
                setProfileForm((prev) => ({ ...prev, birthday: text }))
              }
            />

            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập địa chỉ"
              placeholderTextColor="#999"
              value={profileForm.address}
              onChangeText={(text) =>
                setProfileForm((prev) => ({ ...prev, address: text }))
              }
            />

            <Text style={styles.label}>Giới thiệu</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Viết vài dòng về bản thân..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={profileForm.bio}
              onChangeText={(text) =>
                setProfileForm((prev) => ({ ...prev, bio: text }))
              }
            />
          </View>
        )}

        {/* Menu Items */}
        {!isEditing && (
          <View style={styles.menuCard}>
            <MenuItem
              icon="package-variant"
              label="Đơn hàng của tôi"
              onPress={() => navigation.navigate("Orders")}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="heart"
              label="Danh sách yêu thích"
              onPress={() => navigation.navigate("Favorites")}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="history"
              label="Gói đăng ký của tôi"
              onPress={() => navigation.navigate("Subscription")}
            />
          </View>
        )}

        {!isEditing && (
          <View style={styles.menuCard}>
            <MenuItem
              icon="cog"
              label="Cài đặt ứng dụng"
              onPress={() => Alert.alert("Thông báo", "Chức năng đang phát triển")}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="help-circle"
              label="Trợ giúp & Hỗ trợ"
              onPress={() => Alert.alert("Thông báo", "Chức năng đang phát triển")}
            />
          </View>
        )}

        {/* Logout Button */}
        {!isEditing && (
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <Pressable onPress={() => setShowPasswordModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#111" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Mật khẩu hiện tại</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPasswords.current}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) =>
                    setPasswordForm((prev) => ({ ...prev, currentPassword: text }))
                  }
                />
                <Pressable
                  onPress={() =>
                    setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                  }
                >
                  <MaterialCommunityIcons
                    name={showPasswords.current ? "eye-off" : "eye"}
                    size={20}
                    color="#999"
                  />
                </Pressable>
              </View>

              <Text style={styles.label}>Mật khẩu mới</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPasswords.new}
                  value={passwordForm.newPassword}
                  onChangeText={(text) =>
                    setPasswordForm((prev) => ({ ...prev, newPassword: text }))
                  }
                />
                <Pressable
                  onPress={() =>
                    setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                  }
                >
                  <MaterialCommunityIcons
                    name={showPasswords.new ? "eye-off" : "eye"}
                    size={20}
                    color="#999"
                  />
                </Pressable>
              </View>

              <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPasswords.confirm}
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) =>
                    setPasswordForm((prev) => ({ ...prev, confirmPassword: text }))
                  }
                />
                <Pressable
                  onPress={() =>
                    setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                  }
                >
                  <MaterialCommunityIcons
                    name={showPasswords.confirm ? "eye-off" : "eye"}
                    size={20}
                    color="#999"
                  />
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}
                onPress={handleChangePassword}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Đổi mật khẩu</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Gender Modal */}
      <Modal visible={showGenderModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "40%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn giới tính</Text>
              <Pressable onPress={() => setShowGenderModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#111" />
              </Pressable>
            </View>

            {GENDERS.filter((g) => g.value).map((gender) => (
              <Pressable
                key={gender.value}
                style={styles.genderItem}
                onPress={() => {
                  setProfileForm((prev) => ({ ...prev, gender: gender.value }));
                  setShowGenderModal(false);
                }}
              >
                <Text style={styles.genderLabel}>{gender.label}</Text>
                {profileForm.gender === gender.value && (
                  <MaterialCommunityIcons name="check" size={20} color="#22c55e" />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// MenuItem Component
const MenuItem = ({ icon, label, onPress }) => (
  <Pressable
    style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    onPress={onPress}
  >
    <View style={styles.menuItemLeft}>
      <View style={styles.menuIconContainer}>
        <MaterialCommunityIcons name={icon} size={20} color="#6b7280" />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(53, 158, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#359EFF",
    minWidth: 60,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginTop: 12,
  },
  profileRole: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  statusActive: {
    backgroundColor: "#dcfce7",
  },
  statusVerified: {
    backgroundColor: "#dbeafe",
  },
  statusUnverified: {
    backgroundColor: "#fef3c7",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
  },
  statusActiveText: {
    color: "#16a34a",
  },
  statusVerifiedText: {
    color: "#2563eb",
  },
  metaRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  metaItem: {
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#359EFF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#fff",
  },
  infoGrid: {
    marginHorizontal: 12,
    marginTop: 12,
    gap: 12,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  infoDetails: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  detailsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  formCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#f5f7f8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  selectInput: {
    backgroundColor: "#f5f7f8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  selectText: {
    fontSize: 14,
    color: "#111",
  },
  placeholder: {
    color: "#999",
  },
  menuCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemPressed: {
    backgroundColor: "#f3f4f6",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginLeft: 70,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
    marginTop: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ef4444",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6b7280",
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#359EFF",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveButtonDisabled: {
    opacity: 0.7,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f7f8",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
  },
  genderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  genderLabel: {
    fontSize: 15,
    color: "#111",
  },
});

export default Profile;
