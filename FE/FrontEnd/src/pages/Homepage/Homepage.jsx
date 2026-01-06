import './Homepage.css';
import Header from '../../components/Header';
import HeroBanner from '../../components/HeroBanner';
import ProductGrid from '../../components/ProductGrid';
import Footer from '../../components/Footer';

export default function Homepage() {
  const products = [
    {
      id: 1,
      title: 'iPhone 13 Pro 128GB Vàng - Đẹp như mới',
      price: '15.500.000 đ',
      condition: 'Độ mới: 95%',
      location: 'Phường Linh Xuân, Thủ Đức',
      time: '2 giờ trước',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/bf95040152b70a135d0df38766088c92c548a01f?width=518',
      liked: false
    },
    {
      id: 2,
      title: 'Tủ lạnh Panasonic 180L - Tiết kiệm điện',
      price: '2.490.000 đ',
      condition: 'Độ mới: 90%',
      location: 'Phường Bình Chiểu, Thủ Đức',
      time: '5 giờ trước',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/d71c9ebc3d0eabade05f0fd32baefb51817a0b2d?width=518',
      liked: false
    },
    {
      id: 3,
      title: 'Bàn học gỗ kèm ghế - Cho tặng',
      price: null,
      condition: null,
      location: 'Phường Tam Phú, Thủ Đức',
      time: '1 ngày trước',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/728652725ae8cffb93cbeda4a9e5d4cd8575c6c2?width=518',
      liked: false,
      badge: 'Cho tặng'
    },
    {
      id: 4,
      title: 'Máy giặt Electrolux 8kg - Mới 98%',
      price: '3.800.000 đ',
      condition: 'Độ mới: 98%',
      location: 'Phường Linh Trung, Thủ Đức',
      time: '3 giờ trước',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/701e8f16652a34f3871620efde34dec6a03e4408?width=518',
      liked: true
    },
    {
      id: 5,
      title: 'Áo khoác nữ thời trang - Size M',
      price: '150.000 đ',
      condition: 'Độ mới: 90%',
      location: 'Phường Hiệp Bình Phước, Thủ Đức',
      time: '4 giờ trước',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/e82b2e06e927aa6df075a568cdc5dd63ee5a1ec9?width=518',
      liked: false
    },
    {
      id: 6,
      title: 'Laptop Dell Inspiron 15 - i5 Gen 11',
      price: '8.900.000 đ',
      condition: 'Độ mới: 92%',
      location: 'Phường Tam Bình, Thủ Đức',
      time: '6 giờ trước',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/a6c91705ff600b1beb8a969296f3aa982c8fd6ac?width=518',
      liked: false
    },
    {
      id: 7,
      title: 'Nồi cơm điện Sharp 1.8L',
      price: '450.000 đ',
      condition: 'Độ mới: 88%',
      location: 'Phường Linh Xuân, Thủ Đức',
      time: '8 giờ trước',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/6f4b089c458a431d7d742186c86c9f8d8656720d?width=518',
      liked: false
    },
    {
      id: 8,
      title: 'Quạt điều hòa Kangaroo - Mát lạnh',
      price: '1.200.000 đ',
      condition: 'Độ mới: 95%',
      location: 'Phường Bình Chiểu, Thủ Đức',
      time: '10 giờ trước',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/f8c53b499f1143c457c0cf0fab5e94c0b3ed8c94?width=518',
      liked: false
    },
    {
      id: 9,
      title: 'Giày thể thao Nike Air - Size 42',
      price: '890.000 đ',
      condition: 'Độ mới: 93%',
      location: 'Phường Linh Trung, Thủ Đức',
      time: '12 giờ trước',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/4e4085c489d8ed35098cc95483de5d4dca5fe8a9?width=518',
      liked: true
    },
    {
      id: 10,
      title: 'Bình đun siêu tốc Philips 1.7L',
      price: '280.000 đ',
      condition: 'Độ mới: 85%',
      location: 'Phường Tam Phú, Thủ Đức',
      time: '1 ngày trước',
      image: null,
      liked: false
    },
    {
      id: 11,
      title: 'Xe đạp thể thao Giant - Cho tặng',
      price: null,
      condition: null,
      location: 'Phường Hiệp Bình Phước, Thủ Đức',
      time: '1 ngày trước',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/42ad48f184944ff5e15defdbabdb46aac92fb6b8?width=518',
      liked: false,
      badge: 'Cho tặng'
    },
    {
      id: 12,
      title: 'Tai nghe Bluetooth Sony WH-1000XM4',
      price: '4.500.000 đ',
      condition: 'Độ mới: 96%',
      location: 'Phường Linh Xuân, Thủ Đức',
      time: '2 ngày trước',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/b82cc23c18d42cd15c7c1f9130315bebabc03699?width=518',
      liked: false
    }
  ];

  return (
    <div className="homepage">
      <Header />
      <HeroBanner />
      <ProductGrid products={products} />
      <Footer />
    </div>
  );
}
