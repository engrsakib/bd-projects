import Image from "next/image"
import Link from "next/link"
import { Facebook, Instagram,  Mail, Phone, MapPin } from "lucide-react"
import logoImage from '@/assets/logo/logo-02.png'
import { Container } from "../common/container"

const Footer = () => {
    return (
        <footer className="w-full" style={{ backgroundColor: "#0e012d" }}>
            <Container className="py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <Link href="/" aria-label="TheCloudyBD Home" className="">
                            <Image src={logoImage} alt="TheCloudyBD Logo" width={200} height={60} className="object-contain" />
                        </Link>
                        <p className="text-gray-300 text-xs mt-3 leading-relaxed">
                            TheCloudyBD is your trusted eCommerce shop for quality products, affordable prices, secure payments, and
                            fast delivery—shopping made simple!
                        </p>
                        <div className="flex space-x-4">
                            <Link
                                href="https://www.facebook.com/profile.php?id=61550563063492"
                                target="_blank"
                                className="text-gray-300 hover:text-white transition-colors duration-200"
                                aria-label="Facebook"
                            >
                                <Facebook size={20} />
                            </Link>
                            <Link
                                href="https://www.instagram.com/cloudyclub0_/profilecard/"
                                target="_blank"
                                className="text-gray-300 hover:text-white transition-colors duration-200"
                                aria-label="Instagram"
                            >
                                <Instagram size={20} />
                            </Link>
                            <Link
                                href="https://www.tiktok.com/@cloudybd.com?lang=en"
                                target="_blank"
                                className="text-gray-300 hover:text-white transition-colors duration-200"
                                aria-label="TikTok"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Women&apos;s Fusion</h4>
                        <ul className="space-y-1">
                            <li>
                                <Link
                                    href="/fusion-wear"
                                    className="text-gray-300 hover:text-white transition-colors duration-200 text-xs"
                                >
                                    Fusion Dresses
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/ethnic-wear"
                                    className="text-gray-300 hover:text-white transition-colors duration-200 text-xs"
                                >
                                    Ethnic Collection
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/western-wear"
                                    className="text-gray-300 hover:text-white transition-colors duration-200 text-xs"
                                >
                                    Western Fusion
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/accessories"
                                    className="text-gray-300 hover:text-white transition-colors duration-200 text-xs"
                                >
                                    Accessories
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/new-arrivals"
                                    className="text-gray-300 hover:text-white transition-colors duration-200 text-xs"
                                >
                                    New Arrivals
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Services</h4>
                        <ul className="space-y-1">
                            <li>
                                <Link
                                    href="/pre-orders"
                                    className="text-gray-300 hover:text-white transition-colors duration-200 text-xs"
                                >
                                    Pre-Orders Available
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/custom-orders"
                                    className="text-gray-300 hover:text-white transition-colors duration-200 text-xs"
                                >
                                    Custom Orders
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/size-guide"
                                    className="text-gray-300 hover:text-white transition-colors duration-200 text-xs"
                                >
                                    Size Guide
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/shipping"
                                    className="text-gray-300 hover:text-white transition-colors duration-200 text-xs"
                                >
                                    Fast Delivery
                                </Link>
                            </li>
                            <li>
                                <Link href="/returns" className="text-gray-300 hover:text-white transition-colors duration-200 text-xs">
                                    Returns & Exchange
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Contact Us</h4>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <Phone size={14} className="text-gray-300" />
                                <span className="text-gray-300 text-xs">+880 1834 956 470</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Mail size={14} className="text-gray-300" />
                                <span className="text-gray-300 text-xs">support@thecloudybd.com</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <MapPin size={14} className="text-gray-300 mt-1" />
                                <span className="text-gray-300 text-xs">Singboard, Gazipur</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div
                                className="inline-block bg-primary-mid px-3 py-1 rounded-full text-xs font-medium text-white"
                                
                            >
                                Pre-Orders Open
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-gray-700 mt-8 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="text-gray-300 text-xs">© {new Date().getFullYear()} TheCloudyBD. All rights reserved.</div>
                        <div className="flex space-x-6">
                            <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors duration-200 text-xs">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="text-gray-300 hover:text-white transition-colors duration-200 text-xs">
                                Terms of Service
                            </Link>
                            <Link href="/support" className="text-gray-300 hover:text-white transition-colors duration-200 text-xs">
                                Support
                            </Link>
                        </div>
                    </div>
                </div>
            </Container>
        </footer>
    )
}

export default Footer;