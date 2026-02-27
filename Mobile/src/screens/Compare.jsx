import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { removeFromCompare, clearCompare } from '../store/compareSlice';

export default function Compare() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const products = useSelector(state => state.compare.items);

  const formatPrice = (price) => {
    if (!price) return '—';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const comparisonItems = [
    { label: 'Giá', key: 'price', format: (value) => formatPrice(value) },
    { label: 'Danh mục', key: 'categoryName' },
    { label: 'Danh mục phụ', key: 'subCategoryName' },
    { label: 'Mô tả', key: 'description' },
  ];

  const handleRemoveProduct = (productId) => {
    dispatch(removeFromCompare(productId));
  };

  const handleClearAll = () => {
    dispatch(clearCompare());
    navigation.goBack();
  };

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
             <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
          </Pressable>
          <Text style={styles.headerTitle}>So sánh sản phẩm</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="compass-outline" size={80} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Chưa có sản phẩm nào</Text>
          <Text style={styles.emptyText}>Hãy thêm sản phẩm từ trang chủ để bắt đầu so sánh</Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Quay lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
         <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
         </Pressable>
         <Text style={styles.headerTitle}>So sánh sản phẩm</Text>
         <Pressable onPress={handleClearAll}>
            <Text style={styles.clearText}>Xóa tất cả</Text>
         </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Products Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsScroll}>
          {products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.imageContainer}>
                {product.primaryImageUrl ? (
                   <Image source={{ uri: product.primaryImageUrl }} style={styles.productImage} />
                ) : (
                   <View style={styles.placeholderImage}>
                     <MaterialCommunityIcons name="image-outline" size={32} color="#9ca3af" />
                   </View>
                )}
                <Pressable style={styles.removeButton} onPress={() => handleRemoveProduct(product.id)}>
                   <MaterialCommunityIcons name="close" size={16} color="white" />
                </Pressable>
              </View>

              <Text style={styles.productName} numberOfLines={2}>{product.title}</Text>
              <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>

              {product.categoryName && (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{product.categoryName}</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                <Pressable 
                  style={styles.detailButton} 
                  onPress={() => navigation.navigate('Detail', { listingId: product.id })} /* Assuming listingId based on detail structure */
                >
                  <Text style={styles.detailButtonText}>Chi tiết</Text>
                </Pressable>
                <Pressable 
                  style={styles.contactButton}
                  onPress={() => navigation.navigate('Chat')} 
                >
                  <MaterialCommunityIcons name="phone" size={14} color="white" />
                  <Text style={styles.contactButtonText}>Liên hệ</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Comparison Table */}
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Bảng so sánh chi tiết</Text>
          
          <View style={styles.specTable}>
             {comparisonItems.map((item, index) => (
               <View key={item.key} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                 <View style={styles.tableLabelContainer}>
                    <Text style={styles.tableLabel}>{item.label}</Text>
                 </View>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableValuesScroll}>
                   {products.map(product => (
                     <View key={`${product.id}-${item.key}`} style={styles.tableValueContainer}>
                       <Text style={styles.tableValue} numberOfLines={item.key === 'description' ? 5 : 2}>
                          {item.format ? item.format(product[item.key]) : (product[item.key] || '—')}
                       </Text>
                     </View>
                   ))}
                 </ScrollView>
               </View>
             ))}
          </View>
        </View>

        {/* Footer actions */}
        <View style={styles.footer}>
           <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
             <Text style={styles.primaryButtonText}>+ Thêm sản phẩm để so sánh</Text>
           </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  clearText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productsScroll: {
    padding: 16,
    gap: 16,
  },
  productCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginRight: 16,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    height: 40,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 8,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  categoryText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
  },
  detailButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  detailButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tableContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  specTable: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'column',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRowEven: {
    backgroundColor: '#fff',
  },
  tableRowOdd: {
    backgroundColor: '#f9fafb',
  },
  tableLabelContainer: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableLabel: {
    fontWeight: '600',
    color: '#374151',
    fontSize: 13,
  },
  tableValuesScroll: {
    flexDirection: 'row',
  },
  tableValueContainer: {
    width: 220,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    marginRight: 16,
  },
  tableValue: {
    fontSize: 13,
    color: '#1f2937',
  },
  footer: {
    padding: 16,
    paddingBottom: 40,
  }
});
