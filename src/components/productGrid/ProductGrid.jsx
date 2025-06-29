'use client';
import React from 'react'
import ProductCard from './ProductCard'
import { products } from '@/data/products' // Adjust if you're passing products as props instead

const ProductGrid = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Sweatshirts</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover cozy, stylish, and timeless unisex sweatshirts curated just for you.
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-4">
  {products.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>

    </section>
  )
}

export default ProductGrid
