import React from "react";
import { motion } from "motion/react";
import { UtensilsCrossed, Calendar, ShoppingCart, ShieldAlert, LogIn, LogOut, User as UserIcon, Menu as MenuIcon, X } from "lucide-react";
import { User } from "../types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  cartCount: number;
  onOpenCart: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onOpenAuth,
  cartCount,
  onOpenCart
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "menu", label: "Menu" },
    { id: "services", label: "Services" },
    { id: "about", label: "About Us" },
    { id: "contact", label: "Contact" }
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav id="app-navbar" className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Brand/Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleTabChange("home")}>
            <div className="bg-amber-600 text-white p-2.5 rounded-xl shadow-md shadow-amber-600/20">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div>
              <span className="font-serif text-2xl font-black tracking-tight text-neutral-800">
                BRUNCH<span className="text-amber-500 font-light">.</span>
              </span>
              <span className="block text-[9px] tracking-widest uppercase font-mono text-neutral-500 font-bold">
                American Inspired & Jamaican
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex space-x-1 items-center">
            {navItems.map((item) => (
              <button
                id={`nav-${item.id}`}
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium tracking-wide transition-colors ${
                  activeTab === item.id ? "text-amber-600" : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                {item.label}
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-4 right-4 h-0.5 bg-amber-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
            
            {user?.role === "admin" && (
              <button
                id="nav-dashboard"
                onClick={() => handleTabChange("dashboard")}
                className={`flex items-center space-x-1.5 px-4 py-2 ml-2 bg-amber-50 rounded-lg text-xs font-bold tracking-wider uppercase border border-amber-200 transition-colors ${
                  activeTab === "dashboard" ? "bg-amber-100 text-amber-800" : "text-amber-700 hover:bg-amber-100"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Admin Panel</span>
              </button>
            )}
          </div>

          {/* Action Buttons: Cart, Auth */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Cart Button */}
            <button
              id="navbar-cart-btn"
              onClick={onOpenCart}
              className="relative p-2.5 text-neutral-600 hover:text-amber-500 hover:bg-amber-50 rounded-xl border border-neutral-100 transition-all duration-200 cursor-pointer"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Quick Reservation Shortcut */}
            <button
              id="navbar-book-shortcut"
              onClick={() => handleTabChange("home")} // scroll or trigger in Home
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
              <span>Book Table</span>
            </button>

            {/* User Session Info */}
            {user ? (
              <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100">
                <div className="flex items-center space-x-1.5">
                  <div className="h-7 w-7 rounded-lg bg-neutral-200 flex items-center justify-center text-[11px] font-bold text-neutral-700 uppercase">
                    {user.username.slice(0, 2)}
                  </div>
                  <div className="text-left leading-none">
                    <span className="block text-xs font-semibold text-neutral-800 truncate max-w-[80px]">
                      {user.username}
                    </span>
                    <span className="text-[9px] uppercase font-mono text-amber-600 font-bold">
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1 px-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                id="navbar-login-btn"
                onClick={onOpenAuth}
                className="flex items-center space-x-1 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 px-4 py-2.5 rounded-xl text-xs font-semibold border border-neutral-200 transition-all cursor-pointer"
              >
                <LogIn className="h-4 w-4 text-neutral-500" />
                <span>Guest Sign In</span>
              </button>
            )}
          </div>

          {/* Quick Icons Mobile */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={onOpenCart}
              className="relative p-2 text-neutral-600 hover:bg-amber-50 rounded-lg border border-neutral-100 transition-all"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-white">
                  {cartCount}
                </span>
              )}
            </button>

            {user && (
              <div className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-700">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-600 hover:bg-amber-50 rounded-lg border border-neutral-100 transition-all"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-white border-b border-amber-100 shadow-lg px-4 pt-2 pb-6 space-y-2 absolute top-20 left-0 w-full"
        >
          {navItems.map((item) => (
            <button
              id={`nav-mobile-${item.id}`}
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`block w-full text-left px-4 py-2.5 rounded-xl text-base font-medium transition-all ${
                activeTab === item.id ? "bg-amber-100 text-amber-800 font-semibold" : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {item.label}
            </button>
          ))}

          {user?.role === "admin" && (
            <button
              id="nav-mobile-dashboard"
              onClick={() => handleTabChange("dashboard")}
              className={`block w-full text-left px-4 py-2.5 rounded-xl text-base font-bold text-amber-800 bg-amber-50 border border-amber-200 transition-all`}
            >
              Admin Operations Dashboard
            </button>
          )}

          <div className="pt-4 border-t border-amber-100 flex flex-col space-y-3 px-4">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-sm font-bold text-neutral-800">
                    {user.username}
                  </span>
                  <span className="text-[10px] tracking-wider uppercase font-mono text-amber-600 font-bold">
                    {user.role} Registered Account
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-red-50 text-red-600 font-medium rounded-lg text-xs"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="flex items-center justify-center space-x-1.5 bg-neutral-100 text-neutral-800 py-3 rounded-xl text-sm font-semibold border border-neutral-200 cursor-pointer"
              >
                <LogIn className="h-5 w-5" />
                <span>Sign In / Create Account</span>
              </button>
            )}
            
            <button
              onClick={() => handleTabChange("home")}
              className="flex items-center justify-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-xs font-bold tracking-wider uppercase shadow-md cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
              <span>Book A Dining Table</span>
            </button>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
