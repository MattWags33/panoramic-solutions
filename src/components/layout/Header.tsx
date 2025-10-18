'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X, ChevronDown, Calendar } from 'lucide-react'

import { cn } from '@/shared/utils/cn'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Offerings', href: '/offerings' },
  { 
    name: 'Products', 
    href: '/products',
    hasDropdown: true,
    dropdownItems: [
      { name: 'PPM-Tool Finder', href: '/ppm-tool' }
    ]
  },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close dropdown if clicking outside the header area and not on mobile menu
      const target = event.target as Element
      if (!target.closest('header') && !activeDropdown?.includes('mobile-')) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [activeDropdown])

  const toggleDropdown = (itemName: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const newActiveDropdown = activeDropdown === itemName ? null : itemName
    setActiveDropdown(newActiveDropdown)
  }

  const isCurrentPage = (href: string) => pathname === href
  const isCurrentDropdownPage = (dropdownItems: any[]) => 
    dropdownItems.some(item => pathname === item.href)

  return (
    <header
      className="fixed top-0 w-full z-[60] bg-white shadow-lg py-2 md:py-2"
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' // Increased minimum padding from 8px to 12px
      }}
    >
      <nav className="container px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16">
            <Image
              src="/images/Logo_Panoramic_Solutions.webp"
              alt="Panoramic Solutions Logo"
              fill
              sizes="(max-width: 640px) 40px, (max-width: 768px) 48px, (max-width: 1024px) 56px, 64px"
              className="object-contain group-hover:opacity-80 transition-opacity"
              priority
            />
          </div>
          <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-midnight">
            <span className="hidden sm:inline">Panoramic Solutions</span>
            <span className="sm:hidden">Panoramic</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
          {navigation.map((item) => (
            <div key={item.name} className="relative group">
              {item.hasDropdown ? (
                <>
                  <button
                    className={cn(
                      "flex items-center space-x-1 text-sm font-medium transition-colors hover:text-alpine py-2",
                      isCurrentDropdownPage(item.dropdownItems || [])
                        ? 'text-alpine'
                        : 'text-midnight/70'
                    )}
                  >
                    <span>{item.name}</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                  </button>
                  
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-midnight/10 rounded-lg shadow-xl z-[65] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {item.dropdownItems?.map((dropdownItem) => (
                      <Link
                        key={dropdownItem.name}
                        href={dropdownItem.href}
                        className={cn(
                          "block px-4 py-3 text-sm font-medium transition-colors hover:bg-alpine/5 hover:text-alpine first:rounded-t-lg last:rounded-b-lg",
                          pathname === dropdownItem.href
                            ? 'text-alpine bg-alpine/10'
                            : 'text-midnight/70'
                        )}
                      >
                        {dropdownItem.name}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-alpine py-2",
                    isCurrentPage(item.href)
                      ? 'text-alpine'
                      : 'text-midnight/70'
                  )}
                >
                  {item.name}
                </Link>
              )}
              
              {/* Unified underline positioning for ALL items at the same container level */}
              {((item.hasDropdown && isCurrentDropdownPage(item.dropdownItems || [])) || 
                (!item.hasDropdown && isCurrentPage(item.href))) && (
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-0.5 bg-alpine"
                  layoutId="activeTab"
                />
              )}
            </div>
          ))}
          
          <Button
            size="sm"
            className="btn-hover-lift bg-green-600 hover:bg-green-700 text-white px-6 py-2 flex items-center gap-2"
            onClick={() => window.open('https://app.onecal.io/b/matt-wagner/schedule-a-meeting-with-matt', '_blank')}
          >
            <Calendar className="w-4 h-4" />
            Book A Call
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-3 text-midnight hover:text-alpine transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
          style={{ minWidth: '48px', minHeight: '48px' }}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="lg:hidden bg-white/95 backdrop-blur-sm border-t border-midnight/10 shadow-lg relative z-[65]"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container px-4 sm:px-6 py-6 space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.hasDropdown ? (
                    <div>
                      <button
                        onClick={(e) => toggleDropdown(`mobile-${item.name}`, e)}
                        className={cn(
                          "w-full flex items-center justify-between py-3 px-4 text-base font-medium transition-colors hover:text-alpine hover:bg-alpine/5 rounded-lg",
                          isCurrentDropdownPage(item.dropdownItems || [])
                            ? 'text-alpine bg-alpine/10'
                            : 'text-midnight/70'
                        )}
                        style={{ minHeight: '48px' }}
                      >
                        <span>{item.name}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          activeDropdown === `mobile-${item.name}` ? 'rotate-180' : ''
                        )} />
                      </button>
                      
                      {activeDropdown === `mobile-${item.name}` && (
                        <div className="ml-4 mt-1 space-y-1 relative z-[65]">
                            {item.dropdownItems?.map((dropdownItem) => (
                              <Link
                                key={dropdownItem.name}
                                href={dropdownItem.href}
                                className={cn(
                                  "block py-2 px-4 text-base font-medium transition-colors hover:text-alpine hover:bg-alpine/5 rounded-lg",
                                  pathname === dropdownItem.href
                                    ? 'text-alpine bg-alpine/10'
                                    : 'text-midnight/70'
                                )}
                                onClick={() => {
                                  setIsMobileMenuOpen(false)
                                  setActiveDropdown(null)
                                }}
                                style={{ minHeight: '48px' }}
                              >
                                {dropdownItem.name}
                              </Link>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "block py-3 px-4 text-base font-medium transition-colors hover:text-alpine hover:bg-alpine/5 rounded-lg",
                        isCurrentPage(item.href)
                          ? 'text-alpine bg-alpine/10'
                          : 'text-midnight/70'
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{ minHeight: '48px' }}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
              
              <div className="pt-4">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 flex items-center justify-center gap-2"
                  style={{ minHeight: '48px' }}
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    window.open('https://app.onecal.io/b/matt-wagner/schedule-a-meeting-with-matt', '_blank')
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  Book A Call
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}