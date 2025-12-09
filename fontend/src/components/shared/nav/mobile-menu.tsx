"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Heart, ShoppingCart, User, LogIn, UserPlus } from "lucide-react"
import Link from "next/link"

interface MobileMenuProps {
  isOpen: boolean
  navigationLinks: Array<{ name: string; href: string }>
  wishlistCount: number
  cartCount: number
  isAuthenticated: boolean
  isLoading: boolean
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  navigationLinks,
  wishlistCount,
  cartCount,
  isAuthenticated,
  isLoading,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden bg-[#2a2b4a] border-top border-[#3a3b5a]"
        >
          <div className="px-4 py-4 space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-[#3a3b5a] rounded-lg bg-[#1a1b3a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Search products..."
                aria-label="Search products"
              />
            </div>

            <div className="space-y-2">
              {navigationLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-[#3a3b5a] rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#2a2b4a]"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-around pt-4 border-t border-[#3a3b5a]">
              <Link href="/wishlist">
                <button className="flex flex-col items-center space-y-1 p-2 text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#2a2b4a] rounded-md">
                  <div className="relative">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                        {wishlistCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs">Wishlist</span>
                </button>
              </Link>

              <Link href="/cart">
                <button className="flex flex-col items-center space-y-1 p-2 text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#2a2b4a] rounded-md">
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs">Cart</span>
                </button>
              </Link>

              <Link href={isAuthenticated ? "/profile" : "/login"}>
                <button className="flex flex-col items-center space-y-1 p-2 text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#2a2b4a] rounded-md">
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="text-xs">Account</span>
                </button>
              </Link>
            </div>

            {!isAuthenticated && (
              <div className="space-y-2 pt-4 border-t border-[#3a3b5a]">
                <Link href="/login">
                  <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#2a2b4a]">
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </button>
                </Link>
                <Link href="/register">
                  <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-[#3a3b5a] text-gray-300 rounded-lg hover:bg-[#3a3b5a] hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#2a2b4a]">
                    <UserPlus className="h-4 w-4" />
                    <span>Register</span>
                  </button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MobileMenu
