import {
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useStorageContext } from "../provider/StorageProvider";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const Favorites = () => {
  const navigation = useNavigation();
  const {
    addStorageData: addToFavorites,
    removeStorageData: removeFromFavorites,
    storageData: favorites,
  } = useStorageContext();

  const [statusFilter, setStatusFilter] = useState("all");
  const [showPostingModal, setShowPostingModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "Như mới",
    hasNegotiation: false,
  });

  // Mock data with status - in real app, this would come from API/context
  const listings = (favorites || []).map((product, index) => ({
    ...product,
    status: index === 0 ? "active" : index === 1 ? "pending" : "sold",
    views: [24, 108, 0][index] || 0,
    soldDate: index === 2 ? "2 ngày trước" : null,
  }));

  const filteredListings =
    statusFilter === "all"
      ? listings
      : listings.filter((item) => item.status === statusFilter);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return { bg: "rgba(51, 158, 255, 0.2)", text: "#13ec5b", label: "Đang bán" };
      case "pending":
        return { bg: "rgba(255, 165, 0, 0.2)", text: "#FF9500", label: "Chờ duyệt" };
      case "sold":
        return { bg: "rgba(128, 128, 128, 0.2)", text: "#999", label: "Đã bán" };
      default:
        return { bg: "rgba(51, 158, 255, 0.2)", text: "#359EFF", label: "Đang bán" };
    }
  };

  const handleDelete = (productId) => {
    Alert.alert(
      "Xóa tin đăng",
      "Bạn có chắc chắn muốn xóa tin đăng này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            removeFromFavorites(productId);
          },
        },
      ]
    );
  };

  const handleSubmitPosting = () => {
    if (!formData.title || !formData.description || !formData.price) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    Alert.alert("Thành công", "Tin đăng của bạn đã được tạo!");
    setShowPostingModal(false);
    setFormData({
      title: "",
      description: "",
      price: "",
      category: "",
      condition: "Như mới",
      hasNegotiation: false,
    });
  };
  const ListingCard = ({ product }) => {
    const statusInfo = getStatusColor(product.status);
    const isSold = product.status === "sold";
    const productImage = product.image || product.images?.[0] || 
      "https://via.placeholder.com/80x80?text=No+Image";

    return (
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          marginBottom: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#f0f0f0",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
          opacity: isSold ? 0.75 : 1,
        }}
      >
        {/* Card Content */}
        <View style={{ flexDirection: "row", gap: 16, padding: 16 }}>
          {/* Image */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              backgroundColor: "#f0f0f0",
              overflow: "hidden",
            }}
          >
            <Image
              source={{
                uri: productImage,
              }}
              style={{
                width: "100%",
                height: "100%",
                resizeMode: "cover",
              }}
            />
          </View>

          {/* Info */}
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "#111",
                  flex: 1,
                  marginRight: 8,
                }}
                numberOfLines={1}
              >
                {product.title || product.name}
              </Text>
              <View
                style={{
                  backgroundColor: statusInfo.bg,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: statusInfo.text,
                  }}
                >
                  {statusInfo.label}
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#111",
                marginBottom: 4,
              }}
            >
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(product.price || 0)}
            </Text>

            {/* Views or Sold Date */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <MaterialCommunityIcons
                name={isSold ? "calendar-today" : "eye"}
                size={12}
                color="#999"
              />
              <Text style={{ fontSize: 11, color: "#999" }}>
                {isSold ? `Đã bán ${product.soldDate}` : `${product.views} lượt xem`}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Bar */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: "#fafafa",
            borderTopWidth: 1,
            borderTopColor: "#f0f0f0",
          }}
        >
          <Pressable
            disabled={isSold}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#e0e0e0",
              borderRadius: 8,
              opacity: isSold ? 0.5 : 1,
            }}
          >
            <MaterialCommunityIcons
              name={isSold ? "pencil-off" : "pencil"}
              size={16}
              color={isSold ? "#999" : "#111"}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isSold ? "#999" : "#111",
              }}
            >
              Chỉnh sửa
            </Text>
          </Pressable>

          <View
            style={{
              flexDirection: "row",
              gap: 8,
            }}
          >
            <Pressable
              onPress={() => handleDelete(product.id)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name="delete"
                size={20}
                color="#FF4444"
              />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f7f8" }}>
      {/* Header + Filter */}
      <SafeAreaView
        style={{
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#f0f0f0",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#111",
            }}
          >
            Tin của tôi
          </Text>
        </View>

        {/* Filter Tabs */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: "#fff",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(0, 0, 0, 0.05)",
              borderRadius: 8,
              padding: 4,
              gap: 4,
            }}
          >
            {["all", "active", "pending", "sold"].map((filter) => (
              <Pressable
                key={filter}
                onPress={() => setStatusFilter(filter)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                  borderRadius: 6,
                  backgroundColor:
                    statusFilter === filter ? "#fff" : "transparent",
                  shadowColor:
                    statusFilter === filter ? "#000" : "transparent",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: statusFilter === filter ? 0.1 : 0,
                  shadowRadius: 2,
                  elevation: statusFilter === filter ? 1 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color:
                      statusFilter === filter ? "#111" : "#999",
                    textAlign: "center",
                    textTransform: "capitalize",
                  }}
                >
                  {filter === "all"
                    ? "Tất cả"
                    : filter === "active"
                    ? "Đang bán"
                    : filter === "pending"
                    ? "Chờ duyệt"
                    : "Đã bán"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>

      {/* Listings List */}
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        renderItem={({ item }) => <ListingCard product={item} />}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 120,
        }}
        scrollIndicatorInsets={{ right: 1 }}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 60,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#f0f0f0",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <MaterialCommunityIcons
                name="clipboard-list"
                size={40}
                color="#ccc"
              />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#111",
                marginBottom: 8,
              }}
            >
              Chưa có tin đăng
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#999",
                textAlign: "center",
                maxWidth: 200,
              }}
            >
              Nhấn nút + để bắt đầu đăng bán sản phẩm của bạn.
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <Pressable
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#359EFF",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#359EFF",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
        onPress={() => setShowPostingModal(true)}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#fff" />
      </Pressable>

      {/* Posting Modal */}
      <Modal
        visible={showPostingModal}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f7f8" }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: "#fff",
              borderBottomWidth: 1,
              borderBottomColor: "#f0f0f0",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111" }}>
              Đăng bán sản phẩm
            </Text>
            <Pressable onPress={() => setShowPostingModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#111" />
            </Pressable>
          </View>

          {/* Form */}
          <ScrollView
            style={{ flex: 1, padding: 16 }}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Title */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", marginBottom: 8 }}>
                Tiêu đề
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                }}
                placeholder="Nhập tiêu đề sản phẩm"
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
              />
            </View>

            {/* Category */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", marginBottom: 8 }}>
                Danh mục
              </Text>
              <Pressable
                style={{
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ fontSize: 14, color: "#666" }}>
                  {formData.category || "Chọn danh mục"}
                </Text>
              </Pressable>
            </View>

            {/* Price */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", marginBottom: 8 }}>
                Giá
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                }}
                placeholder="Nhập giá"
                keyboardType="decimal-pad"
                value={formData.price}
                onChangeText={(text) =>
                  setFormData({ ...formData, price: text })
                }
              />
            </View>

            {/* Condition */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", marginBottom: 8 }}>
                Tình trạng
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {["Như mới", "Tốt", "Bình thường"].map((condition) => (
                  <Pressable
                    key={condition}
                    onPress={() => setFormData({ ...formData, condition })}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor:
                        formData.condition === condition ? "#359EFF" : "#fff",
                      borderWidth: 1,
                      borderColor:
                        formData.condition === condition ? "#359EFF" : "#e0e0e0",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color:
                          formData.condition === condition ? "#fff" : "#111",
                      }}
                    >
                      {condition}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Negotiation */}
            <View style={{ marginBottom: 16, flexDirection: "row", alignItems: "center" }}>
              <Pressable
                onPress={() =>
                  setFormData({ ...formData, hasNegotiation: !formData.hasNegotiation })
                }
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: "#e0e0e0",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: formData.hasNegotiation ? "#359EFF" : "#fff",
                }}
              >
                {formData.hasNegotiation && (
                  <MaterialCommunityIcons name="check" size={16} color="#fff" />
                )}
              </Pressable>
              <Text style={{ fontSize: 14, color: "#111", marginLeft: 8 }}>
                Chấp nhận thương lượng
              </Text>
            </View>

            {/* Description */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", marginBottom: 8 }}>
                Mô tả
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
                placeholder="Nhập mô tả sản phẩm"
                multiline
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              flexDirection: "row",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: "#fff",
              borderTopWidth: 1,
              borderTopColor: "#f0f0f0",
            }}
          >
            <Pressable
              onPress={() => setShowPostingModal(false)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#e0e0e0",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#111" }}>
                Hủy
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSubmitPosting}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: "#359EFF",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                Đăng bán
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default Favorites;
