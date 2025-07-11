'use client';

import React from 'react';
import Link from 'next/link';

const ProductCard = ({ product }) => {
  return (
    <Link href={`/product/${product._id}`} className="group block shadow-none hover:shadow-lg transition-shadow bg-white overflow-hidden relative">
      <div className="relative overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-48 sm:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {product.isNew && (
          <span className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-xs rounded">
            New
          </span>
        )}

        {product.isOnSale && (
          <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded">
              Sale
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4">
        <h3 className="text-lg mb-1 group-hover:text-gray-700 transition-colors line-clamp-2">
          {product.title}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {product.isOnSale && product.originalPrice && (
              <span className="text-gray-400 line-through text-sm">
                ${product.originalPrice}
              </span>
            )}
            <span
              className={`font-bold ${
                product.isOnSale ? 'text-red-600' : 'text-black'
              }`}
            >
              ${product.price}
            </span>
          </div>

          {product.rating !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600">{product.rating}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
