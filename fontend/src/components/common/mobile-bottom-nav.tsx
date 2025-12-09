"use client"

import Link from "next/link"
import { Home, Heart, LayoutGrid } from "lucide-react"
import { usePathname } from "next/navigation"
import { FaWhatsapp } from "react-icons/fa";
import { ImWhatsapp } from "react-icons/im";

const MobileBottomNav =()=> {
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shop", href: "/shop", icon: LayoutGrid },
    { name: "Message", href: "https://web.whatsapp.com/send?phone=8801741211810&text=", icon: ImWhatsapp },
    { name: "Wishlist", href: "/wishlist", icon: Heart },
    // { name: "Account", href: "/account", icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-secondary text-white shadow-lg md:hidden z-50">
      <nav className="flex justify-around h-16 items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-2 text-xs  transition-colors ${
                isActive ? "text-primary" : "text-white"
              }`}
            >
              <item.icon className="size-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default MobileBottomNav