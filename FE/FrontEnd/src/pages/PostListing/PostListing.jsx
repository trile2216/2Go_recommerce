import { useState, useEffect, useCallback } from "react";
import { useNavigate, useBlocker, useSearchParams } from "react-router-dom";
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
import { createListing, getMyListingById, updateListing, updateListingMedia, publishListing } from "../../service/home/api.sellerListing";
import { fetchAllCategories, fetchSubCategoriesByCategoryId } from "../../service/home/api.category";
import { fetchAllDistricts, fetchAllWards } from "../../service/home/api.ward";
import { listingPrecheck } from "../../service/ai/api.analyze";
import useAuth from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { getAttributesForCategory, getBrandForCategory } from "../../data/categoryAttributes";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function PostListing() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const [form] = Form.useForm();
    const { user } = useAuth();
    const toast = useToast();
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // To prevent blocker when submitting
    
    // Blocker for navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isFormDirty && !isSubmitting && currentLocation.pathname !== nextLocation.pathname
    );

    // Modal state for blocker
    const [showBlockerModal, setShowBlockerModal] = useState(false);

    useEffect(() => {
        if (blocker.state === "blocked") {
            setShowBlockerModal(true);
        } else {
            setShowBlockerModal(false);
        }
    }, [blocker.state]);

    const handleBlockerLeave = () => {
        if (blocker.state === "blocked") {
            blocker.proceed();
        } else {
             navigate("/");
        }
    };

    const handleBlockerStay = () => {
        if (blocker.state === "blocked") {
            blocker.reset();
        }
        setShowBlockerModal(false);
    };

    const handleSaveDraftAndLeave = () => {
        handleSaveDraft();
    };

    // Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [expandedCategoryId, setExpandedCategoryId] = useState(null);

    // Upload State
    const [imageList, setImageList] = useState([]); // [{ uid, file, preview, isPrimary }]
    const [videoList, setVideoList] = useState([]); // [{ uid, file, preview }]
    const [hasNegotiation, setHasNegotiation] = useState(true);

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
                toast.error('Không thể tải danh mục. Vui lòng thử lại!');
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
                toast.error('Không thể tải quận/huyện. Vui lòng thử lại!');
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
                    toast.error('Không thể tải phường/xã. Vui lòng thử lại!');
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

    // Load existing listing for edit
    useEffect(() => {
        if (editId) {
            const fetchListing = async () => {
                try {
                    const data = await getMyListingById(editId);
                    
                    // Populate Form
                    form.setFieldsValue({
                        title: data.title,
                        description: data.description,
                        price: data.price,
                        condition: data.condition,
                        brand: data.brand,
                        hasNegotiation: data.hasNegotiation !== undefined ? data.hasNegotiation : true,
                        address: data.sellerAddress,
                    });

                    // Populate dynamic attributes
                    if (data.attributes && data.categoryId) {
                        const attrFields = getAttributesForCategory(data.categoryId);
                        const attrValues = {};
                        attrFields.forEach(field => {
                            const found = data.attributes.find(a => a.name === field.name);
                            if (found) {
                                attrValues[`attr_${field.name}`] = found.value;
                            }
                        });
                        form.setFieldsValue(attrValues);
                    }
                    
                    setHasNegotiation(data.hasNegotiation !== undefined ? data.hasNegotiation : true);

                    // Setup Media
                    const images = data.media?.filter(m => m.mediaType === 'IMAGE').map(m => ({
                        uid: `img-${m.id}`,
                        file: null, // No file object for existing
                        preview: m.url,
                        isPrimary: m.isPrimary,
                        url: m.url 
                    })) || [];
                    setImageList(images);

                    const videos = data.media?.filter(m => m.mediaType === 'VIDEO').map(m => ({
                        uid: `vid-${m.id}`,
                        file: null,
                        preview: m.url,
                        url: m.url
                    })) || [];
                    setVideoList(videos);

                    // Setup Category
                    if (data.categoryId && data.subCategoryId) {
                        // Note: categories state might not be fully loaded yet depending on race condition
                        // but we just need names for display usually.
                        // Ideally we find them in categories list.
                        // For now we assume we can fetch them or just display names if available in listing detail
                        // ListingDetail usually has CategoryName, SubCategoryName
                        form.setFieldsValue({
                            category: `${data.categoryName} - ${data.subCategoryName}`
                        });
                        setSelectedSubcategory({ id: data.subCategoryId, name: data.subCategoryName });
                        setSelectedCategory({ id: data.categoryId, name: data.categoryName });
                        setIsCategoryModalOpen(false); 
                    }

                    // Setup Location
                    if (data.wardId) {
                         // We need to fetch district via ward? Or just set if we have districtId in listing
                         // ListingDetail DTO might need DistrictId to be easier. 
                         // Assuming we have it or can derive it.
                         // For now if logic is complex, we might skip pre-filling exact ward/district dropdowns 
                         // unless we have specific IDs.
                         // Let's assume we have WardId. We can try to set it if we load wards.
                         // But we need to load districts first, then select district, then load wards.
                         // This is tricky without DistrictId.
                         // If ListingDetail has DistrictId, uses it.
                         if (data.districtId) {
                             setSelectedDistrict(data.districtId);
                             setSelectedWard(data.wardId);
                         }
                    }

                } catch (error) {
                    console.error("Error fetching listing for edit:", error);
                    toast.error("Không thể tải thông tin bài đăng");
                    navigate("/seller/listings");
                }
            };
            fetchListing();
        }
    }, [editId, form, navigate]);


    // --- Image handlers ---
    const handleImageUpload = useCallback((e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const remainingSlots = 6 - imageList.length;
        if (remainingSlots <= 0) {
            toast.warning('Tối đa 6 ảnh!');
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
            toast.warning('Tối đa 1 video!');
            return;
        }

        const file = files[0];
        if (file.size > 50 * 1024 * 1024) {
            toast.error('Video không được vượt quá 50MB!');
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


    // Track form changes
    const handleFormChange = () => {
        if (!isFormDirty) setIsFormDirty(true);
    };

    const getPublishErrorMessage = (error) => {
        const raw =
            error?.response?.data?.message ||
            error?.response?.data ||
            error?.message ||
            'Đăng bài thất bại';
        if (typeof raw !== 'string') return 'Đăng bài thất bại';

        if (raw.includes('Images did not pass quality checks')) {
            return 'Ảnh chưa đạt chất lượng nên chưa thể đăng. Vui lòng cập nhật ảnh rõ nét hơn rồi thử lại.';
        }
        if (raw.includes('Price must be greater than 0') || raw.includes('Price must be >= 0')) {
            return 'Giá bán không hợp lệ. Vui lòng nhập giá >= 0.';
        }
        return raw;
    };

    const getPublishSuccessMessage = (response) => {
        const raw = response?.message || '';
        if (typeof raw === 'string') {
            const lower = raw.toLowerCase();
            if (lower.includes('review')) {
                return 'Đăng bài thành công! Đang chờ duyệt.';
            }
            if (lower.includes('published')) {
                return 'Đăng bài thành công! Bài đang bán.';
            }
        }
        return 'Đăng bài thành công!';
    };

    const upsertDraftNote = (listingId, message) => {
        if (!listingId || !message) return;
        const key = 'listingDraftNotes';
        let stored = {};
        try {
            stored = JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
            stored = {};
        }
        stored[String(listingId)] = {
            message,
            updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(stored));
    };

    const clearDraftNote = (listingId) => {
        if (!listingId) return;
        const key = 'listingDraftNotes';
        let stored = {};
        try {
            stored = JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
            stored = {};
        }
        if (stored[String(listingId)]) {
            delete stored[String(listingId)];
            localStorage.setItem(key, JSON.stringify(stored));
        }
    };

    const handleSaveDraft = () => {
        const values = form.getFieldsValue();
        submitListing(values, 'Draft');
    };

    const onFinish = (values) => {
        submitListing(values, 'PendingReview');
    };

    const submitListing = async (values, status) => {
        let submitStatus = status;
        const draftReasons = [];
        if (status === 'PendingReview') {
            if (imageList.length < 2) {
                draftReasons.push('Cần ít nhất 2 ảnh để gửi duyệt.');
            }
            if (!selectedWard) {
                draftReasons.push('Vui lòng chọn Phường/Xã trước khi gửi duyệt.');
            }
            if (draftReasons.length > 0) {
                submitStatus = 'Draft';
                toast.warning(`Bài đăng sẽ được lưu nháp vì: ${draftReasons.join(' ')}`);
            }
        }
        // Validation for PendingReview and Draft
        if (submitStatus === 'PendingReview' || submitStatus === 'Draft') {
            // Validation: at least 1 image required
            if (imageList.length === 0) {
                toast.error("Vui lòng tải lên ít nhất 1 hình ảnh!");
                return;
            }

            // Validation: exactly 1 primary image
            const primaryCount = imageList.filter((img) => img.isPrimary).length;
            if (primaryCount !== 1) {
                toast.error("Phải có đúng 1 ảnh bìa!");
                return;
            }

            if (!selectedSubcategory) {
                toast.error("Vui lòng chọn danh mục sản phẩm!");
                return;
            }
        }

        try {
            let forcePendingReview = false;
            let precheckNote = null;
            // Start loading with appropriate message
            if (submitStatus === 'Draft') {
                toast.info("Đang lưu nháp...");
            } else {
                // For PendingReview: show initial message about checking
                toast.info("Đang kiểm tra bài đăng...");
            }

            // Upload images
            const imageFiles = imageList.map((img) => img.file).filter(Boolean);
            let mediaData = [];
            let imageUrlArr = [];
            
            if (imageFiles.length > 0) {
                const imageUrls = await uploadImageAndGetUrl(imageFiles);
                imageUrlArr = Array.isArray(imageUrls) ? imageUrls : [imageUrls];

                // Build media array for images
                mediaData = imageUrlArr.map((url, index) => ({
                    url,
                    mediaType: "IMAGE",
                    isPrimary: imageList[index]?.isPrimary || false,
                    sortOrder: index,
                }));
            }

            // Include existing images (already uploaded, no file object)
            const existingImages = imageList.filter(img => !img.file && img.url);
            existingImages.forEach((img) => {
                imageUrlArr.push(img.url);
                mediaData.push({
                    url: img.url,
                    mediaType: "IMAGE",
                    isPrimary: img.isPrimary || false,
                    sortOrder: mediaData.length,
                });
            });

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

            // Quick precheck before creating listing (only for PendingReview)
            // Precheck: kiểm tra quick (ảnh hợp lệ, chất lượng cơ bản, spam, link, giá...)
            if (submitStatus === 'PendingReview') {
                // Validate userId exists
                const userId = user?.userId || user?.id;
                
                if (!userId) {
                    toast.error("Lỗi: Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.");
                    setIsSubmitting(false);
                    return;
                }

                // Validate mediaUrls
                if (allMediaUrls.length === 0) {
                    toast.error("Lỗi: Không có hình ảnh hoặc video để gửi kiểm tra.");
                    setIsSubmitting(false);
                    return;
                }

                const precheckData = {
                    title: values.title,
                    description: values.description,
                    categoryId: selectedCategory?.id,
                    brand: values.brand || "",
                    price: parseFloat(values.price) || 0,
                    mediaUrls: allMediaUrls,
                    userId: String(userId),
                };

                const precheckResult = await listingPrecheck(precheckData);

                if (!precheckResult.canPublish) {
                    const riskAction = precheckResult.risk?.action || precheckResult.risk?.Action;
                    const qualityDecision = precheckResult.quality?.decision || precheckResult.quality?.Decision;
                    const shouldBlock =
                        String(riskAction).toUpperCase() === "REJECTED" ||
                        String(qualityDecision).toUpperCase() === "REJECT";
                    if (shouldBlock) {
                        toast.error(
                            precheckResult.risk?.message ||
                            "Bài đăng không đủ điều kiện. Vui lòng kiểm tra lại!"
                        );
                        setIsSubmitting(false);
                        return;
                    }
                    forcePendingReview = true;
                    precheckNote = precheckResult.note || null;

                    const issues = Array.isArray(precheckResult.quality?.issues)
                        ? precheckResult.quality.issues
                        : [];
                    const filteredIssues = issues.filter((issue) => !/gemini/i.test(issue));
                    const hasOnlyOneMedia = issues.some((issue) => /only\s*1\s*media/i.test(issue));
                    const hasLowResolution = issues.some((issue) => /image resolution too low/i.test(issue));
                    const suggestions = [];
                    if (hasOnlyOneMedia) {
                        suggestions.push('Tải thêm ít nhất 2 ảnh rõ nét');
                    }
                    if (hasLowResolution) {
                        suggestions.push('Chụp lại ảnh có độ phân giải cao');
                    }

                    if (hasOnlyOneMedia || hasLowResolution) {
                        submitStatus = 'Draft';
                        forcePendingReview = false;
                        const reason = hasOnlyOneMedia && hasLowResolution
                            ? 'ảnh chưa đạt chuẩn và chưa đủ số lượng'
                            : hasOnlyOneMedia
                                ? 'chưa đủ số lượng ảnh'
                                : 'ảnh chưa đạt chuẩn';
                        toast.warning(`Bài đăng sẽ được lưu nháp vì ${reason}. Vui lòng cập nhật ảnh rồi thử lại.`);
                    } else {
                        const warningLines = [
                            'Bài đăng sẽ chờ kiểm duyệt thủ công.',
                            'Lý do:',
                            ...filteredIssues.map((issue) => `- ${issue}`),
                        ];
                        if (suggestions.length > 0) {
                            warningLines.push('Gợi ý:', ...suggestions.map((s) => `- ${s}`));
                        }
                        toast.warning(warningLines.join(' '));
                    }
                }

                if (precheckResult.note && precheckResult.canPublish) {
                    toast.warning(precheckResult.note);
                }
            }

            // For PendingReview: Create as Draft first, then publish
            // For Draft: Just create as Draft directly
            const creationStatus = submitStatus === 'PendingReview'
                ? (forcePendingReview ? 'PendingReview' : 'Draft')
                : 'Draft';

            // Prepare request body matching CreateSellerListingRequest DTO
            const requestData = {
                title: values.title,
                description: values.description,
                subCategoryId: selectedSubcategory?.id,
                wardId: selectedWard || null,
                price: parseFloat(values.price) || 0,
                listingType: "Single",
                availableQuantity: 1,
                hasNegotiation: values.hasNegotiation !== undefined ? !!values.hasNegotiation : true,
                condition: values.condition,
                brand: values.brand || "",
                dimensions: null,
                weight: null,
                media: mediaData,
                attributes: getAttributesForCategory(selectedCategory?.id)
                    .map(field => ({
                        name: field.name,
                        value: values[`attr_${field.name}`] || ""
                    }))
                    .filter(attr => attr.value),
                status: creationStatus
            };
            
            setIsSubmitting(true); // Allow navigation
            
            if (editId) {
                 // Update Listing
                 await updateListing(editId, requestData);
                 
                 // Update Media
                 await updateListingMedia(editId, mediaData);
                 
                 // If user was updating with PendingReview, publish it
                if (submitStatus === 'PendingReview') {
                    if (forcePendingReview) {
                        toast.warning("Cập nhật thành công. Bài đăng đang chờ kiểm duyệt.");
                        if (precheckNote) {
                            const key = 'listingReviewNotes';
                            let stored = {};
                            try {
                                stored = JSON.parse(localStorage.getItem(key) || '{}');
                            } catch {
                                stored = {};
                            }
                            stored[String(editId)] = {
                                note: precheckNote,
                                updatedAt: new Date().toISOString(),
                            };
                            localStorage.setItem(key, JSON.stringify(stored));
                        }
                    } else {
                        try {
                            await publishListing(editId);
                            toast.success("Cập nhật và gửi duyệt bài đăng thành công!");
                            clearDraftNote(editId);
                        } catch (publishError) {
                            const publishErrorMsg = getPublishErrorMessage(publishError);
                            upsertDraftNote(editId, publishErrorMsg);
                            toast.warning(publishErrorMsg);
                        }
                    }
                } else {
                    toast.success("Cập nhật bài đăng thành công!");
                }
                navigate(`/seller/listings/${editId}`);
            } else {
                // Create new listing

                // Step 1: Create Draft
                const response = await createListing(requestData);
                const newListingId = response.id || response.listingId;

                // Step 2: If user wanted to publish, proceed with publishing
                if (submitStatus === 'PendingReview') {
                    if (forcePendingReview) {
                        toast.warning("Bài đăng đã được tạo và đang chờ kiểm duyệt.");
                        if (precheckNote && newListingId) {
                            const key = 'listingReviewNotes';
                            let stored = {};
                            try {
                                stored = JSON.parse(localStorage.getItem(key) || '{}');
                            } catch {
                                stored = {};
                            }
                            stored[String(newListingId)] = {
                                note: precheckNote,
                                updatedAt: new Date().toISOString(),
                            };
                            localStorage.setItem(key, JSON.stringify(stored));
                        }
                        setIsFormDirty(false);
                        if (blocker.state === "blocked") {
                            blocker.proceed();
                        } else {
                            navigate("/");
                        }
                        return;
                    }
                    // Show intermediate message after draft created
                    toast.info("Tin đã được tạo. Đang gửi duyệt...");

                    try {
                        // Deep check happens on BE during publish:
                        // - NSFW/damage check
                        // - Eligibility check
                        // - Quota limits check
                        // - If pass -> Active or PendingReview (for manual review)
                        // - If fail or quota exceeded -> Manual review (PendingReview)
                        const publishRes = await publishListing(newListingId);
                        
                        toast.success(getPublishSuccessMessage(publishRes));
                        clearDraftNote(newListingId);
                    } catch (publishError) {
                        console.error("Publish error:", publishError);
                        
                        // Publish might fail due to deep check or quota issues
                        // In those cases, listing is already created as Draft and waiting for manual review
                        const publishErrorMsg = getPublishErrorMessage(publishError);
                        upsertDraftNote(newListingId, publishErrorMsg);
                        toast.warning(publishErrorMsg);
                    }
                } else {
                    // Just save draft - no publishing
                    toast.success("Đã lưu nháp!");
                }

                // Handle blocker/navigation
                setIsFormDirty(false); // Mark form as clean before leaving
                if (blocker.state === "blocked") {
                    blocker.proceed();
                } else {
                     navigate("/");
                }
            }

        } catch (error) {
            setIsSubmitting(false); // Allow user to retry or save as draft
            console.error("Error in listing submission:", error);
            
            // Extract validation errors from backend
            const validationErrors = error.response?.data?.errors;
            let errorMessage = error.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại!";
            
            if (validationErrors) {
                console.error("Validation errors:", validationErrors);
                const errorList = Object.entries(validationErrors)
                    .map(([field, msgs]) => {
                        const msg = Array.isArray(msgs) ? msgs[0] : msgs;
                        return `${field}: ${msg}`;
                    })
                    .join(', ');
                errorMessage = `Lỗi validate: ${errorList}`;
            }
            
            toast.error(errorMessage);
        }
    };

    return (
        <div className="post-listing-container" style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", paddingBottom: "40px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px" }}>
                <Title level={2} style={{ marginBottom: 20 }}>
                    {editId ? `Chỉnh sửa tin đăng #${editId}` : 'Đăng tin mới'}
                </Title>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    onValuesChange={handleFormChange}
                    initialValues={{
                        condition: undefined,
                        hasNegotiation: true
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
                            label={getBrandForCategory(selectedCategory?.id).label}
                            rules={[{ required: true, message: `Vui lòng nhập ${getBrandForCategory(selectedCategory?.id).label.toLowerCase()}` }]}
                        >
                            <Input placeholder={getBrandForCategory(selectedCategory?.id).placeholder} />
                        </Form.Item>

                        {/* Dynamic attributes based on category */}
                        {selectedCategory && getAttributesForCategory(selectedCategory.id).map(field => (
                            <Form.Item
                                key={field.name}
                                name={`attr_${field.name}`}
                                label={field.label}
                            >
                                <Input placeholder={field.placeholder} />
                            </Form.Item>
                        ))}

                        <Form.Item
                            name="price"
                            label="Giá bán"
                            rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
                            style={{ marginBottom: 8 }}
                        >
                            <Input prefix="₫" type="number" placeholder="VD: 5000000" />
                        </Form.Item>

                        <Form.Item
                            shouldUpdate={(prevValues, currentValues) => prevValues.price !== currentValues.price}
                            style={{ marginBottom: 24 }}
                        >
                            {({ getFieldValue }) => {
                                const priceVal = getFieldValue('price');
                                const priceNum = parseFloat(priceVal);
                                if (!priceNum || priceNum <= 0) return null;

                                const fee = Math.round(priceNum * 0.07);
                                const net = Math.round(priceNum * 0.93);

                                return (
                                    <div style={{ backgroundColor: '#f9fafb', padding: '12px 16px', borderRadius: 8, marginTop: 4 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ color: '#6b7280', fontSize: 13 }}>Phí dịch vụ 2Go (7%):</span>
                                            <span style={{ color: '#ef4444', fontWeight: 500, fontSize: 13 }}>
                                                - {new Intl.NumberFormat('vi-VN').format(fee)} ₫
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#111827', fontSize: 14, fontWeight: 500 }}>Thực nhận:</span>
                                            <span style={{ color: '#10b981', fontWeight: 600, fontSize: 14 }}>
                                                {new Intl.NumberFormat('vi-VN').format(net)} ₫
                                            </span>
                                        </div>
                                    </div>
                                );
                            }}
                        </Form.Item>

                        <Form.Item name="hasNegotiation" valuePropName="checked">
                            <Checkbox onChange={(e) => setHasNegotiation(e.target.checked)}>
                                Giá có thể thương lượng
                            </Checkbox>
                        </Form.Item>
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
                    </Card>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24 }}>
                        <Button size="large" onClick={() => navigate(editId ? `/seller/listings/${editId}` : "/")}>
                            Hủy
                        </Button>
                        {!editId && (
                             <Button size="large" onClick={handleSaveDraft}>
                                Lưu nháp
                            </Button>
                        )}
                        <Button type="primary" htmlType="submit" size="large" style={{ backgroundColor: '#facc15', color: '#000', borderColor: '#facc15' }}>
                            {editId ? 'Cập nhật' : 'Đăng tin'}
                        </Button>
                    </div>
                </Form>
                
                {/* Save Draft/Leave Confirmation Modal */}
                <Modal
                    title="Lưu bản nháp?"
                     open={showBlockerModal}
                    onOk={handleSaveDraftAndLeave}
                    onCancel={handleBlockerStay}
                    footer={[
                        <Button key="cancel" onClick={handleBlockerStay}>
                             Hủy thao tác
                        </Button>,
                        <Button key="leave" danger onClick={handleBlockerLeave}>
                            Không lưu
                        </Button>,
                         <Button key="save" type="primary" onClick={handleSaveDraftAndLeave}>
                            Lưu nháp
                        </Button>,
                    ]}
                >
                    <p>Bạn có muốn lưu lại những thay đổi này vào bản nháp trước khi rời đi không?</p>
                </Modal>

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

