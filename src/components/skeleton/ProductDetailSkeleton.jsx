'use client';

import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';

const ProductDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb Skeleton */}
        <nav className="mb-8">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image Skeleton */}
          <div className="relative space-y-2">
            {/* Main Image */}
            <div className="w-full h-96 lg:h-[600px] bg-gray-200 rounded-lg animate-pulse"></div>
            
            {/* Navigation Arrows */}
            <button className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-gray-200 shadow-md rounded-full p-2 z-10 animate-pulse">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
            </button>
            <button className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-gray-200 shadow-md rounded-full p-2 z-10 animate-pulse">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
            </button>

            {/* Slide Count */}
            <div className="text-center">
              <div className="h-4 w-12 bg-gray-200 rounded mx-auto animate-pulse"></div>
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-12 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <div className="h-5 w-16 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-16 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <div className="h-5 w-16 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Add to Cart Button */}
            <div className="h-12 w-full bg-gray-200 rounded animate-pulse"></div>

            {/* Extra Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetailSkeleton;
