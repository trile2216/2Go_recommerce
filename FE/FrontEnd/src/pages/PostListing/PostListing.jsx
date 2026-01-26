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

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Category structure
const CATEGORIES = [
    {
        id: "electronics",
        name: "Đồ điện tử",
        subcategories: [
            { id: "smartphone", name: "Điện thoại thông minh" },
            { id: "laptop", name: "Laptop" },
            { id: "pc", name: "PC" },
            { id: "tablet", name: "Máy tính bảng" },
            { id: "accessories", name: "Phụ kiện điện tử" },
        ],
    },
    {
        id: "fashion",
        name: "Thời trang",
        subcategories: [
            { id: "men", name: "Thời trang nam" },
            { id: "women", name: "Thời trang nữ" },
            { id: "kids", name: "Thời trang trẻ em" },
            { id: "shoes", name: "Giày dép" },
            { id: "bags", name: "Túi xách" },
        ],
    },
    {
        id: "home",
        name: "Đồ gia dụng",
        subcategories: [
            { id: "furniture", name: "Nội thất" },
            { id: "kitchen", name: "Đồ dùng nhà bếp" },
            { id: "decor", name: "Trang trí" },
            { id: "appliances", name: "Thiết bị gia đình" },
        ],
    },
    {
        id: "vehicles",
        name: "Xe cộ",
        subcategories: [
            { id: "motorbike", name: "Xe máy" },
            { id: "bicycle", name: "Xe đạp" },
            { id: "car", name: "Ô tô" },
            { id: "parts", name: "Phụ tùng xe" },
        ],
    },
    {
        id: "books",
        name: "Sách & Văn phòng phẩm",
        subcategories: [
            { id: "textbooks", name: "Sách giáo khoa" },
            { id: "novels", name: "Tiểu thuyết" },
            { id: "stationery", name: "Văn phòng phẩm" },
            { id: "magazines", name: "Tạp chí" },
        ],
    },
];

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

    useEffect(() => {
        // Show modal on mount if no category selected
        if (!selectedCategory || !selectedSubcategory) {
            setIsCategoryModalOpen(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const handleVideoChange = (info) => {
        if (info.file.status !== 'uploading') {
            const file = info.file.originFileObj || info.file;
            setVideoFile(file);
        }
    };

    const onFinish = (values) => {
        if (fileList.length === 0) {
            message.error("Vui lòng tải lên ít nhất 1 hình ảnh!");
            return;
        }

        // Logic to prepare form data for API...
        console.log("Form values:", {
            ...values,
            images: fileList,
            video: videoFile,
            category: selectedCategory?.id,
            subcategory: selectedSubcategory?.id
        });

        message.success("Tin của bạn đã được đăng tải thành công!");
        setTimeout(() => {
            navigate("/");
        }, 1500);
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
                        address: "Thủ Đức, TP. Hồ Chí Minh",
                        condition: undefined
                    }}
                >
                    {/* Images & Video Section */}
                    <Card title="Hình ảnh và Video" className="mb-4" bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
                        <Row gutter={24}>
                            <Col span={24}>
                                <Form.Item label="Hình ảnh" tooltip="Đăng tin có hình ảnh để bán nhanh hơn">
                                    <div className="upload-container">
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
                                    </div>
                                    {fileList.length === 0 && (
                                        <div
                                            onClick={() => document.querySelector('.ant-upload-select-picture-card')?.click()}
                                            style={{
                                                border: '2px dashed #d9d9d9',
                                                borderRadius: 8,
                                                padding: 40,
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                backgroundColor: '#fafafa',
                                                transition: 'border-color 0.3s'
                                            }}
                                            className="upload-placeholder hover:border-blue-500"
                                        >
                                            <UploadIcon size={48} style={{ color: '#bdbdbd', margin: '0 auto 16px' }} />
                                            <Text strong style={{ display: 'block', fontSize: 16 }}>Bấm để chọn ảnh từ máy</Text>
                                            <Text type="secondary">Đăng tin có hình ảnh để bán nhanh</Text>
                                        </div>
                                    )}
                                </Form.Item>
                            </Col>

                            <Col span={24} style={{ marginTop: 16 }}>
                                <Form.Item label="Video" tooltip="Đăng video để bán nhanh hơn">
                                    <Upload
                                        accept="video/*"
                                        maxCount={1}
                                        onChange={handleVideoChange}
                                        beforeUpload={() => false}
                                        showUploadList={{ showRemoveIcon: true }}
                                    >
                                        <Button icon={<Video size={16} />}>Chọn video</Button>
                                    </Upload>
                                    {!videoFile && (
                                        <div
                                            style={{
                                                border: '2px dashed #d9d9d9',
                                                borderRadius: 8,
                                                padding: 24,
                                                textAlign: 'center',
                                                marginTop: 8,
                                                backgroundColor: '#fafafa'
                                            }}
                                        >
                                            <Video size={32} style={{ color: '#bdbdbd', margin: '0 auto 8px' }} />
                                            <Text type="secondary" style={{ display: 'block' }}>Đăng video để bán nhanh hơn</Text>
                                        </div>
                                    )}
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
                            name="address"
                            label="Địa chỉ"
                            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                        >
                            <Input prefix={<MapPin size={16} color="#999" />} />
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
                        {CATEGORIES.map((category) => (
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
                                        {category.subcategories.map((sub) => (
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
                        ))}
                    </div>
                </Modal>
            </div>
        </div >
    );
}
