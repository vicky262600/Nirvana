
"use client";

import React from 'react';
import ProductCard from './ProductCard';
import { products } from '@/data/products';

const ProductGrid = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore our curated selection of premium clothing and accessories
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map(product => (
          <ProductCard 
            key={product.productId} 
            product={product}
          />
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;
