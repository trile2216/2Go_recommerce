import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import {
  getGhnProvinces,
  getGhnDistricts,
  getGhnWards,
  getGhnFee,
  createGhnShipping,
} from "../service/home/api.shipping";

const SERVICE_TYPES = [
  { value: 2, label: "Tiêu chuẩn (Standard)" },
  { value: 5, label: "Nhanh (Express)" },
];

const PAYMENT_TYPES = [
  { value: 1, label: "Người bán trả phí" },
  { value: 2, label: "Người mua trả phí" },
];

const REQUIRED_NOTES = [
  { value: "KHONGCHOXEMHANG", label: "Không cho xem hàng" },
  { value: "CHOXEMHANGKHONGTHU", label: "Cho xem hàng, không thử" },
  { value: "CHOTHUHANG", label: "Cho thử hàng" },
];

const formatPrice = (price) => {
  if (!price) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export default function CreateShippingModal({ visible, onClose, order, user, onSuccess }) {
  // --- Address data ---
  const [provinces, setProvinces] = useState([]);
  const [fromDistricts, setFromDistricts] = useState([]);
  const [fromWards, setFromWards] = useState([]);
  const [toDistricts, setToDistricts] = useState([]);
  const [toWards, setToWards] = useState([]);

  // --- Sender (Seller) ---
  const [fromName, setFromName] = useState(user?.profile?.fullName || "");
  const [fromPhone, setFromPhone] = useState(user?.phone || "");
  const [fromProvinceId, setFromProvinceId] = useState("");
  const [fromDistrictId, setFromDistrictId] = useState("");
  const [fromWardCode, setFromWardCode] = useState("");
  const [fromAddress, setFromAddress] = useState("");

  // --- Receiver (Buyer) ---
  const [toName, setToName] = useState(order?.buyerName || order?.buyerEmail || "");
  const [toPhone, setToPhone] = useState(order?.buyerPhone || "");
  const [toProvinceId, setToProvinceId] = useState("");
  const [toDistrictId, setToDistrictId] = useState("");
  const [toWardCode, setToWardCode] = useState("");
  const [toAddress, setToAddress] = useState(order?.deliveryAddress || "");

  // --- Package ---
  const [weight, setWeight] = useState("500");
  const [length, setLength] = useState("20");
  const [width, setWidth] = useState("15");
  const [height, setHeight] = useState("10");

  // --- Options ---
  const [serviceTypeId, setServiceTypeId] = useState(2);
  const [paymentTypeId, setPaymentTypeId] = useState(1);
  const [requiredNote, setRequiredNote] = useState("KHONGCHOXEMHANG");
  const [note, setNote] = useState("");

  // --- State ---
  const [fee, setFee] = useState(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    if (visible && provinces.length === 0) {
      getGhnProvinces().then(setProvinces).catch(console.error);
    }
  }, [visible]);

  // From: province -> districts
  useEffect(() => {
    if (!fromProvinceId) {
      setFromDistricts([]);
      setFromDistrictId("");
      return;
    }
    getGhnDistricts(Number(fromProvinceId)).then(setFromDistricts).catch(console.error);
    setFromDistrictId("");
    setFromWardCode("");
    setFromWards([]);
  }, [fromProvinceId]);

  // From: district -> wards
  useEffect(() => {
    if (!fromDistrictId) {
      setFromWards([]);
      setFromWardCode("");
      return;
    }
    getGhnWards(Number(fromDistrictId)).then(setFromWards).catch(console.error);
    setFromWardCode("");
  }, [fromDistrictId]);

  // To: province -> districts
  useEffect(() => {
    if (!toProvinceId) {
      setToDistricts([]);
      setToDistrictId("");
      return;
    }
    getGhnDistricts(Number(toProvinceId)).then(setToDistricts).catch(console.error);
    setToDistrictId("");
    setToWardCode("");
    setToWards([]);
  }, [toProvinceId]);

  // To: district -> wards
  useEffect(() => {
    if (!toDistrictId) {
      setToWards([]);
      setToWardCode("");
      return;
    }
    getGhnWards(Number(toDistrictId)).then(setToWards).catch(console.error);
    setToWardCode("");
  }, [toDistrictId]);

  // Reset fee when inputs change
  useEffect(() => {
    setFee(null);
  }, [
    fromDistrictId,
    fromWardCode,
    toDistrictId,
    toWardCode,
    weight,
    length,
    width,
    height,
    serviceTypeId,
  ]);

  const handleCalcFee = async () => {
    if (!fromDistrictId || !fromWardCode || !toDistrictId || !toWardCode) {
      Alert.alert("Lỗi", "Vui lòng chọn đầy đủ địa chỉ gửi và nhận trước khi tính phí");
      return;
    }
    try {
      setFeeLoading(true);
      const result = await getGhnFee({
        fromDistrictId: Number(fromDistrictId),
        fromWardCode,
        toDistrictId: Number(toDistrictId),
        toWardCode,
        weight: Number(weight),
        length: Number(length),
        width: Number(width),
        height: Number(height),
        serviceTypeId: Number(serviceTypeId),
        insuranceValue: order?.totalAmount || 0,
      });
      setFee(result);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tính phí vận chuyển");
      console.error(error);
    } finally {
      setFeeLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!fromDistrictId || !fromWardCode || !toDistrictId || !toWardCode) {
      Alert.alert("Lỗi", "Vui lòng chọn đầy đủ địa chỉ!");
      return;
    }
    if (!toName || !toPhone) {
      Alert.alert("Lỗi", "Vui lòng nhập tên và SĐT người nhận!");
      return;
    }

    try {
      setSubmitting(true);
      await createGhnShipping({
        orderId: order.orderId,
        toName,
        toPhone,
        toAddress: toAddress || "N/A",
        toWardCode,
        toDistrictId: Number(toDistrictId),
        weight: Number(weight),
        length: Number(length),
        width: Number(width),
        height: Number(height),
        serviceTypeId: Number(serviceTypeId),
        paymentTypeId: Number(paymentTypeId),
        requiredNote,
        note: note || null,
        items: [
          {
            name: order.listingTitle || `Order #${order.orderCode}`,
            quantity: 1,
            price: order.totalAmount || 0,
            weight: Number(weight),
          },
        ],
        fromName: fromName || null,
        fromPhone: fromPhone || null,
        fromAddress: fromAddress || null,
        fromWardCode: fromWardCode || null,
        fromDistrictId: fromDistrictId ? Number(fromDistrictId) : null,
      });
      Alert.alert("Thành công", "Đã tạo đơn vận chuyển GHN thành công!");
      onSuccess?.();
      onClose();
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message ||
          error.response?.data ||
          "Tạo đơn vận chuyển thất bại"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={24} color="#359EFF" />
              <Text style={styles.headerTitle}>Tạo đơn vận chuyển GHN</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Sender Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="map-marker-account" size={18} color="#111" />
                <Text style={styles.sectionTitle}>Địa chỉ người gửi (Bạn)</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroupParams_flex1}>
                  <Text style={styles.label}>Họ tên</Text>
                  <TextInput style={styles.input} value={fromName} onChangeText={setFromName} />
                </View>
                <View style={[styles.inputGroupParams_flex1, { marginLeft: 12 }]}>
                  <Text style={styles.label}>Số điện thoại</Text>
                  <TextInput style={styles.input} value={fromPhone} onChangeText={setFromPhone} keyboardType="phone-pad" />
                </View>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Tỉnh/Thành</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={fromProvinceId} onValueChange={setFromProvinceId}>
                    <Picker.Item label="-- Chọn --" value="" />
                    {provinces.map((p) => (
                      <Picker.Item key={p.provinceId} label={p.provinceName} value={p.provinceId} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroupParams_flex1}>
                  <Text style={styles.label}>Quận/Huyện</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker selectedValue={fromDistrictId} onValueChange={setFromDistrictId} enabled={!!fromProvinceId}>
                      <Picker.Item label="-- Chọn --" value="" />
                      {fromDistricts.map((d) => (
                        <Picker.Item key={d.districtId} label={d.districtName} value={d.districtId} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={[styles.inputGroupParams_flex1, { marginLeft: 12 }]}>
                  <Text style={styles.label}>Phường/Xã</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker selectedValue={fromWardCode} onValueChange={setFromWardCode} enabled={!!fromDistrictId}>
                      <Picker.Item label="-- Chọn --" value="" />
                      {fromWards.map((w) => (
                        <Picker.Item key={w.wardCode} label={w.wardName} value={w.wardCode} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Địa chỉ chi tiết</Text>
                <TextInput style={styles.input} value={fromAddress} onChangeText={setFromAddress} placeholder="Số nhà, tên đường..." />
              </View>
            </View>

            {/* Receiver Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account-arrow-right-outline" size={18} color="#111" />
                <Text style={styles.sectionTitle}>Địa chỉ người nhận</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroupParams_flex1}>
                  <Text style={styles.label}>Họ tên</Text>
                  <TextInput style={styles.input} value={toName} onChangeText={setToName} />
                </View>
                <View style={[styles.inputGroupParams_flex1, { marginLeft: 12 }]}>
                  <Text style={styles.label}>Số điện thoại</Text>
                  <TextInput style={styles.input} value={toPhone} onChangeText={setToPhone} keyboardType="phone-pad" />
                </View>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Tỉnh/Thành</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={toProvinceId} onValueChange={setToProvinceId}>
                    <Picker.Item label="-- Chọn --" value="" />
                    {provinces.map((p) => (
                      <Picker.Item key={p.provinceId} label={p.provinceName} value={p.provinceId} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroupParams_flex1}>
                  <Text style={styles.label}>Quận/Huyện</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker selectedValue={toDistrictId} onValueChange={setToDistrictId} enabled={!!toProvinceId}>
                      <Picker.Item label="-- Chọn --" value="" />
                      {toDistricts.map((d) => (
                        <Picker.Item key={d.districtId} label={d.districtName} value={d.districtId} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={[styles.inputGroupParams_flex1, { marginLeft: 12 }]}>
                  <Text style={styles.label}>Phường/Xã</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker selectedValue={toWardCode} onValueChange={setToWardCode} enabled={!!toDistrictId}>
                      <Picker.Item label="-- Chọn --" value="" />
                      {toWards.map((w) => (
                        <Picker.Item key={w.wardCode} label={w.wardName} value={w.wardCode} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Địa chỉ chi tiết</Text>
                <TextInput style={styles.input} value={toAddress} onChangeText={setToAddress} placeholder="Số nhà, tên đường..." />
              </View>
            </View>

            {/* Package Details */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="package-variant-closed" size={18} color="#111" />
                <Text style={styles.sectionTitle}>Thông tin gói hàng</Text>
              </View>
              
              <View style={styles.row}>
                 <View style={styles.inputGroupParams_flex1}>
                    <Text style={styles.label}>Nặng (g)</Text>
                    <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
                 </View>
                 <View style={[styles.inputGroupParams_flex1, { marginLeft: 12 }]}>
                    <Text style={styles.label}>Dài (cm)</Text>
                    <TextInput style={styles.input} value={length} onChangeText={setLength} keyboardType="numeric" />
                 </View>
              </View>
              <View style={[styles.row, { marginTop: 12 }]}>
                 <View style={styles.inputGroupParams_flex1}>
                    <Text style={styles.label}>Rộng (cm)</Text>
                    <TextInput style={styles.input} value={width} onChangeText={setWidth} keyboardType="numeric" />
                 </View>
                 <View style={[styles.inputGroupParams_flex1, { marginLeft: 12 }]}>
                    <Text style={styles.label}>Cao (cm)</Text>
                    <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" />
                 </View>
              </View>

              <View style={[styles.pickerContainer, { marginTop: 12 }]}>
                 <Text style={styles.label}>Dịch vụ</Text>
                 <View style={styles.pickerWrapper}>
                    <Picker selectedValue={serviceTypeId} onValueChange={setServiceTypeId}>
                      {SERVICE_TYPES.map((s) => (
                        <Picker.Item key={s.value} label={s.label} value={s.value} />
                      ))}
                    </Picker>
                 </View>
              </View>

              <View style={styles.pickerContainer}>
                 <Text style={styles.label}>Thanh toán phí</Text>
                 <View style={styles.pickerWrapper}>
                    <Picker selectedValue={paymentTypeId} onValueChange={setPaymentTypeId}>
                      {PAYMENT_TYPES.map((p) => (
                        <Picker.Item key={p.value} label={p.label} value={p.value} />
                      ))}
                    </Picker>
                 </View>
              </View>

              <View style={styles.pickerContainer}>
                 <Text style={styles.label}>Ghi chú bắt buộc</Text>
                 <View style={styles.pickerWrapper}>
                    <Picker selectedValue={requiredNote} onValueChange={setRequiredNote}>
                      {REQUIRED_NOTES.map((n) => (
                        <Picker.Item key={n.value} label={n.label} value={n.value} />
                      ))}
                    </Picker>
                 </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ghi chú thêm</Text>
                <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="Ghi chú cho shipper (tuỳ chọn)" />
              </View>
            </View>

            {/* Fee Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="calculator" size={18} color="#111" />
                <Text style={styles.sectionTitle}>Phí vận chuyển</Text>
              </View>
              
              <Pressable style={styles.calcButton} onPress={handleCalcFee} disabled={feeLoading}>
                {feeLoading ? (
                  <ActivityIndicator size="small" color="#359EFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="calculator-variant-outline" size={20} color="#359EFF" />
                    <Text style={styles.calcButtonText}>Tính phí vận chuyển</Text>
                  </>
                )}
              </Pressable>

              {fee && (
                 <View style={styles.feeResultBox}>
                    <View style={styles.feeRow}>
                       <Text style={styles.feeLabel}>Phí dịch vụ</Text>
                       <Text style={styles.feeValue}>{formatPrice(fee.serviceFee)}</Text>
                    </View>
                    <View style={styles.feeRow}>
                       <Text style={styles.feeLabel}>Phí bảo hiểm</Text>
                       <Text style={styles.feeValue}>{formatPrice(fee.insuranceFee)}</Text>
                    </View>
                    <View style={styles.feeRow}>
                       <Text style={styles.feeLabel}>Phí lấy hàng</Text>
                       <Text style={styles.feeValue}>{formatPrice(fee.pickStationFee)}</Text>
                    </View>
                    {fee.couponValue > 0 && (
                      <View style={styles.feeRow}>
                         <Text style={styles.feeLabel}>Giảm giá</Text>
                         <Text style={[styles.feeValue, { color: '#ef4444' }]}>-{formatPrice(fee.couponValue)}</Text>
                      </View>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.feeRow}>
                       <Text style={styles.feeTotalLabel}>Tổng phí</Text>
                       <Text style={styles.feeTotalValue}>{formatPrice(fee.total)}</Text>
                    </View>
                 </View>
              )}
            </View>
            
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.cancelButton} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </Pressable>
            <Pressable style={[styles.submitButton, submitting && styles.disabledButton]} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                 <ActivityIndicator size="small" color="#fff" />
              ) : (
                 <>
                   <MaterialCommunityIcons name="check" size={20} color="#fff" />
                   <Text style={styles.submitButtonText}>Tạo đơn</Text>
                 </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#f5f7f8",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  closeButton: {
    padding: 4,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  row: {
    flexDirection: "row",
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputGroupParams_flex1: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111",
    backgroundColor: "#fff",
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  calcButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#359EFF",
    borderRadius: 8,
    backgroundColor: "#eff6ff",
    gap: 8,
    marginBottom: 16,
  },
  calcButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#359EFF",
  },
  feeResultBox: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  feeValue: {
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
  feeTotalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  feeTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#359EFF",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4b5563",
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#359EFF",
    borderRadius: 10,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.6,
  }
});
