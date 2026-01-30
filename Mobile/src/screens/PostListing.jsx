import React, { useState } from "react";
import {
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Modal,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const PostListing = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "Như mới",
    hasNegotiation: false,
    images: [],
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.price) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    Alert.alert("Thành công", "Sản phẩm của bạn đã được đăng!");
    setFormData({
      title: "",
      description: "",
      price: "",
      category: "",
      condition: "Như mới",
      hasNegotiation: false,
      images: [],
    });
    navigation?.goBack();
  };

  return (
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
        <Pressable onPress={() => navigation?.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#111" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111" }}>
          Đăng bán sản phẩm
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Form */}
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Title */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", marginBottom: 8 }}>
            Tiêu đề sản phẩm
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#e0e0e0",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: "#111",
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
            <Text style={{ fontSize: 14, color: formData.category ? "#111" : "#666" }}>
              {formData.category || "Chọn danh mục"}
            </Text>
          </Pressable>
        </View>

        {/* Price */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", marginBottom: 8 }}>
            Giá (VND)
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#e0e0e0",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: "#111",
            }}
            placeholder="Nhập giá sản phẩm"
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
            Mô tả chi tiết
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
              color: "#111",
            }}
            placeholder="Mô tả chi tiết về sản phẩm..."
            multiline
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
          />
        </View>

        {/* Image Upload */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#999", marginBottom: 8 }}>
            Hình ảnh
          </Text>
          <Pressable
            style={{
              borderWidth: 2,
              borderColor: "#359EFF",
              borderStyle: "dashed",
              borderRadius: 8,
              paddingVertical: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons name="cloud-upload" size={32} color="#359EFF" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#359EFF", marginTop: 8 }}>
              Tải lên hình ảnh
            </Text>
            <Text style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
              Tối đa 10 ảnh
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Submit Button */}
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
          onPress={() => navigation?.goBack()}
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
          onPress={handleSubmit}
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
  );
};

export default PostListing;
