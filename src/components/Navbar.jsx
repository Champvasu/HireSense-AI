'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Shield, PlusCircle, LayoutDashboard, LogOut, LogIn, Menu, X, Search } from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    // Student role links
    ...(session?.user?.role === 'student' ? [
      { href: '/internships', label: 'Get Hired', icon: Briefcase, roles: ['student'] },
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['student'] },
    ] : []),
    // Company role links
    ...(session?.user?.role === 'company' ? [
      { href: '/post', label: 'Hire Talent', icon: PlusCircle, roles: ['company'] },
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['company'] },
    ] : []),
    // Admin role links - has access to both workflows
    ...(session?.user?.role === 'admin' ? [
      { href: '/internships', label: 'Get Hired', icon: Briefcase, roles: ['admin'] },
      { href: '/post', label: 'Hire Talent', icon: PlusCircle, roles: ['admin'] },
      { href: '/admin', label: 'Admin', icon: Shield, roles: ['admin'] },
    ] : []),
    // Default links for non-logged-in users
    
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }} 
      animate={{ y: 0 }} 
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E8EAF0]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#3DD68C]/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#3DD68C]" />
              </div>
              <span className="text-lg font-bold text-[#1A1A2E]">HireSense AI</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[#1A1A2E] hover:text-[#3DD68C] transition-colors"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-[#F0F2F5] animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F0F2F5]">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt={session.user.name} className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#3DD68C]/20 flex items-center justify-center text-[#3DD68C] text-xs font-semibold">
                      {session.user.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-sm text-[#1A1A2E]">{session.user.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#3DD68C]/15 text-[#2BC47A] border border-[#3DD68C]/20 capitalize">
                    {session.user.role}
                  </span>
                </div>
                <button 
                  onClick={() => signOut()} 
                  className="p-2 rounded-lg text-[#6B7280] hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signIn()} 
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1A1A2E] hover:opacity-85 text-white text-sm font-medium transition-opacity"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>

          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden p-2 rounded-lg text-[#6B7280] hover:text-[#1A1A2E]"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }} 
            className="md:hidden bg-white border-t border-[#E8EAF0]"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setIsOpen(false)} 
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#1A1A2E] hover:text-[#3DD68C] hover:bg-[#F0F2F5]"
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              {session ? (
                <button 
                  onClick={() => { signOut(); setIsOpen(false); }} 
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              ) : (
                <button 
                  onClick={() => { signIn(); setIsOpen(false); }} 
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#3DD68C] text-white"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
