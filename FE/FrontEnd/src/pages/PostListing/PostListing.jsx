import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Form,
    Input,
    Button,
    Select,
    Upload,
    Modal,
    Checkbox,
    Card,
    Row,
    Col,
    message,
    Typography,
    Image,
} from "antd";
import {
    Upload as UploadIcon,
    Video,
    ChevronRight,
    MapPin,
    Check,
    X,
    Star,
} from "lucide-react";
import "./PostListing.css";
import Header from "../../components/Header";
import { uploadImageAndGetUrl, uploadVideoAndGetUrl } from "../../service/upload/api.upload";
import { createListing } from "../../service/home/api.sellerListing";
import { fetchAllCategories, fetchSubCategoriesByCategoryId } from "../../service/home/api.category";
import { fetchAllDistricts, fetchAllWards } from "../../service/home/api.ward";
import { listingPrecheck } from "../../service/ai/api.analyze";
import useAuth from "../../hooks/useAuth";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function PostListing() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { user } = useAuth();

    // Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [expandedCategoryId, setExpandedCategoryId] = useState(null);

    // Upload State
    const [imageList, setImageList] = useState([]); // [{ uid, file, preview, isPrimary }]
    const [videoList, setVideoList] = useState([]); // [{ uid, file, preview }]
    const [isFree, setIsFree] = useState(false);

    // Categories State
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // Districts & Wards State
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedWard, setSelectedWard] = useState(null);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);

    useEffect(() => {
        // Fetch categories from API
        const loadCategories = async () => {
            setLoadingCategories(true);
            try {
                const data = await fetchAllCategories();
                
                // Transform API response to include subcategories
                const categoriesWithSubs = await Promise.all(
                    data.items.map(async (category) => {
                        try {
                            const subData = await fetchSubCategoriesByCategoryId(category.categoryId);
                            return {
                                id: category.categoryId,
                                name: category.name,
                                subcategories: subData.items.map(sub => ({
                                    id: sub.subCategoryId,
                                    name: sub.name
                                })) || []
                            };
                        } catch (err) {
                            console.error(`Error fetching subcategories for ${category.categoryId}:`, err);
                            return {
                                id: category.categoryId,
                                name: category.name,
                                subcategories: []
                            };
                        }
                    })
                );
                
                setCategories(categoriesWithSubs);
            } catch (error) {
                console.error('Error loading categories:', error);
                message.error('Không thể tải danh mục. Vui lòng thử lại!');
            } finally {
                setLoadingCategories(false);
            }
        };

        loadCategories();
        // Show modal on mount if no category selected
        if (!selectedCategory || !selectedSubcategory) {
            setIsCategoryModalOpen(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch districts on component mount
    useEffect(() => {
        const loadDistricts = async () => {
            setLoadingDistricts(true);
            try {
                const data = await fetchAllDistricts();
                const districtsList = data.items.map(district => ({
                    value: district.districtId,
                    label: district.name,
                    cityName: district.cityName
                }));
                setDistricts(districtsList);
            } catch (error) {
                console.error('Error loading districts:', error);
                message.error('Không thể tải quận/huyện. Vui lòng thử lại!');
            } finally {
                setLoadingDistricts(false);
            }
        };
        loadDistricts();
    }, []);

    // Fetch wards when district is selected
    useEffect(() => {
        if (selectedDistrict) {
            const loadWards = async () => {
                setLoadingWards(true);
                try {
                    const data = await fetchAllWards();
                    // Filter wards by selected district
                    const wardsList = data.items
                        .filter(ward => ward.districtId === selectedDistrict)
                        .map(ward => ({
                            value: ward.wardId,
                            label: ward.name,
                            districtName: ward.districtName
                        }));
                    setWards(wardsList);
                    setSelectedWard(null); // Reset selected ward
                } catch (error) {
                    console.error('Error loading wards:', error);
                    message.error('Không thể tải phường/xã. Vui lòng thử lại!');
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

    const handleCategorySelect = (category) => {
        if (expandedCategoryId === category.id) {
            setExpandedCategoryId(null);
        } else {
            setExpandedCategoryId(category.id);
        }
    };

    const handleSubcategorySelect = (category, subcategory) => {
        setSelectedCategory(category);
        setSelectedSubcategory(subcategory);
        setIsCategoryModalOpen(false);
        form.setFieldsValue({
            category: `${category.name} - ${subcategory.name}`
        });
    };

    // --- Image handlers ---
    const handleImageUpload = useCallback((e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const remainingSlots = 6 - imageList.length;
        if (remainingSlots <= 0) {
            message.warning('Tối đa 6 ảnh!');
            return;
        }

        const filesToAdd = files.slice(0, remainingSlots);
        const newImages = filesToAdd.map((file) => ({
            uid: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview: URL.createObjectURL(file),
            isPrimary: false,
        }));

        setImageList((prev) => {
            const updated = [...prev, ...newImages];
            // If no primary yet, set the first image as primary
            if (!updated.some((img) => img.isPrimary) && updated.length > 0) {
                updated[0].isPrimary = true;
            }
            return updated;
        });

        // Reset input
        e.target.value = '';
    }, [imageList]);

    const handleRemoveImage = useCallback((uid) => {
        setImageList((prev) => {
            const updated = prev.filter((img) => img.uid !== uid);
            // If the removed image was primary, auto-set first remaining as primary
            if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
                updated[0].isPrimary = true;
            }
            return updated;
        });
    }, []);

    const handleSetPrimary = useCallback((uid) => {
        setImageList((prev) =>
            prev.map((img) => ({
                ...img,
                isPrimary: img.uid === uid,
            }))
        );
    }, []);

    // --- Video handlers ---
    const handleVideoUpload = useCallback((e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const remainingSlots = 1 - videoList.length;
        if (remainingSlots <= 0) {
            message.warning('Tối đa 1 video!');
            return;
        }

        const file = files[0];
        if (file.size > 50 * 1024 * 1024) {
            message.error('Video không được vượt quá 50MB!');
            return;
        }

        setVideoList([{
            uid: `vid-${Date.now()}`,
            file,
            preview: URL.createObjectURL(file),
        }]);

        e.target.value = '';
    }, [videoList]);

    const handleRemoveVideo = useCallback((uid) => {
        setVideoList((prev) => prev.filter((v) => v.uid !== uid));
    }, []);


    const onFinish = async (values) => {
        // Validation: at least 1 image required
        if (imageList.length === 0) {
            message.error("Vui lòng tải lên ít nhất 1 hình ảnh!");
            return;
        }

        // Validation: exactly 1 primary image
        const primaryCount = imageList.filter((img) => img.isPrimary).length;
        if (primaryCount !== 1) {
            message.error("Phải có đúng 1 ảnh bìa!");
            return;
        }

        if (!selectedSubcategory) {
            message.error("Vui lòng chọn danh mục sản phẩm!");
            return;
        }

        // Show loading message
        const hideLoadingMsg = message.loading("Đang xử lý tin đăng của bạn...", 0);

        try {
            // Upload images
            const imageFiles = imageList.map((img) => img.file).filter(Boolean);
            const imageUrls = await uploadImageAndGetUrl(imageFiles);
            const imageUrlArr = Array.isArray(imageUrls) ? imageUrls : [imageUrls];

            // Build media array for images
            const mediaData = imageUrlArr.map((url, index) => ({
                url,
                mediaType: "IMAGE",
                isPrimary: imageList[index]?.isPrimary || false,
                sortOrder: index,
            }));

            // Upload video if present
            let videoUrl = null;
            if (videoList.length > 0) {
                const videoFile = videoList[0].file;
                if (videoFile) {
                    videoUrl = await uploadVideoAndGetUrl(videoFile);
                    mediaData.push({
                        url: videoUrl,
                        mediaType: "VIDEO",
                        isPrimary: false, // isPrimary never true for video
                        sortOrder: mediaData.length,
                    });
                }
            }

            // Collect all media URLs for precheck
            const allMediaUrls = [...imageUrlArr];
            if (videoUrl) allMediaUrls.push(videoUrl);

            // Call precheck API before creating listing
            const precheckData = {
                title: values.title,
                description: values.description,
                categoryId: selectedCategory?.id || 0,
                brand: values.brand || "",
                price: values.isFree ? 0 : parseFloat(values.price) || 0,
                mediaUrls: allMediaUrls,
                userId: user?.userId || user?.id || "",
            };

            const precheckResult = await listingPrecheck(precheckData);

            if (!precheckResult.canPublish) {
                hideLoadingMsg();
                message.error(
                    precheckResult.risk?.message || 
                    precheckResult.note || 
                    "Bài đăng không đủ điều kiện. Vui lòng kiểm tra lại!"
                );
                return;
            }

            // Prepare request body matching CreateSellerListingRequest DTO
            const requestData = {
                title: values.title,
                description: values.description,
                subCategoryId: selectedSubcategory.id,
                wardId: selectedWard || null,
                price: values.isFree ? 0 : parseFloat(values.price) || 0,
                listingType: "Single",
                availableQuantity: 1,
                hasNegotiation: true,
                condition: values.condition,
                brand: values.brand || "",
                dimensions: null,
                weight: null,
                media: mediaData,
                attributes: [
                    { name: "Màu sắc", value: values.color || "" },
                    { name: "Dung lượng", value: values.capacity || "" },
                    { name: "Bảo hành", value: values.warranty || "" },
                    { name: "Xuất xứ", value: values.origin || "" }
                ].filter(attr => attr.value)
            };

            // Call API to create listing
            const response = await createListing(requestData);

            hideLoadingMsg();
            message.success("Tin của bạn đã được đăng tải thành công!");
            console.log("Listing created:", response);

            setTimeout(() => {
                navigate("/");
            }, 1500);
        } catch (error) {
            hideLoadingMsg();
            console.error("Error creating listing:", error);
            message.error(
                error.response?.data?.message || 
                "Có lỗi xảy ra khi đăng tin. Vui lòng thử lại!"
            );
        }
    };

    return (
        <div className="post-listing-container" style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", paddingBottom: "40px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px" }}>
                <Title level={2} style={{ marginBottom: 20 }}>Đăng tin mới</Title>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        condition: undefined
                    }}
                >
                    {/* Images & Video Section */}
                    <Card
                        title={`Hình ảnh và Video (tối đa 6 ảnh và 1 video)`}
                        className="mb-4"
                        bordered={false}
                        style={{ marginBottom: 16, borderRadius: 8 }}
                    >
                        {/* Images */}
                        <Form.Item
                            label="Hình ảnh"
                            required
                            tooltip="Ảnh đầu tiên sẽ là ảnh bìa. Bấm vào ảnh để chọn ảnh bìa."
                        >
                            <div className="media-upload-grid">
                                {imageList.map((img) => (
                                    <div key={img.uid} className={`media-upload-item${img.isPrimary ? ' primary' : ''}`}>
                                        <img src={img.preview} alt="preview" className="media-upload-preview" />
                                        {/* Remove button */}
                                        <button
                                            type="button"
                                            className="media-upload-remove"
                                            onClick={() => handleRemoveImage(img.uid)}
                                        >
                                            <X size={14} />
                                        </button>
                                        {/* Primary badge */}
                                        {img.isPrimary && (
                                            <div className="media-upload-primary-badge">Ảnh bìa</div>
                                        )}
                                        {/* Set as primary */}
                                        {!img.isPrimary && (
                                            <button
                                                type="button"
                                                className="media-upload-set-primary"
                                                onClick={() => handleSetPrimary(img.uid)}
                                                title="Đặt làm ảnh bìa"
                                            >
                                                <Star size={14} /> Ảnh bìa
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {/* Upload button */}
                                {imageList.length < 6 && (
                                    <label className="media-upload-add">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageUpload}
                                            style={{ display: 'none' }}
                                        />
                                        <UploadIcon size={24} color="#999" />
                                        <span style={{ marginTop: 8, color: '#666', fontSize: 13 }}>Thêm ảnh</span>
                                    </label>
                                )}
                            </div>
                            {imageList.length === 0 && (
                                <div style={{ color: '#ff4d4f', fontSize: 13, marginTop: 4 }}>Bắt buộc có ít nhất 1 ảnh</div>
                            )}
                        </Form.Item>

                        {/* Video */}
                        <Form.Item
                            label="Video"
                            tooltip="Tối đa 1 video (50MB)"
                        >
                            <div className="media-upload-grid">
                                {videoList.map((vid) => (
                                    <div key={vid.uid} className="media-upload-item">
                                        <video src={vid.preview} className="media-upload-preview" muted />
                                        <button
                                            type="button"
                                            className="media-upload-remove"
                                            onClick={() => handleRemoveVideo(vid.uid)}
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="media-upload-video-badge">Video</div>
                                    </div>
                                ))}

                                {videoList.length < 1 && (
                                    <label className="media-upload-add">
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={handleVideoUpload}
                                            style={{ display: 'none' }}
                                        />
                                        <Video size={24} color="#999" />
                                        <span style={{ marginTop: 8, color: '#666', fontSize: 13 }}>Thêm video</span>
                                    </label>
                                )}
                            </div>
                        </Form.Item>
                    </Card>

                    {/* Product Details Section */}
                    <Card title="Thông tin chi tiết" className="mb-4" bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
                        <Form.Item label="Danh mục sản phẩm">
                            <Input
                                value={selectedCategory && selectedSubcategory ? `${selectedCategory.name} - ${selectedSubcategory.name}` : ''}
                                readOnly
                                onClick={() => setIsCategoryModalOpen(true)}
                                suffix={<ChevronRight size={16} color="#999" />}
                                style={{ cursor: 'pointer' }}
                                placeholder="Chọn danh mục"
                            />
                        </Form.Item>

                        <Form.Item
                            name="condition"
                            label="Tình trạng"
                            rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                        >
                            <Select placeholder="Chọn tình trạng">
                                <Option value="new">Mới</Option>
                                <Option value="used">Đã sử dụng</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="brand"
                            label="Hãng"
                            rules={[{ required: true, message: 'Vui lòng nhập hãng' }]}
                        >
                            <Input placeholder="VD: Apple, Samsung, Xiaomi..." />
                        </Form.Item>

                        <Form.Item name="color" label="Màu sắc">
                            <Input placeholder="VD: Đen, Trắng, Xanh..." />
                        </Form.Item>

                        <Form.Item name="capacity" label="Dung lượng">
                            <Input placeholder="VD: 128GB, 256GB..." />
                        </Form.Item>

                        <Form.Item name="warranty" label="Chính sách bảo hành">
                            <Input placeholder="VD: 12 tháng, Hết bảo hành..." />
                        </Form.Item>

                        <Form.Item
                            name="origin"
                            label="Xuất xứ"
                        >
                            <Input placeholder="VD: Việt Nam, Trung Quốc..." />
                        </Form.Item>

                        <Form.Item name="isFree" valuePropName="checked">
                            <Checkbox onChange={(e) => setIsFree(e.target.checked)}>
                                Tích miễn phí cho tặng miễn phí
                            </Checkbox>
                        </Form.Item>

                        {!isFree && (
                            <Form.Item
                                name="price"
                                label="Giá bán"
                                rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
                            >
                                <Input prefix="₫" type="number" placeholder="VD: 5000000" />
                            </Form.Item>
                        )}
                    </Card>

                    {/* Title & Description Section */}
                    <Card title="Tiêu đề và Mô tả" className="mb-4" bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
                        <Form.Item
                            name="title"
                            label="Tiêu đề tin đăng"
                            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                        >
                            <Input placeholder="VD: iPhone 14 Pro Max 256GB - Mới 99%" />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="Mô tả chi tiết"
                            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                        >
                            <TextArea
                                rows={6}
                                placeholder={`Hãy mô tả chi tiết về sản phẩm của bạn:\n- Tình trạng máy\n- Chức năng còn hoạt động\n- Phụ kiện đi kèm\n- Lý do bán\n- Thời gian sử dụng`}
                            />
                        </Form.Item>
                    </Card>

                    {/* Seller Info Section */}
                    <Card title="Thông tin người bán" className="mb-4" bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
                        <Form.Item
                            label="Quận/Huyện"
                            rules={[{ required: true, message: 'Vui lòng chọn quận/huyện' }]}
                        >
                            <Select
                                placeholder="Chọn quận/huyện"
                                loading={loadingDistricts}
                                value={selectedDistrict}
                                onChange={setSelectedDistrict}
                                options={districts}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Phường/Xã"
                            rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
                        >
                            <Select
                                placeholder="Chọn phường/xã"
                                loading={loadingWards}
                                value={selectedWard}
                                onChange={setSelectedWard}
                                options={wards}
                                disabled={!selectedDistrict}
                            />
                        </Form.Item>

                        <Form.Item
                            name="address"
                            label="Địa chỉ chi tiết"
                            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ chi tiết' }]}
                        >
                            <Input placeholder="Ví dụ: Số nhà, tên đường..." prefix={<MapPin size={16} color="#999" />} />
                        </Form.Item>
                    </Card>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24 }}>
                        <Button size="large" onClick={() => navigate("/")}>
                            Hủy
                        </Button>
                        <Button type="primary" htmlType="submit" size="large" style={{ backgroundColor: '#facc15', color: '#000', borderColor: '#facc15' }}>
                            Đăng tin
                        </Button>
                    </div>
                </Form>

                {/* Category Selection Modal */}
                <Modal
                    title={<Title level={4} style={{ textAlign: 'center', margin: 0 }}>Chọn danh mục sản phẩm</Title>}
                    open={isCategoryModalOpen}
                    onCancel={() => {
                        setIsCategoryModalOpen(false);
                    }}
                    footer={null}
                    width={600}
                    centered
                >
                    <div className="category-list" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        {loadingCategories ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                Đang tải danh mục...
                            </div>
                        ) : categories.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                Không có danh mục nào
                            </div>
                        ) : (
                            categories.map((category) => (
                                <div key={category.id} style={{ marginBottom: 8, border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                                    <div
                                        onClick={() => handleCategorySelect(category)}
                                        style={{
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            backgroundColor: expandedCategoryId === category.id ? '#fafafa' : '#fff',
                                            fontWeight: 500
                                        }}
                                    >
                                        <span>{category.name}</span>
                                        {expandedCategoryId === category.id ? <span>−</span> : <span>+</span>}
                                    </div>

                                    {expandedCategoryId === category.id && (
                                        <div style={{ backgroundColor: '#f9f9f9', borderTop: '1px solid #f0f0f0' }}>
                                            {category.subcategories && category.subcategories.map((sub) => (
                                                <div
                                                    key={sub.id}
                                                    onClick={() => handleSubcategorySelect(category, sub)}
                                                    style={{
                                                        padding: '10px 24px',
                                                        cursor: 'pointer',
                                                        color: '#555',
                                                        transition: 'background 0.2s',
                                                        display: 'flex',
                                                        justifyContent: 'space-between'
                                                    }}
                                                    className="hover:bg-gray-100"
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                >
                                                    {sub.name}
                                                    {selectedSubcategory?.id === sub.id && <Check size={16} color="green" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </Modal>
            </div>
        </div >
    );
}
