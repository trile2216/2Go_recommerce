import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { fetchAllCategories, fetchSubCategoriesByCategoryId } from "../service/home/api.category";
import { fetchAllDistricts, fetchAllWards } from "../service/home/api.ward";
import { createListing } from "../service/home/api.sellerListing";
import { uploadImageAndGetUrl, uploadVideo } from "../service/upload/api.upload";
import { listingPrecheck } from "../service/ai/api.analyze";
import { useAuth } from "../context/AuthContext";

const CONDITIONS = [
  { value: "new", label: "Mới" },
  { value: "used", label: "Đã sử dụng" },
];

const PostListing = ({ navigation }) => {
  const { user } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    brand: "",
    color: "",
    capacity: "",
    warranty: "",
    origin: "",
    condition: "",
    isFree: false,
    hasNegotiation: true,
  });

  // Category State
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Location State
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [isWardModalOpen, setIsWardModalOpen] = useState(false);

  // Media State
  const [imageList, setImageList] = useState([]); // [{ uri, isPrimary }]
  const [videoUri, setVideoUri] = useState(null);

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Categories
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await fetchAllCategories();
        const items = data.items || [];

        const categoriesWithSubs = await Promise.all(
          items.map(async (category) => {
            try {
              const subData = await fetchSubCategoriesByCategoryId(category.categoryId);
              return {
                id: category.categoryId,
                name: category.name,
                subcategories: (subData.items || []).map((sub) => ({
                  id: sub.subCategoryId,
                  name: sub.name,
                })),
              };
            } catch (err) {
              return {
                id: category.categoryId,
                name: category.name,
                subcategories: [],
              };
            }
          })
        );

        setCategories(categoriesWithSubs);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Load Districts
  useEffect(() => {
    const loadDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const data = await fetchAllDistricts();
        const districtsList = (data.items || []).map((district) => ({
          value: district.districtId,
          label: district.name,
          cityName: district.cityName,
        }));
        setDistricts(districtsList);
      } catch (error) {
        console.error("Error loading districts:", error);
      } finally {
        setLoadingDistricts(false);
      }
    };
    loadDistricts();
  }, []);

  // Load Wards when district selected
  useEffect(() => {
    if (selectedDistrict) {
      const loadWards = async () => {
        setLoadingWards(true);
        try {
          const data = await fetchAllWards();
          const wardsList = (data.items || [])
            .filter((ward) => ward.districtId === selectedDistrict.value)
            .map((ward) => ({
              value: ward.wardId,
              label: ward.name,
            }));
          setWards(wardsList);
          setSelectedWard(null);
        } catch (error) {
          console.error("Error loading wards:", error);
        } finally {
          setLoadingWards(false);
        }
      };
      loadWards();
    } else {
      setWards([]);
      setSelectedWard(null);
    }
  }, [selectedDistrict]);

  // Category Handlers
  const handleCategorySelect = (category) => {
    setExpandedCategoryId(expandedCategoryId === category.id ? null : category.id);
  };

  const handleSubcategorySelect = (category, subcategory) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setIsCategoryModalOpen(false);
  };

  // Image Handlers
  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 6 - imageList.length,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset, index) => ({
        uri: asset.uri,
        isPrimary: imageList.length === 0 && index === 0,
      }));

      setImageList((prev) => {
        const updated = [...prev, ...newImages].slice(0, 6);
        if (!updated.some((img) => img.isPrimary) && updated.length > 0) {
          updated[0].isPrimary = true;
        }
        return updated;
      });
    }
  };

  const handleRemoveImage = (index) => {
    setImageList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const handleSetPrimary = (index) => {
    setImageList((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  // Video Handlers
  const handlePickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleRemoveVideo = () => {
    setVideoUri(null);
  };

  // Form Validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề sản phẩm");
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mô tả sản phẩm");
      return false;
    }
    if (!formData.isFree && !formData.price) {
      Alert.alert("Lỗi", "Vui lòng nhập giá bán");
      return false;
    }
    if (!selectedSubcategory) {
      Alert.alert("Lỗi", "Vui lòng chọn danh mục sản phẩm");
      return false;
    }
    if (!formData.condition) {
      Alert.alert("Lỗi", "Vui lòng chọn tình trạng sản phẩm");
      return false;
    }
    if (imageList.length === 0) {
      Alert.alert("Lỗi", "Vui lòng tải lên ít nhất 1 hình ảnh");
      return false;
    }
    return true;
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Upload images
      const imageFiles = imageList.map((img) => ({
        uri: img.uri,
        type: "image/jpeg",
        name: `image_${Date.now()}.jpg`,
      }));

      const imageUrls = await uploadImageAndGetUrl(imageFiles);
      const imageUrlArr = Array.isArray(imageUrls) ? imageUrls : [imageUrls];

      // Build media array
      const mediaData = imageUrlArr.map((url, index) => ({
        url,
        mediaType: "IMAGE",
        isPrimary: imageList[index]?.isPrimary || false,
        sortOrder: index,
      }));

      // Upload video if present
      let videoUrl = null;
      if (videoUri) {
        const videoFile = {
          uri: videoUri,
          type: "video/mp4",
          name: `video_${Date.now()}.mp4`,
        };
        const videoResult = await uploadVideo(videoFile);
        videoUrl = videoResult.secureUrl || videoResult.url;
        mediaData.push({
          url: videoUrl,
          mediaType: "VIDEO",
          isPrimary: false,
          sortOrder: mediaData.length,
        });
      }

      // Collect all media URLs for precheck
      const allMediaUrls = [...imageUrlArr];
      if (videoUrl) allMediaUrls.push(videoUrl);

      // Call precheck API before creating listing
      const precheckData = {
        title: formData.title,
        description: formData.description,
        categoryId: selectedCategory?.id || 0,
        brand: formData.brand || "",
        price: formData.isFree ? 0 : parseFloat(formData.price) || 0,
        mediaUrls: allMediaUrls,
        userId: user?.userId || user?.id || "",
      };

      const precheckResult = await listingPrecheck(precheckData);

      if (!precheckResult.canPublish) {
        setIsSubmitting(false);
        Alert.alert(
          "Không thể đăng tin",
          precheckResult.risk?.message || precheckResult.note || "Bài đăng không đủ điều kiện. Vui lòng kiểm tra lại!"
        );
        return;
      }

      // Prepare request
      const requestData = {
        title: formData.title,
        description: formData.description,
        subCategoryId: selectedSubcategory.id,
        wardId: selectedWard?.value || null,
        price: formData.isFree ? 0 : parseFloat(formData.price) || 0,
        listingType: "Single",
        availableQuantity: 1,
        hasNegotiation: formData.hasNegotiation,
        condition: formData.condition,
        brand: formData.brand || "",
        dimensions: null,
        weight: null,
        media: mediaData,
        attributes: [
          { name: "Màu sắc", value: formData.color || "" },
          { name: "Dung lượng", value: formData.capacity || "" },
          { name: "Bảo hành", value: formData.warranty || "" },
          { name: "Xuất xứ", value: formData.origin || "" },
        ].filter((attr) => attr.value),
      };

      await createListing(requestData);

      Alert.alert("Thành công", "Tin của bạn đã được đăng tải thành công!", [
        { text: "OK", onPress: () => navigation?.goBack() },
      ]);
    } catch (error) {
      console.error("Error creating listing:", error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Có lỗi xảy ra khi đăng tin. Vui lòng thử lại!"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateForm = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation?.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Đăng tin mới</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hình ảnh và Video</Text>
          <Text style={styles.sectionSubtitle}>Tối đa 6 ảnh và 1 video</Text>

          <Text style={styles.label}>Hình ảnh *</Text>
          <View style={styles.mediaGrid}>
            {imageList.map((img, index) => (
              <View key={index} style={[styles.mediaItem, img.isPrimary && styles.mediaItemPrimary]}>
                <Image source={{ uri: img.uri }} style={styles.mediaPreview} />
                <Pressable style={styles.removeButton} onPress={() => handleRemoveImage(index)}>
                  <MaterialCommunityIcons name="close" size={14} color="#fff" />
                </Pressable>
                {img.isPrimary ? (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Ảnh bìa</Text>
                  </View>
                ) : (
                  <Pressable style={styles.setPrimaryButton} onPress={() => handleSetPrimary(index)}>
                    <MaterialCommunityIcons name="star-outline" size={12} color="#359EFF" />
                    <Text style={styles.setPrimaryText}>Ảnh bìa</Text>
                  </Pressable>
                )}
              </View>
            ))}

            {imageList.length < 6 && (
              <Pressable style={styles.addMediaButton} onPress={handlePickImages}>
                <MaterialCommunityIcons name="camera-plus" size={24} color="#999" />
                <Text style={styles.addMediaText}>Thêm ảnh</Text>
              </Pressable>
            )}
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Video</Text>
          <View style={styles.mediaGrid}>
            {videoUri ? (
              <View style={styles.mediaItem}>
                <View style={[styles.mediaPreview, styles.videoPreview]}>
                  <MaterialCommunityIcons name="video" size={32} color="#359EFF" />
                </View>
                <Pressable style={styles.removeButton} onPress={handleRemoveVideo}>
                  <MaterialCommunityIcons name="close" size={14} color="#fff" />
                </Pressable>
                <View style={styles.videoBadge}>
                  <Text style={styles.videoBadgeText}>Video</Text>
                </View>
              </View>
            ) : (
              <Pressable style={styles.addMediaButton} onPress={handlePickVideo}>
                <MaterialCommunityIcons name="video-plus" size={24} color="#999" />
                <Text style={styles.addMediaText}>Thêm video</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Product Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>

          {/* Category */}
          <Text style={styles.label}>Danh mục sản phẩm *</Text>
          <Pressable style={styles.selectInput} onPress={() => setIsCategoryModalOpen(true)}>
            <Text style={[styles.selectText, !selectedSubcategory && styles.placeholder]}>
              {selectedCategory && selectedSubcategory
                ? `${selectedCategory.name} - ${selectedSubcategory.name}`
                : "Chọn danh mục"}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
          </Pressable>

          {/* Condition */}
          <Text style={styles.label}>Tình trạng *</Text>
          <View style={styles.conditionRow}>
            {CONDITIONS.map((cond) => (
              <Pressable
                key={cond.value}
                style={[
                  styles.conditionButton,
                  formData.condition === cond.value && styles.conditionButtonActive,
                ]}
                onPress={() => updateForm("condition", cond.value)}
              >
                <Text
                  style={[
                    styles.conditionText,
                    formData.condition === cond.value && styles.conditionTextActive,
                  ]}
                >
                  {cond.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Brand */}
          <Text style={styles.label}>Hãng *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="VD: Apple, Samsung, Xiaomi..."
            placeholderTextColor="#999"
            value={formData.brand}
            onChangeText={(text) => updateForm("brand", text)}
          />

          {/* Color */}
          <Text style={styles.label}>Màu sắc</Text>
          <TextInput
            style={styles.textInput}
            placeholder="VD: Đen, Trắng, Xanh..."
            placeholderTextColor="#999"
            value={formData.color}
            onChangeText={(text) => updateForm("color", text)}
          />

          {/* Capacity */}
          <Text style={styles.label}>Dung lượng</Text>
          <TextInput
            style={styles.textInput}
            placeholder="VD: 128GB, 256GB..."
            placeholderTextColor="#999"
            value={formData.capacity}
            onChangeText={(text) => updateForm("capacity", text)}
          />

          {/* Warranty */}
          <Text style={styles.label}>Chính sách bảo hành</Text>
          <TextInput
            style={styles.textInput}
            placeholder="VD: 12 tháng, Hết bảo hành..."
            placeholderTextColor="#999"
            value={formData.warranty}
            onChangeText={(text) => updateForm("warranty", text)}
          />

          {/* Origin */}
          <Text style={styles.label}>Xuất xứ</Text>
          <TextInput
            style={styles.textInput}
            placeholder="VD: Việt Nam, Trung Quốc..."
            placeholderTextColor="#999"
            value={formData.origin}
            onChangeText={(text) => updateForm("origin", text)}
          />

          {/* Free Checkbox */}
          <Pressable
            style={styles.checkboxRow}
            onPress={() => updateForm("isFree", !formData.isFree)}
          >
            <View style={[styles.checkbox, formData.isFree && styles.checkboxChecked]}>
              {formData.isFree && (
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Tích miễn phí cho tặng miễn phí</Text>
          </Pressable>

          {/* Price */}
          {!formData.isFree && (
            <>
              <Text style={styles.label}>Giá bán *</Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.pricePrefix}>₫</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="VD: 5000000"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={formData.price}
                  onChangeText={(text) => updateForm("price", text)}
                />
              </View>
            </>
          )}
        </View>

        {/* Title & Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiêu đề và Mô tả</Text>

          <Text style={styles.label}>Tiêu đề tin đăng *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="VD: iPhone 14 Pro Max 256GB - Mới 99%"
            placeholderTextColor="#999"
            value={formData.title}
            onChangeText={(text) => updateForm("title", text)}
          />

          <Text style={styles.label}>Mô tả chi tiết *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder={`Hãy mô tả chi tiết về sản phẩm của bạn:\n- Tình trạng máy\n- Chức năng còn hoạt động\n- Phụ kiện đi kèm\n- Lý do bán\n- Thời gian sử dụng`}
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={formData.description}
            onChangeText={(text) => updateForm("description", text)}
          />
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin người bán</Text>

          <Text style={styles.label}>Quận/Huyện</Text>
          <Pressable style={styles.selectInput} onPress={() => setIsDistrictModalOpen(true)}>
            <Text style={[styles.selectText, !selectedDistrict && styles.placeholder]}>
              {selectedDistrict?.label || "Chọn quận/huyện"}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
          </Pressable>

          <Text style={styles.label}>Phường/Xã</Text>
          <Pressable
            style={[styles.selectInput, !selectedDistrict && styles.selectInputDisabled]}
            onPress={() => selectedDistrict && setIsWardModalOpen(true)}
          >
            <Text style={[styles.selectText, !selectedWard && styles.placeholder]}>
              {selectedWard?.label || "Chọn phường/xã"}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Submit Buttons */}
      <View style={styles.footer}>
        <Pressable style={styles.cancelButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </Pressable>
        <Pressable
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Đăng tin</Text>
          )}
        </Pressable>
      </View>

      {/* Category Modal */}
      <Modal visible={isCategoryModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục sản phẩm</Text>
              <Pressable onPress={() => setIsCategoryModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#111" />
              </Pressable>
            </View>

            {loadingCategories ? (
              <ActivityIndicator size="large" color="#359EFF" style={{ marginTop: 40 }} />
            ) : (
              <ScrollView style={styles.modalScrollView}>
                {categories.map((category) => (
                  <View key={category.id} style={styles.categoryItem}>
                    <Pressable
                      style={styles.categoryHeader}
                      onPress={() => handleCategorySelect(category)}
                    >
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <MaterialCommunityIcons
                        name={expandedCategoryId === category.id ? "minus" : "plus"}
                        size={20}
                        color="#666"
                      />
                    </Pressable>

                    {expandedCategoryId === category.id && (
                      <View style={styles.subcategoryList}>
                        {category.subcategories.map((sub) => (
                          <Pressable
                            key={sub.id}
                            style={styles.subcategoryItem}
                            onPress={() => handleSubcategorySelect(category, sub)}
                          >
                            <Text style={styles.subcategoryName}>{sub.name}</Text>
                            {selectedSubcategory?.id === sub.id && (
                              <MaterialCommunityIcons name="check" size={18} color="#22c55e" />
                            )}
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* District Modal */}
      <Modal visible={isDistrictModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn quận/huyện</Text>
              <Pressable onPress={() => setIsDistrictModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#111" />
              </Pressable>
            </View>

            {loadingDistricts ? (
              <ActivityIndicator size="large" color="#359EFF" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={districts}
                keyExtractor={(item) => item.value.toString()}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.listItem}
                    onPress={() => {
                      setSelectedDistrict(item);
                      setIsDistrictModalOpen(false);
                    }}
                  >
                    <Text style={styles.listItemText}>{item.label}</Text>
                    {selectedDistrict?.value === item.value && (
                      <MaterialCommunityIcons name="check" size={18} color="#22c55e" />
                    )}
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Ward Modal */}
      <Modal visible={isWardModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn phường/xã</Text>
              <Pressable onPress={() => setIsWardModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#111" />
              </Pressable>
            </View>

            {loadingWards ? (
              <ActivityIndicator size="large" color="#359EFF" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={wards}
                keyExtractor={(item) => item.value.toString()}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.listItem}
                    onPress={() => {
                      setSelectedWard(item);
                      setIsWardModalOpen(false);
                    }}
                  >
                    <Text style={styles.listItemText}>{item.label}</Text>
                    {selectedWard?.value === item.value && (
                      <MaterialCommunityIcons name="check" size={18} color="#22c55e" />
                    )}
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Không có dữ liệu</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7f8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
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
    minHeight: 120,
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
  selectInputDisabled: {
    opacity: 0.5,
  },
  selectText: {
    fontSize: 14,
    color: "#111",
  },
  placeholder: {
    color: "#999",
  },
  conditionRow: {
    flexDirection: "row",
    gap: 8,
  },
  conditionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f5f7f8",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  conditionButtonActive: {
    backgroundColor: "#359EFF",
    borderColor: "#359EFF",
  },
  conditionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
  conditionTextActive: {
    color: "#fff",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#359EFF",
    borderColor: "#359EFF",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#111",
    marginLeft: 10,
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f7f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
  },
  pricePrefix: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f5f7f8",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  mediaItemPrimary: {
    borderColor: "#359EFF",
    borderWidth: 2,
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
  },
  videoPreview: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e5e7eb",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#359EFF",
    paddingVertical: 3,
    alignItems: "center",
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  setPrimaryButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 3,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  setPrimaryText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#359EFF",
  },
  videoBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#22c55e",
    paddingVertical: 3,
    alignItems: "center",
  },
  videoBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  addMediaButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  addMediaText: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  footer: {
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
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#359EFF",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
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
    maxHeight: "80%",
    paddingBottom: 24,
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
  modalScrollView: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  subcategoryList: {
    backgroundColor: "#fafafa",
    paddingLeft: 16,
    paddingBottom: 8,
  },
  subcategoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  subcategoryName: {
    fontSize: 14,
    color: "#555",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  listItemText: {
    fontSize: 15,
    color: "#111",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 40,
  },
});

export default PostListing;
