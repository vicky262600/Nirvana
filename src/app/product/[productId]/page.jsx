'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { addItem } from '@/redux/cartSlice';
import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Truck, RotateCcw, Shield } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        const data = await res.json();
        setProduct(data);

        // Default select first color if available
        const firstColor = data.variants?.[0]?.color;
        if (firstColor) setSelectedColor(firstColor);
      } catch (err) {
        console.error('Error fetching product:', err.message);
      }
    };

    if (productId) fetchProduct();
  }, [productId]);

  // Get all unique sizes and colors
  const uniqueSizes = product ? [...new Set(product.variants.map(v => v.size))] : [];
  const uniqueColors = product ? [...new Set(product.variants.map(v => v.color))] : [];

  // Find available quantity for selected size + color
  const availableVariant = product
    ? product.variants.find(v => v.size === selectedSize && v.color === selectedColor)
    : null;
  const availableQuantity = availableVariant ? availableVariant.quantity : 0;

  // Quantity options capped at min(5, availableQuantity)
  const quantityOptions = [];
  const maxQuantity = Math.min(5, availableQuantity);
  for (let i = 1; i <= maxQuantity; i++) {
    quantityOptions.push(i);
  }

  // Check if size is available in selected color
  const isSizeAvailable = (size) =>
    product.variants.some(v => v.size === size && v.color === selectedColor && v.quantity > 0);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    if (!selectedColor) {
      alert('Please select a color');
      return;
    }
    if (quantity > availableQuantity) {
      alert(`Only ${availableQuantity} items available in selected size and color.`);
      return;
    }

    dispatch(
      addItem({
        product,
        price: product.isOnSale ? product.salePrice : product.price,
        size: selectedSize,
        color: selectedColor,
        quantity,
      })
    );
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/">
            <Button>Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <nav className="mb-8">
          <Link href="/" className="text-gray-500 hover:text-black">
            Shop
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-black">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image Carousel */}
          <div className="relative space-y-2">
            <Swiper
              modules={[Navigation]}
              spaceBetween={10}
              slidesPerView={1}
              navigation={{
                nextEl: '.next-btn',
                prevEl: '.prev-btn',
              }}
              onSlideChange={(swiper) => setPhotoIndex(swiper.activeIndex)}
              className="rounded-lg overflow-hidden"
            >
              {product.images.map((img, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={img}
                    alt={`Product ${index + 1}`}
                    onClick={() => setIsOpen(true)}
                    className="w-full h-96 lg:h-[600px] object-cover cursor-pointer rounded-lg"
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Arrows */}
            <button className="prev-btn absolute top-1/2 -left-4 transform -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10">
              &#8592;
            </button>
            <button className="next-btn absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10">
              &#8594;
            </button>

            {/* Slide count */}
            <div className="text-center text-sm text-gray-500 mt-2">
              {photoIndex + 1} / {product.images.length}
            </div>

            {/* Fullscreen Viewer */}
            {isOpen && (
              <Lightbox
                mainSrc={product.images[photoIndex]}
                nextSrc={product.images[(photoIndex + 1) % product.images.length]}
                prevSrc={product.images[(photoIndex + product.images.length - 1) % product.images.length]}
                onCloseRequest={() => setIsOpen(false)}
                onMovePrevRequest={() =>
                  setPhotoIndex((photoIndex + product.images.length - 1) % product.images.length)
                }
                onMoveNextRequest={() =>
                  setPhotoIndex((photoIndex + 1) % product.images.length)
                }
              />
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">{product.title}</h1>

            <div className="flex items-center gap-4">
              {product.isOnSale ? (
                <>
                  <span className="text-2xl font-bold text-gray-400 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-2xl font-bold text-black flex items-center gap-1">
                    ${product.salePrice.toFixed(2)} 
                  </span>
                  <span className="ml-2 inline-block text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    Sale
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-black">${product.price.toFixed(2)}</span>
              )}
            </div>

            {/* Size Selection */}
            {uniqueSizes.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Size</h3>
                <div className="flex gap-2 flex-wrap">
                  {uniqueSizes.map((size) => {
                    const available = isSizeAvailable(size);
                    return (
                      <button
                        key={size}
                        disabled={!available}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border rounded-md ${
                          selectedSize === size
                            ? 'border-black bg-black text-white'
                            : available
                            ? 'border-gray-300 hover:border-gray-400'
                            : 'border-gray-300 text-gray-400 line-through cursor-not-allowed'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {uniqueColors.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Color</h3>
                <div className="flex gap-2">
                  {uniqueColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        setSelectedSize(''); // reset size on color change for clarity
                        setQuantity(1); // reset quantity
                      }}
                      className={`px-4 py-2 border rounded-md ${
                        selectedColor === color
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-medium mb-2">Quantity</h3>
              <Select
                value={quantity.toString()}
                onValueChange={(val) => setQuantity(parseInt(val))}
                disabled={!selectedSize || !selectedColor || availableQuantity === 0}
              >
                <SelectTrigger className="w-32 border px-3 py-2 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {quantityOptions.length === 0 ? (
                    <SelectItem value="0" disabled>
                      Out of Stock
                    </SelectItem>
                  ) : (
                    quantityOptions.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="w-full mt-4"
              disabled={!selectedSize || !selectedColor || availableQuantity === 0}
            >
              Add to Cart
            </Button>

            <Button className="w-full mt-4" disabled>
              Buy It Now
            </Button>

            {/* Extra Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm">Free Shipping</p>
                  <p className="text-xs text-gray-600">On orders over $100</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm">Easy Returns</p>
                  <p className="text-xs text-gray-600">30-day return policy</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm">Secure Payment</p>
                  <p className="text-xs text-gray-600">SSL encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
