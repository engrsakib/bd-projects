"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Heart, User, Menu, X, ChevronDown, Truck, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import logoImage from "@/assets/logo/logo-02.png"
import { Container } from "../common/container"
import { useGetUserInfoQuery, useGetAllSubCategoriesQuery } from "@/redux/api/api-query"
import { toast } from "sonner"
import { API_BASE_URL } from "@/config"
import { useRouter } from "next/navigation"
import Cookie from "js-cookie"
import { useAppDispatch, useAppSelector } from "@/redux/store"
import { selectCartItems } from "@/redux/features/cart-slice"
import RowSkeleton from "./nav/row-skeleton"
import CategoryRow from "./nav/category-row"
import { chunkInto } from "@/lib/utils"
import SearchBar from "./nav/search-bar"
import ProfileDropdown from "./nav/profile-dropdown"
import MobileMenu from "./nav/mobile-menu"

// NEW: preorder selectors/actions
import {
  selectSavedForLater,
  selectPreOrderCurrent,
  moveSavedToPreOrder,
} from "@/redux/features/preorder-slice"

const navigationLinks = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "About Us", href: "/about" },
  { name: "Contact Us", href: "/contact" },
]

const NAV_HEIGHT_PX = 64 // matches h-16
const COLUMNS = 5 // like the boAt screenshot

const Navbar = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [hoverLock, setHoverLock] = useState<ReturnType<typeof setTimeout> | null>(null)

  const lines = useAppSelector(selectCartItems)
  const cartCount = lines.length || 0

  // NEW: saved pre-orders & current pre-order state
  const savedForLater = useAppSelector(selectSavedForLater)
  const savedCount = savedForLater.length
  const firstSaved = savedForLater[0] // most recently saved
  const currentPreOrder = useAppSelector(selectPreOrderCurrent)

  const [wishlistCount] = useState(5)

  const { data, isLoading, refetch } = useGetUserInfoQuery({})
  const isAuthenticated = data?.success && data?.data
  const user = data?.data
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  const { data: catRes, isLoading: catsLoading, error: catsError } = useGetAllSubCategoriesQuery({})
  const subcategories = useMemo(() => catRes?.data?.data || [], [catRes?.data?.data])
  const columns = useMemo(() => chunkInto(subcategories, COLUMNS), [subcategories])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false)
        setIsProfileDropdownOpen(false)
        setIsCategoriesOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch(API_BASE_URL + `/user/logout`, {
        method: "DELETE",
        credentials: "include",
      })
      refetch()
      Cookie.remove("cbd_rtkn_7c4d1")
      Cookie.remove("cbd_atkn_91f2a")
      router.push("/login")
      toast.success("Logged out successfully")
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setIsProfileDropdownOpen(false)
    }
  }

  // hover helpers to prevent flicker when moving between trigger & panel
  const openCategories = useCallback(() => {
    if (hoverLock) clearTimeout(hoverLock)
    setIsCategoriesOpen(true)
  }, [hoverLock])

  const closeCategories = useCallback(() => {
    if (hoverLock) clearTimeout(hoverLock)
    const t = setTimeout(() => setIsCategoriesOpen(false), 120)
    setHoverLock(t)
  }, [hoverLock])


  const handleQuickPreOrderNow = useCallback(() => {
    
    toast.success("Pre-order ready! Finish it at checkout.")
    router.push("/pre-order") 
  }, [router])

  return (
    <nav className="bg-secondary border-b border-[#2a2b4a] sticky top-0 z-[100]">
      <Container className="">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center md:w-2/4">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center" aria-label="CLOUDY - Home">
                <Image
                  src={logoImage || "/placeholder.svg"}
                  alt="CLOUDY Logo"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
            </div>

            
            <div className="hidden md:block">
              <div className="ml-5 flex items-baseline space-x-1">
                {/* Categories trigger */}
                <div className="relative" onMouseEnter={openCategories} onMouseLeave={closeCategories}>
                  <button
                    className={`flex items-center gap-1 text-gray-100 hover:text-white px-3 py-2 text-xs font-medium transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#1a1b3a] ${isCategoriesOpen ? "bg-[#2a2b4a]" : "hover:bg-[#2a2b4a]"
                      }`}
                    aria-haspopup="dialog"
                    aria-expanded={isCategoriesOpen}
                    aria-controls="desktop-categories-panel"
                  >
                    Categories
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${isCategoriesOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {/* your original links */}
                {navigationLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-gray-300 hover:text-white px-3 py-2 text-xs font-medium transition-colors duration-200 hover:bg-[#2a2b4a] rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#1a1b3a]"
                    aria-label={`Navigate to ${link.name}`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {savedCount > 0 && (
            <button
              onClick={handleQuickPreOrderNow}
              className="relative hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 text-primary shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#1a1b3a]"
              aria-label={`Quick pre-order (${savedCount} saved)`}
            >
              <Clock className="h-4 w-4" />
              Quick Pre-Order
              <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-white/20 text-[10px]">
                {savedCount}
              </span>
            </button>
          )}
          <SearchBar />

          <div className="hidden md:flex items-center space-x-3">



            <Link href="/track-order">
              <button
                className="relative p-2 text-gray-300 hover:text-white hover:bg-[#2a2b4a] rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#1a1b3a]"
                aria-label={`Track order`}
              >
                <Truck className="h-5 w-5" />
              </button>
            </Link>

            <Link href="/cart">
              <button
                className="relative p-2 text-gray-300 hover:text-white hover:bg-[#2a2b4a] rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#1a1b3a]"
                aria-label={`Shopping cart (${cartCount} items)`}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </button>
            </Link>

            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-1 p-2 text-gray-300 hover:text-white hover:bg-[#2a2b4a] rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#1a1b3a]"
                aria-label="User account menu"
                aria-expanded={isProfileDropdownOpen}
                aria-haspopup="menu"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              <ProfileDropdown
                isOpen={isProfileDropdownOpen}
                isAuthenticated={isAuthenticated}
                user={user}
                isLoading={isLoading}
                onLogout={handleLogout}
                onClose={() => setIsProfileDropdownOpen(false)}
              />
            </div>
          </div>

          {/* MOBILE cluster */}
          <div className="md:hidden flex items-center gap-2">
            {savedCount > 0 && (
              <button
                onClick={handleQuickPreOrderNow}
                className="relative p-2 text-gray-100 hover:text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#1a1b3a]"
                aria-label={`Quick pre-order (${savedCount} saved)`}
              >
                <Clock className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-white/20 text-white text-[10px] rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center font-medium">
                  {savedCount}
                </span>
              </button>
            )}

            <Link href="/cart">
              <button
                className="relative p-2 text-gray-300 hover:text-white hover:bg-[#2a2b4a] rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#1a1b3a]"
                aria-label={`Shopping cart (${cartCount} items)`}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </button>
            </Link>

            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-1 p-2 text-gray-300 hover:text-white hover:bg-[#2a2b4a] rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#1a1b3a]"
                aria-label="User account menu"
                aria-expanded={isProfileDropdownOpen}
                aria-haspopup="menu"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              <ProfileDropdown
                isOpen={isProfileDropdownOpen}
                isAuthenticated={isAuthenticated}
                user={user}
                isLoading={isLoading}
                onLogout={handleLogout}
                onClose={() => setIsProfileDropdownOpen(false)}
              />
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-300 hover:text-white hover:bg-[#2a2b4a] rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#1a1b3a]"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </Container>

      {/* ===== DESKTOP FULL-WIDTH CATEGORIES  ===== */}
      <AnimatePresence>
        {isCategoriesOpen && (
          <motion.div
            id="desktop-categories-panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onMouseEnter={openCategories}
            onMouseLeave={closeCategories}
            className="hidden md:block fixed left-0 right-0 z-[95] border-t border-gray-200 bg-white"
            style={{ top: NAV_HEIGHT_PX }}
            role="dialog"
            aria-label="Browse categories"
          >
            <div className="mx-auto max-w-[1600px] px-8">
              <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
                {catsLoading ? (
                  <div className="grid grid-cols-5 gap-10 py-6">
                    {Array.from({ length: COLUMNS }).map((_, col) => (
                      <div key={col} className="space-y-2">
                        {Array.from({ length: 6 }).map((__, i) => (
                          <RowSkeleton key={i} />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : catsError ? (
                  <div className="py-10 text-center text-gray-600">
                    <p className="text-sm">Failed to load categories</p>
                  </div>
                ) : subcategories.length === 0 ? (
                  <div className="py-10 text-center text-gray-600">
                    <p className="text-sm">No categories found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-10 py-6">
                    {columns.map((col, idx) => (
                      <div key={idx} className="space-y-1">
                        {col.map((subcategory: any) => (
                          <CategoryRow
                            key={subcategory.id || subcategory._id || subcategory.slug || subcategory.name}
                            subcategory={subcategory}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        navigationLinks={navigationLinks}
        wishlistCount={wishlistCount}
        cartCount={cartCount}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
      />
    </nav>
  )
}

export default Navbar
