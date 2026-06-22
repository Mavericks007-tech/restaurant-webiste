import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Star,
  Users,
  Clock,
  Award,
  ShieldCheck,
  User as UserIcon,
  HelpCircle,
  Send,
  MapPin,
  ChefHat,
  Plus,
  RotateCcw,
  Edit,
  Trash,
  PlusCircle,
  Check,
  Sparkles,
  Filter,
  Search,
  Phone,
  Mail,
  Shield,
  Briefcase,
  UtensilsCrossed,
  Layers,
  CheckCircle2,
  CalendarCheck2
} from "lucide-react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import BookingForm from "./components/BookingForm";
import CartOverlay from "./components/CartOverlay";
import AuthModal from "./components/AuthModal";
import { MenuItem, User, Order, Booking, OrderItem } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = React.useState<string>("home");
  const [user, setUser] = React.useState<User | null>(null);
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [cart, setCart] = React.useState<OrderItem[]>([]);
  
  // Modals Toggles
  const [isAuthOpen, setIsAuthOpen] = React.useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = React.useState<boolean>(false);
  
  // Dynamic App states
  const [menuSearch, setMenuSearch] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  
  // Admin Data states
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [adminTab, setAdminTab] = React.useState<"menu" | "bookings" | "orders">("menu");
  
  // State for Menu Editing / Adding
  const [showAddMenuForm, setShowAddMenuForm] = React.useState<boolean>(false);
  const [editingMenuItem, setEditingMenuItem] = React.useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = React.useState({
    name: "",
    description: "",
    price: "",
    category: "American Brunch",
    imageUrl: "",
    available: true
  });
  
  const [apiFeedback, setApiFeedback] = React.useState<{ success?: string; error?: string } | null>(null);

  // Load user session on boot
  React.useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${savedToken}` }
      })
        .then((res) => res.json())
        .then((resJson) => {
          if (resJson.success && resJson.data) {
            setUser(resJson.data);
          } else {
            localStorage.removeItem("token");
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
        });
    }
    fetchMenu();
  }, []);

  // Fetch admin stats when entering admin panel tab
  React.useEffect(() => {
    if (activeTab === "dashboard" && user?.role === "admin") {
      fetchAdminData();
    }
  }, [activeTab, user]);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      const resJson = await res.json();
      if (resJson.success && resJson.data) {
        setMenuItems(resJson.data);
      }
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
    }
  };

  const fetchAdminData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Fetch bookings
      const bRes = await fetch("/api/bookings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const bJson = await bRes.json();
      if (bJson.success) setBookings(bJson.data);

      // Fetch takeaway orders
      const oRes = await fetch("/api/orders", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const oJson = await oRes.json();
      if (oJson.success) setOrders(oJson.data);
    } catch (err) {
      console.error("Failed pulling admin registers:", err);
    }
  };

  const handleLoginSuccess = (loggedInUser: User, token: string) => {
    setUser(loggedInUser);
    localStorage.setItem("token", token);
    setApiFeedback({ success: `Welcome ${loggedInUser.username}! Successfully signed in.` });
    setTimeout(() => setApiFeedback(null), 3500);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
    setActiveTab("home");
    setCart([]);
    setApiFeedback({ success: "Logged out from master session." });
    setTimeout(() => setApiFeedback(null), 3500);
  };

  // Add Item to takeaway cart
  const handleAddToBasket = (item: MenuItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find((it) => it.menuItemId === item.id);
      if (existing) {
        return prevCart.map((it) =>
          it.menuItemId === item.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prevCart, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });

    setApiFeedback({ success: `Placed "${item.name}" into your Brunch basket!` });
    setTimeout(() => setApiFeedback(null), 3500);
  };

  const handleUpdateCartQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => (it.menuItemId === id ? { ...it, quantity: it.quantity + delta } : it))
        .filter((it) => it.quantity > 0)
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Menu item write CRUD operations
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || user?.role !== "admin") return;

    if (!menuForm.name || !menuForm.price || !menuForm.imageUrl) {
      setApiFeedback({ error: "Please populate all necessary menu form variables." });
      return;
    }

    const priceNum = Number(menuForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setApiFeedback({ error: "Please enter a valid numeric price." });
      return;
    }

    const url = editingMenuItem ? `/api/menu/${editingMenuItem.id}` : "/api/menu";
    const method = editingMenuItem ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: menuForm.name,
          description: menuForm.description,
          price: priceNum,
          category: menuForm.category,
          imageUrl: menuForm.imageUrl,
          available: menuForm.available
        })
      });

      const resJson = await response.json();
      if (resJson.success) {
        setApiFeedback({ success: `Masterfully ${editingMenuItem ? "updated" : "created"} "${menuForm.name}"!` });
        setEditingMenuItem(null);
        setShowAddMenuForm(false);
        setMenuForm({
          name: "",
          description: "",
          price: "",
          category: "American Brunch",
          imageUrl: "",
          available: true
        });
        fetchMenu();
      } else {
        setApiFeedback({ error: resJson.error || "Action declined." });
      }
    } catch (err) {
      setApiFeedback({ error: "Failed executing menu update request." });
    }
    setTimeout(() => setApiFeedback(null), 4000);
  };

  const handleDeleteMenuItem = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token || user?.role !== "admin") return;
    if (!window.confirm("Are you thoroughly sure you wish to delete this luxury item from the database?")) return;

    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setApiFeedback({ success: "Item deleted from digital collection archives." });
        fetchMenu();
      }
    } catch (err) {
      setApiFeedback({ error: "Delete process triggered error." });
    }
    setTimeout(() => setApiFeedback(null), 3500);
  };

  const handleUpdateBookingStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    if (!token || user?.role !== "admin") return;

    try {
      const response = await fetch(`/api/bookings/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        setApiFeedback({ success: `Reservation #${id} is now ${status}!` });
        fetchAdminData();
      }
    } catch (err) {
      setApiFeedback({ error: "Booking edit failed." });
    }
    setTimeout(() => setApiFeedback(null), 3000);
  };

  const handleUpdateOrderStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    if (!token || user?.role !== "admin") return;

    try {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        setApiFeedback({ success: `Takeaway order #${id} set to "${status}"!` });
        fetchAdminData();
      }
    } catch (err) {
      setApiFeedback({ error: "Order state modifier errored out." });
    }
    setTimeout(() => setApiFeedback(null), 3000);
  };

  const handleToggleOrderPayment = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    if (!token || user?.role !== "admin") return;

    try {
      const response = await fetch(`/api/orders/${id}/payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ paymentStatus: status })
      });
      const data = await response.json();
      if (data.success) {
        setApiFeedback({ success: `Order #${id} billing switched to "${status}"!` });
        fetchAdminData();
      }
    } catch (err) {
      setApiFeedback({ error: "Order payment toggle erred." });
    }
    setTimeout(() => setApiFeedback(null), 3000);
  };

  // categories options
  const filterCategories = ["All", "American Brunch", "Jamaican Mains", "Beverages", "Desserts"];

  // Search filter
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-stone-50 min-h-screen text-stone-900 flex flex-col font-sans transition-all selection:bg-amber-400 selection:text-stone-900">
      {/* Top sticky navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        cartCount={cart.reduce((tot, i) => tot + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Floating System Messages Feedback */}
      <AnimatePresence>
        {apiFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 p-4 rounded-2xl shadow-xl border flex items-center space-x-3.5 max-w-sm ${
              apiFeedback.error
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-stone-900 text-amber-400 border-amber-900/30"
            }`}
          >
            {apiFeedback.error ? (
              <span className="text-red-500 font-bold font-sans">✕</span>
            ) : (
              <Sparkles className="h-4.5 w-4.5 text-amber-500 shrink-0" />
            )}
            <p className="text-xs font-bold tracking-wide">{apiFeedback.success || apiFeedback.error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow">
        {activeTab === "home" && (
          <div className="space-y-16 pb-20">
            {/* Elegant Hero Slider */}
            <Hero
              onOrderNow={() => setActiveTab("menu")}
              onBookNow={() => {
                document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" });
              }}
            />

            {/* Infographics Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <span className="text-amber-600 font-mono text-xs uppercase tracking-widest font-black">
                  ✦ High Culinary Distinction ✦
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-black text-stone-900 tracking-tight leading-tight">
                  Taste the Fusion of Master Crafts
                </h2>
                <p className="text-stone-500 text-sm sm:text-base leading-relaxed">
                  We leverage elite global ingredients to weave comforting American recipes with premium, slow-cooked Jamaican spices, delivering a taste like no other.
                </p>
              </div>

              {/* Infographic Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <motion.div
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-3xl p-8 border border-stone-200/60 shadow-sm text-left space-y-4"
                >
                  <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100">
                    <ChefHat className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">NYC Master Culinary Team</h3>
                  <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
                    Our kitchens are helmed by executive chefs formally trained in top-tier Manhattan restaurants, bringing precise techniques to every breakfast platter.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-3xl p-8 border border-stone-200/60 shadow-sm text-left space-y-4"
                >
                  <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100">
                    <Star className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">Scotch Bonnet Pit Smoldering</h3>
                  <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
                    We import genuine pimento wood logs from Jamaica to pit-smoke our signature proteins, infusing authentic wood aromas, clove accents, and sweet high-heat peppers.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-3xl p-8 border border-stone-200/60 shadow-sm text-left space-y-4"
                >
                  <div className="h-12 w-12 bg-stone-900 rounded-2xl flex items-center justify-center text-amber-400">
                    <Award className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">Expensive & Pure Ingredients</h3>
                  <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
                    From organic farm eggs and luxurious black Italian truffles to line-caught red snapper and dry-aged Wagyu beef, no compromises on luxury are made. Only premium quality.
                  </p>
                </motion.div>
              </div>
            </section>

            {/* Quick Promo visual showcasing double zoom in/out with transition */}
            <section className="bg-stone-900 text-white py-16 overflow-hidden relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6 text-left">
                  <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-black">
                    Live Smoke Showcase
                  </span>
                  <h2 className="font-serif text-4xl font-extrabold text-white tracking-tight leading-none">
                    Uncompromising Luxury <br />
                    At Gulshan 1, Dhaka
                  </h2>
                  <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
                    We invite you into an immersive culinary space with soft modern jazz, deep leather seating, and open-flame cooking. Experience authentic cocoa bread basted in garlic herbs, and master-crafted Wagyu benedicts.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveTab("menu")}
                      className="bg-amber-500 text-stone-950 font-bold px-6 py-3 rounded-lg text-xs tracking-uppercase transition-all hover:bg-amber-600 cursor-pointer"
                    >
                      Browse Cuisines Menu
                    </button>
                    <button
                      onClick={() => {
                        const target = document.getElementById("booking-section");
                        target?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="bg-stone-800 text-white font-bold px-6 py-3 rounded-lg text-xs tracking-uppercase hover:bg-stone-700 transition"
                    >
                      Book Your Slot
                    </button>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl h-[280px] sm:h-[360px] group border border-stone-800">
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=700"
                    alt="Luxury Brunch"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-stone-950/40 pointer-events-none" />
                </div>
              </div>
            </section>

            {/* Seating booking Reservation section in DB */}
            <section id="booking-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <BookingForm user={user} />
            </section>
          </div>
        )}

        {activeTab === "menu" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header copy */}
            <div className="text-center space-y-4 max-w-2xl mx-auto mb-10">
              <span className="text-amber-600 font-mono text-xs uppercase tracking-widest font-black">
                Gourmet Selections Menu
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                Our American Inspired & Jamaican Menu
              </h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                Prices denoted in Bangladeshi Taka (৳). Fully prepared in accordance with fine-dining halal metrics near Gulshan 1, Dhaka. Takeaway pickup or courier delivery supported.
              </p>
            </div>

            {/* Filter controls and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-stone-200/60 shadow-sm max-w-4xl mx-auto mb-10">
              {/* Search text input */}
              <div className="relative flex-grow max-w-md">
                <Search className="h-4.5 w-4.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search jerk lobster, wagyu, pancakes..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Categorization tabs */}
              <div className="flex flex-wrap gap-1">
                {filterCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      selectedCategory === cat
                        ? "bg-amber-500 text-stone-950 shadow-sm"
                        : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Empty check */}
            {filteredMenuItems.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 max-w-md mx-auto">
                <p className="text-stone-400 text-sm mb-2">No matching high-end gourmet items found.</p>
                <button
                  onClick={() => {
                    setMenuSearch("");
                    setSelectedCategory("All");
                  }}
                  className="text-xs bg-amber-50 text-amber-700 font-bold px-4 py-2 rounded-lg border border-amber-200"
                >
                  Reset Current Filter Filters
                </button>
              </div>
            ) : (
              /* Grid Layout */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMenuItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-3xl border border-stone-200/70 shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    {/* Zoomable Image Container */}
                    <div className="h-[210px] w-full overflow-hidden relative bg-stone-100 border-b border-stone-100">
                      <motion.img
                        whileHover={{ scale: 1.09 }}
                        transition={{ duration: 0.35 }}
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-sm text-amber-400 text-[10px] font-mono tracking-widest uppercase font-bold py-1 px-3 border border-stone-800 rounded-full">
                        {item.category}
                      </div>

                      {!item.available && (
                        <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center text-white px-4">
                          <span className="text-xs font-mono font-black uppercase tracking-widest text-red-400 border border-red-500/30 px-3 py-1 bg-red-950/20 rounded-lg">
                            Sold Out Today
                          </span>
                        </div>
                      )}
                    </div>

                    {/* text contents */}
                    <div className="p-6 text-left space-y-3.5 flex-grow flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-serif text-lg font-black text-stone-900 leading-snug">
                            {item.name}
                          </h3>
                        </div>
                        <p className="text-stone-500 text-xs leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                        <div className="text-left font-sans">
                          <span className="block text-[9px] uppercase tracking-widest text-stone-400 font-bold font-mono">
                            BDT Currency
                          </span>
                          <span className="text-xl font-bold font-mono text-stone-900">
                            ৳{item.price.toLocaleString("en-US")}
                          </span>
                        </div>

                        <button
                          onClick={() => handleAddToBasket(item)}
                          disabled={!item.available}
                          className={`flex items-center space-x-1 font-bold tracking-wide text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                            item.available
                              ? "bg-stone-900 text-amber-400 hover:bg-stone-850 hover:shadow-md"
                              : "bg-stone-100 text-stone-400 cursor-not-allowed"
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "services" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-amber-600 font-mono text-xs uppercase tracking-widest font-black">Custom Experiences</span>
              <h2 className="font-serif text-4xl font-extrabold text-stone-900 tracking-tight">Our Premium Services</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                We bring high-end culinary curation directly to you, from executive corporate setup to your private yacht gatherings in Dhaka.
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-3xl p-8 border border-stone-200/60 shadow-sm space-y-4">
                <div className="h-12 w-12 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl flex items-center justify-center">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">Corporate Boardroom Brunch</h3>
                <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
                  Impress international developers, stakeholders, and executives. We construct tailored hot-buffets featuring Wagyu benedict setups, custom Blue Mountain brews, and flight side-carts for private office morning feeds.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-stone-200/60 shadow-sm space-y-4">
                <div className="h-12 w-12 bg-stone-900 text-amber-400 rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">Private At-Home Catering</h3>
                <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
                  Celebrate birthdays and anniversaries in Gulshan in pure luxury. Our executive pit masters transport professional slow-smoking units to your residence to carve Jamaican jerks raw at your table.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-stone-200/60 shadow-sm space-y-4">
                <div className="h-12 w-12 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl flex items-center justify-center">
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">The Yacht & Boat Banquet</h3>
                <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
                  Cruising on the Shitalakshya or Meghna river? We pack luxury cooling locks and onboard culinary stations to serve hot-reheated lobster reductions and coconut milk snapper, accompanied by custom sparkling cider mocktails.
                </p>
              </div>
            </div>

            {/* Visual Callout */}
            <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-stone-800">
              <div className="space-y-3 z-10 max-w-xl">
                <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-black">Plan an Event</span>
                <h3 className="font-serif text-2xl sm:text-3xl font-extrabold">Custom Catering Customizations</h3>
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                  Have a bespoke request? We have served elite high-commissions, embassies, and family gatherings up to 500 plates across Bangladesh. Fully compliant, with dedicated service servers.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("contact")}
                className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black px-6 py-4.5 rounded-xl text-xs uppercase tracking-widest shadow-lg shrink-0 cursor-pointer"
              >
                Inquire With Hosting Desk
              </button>
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-amber-600 font-mono text-xs uppercase tracking-widest font-black">Our Founding Journal</span>
                <h2 className="font-serif text-4xl font-extrabold text-stone-900 leading-tight">
                  The Story of Brunch: <br />
                  <span className="text-amber-600 italic">American Inspired & Jamaican Soul</span>
                </h2>
                <p className="text-stone-600 text-sm leading-relaxed">
                  The seed for Brunch was planted in Brooklyn, New York back in 2021, where Chef Michael (originally from Portland, Jamaica) and Chef David (born in downtown Manhattan) operated a small underground pop-up kitchen. Their wildly unique balance of premium American breakfast items with deep, wood-smoked jerk spices took the neighborhood by storm.
                </p>
                <p className="text-stone-600 text-sm leading-relaxed">
                  They asked themselves, "Why not introduce this luxury culinary vision to Dhaka's high-tier food circle?" Sourcing plot 14 in Gulshan 1, they constructed a premium physical sanctuary with organic mahogany tables, custom leather seats, and Dhaka's very first custom slow pit smokers.
                </p>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/40 text-xs text-neutral-600 font-mono">
                  "We believe dining must engage the eyes and tongue. Generous servings, expensive ingredients, complex wood smoke. Luxury in every detail."
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl h-[420px] group border border-stone-200 shadow-lg">
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=700"
                  alt="Fine Chefs working in kitchen"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Core Values infographic */}
            <div className="bg-stone-900 text-stone-100 rounded-3xl p-8 sm:p-12 border border-stone-850">
              <div className="text-center space-y-3 mb-10">
                <h3 className="font-serif text-2xl font-bold">Our Pillars of Gastronomy</h3>
                <p className="text-stone-400 text-xs">Uncompromising values we uphold everyday</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <div className="h-10 w-10 bg-amber-500 text-stone-950 font-bold font-mono rounded-xl flex items-center justify-center text-sm">01</div>
                  <h4 className="font-serif text-lg font-bold text-white">Halal Integrity Always</h4>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    Every meat element is sourced from certified organic local Halal suppliers, adhering perfectly to local and global requirements.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-10 w-10 bg-amber-500 text-stone-950 font-bold font-mono rounded-xl flex items-center justify-center text-sm">02</div>
                  <h4 className="font-serif text-lg font-bold text-white">Genuine Wood Smoking</h4>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    Zero chemical smoke additions. We pit-smoke in small quantities daily to ensure deep seasoning absorption.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-10 w-10 bg-amber-500 text-stone-950 font-bold font-mono rounded-xl flex items-center justify-center text-sm">03</div>
                  <h4 className="font-serif text-lg font-bold text-white">Sustainable Community Integration</h4>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    We recycle all wood fuel ash into compost and direct leftover organic ingredients to local charities around Gulshan 1.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Info Column */}
              <div className="lg:col-span-5 space-y-6">
                <span className="text-amber-600 font-mono text-xs uppercase tracking-widest font-black">Get In Touch</span>
                <h2 className="font-serif text-4xl font-extrabold text-stone-900 leading-tight">We Love to Hear From You</h2>
                <p className="text-stone-500 text-sm leading-relaxed">
                  Join us at our beautiful physical venue, or reach our managers immediately. Bookings and custom events desk are open 24/7.
                </p>

                <div className="space-y-4 pt-4 border-t border-stone-200">
                  <div className="flex items-start space-x-3.5 text-xs text-stone-600">
                    <MapPin className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-bold text-stone-900">Physical Location Address</span>
                      <span>Plot 14, Road 112, Gulshan 1, Dhaka (Near Circle 1 Hub)</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5 text-xs text-stone-600">
                    <Phone className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-bold text-stone-900">Reservations Hot Line</span>
                      <span>+880 171-889922 (Manager Desk)</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5 text-xs text-stone-600">
                    <Mail className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-bold text-stone-900">Billing & Guest Support</span>
                      <span>concierge@brunchdhake.com</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-stone-900 text-amber-400 rounded-2xl border border-amber-900/10 text-xs">
                  <span className="font-bold uppercase block mb-1">bKash Merchant Pay No.</span>
                  Dial <span className="font-bold underline text-white">+880 171-889922</span> for direct premium automated merchant payouts on takeaways.
                </div>
              </div>

              {/* Inquiries email Form */}
              <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                <h3 className="font-serif text-lg font-bold text-stone-900">Transmit a Direct Message</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setApiFeedback({ success: "Assalamu Alaikum! Your inquiry is safely transmitted to our managers." });
                    setTimeout(() => setApiFeedback(null), 4000);
                    (e.target as HTMLFormElement).reset();
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Andy Smith"
                        className="w-full text-xs bg-stone-50/50 rounded-xl border border-stone-200 px-3.5 py-3 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Your Email</label>
                      <input
                        type="email"
                        required
                        placeholder="andy@domain.com"
                        className="w-full text-xs bg-stone-50/50 rounded-xl border border-stone-200 px-3.5 py-3 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Inquiry Topic</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Private Yacht catering questions, Corporate lunch booking setup..."
                      className="w-full text-xs bg-stone-50/50 rounded-xl border border-stone-200 px-3.5 py-3 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Message Body</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Draft your thoughts here..."
                      className="w-full text-xs bg-stone-50/50 rounded-xl border border-stone-200 px-3.5 py-2.5 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-stone-900 hover:bg-stone-850 text-amber-400 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Send Secure Message
                  </button>
                </form>
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="border-t border-stone-200 pt-12 space-y-6">
              <div className="text-center mb-10">
                <h3 className="font-serif text-2xl font-bold">Frequently Asked Questions</h3>
                <p className="text-stone-500 text-xs">Helpful details about Brunch restaurant metrics</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
                <div className="p-5 bg-white rounded-2xl border border-stone-200/70 space-y-2">
                  <h4 className="font-bold text-stone-900 flex items-center space-x-2">
                    <HelpCircle className="h-4 w-4 text-amber-500" />
                    <span>How expensive is Brunch average pricing?</span>
                  </h4>
                  <p className="text-stone-500 leading-relaxed ps-6">
                    Our pricing reflects line-caught marine resources, imported premium beef cuts, and organic ingredients. Main dishes typically range between ৳1,600 and ৳4,200.
                  </p>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-stone-200/70 space-y-2">
                  <h4 className="font-bold text-stone-900 flex items-center space-x-2">
                    <HelpCircle className="h-4 w-4 text-amber-500" />
                    <span>Do you offer delivery across all parts of Dhaka?</span>
                  </h4>
                  <p className="text-stone-500 leading-relaxed ps-6">
                    Yes, we support home deliveries inside Gulshan 1, Banani, and adjacent commercial neighborhoods with our flat-rate courier system of ৳60.
                  </p>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-stone-200/70 space-y-2">
                  <h4 className="font-bold text-stone-900 flex items-center space-x-2">
                    <HelpCircle className="h-4 w-4 text-amber-500" />
                    <span>Can we modify spice level for Jamaican Jerk items?</span>
                  </h4>
                  <p className="text-stone-500 leading-relaxed ps-6">
                    Absolutely. Jerk spices are traditionally seasoned in highly dense fiery scotch bonnet pastes. However, you can input "Mild Jerk" in takeaway checkouts or inform tableside hosts before smoking.
                  </p>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-stone-200/70 space-y-2">
                  <h4 className="font-bold text-stone-900 flex items-center space-x-2">
                    <HelpCircle className="h-4 w-4 text-amber-500" />
                    <span>Is booking robustly logged in your SQLite backend?</span>
                  </h4>
                  <p className="text-stone-500 leading-relaxed ps-6">
                    Yes, every reservation booking is cataloged live in a persistent local SQLite database. Our hostesses verify table registers on immediate seating access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN OPERATION PANEL TAB (securely guarded RBAC) */}
        {activeTab === "dashboard" && user?.role === "admin" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left">
            <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-stone-850 shadow-md">
              <div className="space-y-1 flex items-center space-x-4">
                <div className="h-12 w-12 bg-amber-500 text-stone-950 rounded-2xl flex items-center justify-center font-serif text-xl font-black shrink-0">
                  A
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-black">Brunch Operations Hub</h2>
                  <p className="text-stone-400 text-xs font-mono">
                    Logged in as: <span className="text-amber-400 font-bold">{user.email}</span> (Master Admin)
                  </p>
                </div>
              </div>

              {/* Sub tabs switches */}
              <div className="flex bg-stone-800 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setAdminTab("menu")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    adminTab === "menu" ? "bg-amber-505 bg-amber-500 text-stone-950" : "text-stone-400 hover:text-white"
                  }`}
                >
                  Manage Menu
                </button>
                <button
                  onClick={() => setAdminTab("bookings")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    adminTab === "bookings" ? "bg-amber-500 text-stone-950" : "text-stone-400 hover:text-white"
                  }`}
                >
                  Reservations ({bookings.length})
                </button>
                <button
                  onClick={() => setAdminTab("orders")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    adminTab === "orders" ? "bg-amber-500 text-stone-950" : "text-stone-400 hover:text-white"
                  }`}
                >
                  Ords ({orders.length})
                </button>
              </div>
            </div>

            {/* Hub contents panel */}
            <div className="mt-8">
              {adminTab === "menu" && (
                <div className="space-y-6">
                  {/* form trigger bar */}
                  <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-stone-200">
                    <div>
                      <h3 className="font-serif text-lg font-bold">Catalog Menu Management</h3>
                      <p className="text-stone-500 text-xs">Add new items or edit existing expensive dishes</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingMenuItem(null);
                        setMenuForm({
                          name: "",
                          description: "",
                          price: "",
                          category: "American Brunch",
                          imageUrl: "",
                          available: true
                        });
                        setShowAddMenuForm(!showAddMenuForm);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl text-stone-950 flex items-center space-x-1 cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>{showAddMenuForm ? "Collapse Form" : "Add New Item"}</span>
                    </button>
                  </div>

                  {/* Add Edit form drawer */}
                  {showAddMenuForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm max-w-2xl"
                    >
                      <h4 className="font-serif text-md font-bold mb-4 text-stone-800">
                        {editingMenuItem ? `Editing item: ${editingMenuItem.name}` : "Create Restaurant Menu Dish"}
                      </h4>
                      <form onSubmit={handleSaveMenuItem} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-stone-500">Dish Name</label>
                            <input
                              type="text"
                              required
                              value={menuForm.name}
                              onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                              placeholder="e.g. Jerk Salmon Benedict"
                              className="w-full text-xs bg-stone-50 rounded-xl border border-stone-200 p-3 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-stone-500">Price in BDT Taka (৳)</label>
                            <input
                              type="number"
                              required
                              value={menuForm.price}
                              onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                              placeholder="e.g. 2450"
                              className="w-full text-xs bg-stone-50 rounded-xl border border-stone-200 p-3 focus:outline-none font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-stone-500">Food Category</label>
                            <select
                              value={menuForm.category}
                              onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                              className="w-full text-xs bg-stone-50 rounded-xl border border-stone-200 p-3 focus:outline-none"
                            >
                              <option value="American Brunch">American Brunch</option>
                              <option value="Jamaican Mains">Jamaican Mains</option>
                              <option value="Beverages">Beverages</option>
                              <option value="Desserts">Desserts</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-stone-500">Image Asset URL</label>
                            <input
                              type="text"
                              required
                              value={menuForm.imageUrl}
                              onChange={(e) => setMenuForm({ ...menuForm, imageUrl: e.target.value })}
                              placeholder="https://images.unsplash.com/photo-..."
                              className="w-full text-xs bg-stone-50 rounded-xl border border-stone-200 p-3 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold uppercase text-stone-500">Chef Description</label>
                          <textarea
                            value={menuForm.description}
                            onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                            rows={3}
                            placeholder="Draft gourmet details, ingredients used, spice hints..."
                            className="w-full text-xs bg-stone-50 rounded-xl border border-stone-200 p-2.5 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="available"
                            checked={menuForm.available}
                            onChange={(e) => setMenuForm({ ...menuForm, available: e.target.checked })}
                            className="h-4 w-4 bg-amber-500 accent-amber-500 border-neutral-300"
                          />
                          <label htmlFor="available" className="text-xs font-semibold text-stone-700">
                            Set as Instantly Available to Customers
                          </label>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="submit"
                            className="bg-stone-900 hover:bg-stone-850 text-amber-400 font-bold px-6 py-3 rounded-lg text-xs uppercase cursor-pointer"
                          >
                            Save Master Item
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddMenuForm(false);
                              setEditingMenuItem(null);
                            }}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold px-4 py-3 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Curated list */}
                  <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
                    <div className="p-5 border-b border-stone-100 flex justify-between items-center">
                      <h4 className="font-serif text-sm font-bold text-stone-800">Master Cuisines List ({menuItems.length})</h4>
                      <button
                        onClick={fetchMenu}
                        className="p-1 px-2.5 bg-stone-100 rounded-lg text-[10px] font-bold text-stone-500 hover:bg-stone-200 flex items-center space-x-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reload SQLite Menu</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-stone-100 text-stone-500 uppercase tracking-wider font-mono text-[10px]">
                          <tr>
                            <th className="p-4">Dish Details</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Availability</th>
                            <th className="p-4 text-right">Actions Operations</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {menuItems.map((item) => (
                            <tr key={item.id} className="hover:bg-stone-50/50">
                              <td className="p-4 flex items-center space-x-3 max-w-xs">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="h-10 w-10 object-cover rounded-lg border border-stone-200"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <span className="block font-bold text-stone-900 truncate leading-snug">{item.name}</span>
                                  <span className="block text-[10px] text-stone-400 line-clamp-1">{item.description}</span>
                                </div>
                              </td>
                              <td className="p-4 font-mono">{item.category}</td>
                              <td className="p-4 font-bold font-mono">৳{item.price} BDT</td>
                              <td className="p-4">
                                {item.available ? (
                                  <span className="inline-block bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                                    IN SERVICE
                                  </span>
                                ) : (
                                  <span className="inline-block bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                                    SOLD OUT
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingMenuItem(item);
                                    setMenuForm({
                                      name: item.name,
                                      description: item.description,
                                      price: String(item.price),
                                      category: item.category,
                                      imageUrl: item.imageUrl,
                                      available: item.available
                                    });
                                    setShowAddMenuForm(true);
                                    window.scrollTo({ top: 300, behavior: "smooth" });
                                  }}
                                  className="p-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold border border-amber-200/50"
                                >
                                  Modify
                                </button>
                                <button
                                  onClick={() => handleDeleteMenuItem(item.id)}
                                  className="p-1 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {adminTab === "bookings" && (
                <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs space-y-4">
                  <div className="p-5 border-b border-stone-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-serif text-sm font-bold text-stone-800">Dynamic Guest Reservations</h3>
                      <p className="text-stone-400 text-[11px]">Manage floor tables approvals and calendars logs</p>
                    </div>
                    <button
                      onClick={fetchAdminData}
                      className="p-1 px-2 bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/50 rounded-lg flex items-center space-x-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Refresh Bookings</span>
                    </button>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="text-center py-20 text-stone-400 text-xs">
                      No customer dinings reservations exist inside digital registers.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-stone-100 text-stone-500 uppercase tracking-wider font-mono text-[10px]">
                          <tr>
                            <th className="p-4">Customer Details</th>
                            <th className="p-4">Seating Slot</th>
                            <th className="p-4">Guests Cover</th>
                            <th className="p-4">Special Requests</th>
                            <th className="p-4">Active Status</th>
                            <th className="p-4 text-right">Approval Decisions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {bookings.map((b) => (
                            <tr key={b.id} className="hover:bg-stone-50/50">
                              <td className="p-4">
                                <span className="block font-bold text-stone-900">{b.name}</span>
                                <span className="block text-[10px] text-stone-500 font-mono">{b.email}</span>
                                <span className="block text-[10px] text-stone-400 font-mono">{b.phone}</span>
                              </td>
                              <td className="p-4 font-mono">
                                <span className="block font-bold text-stone-800">{b.date}</span>
                                <span className="block text-[10px] font-light text-stone-500">{b.time} Hours</span>
                              </td>
                              <td className="p-4 font-bold font-mono text-center">{b.guests} Pax</td>
                              <td className="p-4 max-w-xs truncate" title={b.specialRequests || ""}>
                                <span className="text-stone-600 italic font-light">{b.specialRequests || "No requests"}</span>
                              </td>
                              <td className="p-4">
                                <span
                                  className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                    b.status === "Confirmed"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : b.status === "Cancelled"
                                      ? "bg-red-50 text-red-600 border-red-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                                  }`}
                                >
                                  {b.status}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-1.5">
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, "Confirmed")}
                                  disabled={b.status === "Confirmed"}
                                  className="p-1 px-2 bg-green-50 hover:bg-green-100 text-green-700 text-[10px] border border-green-200 rounded disabled:opacity-40 disabled:pointer-events-none"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, "Cancelled")}
                                  disabled={b.status === "Cancelled"}
                                  className="p-1 px-2 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] border border-red-100 rounded disabled:opacity-40 disabled:pointer-events-none"
                                >
                                  Reject
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {adminTab === "orders" && (
                <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs space-y-4">
                  <div className="p-5 border-b border-stone-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-serif text-sm font-bold text-stone-800">takeaway & delivery logs</h3>
                      <p className="text-stone-400 text-[11px]">Dispatch food pieces and collection controls</p>
                    </div>
                    <button
                      onClick={fetchAdminData}
                      className="p-1 px-2 bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/50 rounded-lg flex items-center space-x-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Refresh Registry</span>
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-20 text-stone-400 text-xs">
                      No takeaway orders cataloged inside digital records today.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-stone-100 text-stone-500 uppercase tracking-wider font-mono text-[10px]">
                          <tr>
                            <th className="p-4">Customer Details</th>
                            <th className="p-4">Order Items</th>
                            <th className="p-4">Type / Address</th>
                            <th className="p-4">Grand Total</th>
                            <th className="p-4">Fulfillment Status</th>
                            <th className="p-4">Billing (Cash)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {orders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-stone-50/50">
                              <td className="p-4">
                                <span className="block font-bold text-stone-900">#ORD-{ord.id}</span>
                                <span className="block text-[11px] font-semibold text-stone-800">{ord.name}</span>
                                <span className="block text-[10px] text-stone-500 font-mono">{ord.phone}</span>
                              </td>
                              <td className="p-4 max-w-sm">
                                <div className="space-y-0.5">
                                  {ord.items?.map((it, idx) => (
                                    <div key={idx} className="text-stone-700 text-[11px]">
                                      • <span className="font-semibold">{it.name}</span> x{it.quantity}
                                    </div>
                                  ))}
                                </div>
                                {ord.instructions && (
                                  <div className="text-[10px] text-stone-400 mt-1 italic">
                                    "Instructions: {ord.instructions}"
                                  </div>
                                )}
                              </td>
                              <td className="p-4 max-w-xs">
                                <span className="inline-block bg-neutral-100 text-neutral-800 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-neutral-200">
                                  {ord.orderType}
                                </span>
                                {ord.orderType === "delivery" && (
                                  <span className="block text-[10px] text-stone-500 mt-1 truncate" title={ord.address}>
                                    Address: {ord.address}
                                  </span>
                                )}
                              </td>
                              <td className="p-4 font-bold font-mono text-stone-900 leading-none">
                                ৳{ord.total} BDT
                              </td>
                              <td className="p-4">
                                <div className="space-y-1.5 min-w-[130px]">
                                  <span
                                    className={`inline-block text-[9px] font-bold uppercase py-0.5 tracking-wider px-2 rounded-full border ${
                                      ord.status === "Completed"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : ord.status === "Cancelled"
                                        ? "bg-red-50 text-red-600 border-red-200"
                                        : ord.status === "Ready"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}
                                  >
                                    {ord.status}
                                  </span>
                                  
                                  {/* Update status selector */}
                                  <select
                                    value={ord.status}
                                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                    className="block text-[10px] bg-stone-50 border border-stone-200 rounded p-1 w-full focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Preparing">Preparing</option>
                                    <option value="Ready">Ready to Serve</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="space-y-1">
                                  <span
                                    className={`inline-block text-[9px] font-bold uppercase py-0.5 px-2 rounded border ${
                                      ord.paymentStatus === "Paid"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-red-50 text-red-600 border-red-200"
                                    }`}
                                  >
                                    {ord.paymentStatus}
                                  </span>
                                  
                                  {/* Toggle Button */}
                                  <button
                                    onClick={() =>
                                      handleToggleOrderPayment(ord.id, ord.paymentStatus === "Paid" ? "Pending" : "Paid")
                                    }
                                    className="block p-1 bg-stone-100 hover:bg-stone-200 text-stone-600 text-[9px] rounded font-bold w-full border border-stone-150"
                                  >
                                    Toggle State
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Elegant minimalist Footer */}
      <footer className="bg-stone-900 border-t border-stone-850 text-stone-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-amber-600 text-white p-2 rounded-xl">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <span className="font-serif text-xl font-black text-white uppercase tracking-tight">
                BRUNCH<span className="text-amber-500 font-light">.</span>
              </span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed max-w-sm">
              Crafting premium culinary bridges with authentic wood smoke seasonings. Nestled in the finest commercial hub of Dhaka.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h5 className="text-xs uppercase tracking-widest text-stone-200 font-bold font-mono">Gastronomy</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveTab("menu")} className="hover:text-amber-500 cursor-pointer">
                  American Benedicts
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("menu")} className="hover:text-amber-500 cursor-pointer">
                  Montego Red Snapper
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("menu")} className="hover:text-amber-500 cursor-pointer">
                  Blue Mountain Single Origin
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h5 className="text-xs uppercase tracking-widest text-stone-200 font-bold font-mono">Secure Venue</h5>
            <p className="text-xs text-stone-400 leading-relaxed">
              Plot 14, Road 112, Gulshan 1, Dhaka <br />
              Open Daily: 12:00 PM – 11:30 PM <br />
              Booking hot desk: +880 171-889922
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h5 className="text-xs uppercase tracking-widest text-stone-200 font-bold font-mono">Newsletter Curation</h5>
            <p className="text-xs text-stone-400 leading-normal">
              Subscribe to unlock private invitations, secret chef tables, and new smoke events.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setApiFeedback({ success: "Assalamu Alaikum! Your letter code is logged securely." });
                setTimeout(() => setApiFeedback(null), 3000);
                (e.target as HTMLFormElement).reset();
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                required
                placeholder="Secure email..."
                className="bg-stone-850 text-xs px-3 py-2 rounded-lg border border-stone-800 text-white flex-grow focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-3 rounded-lg text-xs"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-stone-850/60 text-center text-[10px] text-stone-500 font-mono flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>
            © {new Date().getFullYear()} BRUNCH American Inspired • Gulshan 1, Dhaka. All rights reserved.
          </span>
          <span className="flex space-x-3">
            <span className="hover:text-amber-500 cursor-pointer">Security Audited</span>
            <span>•</span>
            <span className="hover:text-amber-500 cursor-pointer">SQLite Persistent Session</span>
          </span>
        </div>
      </footer>

      {/* Cart Drawer overlay */}
      <CartOverlay
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onClearCart={handleClearCart}
        user={user}
      />

      {/* Guest Authentication modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
