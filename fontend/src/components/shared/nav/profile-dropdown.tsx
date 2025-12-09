"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LogIn, UserPlus, UserCircle, ShoppingCart, LogOut } from "lucide-react"
import Link from "next/link"

interface User {
    name: string
    email?: string
    phone_number?: string
    role: string
    status: string
}

interface ProfileDropdownProps {
    isOpen: boolean
    isAuthenticated: boolean
    user?: User
    isLoading: boolean
    onLogout: () => void
    onClose: () => void
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
    isOpen,
    isAuthenticated,
    user,
    isLoading,
    onLogout,
    onClose,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-56 bg-[#2a2b4a] border border-[#3a3b5a] rounded-xl shadow-2xl z-50 overflow-hidden"
                    role="menu"
                    aria-orientation="vertical"
                >
                    {isAuthenticated && user ? (
                        <>
                            <div className="px-4 py-3 border-b border-[#3a3b5a]">
                                <p className="text-sm text-white font-medium truncate">{user.name}</p>
                                <p className="text-xs text-gray-400 mt-1">{user.email || user.phone_number}</p>
                                <p className="text-xs text-gray-500 capitalize">
                                    {user.role} • {user.status}
                                </p>
                            </div>

                            <div className="py-2">
                                <Link href="/profile">
                                    <button
                                        className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-[#3a3b5a] transition-colors duration-150 focus:outline-none focus:bg-[#3a3b5a] focus:text-white"
                                        role="menuitem"
                                        onClick={onClose}
                                    >
                                        <UserCircle className="h-4 w-4 mr-3" />
                                        My Profile
                                    </button>
                                </Link>

                                <Link href="/orders">
                                    <button
                                        className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-[#3a3b5a] transition-colors duration-150 focus:outline-none focus:bg-[#3a3b5a] focus:text-white"
                                        role="menuitem"
                                        onClick={onClose}
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-3" />
                                        My Orders
                                    </button>
                                </Link>

                                <button
                                    className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-[#3a3b5a] transition-colors duration-150 focus:outline-none focus:bg-[#3a3b5a] focus:text-white"
                                    role="menuitem"
                                    onClick={onLogout}
                                >
                                    <LogOut className="h-4 w-4 mr-3" />
                                    Sign Out
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="px-4 py-3 border-b border-[#3a3b5a]">
                                <p className="text-sm text-gray-400">Welcome to CLOUDY</p>
                                <p className="text-xs text-gray-500 mt-1">Classy, Comfort, Casual</p>
                            </div>

                            <div className="py-2">
                                <Link href="/login">
                                    <button
                                        className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-[#3a3b5a] transition-colors duration-150 focus:outline-none focus:bg-[#3a3b5a] focus:text-white"
                                        role="menuitem"
                                        onClick={onClose}
                                    >
                                        <LogIn className="h-4 w-4 mr-3" />
                                        Sign In
                                    </button>
                                </Link>

                                <Link href="/register">
                                    <button
                                        className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-[#3a3b5a] transition-colors duration-150 focus:outline-none focus:bg-[#3a3b5a] focus:text-white"
                                        role="menuitem"
                                        onClick={onClose}
                                    >
                                        <UserPlus className="h-4 w-4 mr-3" />
                                        Register
                                    </button>
                                </Link>
                            </div>

                            <div className="px-4 py-3 bg-gradient-to-r from-pink-500/10 to-purple-600/10 border-t border-[#3a3b5a]">
                                <p className="text-xs text-gray-400">Join CLOUDY for exclusive offers</p>
                            </div>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default ProfileDropdown
