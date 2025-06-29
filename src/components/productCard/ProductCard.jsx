'use client';
import React from 'react';
import { Heart } from 'lucide-react';

const ProductCard = ({ product }) => {
  return (
    <div 
      className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
    //   onClick={() => onProductClick(product)}
    >
      {/* Image Section */}
      <div className="relative overflow-hidden rounded-t-lg">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // Favorite/like functionality can be added later
          }}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
        >
          <Heart className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h4 className="text-sm text-gray-500 mb-1">{product.title}</h4> {/* Sweatshirt Type */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3> {/* Specific Name */}
        <p className="text-2xl font-bold text-gray-900">${product.price}</p>
      </div>
    </div>
  );
};

export default ProductCard;
