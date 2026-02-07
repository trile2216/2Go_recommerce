import { useState, useEffect } from "react";
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
} from "antd";
import {
    Upload as UploadIcon,
    Video,
    ChevronRight,
    MapPin,
    Check
} from "lucide-react";
import "./PostListing.css";
import Header from "../../components/Header";
import { uploadImageAndGetUrl } from "../../service/upload/api.upload";
import { createListing } from "../../service/home/api.lishting";
import { fetchAllCategories, fetchSubCategoriesByCategoryId } from "../../service/home/api.category";
import { fetchAllDistricts, fetchAllWards } from "../../service/home/api.ward";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function PostListing() {
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [expandedCategoryId, setExpandedCategoryId] = useState(null);

    // Upload State
    const [fileList, setFileList] = useState([]);
    const [videoFile, setVideoFile] = useState(null);
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

    const handleImageChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };


    const onFinish = async (values) => {
        if (fileList.length === 0) {
            message.error("Vui lòng tải lên ít nhất 1 hình ảnh!");
            return;
        }

        if (!selectedSubcategory) {
            message.error("Vui lòng chọn danh mục sản phẩm!");
            return;
        }

        // Show loading message
        const hideLoadingMsg = message.loading("Đang xử lý tin đăng của bạn...", 0);

        try {
            // Upload all images and get URLs
            const uploadedFiles = fileList.map(file => file.originFileObj || file).filter(f => f instanceof File);
            const imageUrls = await uploadImageAndGetUrl(uploadedFiles);

            // Format images data with primary image
            const imagesData = imageUrls.map((url, index) => ({
                imageUrl: url,
                isPrimary: index === 0 // First image is primary
            }));

            // Prepare request body
            const requestData = {
                title: values.title,
                description: values.description,
                subCategoryId: selectedSubcategory.id,
                wardId: selectedWard || 0,
                price: values.isFree ? 0 : parseInt(values.price) || 0,
                listingType: "SELLING", // Default listing type
                availableQuantity: 1,
                hasNegotiation: true,
                condition: values.condition,
                brand: values.brand || "",
                dimensions: "",
                weight: 0,
                images: imagesData,
                attributes: [
                    { name: "Màu sắc", value: values.color || "" },
                    { name: "Dung lượng", value: values.capacity || "" },
                    { name: "Bảo hành", value: values.warranty || "" },
                    { name: "Xuất xứ", value: values.origin || "" }
                ].filter(attr => attr.value) // Remove empty attributes
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
                    <Card title="Hình ảnh và Video" className="mb-4" bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
                        <Row gutter={24}>
                            <Col span={24}>
                                <Form.Item label="Hình ảnh" tooltip="Đăng tin có hình ảnh để bán nhanh hơn">
                                    <Upload
                                        listType="picture-card"
                                        fileList={fileList}
                                        onChange={handleImageChange}
                                        beforeUpload={() => false}
                                        multiple
                                        accept="image/*"
                                    >
                                        {fileList.length >= 8 ? null : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <UploadIcon size={24} style={{ color: '#999', marginBottom: 8 }} />
                                                <div style={{ marginTop: 8, color: '#666' }}>Thêm ảnh</div>
                                            </div>
                                        )}
                                    </Upload>
                                </Form.Item>
                            </Col>

                        </Row>
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
