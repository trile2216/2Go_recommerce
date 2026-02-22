import { useState, useEffect, useCallback } from "react";
import { X, Truck, MapPin, Package, Calculator, User } from "lucide-react";
import {
  getGhnProvinces,
  getGhnDistricts,
  getGhnWards,
  getGhnFee,
  createGhnShipping,
} from "../service/home/api.shipping";
import { formatPrice } from "../utils/utils";
import "./CreateShippingModal.css";

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
  { value: "CHOXEMHANGKHONGTHU", label: "Cho xem hàng, không cho thử" },
  { value: "CHOTHUHANG", label: "Cho thử hàng" },
];

export default function CreateShippingModal({ order, user, onClose, onSuccess, toast }) {
  // --- Address data ---
  const [provinces, setProvinces] = useState([]);
  const [fromDistricts, setFromDistricts] = useState([]);
  const [fromWards, setFromWards] = useState([]);
  const [toDistricts, setToDistricts] = useState([]);
  const [toWards, setToWards] = useState([]);

  // --- Sender (Seller) ---
  const [fromName, setFromName] = useState(user.profile.fullName || "");
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
  const [weight, setWeight] = useState(500);
  const [length, setLength] = useState(20);
  const [width, setWidth] = useState(15);
  const [height, setHeight] = useState(10);

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
    getGhnProvinces().then(setProvinces).catch(console.error);
  }, []);

  // From: province -> districts
  useEffect(() => {
    if (!fromProvinceId) { setFromDistricts([]); setFromDistrictId(""); return; }
    getGhnDistricts(Number(fromProvinceId)).then(setFromDistricts).catch(console.error);
    setFromDistrictId("");
    setFromWardCode("");
    setFromWards([]);
  }, [fromProvinceId]);

  // From: district -> wards
  useEffect(() => {
    if (!fromDistrictId) { setFromWards([]); setFromWardCode(""); return; }
    getGhnWards(Number(fromDistrictId)).then(setFromWards).catch(console.error);
    setFromWardCode("");
  }, [fromDistrictId]);

  // To: province -> districts
  useEffect(() => {
    if (!toProvinceId) { setToDistricts([]); setToDistrictId(""); return; }
    getGhnDistricts(Number(toProvinceId)).then(setToDistricts).catch(console.error);
    setToDistrictId("");
    setToWardCode("");
    setToWards([]);
  }, [toProvinceId]);

  // To: district -> wards
  useEffect(() => {
    if (!toDistrictId) { setToWards([]); setToWardCode(""); return; }
    getGhnWards(Number(toDistrictId)).then(setToWards).catch(console.error);
    setToWardCode("");
  }, [toDistrictId]);

  // Reset fee when inputs change
  useEffect(() => {
    setFee(null);
  }, [fromDistrictId, fromWardCode, toDistrictId, toWardCode, weight, length, width, height, serviceTypeId]);

  // Calculate fee
  const handleCalcFee = async () => {
    if (!fromDistrictId || !fromWardCode || !toDistrictId || !toWardCode) {
      toast.error("Vui lòng chọn đầy đủ địa chỉ gửi và nhận trước khi tính phí");
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
        insuranceValue: order?.totalAmount.toFixed(0) || 0,
      });
      setFee(result);
    } catch (error) {
      toast.error("Không thể tính phí vận chuyển");
      console.error(error);
    } finally {
      setFeeLoading(false);
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!fromDistrictId || !fromWardCode || !toDistrictId || !toWardCode) {
      toast.error("Vui lòng chọn đầy đủ địa chỉ");
      return;
    }
    if (!toName || !toPhone) {
      toast.error("Vui lòng nhập tên và SĐT người nhận");
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
            price: order.totalAmount.toFixed(0) || 0,
            weight: Number(weight),
          },
        ],
        fromName: fromName || null,
        fromPhone: fromPhone || null,
        fromAddress: fromAddress || null,
        fromWardCode: fromWardCode || null,
        fromDistrictId: fromDistrictId ? Number(fromDistrictId) : null,
      });
      toast.success("Đã tạo đơn vận chuyển GHN thành công!");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data || "Tạo đơn vận chuyển thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shipping-modal-overlay" onClick={onClose}>
      <div className="shipping-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sm-header">
          <h3><Truck size={20} /> Tạo đơn vận chuyển GHN</h3>
          <button className="sm-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="sm-body">
          {/* === SENDER === */}
          <div className="sm-section">
            <h4 className="sm-section-title"><MapPin size={16} /> Địa chỉ người gửi (Bạn)</h4>
            <div className="sm-form-row">
              <div className="sm-form-group">
                <label className="sm-label">Họ tên</label>
                <input className="sm-input" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Tên người gửi" />
              </div>
              <div className="sm-form-group">
                <label className="sm-label">Số điện thoại</label>
                <input className="sm-input" value={fromPhone} onChange={(e) => setFromPhone(e.target.value)} placeholder="SĐT người gửi" />
              </div>
            </div>
            <div className="sm-form-row-3">
              <div className="sm-form-group">
                <label className="sm-label">Tỉnh/Thành</label>
                <select className="sm-select" value={fromProvinceId} onChange={(e) => setFromProvinceId(e.target.value)}>
                  <option value="">-- Chọn --</option>
                  {provinces.map((p) => (
                    <option key={p.provinceId} value={p.provinceId}>{p.provinceName}</option>
                  ))}
                </select>
              </div>
              <div className="sm-form-group">
                <label className="sm-label">Quận/Huyện</label>
                <select className="sm-select" value={fromDistrictId} onChange={(e) => setFromDistrictId(e.target.value)} disabled={!fromProvinceId}>
                  <option value="">-- Chọn --</option>
                  {fromDistricts.map((d) => (
                    <option key={d.districtId} value={d.districtId}>{d.districtName}</option>
                  ))}
                </select>
              </div>
              <div className="sm-form-group">
                <label className="sm-label">Phường/Xã</label>
                <select className="sm-select" value={fromWardCode} onChange={(e) => setFromWardCode(e.target.value)} disabled={!fromDistrictId}>
                  <option value="">-- Chọn --</option>
                  {fromWards.map((w) => (
                    <option key={w.wardCode} value={w.wardCode}>{w.wardName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sm-form-group full-width">
              <label className="sm-label">Địa chỉ chi tiết</label>
              <input className="sm-input" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} placeholder="Số nhà, tên đường..." />
            </div>
          </div>

          {/* === RECEIVER === */}
          <div className="sm-section">
            <h4 className="sm-section-title"><User size={16} /> Địa chỉ người nhận</h4>
            <div className="sm-form-row">
              <div className="sm-form-group">
                <label className="sm-label">Họ tên</label>
                <input className="sm-input" value={toName} onChange={(e) => setToName(e.target.value)} placeholder="Tên người nhận" />
              </div>
              <div className="sm-form-group">
                <label className="sm-label">Số điện thoại</label>
                <input className="sm-input" value={toPhone} onChange={(e) => setToPhone(e.target.value)} placeholder="SĐT người nhận" />
              </div>
            </div>
            <div className="sm-form-row-3">
              <div className="sm-form-group">
                <label className="sm-label">Tỉnh/Thành</label>
                <select className="sm-select" value={toProvinceId} onChange={(e) => setToProvinceId(e.target.value)}>
                  <option value="">-- Chọn --</option>
                  {provinces.map((p) => (
                    <option key={p.provinceId} value={p.provinceId}>{p.provinceName}</option>
                  ))}
                </select>
              </div>
              <div className="sm-form-group">
                <label className="sm-label">Quận/Huyện</label>
                <select className="sm-select" value={toDistrictId} onChange={(e) => setToDistrictId(e.target.value)} disabled={!toProvinceId}>
                  <option value="">-- Chọn --</option>
                  {toDistricts.map((d) => (
                    <option key={d.districtId} value={d.districtId}>{d.districtName}</option>
                  ))}
                </select>
              </div>
              <div className="sm-form-group">
                <label className="sm-label">Phường/Xã</label>
                <select className="sm-select" value={toWardCode} onChange={(e) => setToWardCode(e.target.value)} disabled={!toDistrictId}>
                  <option value="">-- Chọn --</option>
                  {toWards.map((w) => (
                    <option key={w.wardCode} value={w.wardCode}>{w.wardName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sm-form-group full-width">
              <label className="sm-label">Địa chỉ chi tiết</label>
              <input className="sm-input" value={toAddress} onChange={(e) => setToAddress(e.target.value)} placeholder="Số nhà, tên đường..." />
            </div>
          </div>

          {/* === PACKAGE === */}
          <div className="sm-section">
            <h4 className="sm-section-title"><Package size={16} /> Thông tin gói hàng</h4>
            <div className="sm-form-row-4">
              <div className="sm-form-group">
                <label className="sm-label">Cân nặng (g)</label>
                <input className="sm-input" type="number" min="1" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div className="sm-form-group">
                <label className="sm-label">Dài (cm)</label>
                <input className="sm-input" type="number" min="1" value={length} onChange={(e) => setLength(e.target.value)} />
              </div>
              <div className="sm-form-group">
                <label className="sm-label">Rộng (cm)</label>
                <input className="sm-input" type="number" min="1" value={width} onChange={(e) => setWidth(e.target.value)} />
              </div>
              <div className="sm-form-group">
                <label className="sm-label">Cao (cm)</label>
                <input className="sm-input" type="number" min="1" value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
            </div>
            <div className="sm-form-row-3">
              <div className="sm-form-group">
                <label className="sm-label">Dịch vụ</label>
                <select className="sm-select" value={serviceTypeId} onChange={(e) => setServiceTypeId(e.target.value)}>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm-form-group">
                <label className="sm-label">Thanh toán phí</label>
                <select className="sm-select" value={paymentTypeId} onChange={(e) => setPaymentTypeId(e.target.value)}>
                  {PAYMENT_TYPES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm-form-group">
                <label className="sm-label">Ghi chú bắt buộc</label>
                <select className="sm-select" value={requiredNote} onChange={(e) => setRequiredNote(e.target.value)}>
                  {REQUIRED_NOTES.map((n) => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sm-form-group full-width">
              <label className="sm-label">Ghi chú thêm</label>
              <input className="sm-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú cho đơn vị vận chuyển (tuỳ chọn)" />
            </div>
          </div>

          {/* === FEE === */}
          <div className="sm-section">
            <h4 className="sm-section-title"><Calculator size={16} /> Phí vận chuyển</h4>
            <button className="sm-btn sm-btn-outline" onClick={handleCalcFee} disabled={feeLoading} style={{ width: "100%" }}>
              <Calculator size={16} />
              {feeLoading ? "Đang tính..." : "Tính phí vận chuyển"}
            </button>
            {fee && (
              <div className="sm-fee-result">
                <div className="sm-fee-row">
                  <span className="sm-fee-label">Phí dịch vụ</span>
                  <span className="sm-fee-value">{formatPrice(fee.serviceFee)}</span>
                </div>
                <div className="sm-fee-row">
                  <span className="sm-fee-label">Phí bảo hiểm</span>
                  <span className="sm-fee-value">{formatPrice(fee.insuranceFee)}</span>
                </div>
                <div className="sm-fee-row">
                  <span className="sm-fee-label">Phí lấy hàng</span>
                  <span className="sm-fee-value">{formatPrice(fee.pickStationFee)}</span>
                </div>
                {fee.couponValue > 0 && (
                  <div className="sm-fee-row">
                    <span className="sm-fee-label">Giảm giá</span>
                    <span className="sm-fee-value">-{formatPrice(fee.couponValue)}</span>
                  </div>
                )}
                <div className="sm-fee-row total">
                  <span>Tổng phí</span>
                  <span>{formatPrice(fee.total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sm-footer">
          <button className="sm-btn sm-btn-secondary" onClick={onClose} disabled={submitting}>
            Hủy
          </button>
          <button className="sm-btn sm-btn-success" onClick={handleSubmit} disabled={submitting}>
            <Truck size={16} />
            {submitting ? "Đang tạo..." : "Tạo đơn vận chuyển"}
          </button>
        </div>
      </div>
    </div>
  );
}
