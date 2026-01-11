import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "./PostListing.css";

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
  const { toast } = useToast();
  const [showCategoryDialog, setShowCategoryDialog] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [expandedCategory, setExpandedCategory] = useState("");
  
  // Form state
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [condition, setCondition] = useState("");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [capacity, setCapacity] = useState("");
  const [warranty, setWarranty] = useState("");
  const [origin, setOrigin] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("Thủ Đức, TP. Hồ Chí Minh");

  const handleCategorySelect = (categoryId) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory("");
    } else {
      setExpandedCategory(categoryId);
    }
  };

  const handleSubcategorySelect = (categoryId, subcategoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategoryId);
    setShowCategoryDialog(false);
  };

  const handleImageUpload = (e) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleVideoUpload = (e) => {
    if (e.target.files?.[0]) {
      setVideo(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!condition || !brand || !price || !title) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ các trường bắt buộc",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Đăng tin thành công!",
      description: "Tin của bạn đã được đăng tải.",
    });
    
    navigate("/");
  };

  const getCategoryName = () => {
    const category = CATEGORIES.find((c) => c.id === selectedCategory);
    const subcategory = category?.subcategories.find((s) => s.id === selectedSubcategory);
    return category && subcategory ? `${category.name} - ${subcategory.name}` : "";
  };

  return (
    <div className="post-listing">
      <Header />
      
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Chọn danh mục sản phẩm</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            {CATEGORIES.map((category) => (
              <div key={category.id} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => handleCategorySelect(category.id)}
                  className="w-full px-4 py-3 text-left bg-card hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-foreground">{category.name}</span>
                  <span className="text-muted-foreground">
                    {expandedCategory === category.id ? "−" : "+"}
                  </span>
                </button>
                
                {expandedCategory === category.id && (
                  <div className="bg-secondary/50 border-t border-border">
                    {category.subcategories.map((subcategory) => (
                      <button
                        key={subcategory.id}
                        onClick={() => handleSubcategorySelect(category.id, subcategory.id)}
                        className="w-full px-6 py-2.5 text-left hover:bg-muted transition-colors text-foreground"
                      >
                        {subcategory.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Đăng tin mới</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image and Video Upload */}
          <div className="bg-card rounded-lg p-6 border border-border space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Hình ảnh và Video</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="images" className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-foreground font-medium">Bấm để chọn ảnh từ máy</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Đăng tin có hình ảnh để bán nhanh
                    </p>
                  </div>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </Label>
                {images.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Đã chọn {images.length} ảnh
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="video" className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <Video className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-foreground font-medium">Đăng video để bán nhanh hơn</p>
                  </div>
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoUpload}
                  />
                </Label>
                {video && (
                  <p className="text-sm text-muted-foreground mt-2">Đã chọn video: {video.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-card rounded-lg p-6 border border-border space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Thông tin chi tiết</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="category" className="text-foreground">
                  Danh mục sản phẩm
                </Label>
                <Input
                  id="category"
                  value={getCategoryName()}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              <div>
                <Label htmlFor="condition" className="text-foreground">
                  Tình trạng <span className="text-destructive">*</span>
                </Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tình trạng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Mới</SelectItem>
                    <SelectItem value="used">Đã sử dụng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="brand" className="text-foreground">
                  Hãng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="VD: Apple, Samsung, Xiaomi..."
                />
              </div>

              <div>
                <Label htmlFor="color" className="text-foreground">Màu sắc</Label>
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="VD: Đen, Trắng, Xanh..."
                />
              </div>

              <div>
                <Label htmlFor="capacity" className="text-foreground">Dung lượng</Label>
                <Input
                  id="capacity"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="VD: 128GB, 256GB..."
                />
              </div>

              <div>
                <Label htmlFor="warranty" className="text-foreground">
                  Chính sách bảo hành
                </Label>
                <Input
                  id="warranty"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  placeholder="VD: 12 tháng, Hết bảo hành..."
                />
              </div>

              <div>
                <Label htmlFor="origin" className="text-foreground">Xuất xứ</Label>
                <Input
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="VD: Việt Nam, Trung Quốc..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="free" checked={isFree} onCheckedChange={(checked) => setIsFree(checked === true)} />
                <Label
                  htmlFor="free"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Tích miễn phí cho tặng miễn phí
                </Label>
              </div>

              {!isFree && (
                <div>
                  <Label htmlFor="price" className="text-foreground">
                    Giá bán <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="VD: 5000000"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Title and Description */}
          <div className="bg-card rounded-lg p-6 border border-border space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Tiêu đề và Mô tả</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-foreground">
                  Tiêu đề tin đăng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: iPhone 14 Pro Max 256GB - Mới 99%"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-foreground">Mô tả chi tiết</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Hãy mô tả chi tiết về sản phẩm của bạn:&#10;- Tình trạng máy&#10;- Chức năng còn hoạt động&#10;- Phụ kiện đi kèm&#10;- Lý do bán&#10;- Thời gian sử dụng"
                  rows={8}
                />
              </div>
            </div>
          </div>

          {/* Seller Information */}
          <div className="bg-card rounded-lg p-6 border border-border space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Thông tin người bán</h2>
            
            <div>
              <Label htmlFor="address" className="text-foreground">
                Địa chỉ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
            >
              Hủy
            </Button>
            <Button type="submit">
              Đăng tin
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
