import React from "react";
import { motion } from "motion/react";
import { ShoppingBag, Utensils, Star, Flame, MapPin } from "lucide-react";

interface HeroProps {
  onOrderNow: () => void;
  onBookNow: () => void;
}

export default function Hero({ onOrderNow, onBookNow }: HeroProps) {
  return (
    <div className="relative overflow-hidden bg-stone-950 text-white py-14 sm:py-20 lg:py-24">
      {/* Visual background image with state-driven subtle zoom transition */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.img
          initial={{ scale: 1.15, opacity: 0.15 }}
          animate={{ scale: 1.0, opacity: 0.22 }}
          transition={{ duration: 15, ease: "easeOut", repeat: Infinity, repeatType: "reverse" }}
          src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1600"
          alt="Premium Fine Dining Brunch atmosphere in Gulshan-1"
          className="h-full w-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900/95 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Copy Column */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-6 sm:space-y-8 text-left">
            {/* Tag Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-amber-400 text-xs font-semibold tracking-wide uppercase"
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>Gourmet Jamaican & American Avant-Garde</span>
            </motion.div>

            {/* Main Premium Heading */}
            <div className="space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none"
              >
                Where Luxury Meets <br />
                <span className="text-amber-400 italic font-light drop-shadow-sm">American Inspired</span> Brunch
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="max-w-xl text-stone-300 text-sm sm:text-base leading-relaxed font-sans"
              >
                Nestled in the prestigious Gulshan 1 circle, Dhaka, we compose an exquisite luxury balance of prime aged American beef cuts with pit-smoked Kingston Jamaican jerks. Fine-dining plates meticulously crafted for the gourmand.
              </motion.p>
            </div>

            {/* Location indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center space-x-2 text-stone-300 bg-stone-900 border border-stone-800 p-2.5 px-4 rounded-2xl w-fit"
            >
              <MapPin className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide">Plot 14, Road 112, Gulshan 1, Dhaka</span>
            </motion.div>

            {/* Primary Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 pt-2"
            >
              <button
                id="hero-order-now-btn"
                onClick={onOrderNow}
                className="flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black px-8 py-4 rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 transition-all text-sm uppercase tracking-wider hover:-translate-y-0.5 duration-200 cursor-pointer"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Order Takeaway Now</span>
              </button>

              <button
                id="hero-book-now-btn"
                onClick={onBookNow}
                className="flex items-center justify-center space-x-2 bg-transparent hover:bg-white/5 text-white font-bold px-8 py-4 rounded-xl border border-white/20 hover:border-white/40 transition-all text-sm uppercase tracking-wider duration-200 cursor-pointer"
              >
                <Utensils className="h-5 w-5 text-amber-500" />
                <span>Secure Seating</span>
              </button>
            </motion.div>

            {/* Quick trust counts */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-6 pt-6 border-t border-stone-850"
            >
              <div>
                <span className="block text-xl sm:text-2xl font-serif font-black text-amber-400 font-black">4.9 ★</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono font-bold">1,800+ Ratings</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-serif font-black text-amber-400 font-black">৳2,000+</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono font-bold">Luxe Plates</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-serif font-black text-amber-400 font-black">100%</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono font-bold">Prime Halal</span>
              </div>
            </motion.div>
          </div>

          {/* Aesthetic Promo Visual Graphic (Bento/Card stack) with interactive zoom transitions */}
          <div className="lg:col-span-12 xl:col-span-5 relative hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="bg-stone-900 border border-stone-800 p-4 rounded-3xl shadow-2xl relative overflow-hidden group"
            >
              {/* Zoom-in interactive picture on hover */}
              <div className="overflow-hidden rounded-2xl h-[340px]">
                <motion.img
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.4 }}
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600"
                  alt="Premium Smoked Steak Eggs Brunch"
                  className="w-full h-full object-cover shadow-md"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Floating review card */}
              <div className="absolute -bottom-4 -left-6 bg-stone-950 border border-stone-800 text-white p-4.5 rounded-2xl shadow-2xl max-w-[245px] space-y-1.5 transition-transform duration-300 group-hover:scale-105">
                <div className="flex text-amber-400 text-xs gap-0.5">★★★★★</div>
                <p className="text-xs italic text-stone-300 leading-relaxed font-sans">
                  "The Scotch Bonnet Jerk Lobster and Wagyu benedicts are world-class. Absolute culinary perfection in Dhaka."
                </p>
                <span className="block text-[9px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                  — Tahmid R., Gulshan Critic
                </span>
              </div>

              {/* Special chef tag overlay with pulsing light */}
              <div className="absolute -top-4 -right-4 bg-amber-500 text-stone-950 p-3 rounded-full shadow-lg font-mono text-center leading-none">
                <Flame className="h-5 w-5 mx-auto mb-1 animate-pulse" />
                <span className="text-[9px] font-extrabold uppercase tracking-widest block animate-pulse">EXTREME LUXE</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Premium Infinite Horizontal Moving Text Marquee for a luxurious dynamic touch */}
      <div className="w-full bg-amber-500 text-stone-950 font-mono py-2.5 mt-12 overflow-hidden relative border-y border-amber-400">
        <div className="flex space-x-12 whitespace-nowrap overflow-x-hidden">
          <div className="inline-flex space-x-12 text-xs font-black uppercase tracking-widest animate-pulse">
            <span>✦ BRUNCH AMERICAN INSPIRED</span>
            <span>✦ PREMIUM JAMAICAN JERK LOBSTER</span>
            <span>✦ LOCATED AT GULSHAN 1, DHAKA</span>
            <span>✦ COGNAC FRENCH TOAST FLAMBÉ</span>
            <span>✦ TRUFFLE HOLSTEIN BENEDICT</span>
            <span>✦ AUTHENTIC COCOA BREAD SLIDERS</span>
            <span>✦ BRUNCH AMERICAN INSPIRED</span>
            <span>✦ PREMIUM JAMAICAN JERK LOBSTER</span>
            <span>✦ LOCATED AT GULSHAN 1, DHAKA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
