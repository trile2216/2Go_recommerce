import { useState } from 'react';

export default function ProductGallery({ images }) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="product-gallery">
      <div className="main-image-wrapper">
        <img 
          src={images[selectedImage]} 
          alt="Product" 
          className="main-image"
        />
      </div>
      
      <div className="thumbnail-gallery">
        {images.map((image, index) => (
          <button
            key={index}
            className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
            onClick={() => setSelectedImage(index)}
          >
            <img src={image} alt={`Thumbnail ${index + 1}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
