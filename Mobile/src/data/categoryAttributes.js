/**
 * Cấu hình thuộc tính động theo từng category.
 * - brandConfig: label + placeholder cho field "Hãng" (maps to `brand` in BE)
 * - attributes: danh sách fields động (maps to `attributes[]` in BE)
 *
 * Nếu category không có trong map → dùng DEFAULT config.
 */

const DEFAULT_BRAND = { label: "Hãng / Thương hiệu", placeholder: "VD: Tên thương hiệu sản phẩm..." };

export const DEFAULT_ATTRIBUTES = [
    { name: "Màu sắc", label: "Màu sắc", placeholder: "VD: Đen, Trắng, Xanh..." },
    { name: "Tình trạng chi tiết", label: "Tình trạng chi tiết", placeholder: "VD: Mới 99%, Còn bảo hành..." },
    { name: "Xuất xứ", label: "Xuất xứ", placeholder: "VD: Việt Nam, Nhật Bản..." },
];

/**
 * Map categoryId → { brandConfig, attributes }
 */
const CATEGORY_CONFIG = {
    // Âm thanh (Tai nghe, Loa, Soundbar)
    2: {
        brand: { label: "Hãng", placeholder: "VD: Sony, JBL, Bose, Marshall..." },
        attributes: [
            { name: "Loại kết nối", label: "Loại kết nối", placeholder: "VD: Bluetooth 5.0, Có dây, USB-C..." },
            { name: "Thời lượng pin", label: "Thời lượng pin", placeholder: "VD: 8 giờ, 20 giờ..." },
            { name: "Màu sắc", label: "Màu sắc", placeholder: "VD: Đen, Trắng..." },
            { name: "Bảo hành", label: "Bảo hành", placeholder: "VD: 6 tháng, Hết bảo hành..." },
        ],
    },

    // Automotive (Phụ kiện xe, linh kiện)
    13: {
        brand: { label: "Hãng sản xuất", placeholder: "VD: Bosch, Denso, OEM..." },
        attributes: [
            { name: "Loại xe tương thích", label: "Loại xe tương thích", placeholder: "VD: Honda Wave, Toyota Vios..." },
            { name: "Tình trạng chi tiết", label: "Tình trạng chi tiết", placeholder: "VD: Mới 100%, Đã qua sử dụng..." },
            { name: "Xuất xứ", label: "Xuất xứ", placeholder: "VD: Nhật Bản, Đài Loan..." },
        ],
    },

    // Baby & Kids
    14: {
        brand: { label: "Thương hiệu", placeholder: "VD: Combi, Chicco, Johnson's..." },
        attributes: [
            { name: "Độ tuổi phù hợp", label: "Độ tuổi phù hợp", placeholder: "VD: 0-3 tháng, 1-3 tuổi..." },
            { name: "Chất liệu", label: "Chất liệu", placeholder: "VD: Cotton, Nhựa an toàn..." },
            { name: "Kích cỡ", label: "Kích cỡ", placeholder: "VD: Size S, 80cm..." },
        ],
    },

    // Beauty & Personal Care
    12: {
        brand: { label: "Thương hiệu", placeholder: "VD: L'Oréal, Innisfree, The Ordinary..." },
        attributes: [
            { name: "Dung tích", label: "Dung tích / Khối lượng", placeholder: "VD: 50ml, 100g..." },
            { name: "Hạn sử dụng", label: "Hạn sử dụng", placeholder: "VD: 12/2026, Còn 6 tháng..." },
            { name: "Loại da phù hợp", label: "Loại da phù hợp", placeholder: "VD: Da dầu, Da nhạy cảm, Mọi loại da..." },
        ],
    },

    // Books & Media
    10: {
        brand: { label: "Nhà xuất bản / Hãng", placeholder: "VD: NXB Kim Đồng, Universal..." },
        attributes: [
            { name: "Tác giả", label: "Tác giả / Nghệ sĩ", placeholder: "VD: Nguyễn Nhật Ánh, BTS..." },
            { name: "Ngôn ngữ", label: "Ngôn ngữ", placeholder: "VD: Tiếng Việt, Tiếng Anh..." },
            { name: "Năm xuất bản", label: "Năm xuất bản", placeholder: "VD: 2023, 2020..." },
        ],
    },

    // Electronics (categoryId: 1)
    1: {
        brand: { label: "Hãng", placeholder: "VD: Apple, Samsung, Xiaomi..." },
        attributes: [
            { name: "Màu sắc", label: "Màu sắc", placeholder: "VD: Đen, Trắng, Xanh..." },
            { name: "Dung lượng", label: "Dung lượng", placeholder: "VD: 128GB, 256GB..." },
            { name: "Bảo hành", label: "Bảo hành", placeholder: "VD: 12 tháng, Hết bảo hành..." },
            { name: "Xuất xứ", label: "Xuất xứ", placeholder: "VD: Việt Nam, Trung Quốc..." },
        ],
    },

    // Electronics (categoryId: 6)
    6: {
        brand: { label: "Hãng", placeholder: "VD: Apple, Samsung, Dell, Asus..." },
        attributes: [
            { name: "Màu sắc", label: "Màu sắc", placeholder: "VD: Đen, Trắng, Bạc..." },
            { name: "Dung lượng", label: "Dung lượng / RAM", placeholder: "VD: 128GB, 8GB RAM..." },
            { name: "Bảo hành", label: "Bảo hành", placeholder: "VD: 12 tháng, Hết bảo hành..." },
            { name: "Xuất xứ", label: "Xuất xứ", placeholder: "VD: Việt Nam, Trung Quốc..." },
        ],
    },

    // Fashion & Clothing
    7: {
        brand: { label: "Thương hiệu", placeholder: "VD: Zara, Uniqlo, Nike, Adidas..." },
        attributes: [
            { name: "Kích cỡ", label: "Kích cỡ", placeholder: "VD: S, M, L, XL, 39, 42..." },
            { name: "Chất liệu", label: "Chất liệu", placeholder: "VD: Cotton, Polyester, Da thật..." },
            { name: "Màu sắc", label: "Màu sắc", placeholder: "VD: Đen, Trắng, Nâu..." },
        ],
    },

    // Home & Living
    8: {
        brand: { label: "Thương hiệu", placeholder: "VD: IKEA, Hòa Phát, Đại Việt..." },
        attributes: [
            { name: "Chất liệu", label: "Chất liệu", placeholder: "VD: Gỗ tự nhiên, Inox, Nhựa..." },
            { name: "Kích thước", label: "Kích thước", placeholder: "VD: 120x60x75cm, 1m8..." },
            { name: "Màu sắc", label: "Màu sắc", placeholder: "VD: Trắng, Nâu gỗ..." },
        ],
    },

    // Máy tính bảng
    3: {
        brand: { label: "Hãng", placeholder: "VD: Apple, Samsung, Huawei..." },
        attributes: [
            { name: "Dung lượng", label: "Dung lượng", placeholder: "VD: 64GB, 128GB, 256GB..." },
            { name: "Màu sắc", label: "Màu sắc", placeholder: "VD: Xám, Bạc, Xanh..." },
            { name: "Bảo hành", label: "Bảo hành", placeholder: "VD: 12 tháng, Hết bảo hành..." },
            { name: "Phụ kiện đi kèm", label: "Phụ kiện đi kèm", placeholder: "VD: Bút cảm ứng, Bàn phím, Ốp lưng..." },
        ],
    },

    // Musical Instruments
    15: {
        brand: { label: "Thương hiệu", placeholder: "VD: Yamaha, Fender, Roland..." },
        attributes: [
            { name: "Loại nhạc cụ", label: "Loại nhạc cụ", placeholder: "VD: Guitar acoustic, Piano điện..." },
            { name: "Chất liệu", label: "Chất liệu", placeholder: "VD: Gỗ mahogany, Gỗ thông..." },
            { name: "Phụ kiện đi kèm", label: "Phụ kiện đi kèm", placeholder: "VD: Bao đàn, Dây thay, Tuner..." },
        ],
    },

    // Sports & Outdoors
    9: {
        brand: { label: "Thương hiệu", placeholder: "VD: Nike, Adidas, Giant, Decathlon..." },
        attributes: [
            { name: "Kích cỡ", label: "Kích cỡ", placeholder: "VD: S, M, L, 26 inch..." },
            { name: "Chất liệu", label: "Chất liệu", placeholder: "VD: Carbon, Nhôm, Vải chống nước..." },
            { name: "Tình trạng chi tiết", label: "Tình trạng chi tiết", placeholder: "VD: Mới 95%, Ít sử dụng..." },
        ],
    },

    // Toys & Games
    11: {
        brand: { label: "Thương hiệu", placeholder: "VD: LEGO, Hasbro, Nintendo..." },
        attributes: [
            { name: "Độ tuổi phù hợp", label: "Độ tuổi phù hợp", placeholder: "VD: 3+, 6-12 tuổi..." },
            { name: "Tình trạng chi tiết", label: "Tình trạng chi tiết", placeholder: "VD: Còn đầy đủ hộp, Thiếu phụ kiện..." },
            { name: "Số người chơi", label: "Số người chơi", placeholder: "VD: 1 người, 2-4 người..." },
        ],
    },
};

/**
 * Lấy config brand cho một categoryId.
 */
export function getBrandForCategory(categoryId) {
    if (!categoryId) return DEFAULT_BRAND;
    return CATEGORY_CONFIG[categoryId]?.brand || DEFAULT_BRAND;
}

/**
 * Lấy danh sách thuộc tính cho một categoryId.
 */
export function getAttributesForCategory(categoryId) {
    if (!categoryId) return DEFAULT_ATTRIBUTES;
    return CATEGORY_CONFIG[categoryId]?.attributes || DEFAULT_ATTRIBUTES;
}

export default CATEGORY_CONFIG;
