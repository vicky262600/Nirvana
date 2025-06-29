"use client";

import React, { useState } from 'react';
import { Search, ShoppingBag, Menu, X, User } from 'lucide-react';

const Navbar = ({ cartItemsCount, onCartClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-900">StyleStore</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">New Arrivals</a>
            <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Women</a>
            <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Men</a>
            <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Accessories</a>
            <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Sale</a>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-700 hover:text-gray-900">
              <Search className="h-5 w-5" />
            </button>
            <button className="text-gray-700 hover:text-gray-900">
              <User className="h-5 w-5" />
            </button>
            <button 
              onClick={onCartClick}
              className="text-gray-700 hover:text-gray-900 relative"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden text-gray-700 hover:text-gray-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">New Arrivals</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Women</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Men</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Accessories</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Sale</a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;