import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Plus, Minus, ShoppingBag, Truck, MapPin, Inbox, Phone, Mail, User as UserIcon, MessageSquare, Check, CreditCard } from "lucide-react";
import { OrderItem, User } from "../types";

interface CartOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  cart: OrderItem[];
  onUpdateQuantity: (id: number, delta: number) => void;
  onClearCart: () => void;
  user: User | null;
}

export default function CartOverlay({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onClearCart,
  user
}: CartOverlayProps) {
  const [orderType, setOrderType] = React.useState<"takeaway" | "delivery">("takeaway");
  const [formData, setFormData] = React.useState({
    name: user?.username || "",
    email: user?.email || "",
    phone: "",
    address: "",
    instructions: ""
  });

  const [loading, setLoading] = React.useState(false);
  const [successOrder, setSuccessOrder] = React.useState<any | null>(null);
  const [errorStr, setErrorStr] = React.useState<string | null>(null);

  // Sync auth updates
  React.useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.username,
        email: user.email
      }));
    }
  }, [user]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // Delivery cost: 60 Taka flat rate for Gulshan & surrounding areas in Dhaka
  const deliveryCharge = orderType === "delivery" ? 60 : 0;
  const grandTotal = subtotal + deliveryCharge;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorStr(null);

    // Validation
    if (cart.length === 0) {
      setLoading(false);
      return setErrorStr("Your cart basket is completely empty.");
    }
    if (!formData.name.trim()) {
      setLoading(false);
      return setErrorStr("Please enter a name for order fulfillment.");
    }
    if (!formData.phone.trim() || formData.phone.length < 6) {
      setLoading(false);
      return setErrorStr("Please enter a valid bKash/Mobile contact phone number.");
    }
    if (orderType === "delivery" && (!formData.address || formData.address.trim().length < 5)) {
      setLoading(false);
      return setErrorStr("Please enter a thorough delivery address in Dhaka.");
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      orderType,
      items: cart,
      total: grandTotal,
      address: orderType === "delivery" ? formData.address : "",
      instructions: formData.instructions
    };

    try {
      // Pass JWT optionally to record order history under user
      const token = localStorage.getItem("token");
      const headers: any = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to catalog takeaway order.");
      }

      setSuccessOrder(resData.data);
      onClearCart();
      // Reset form variables
      setFormData({
        name: user?.username || "",
        email: user?.email || "",
        phone: "",
        address: "",
        instructions: ""
      });
    } catch (err: any) {
      setErrorStr(err.message || "Something went wrong submitting order.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Background backing tint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900 cursor-pointer"
      />

      {/* Main Drawer Canvas */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className="relative w-full max-w-lg bg-white h-full flex flex-col shadow-2xl z-10 border-l border-amber-100"
      >
        {/* Header bar */}
        <div className="px-6 py-5 border-b border-amber-100 flex items-center justify-between bg-amber-50/40">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-amber-500" />
            <h2 className="font-serif text-lg font-bold text-neutral-800">Your Brunch Basket</h2>
            {cart.length > 0 && (
              <span className="bg-amber-500 text-white rounded-full text-[10px] font-bold px-2 py-0.5">
                {cart.reduce((qty, it) => qty + it.quantity, 0)} Items
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body switcher */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {successOrder ? (
            <div className="space-y-6 py-4 text-center">
              <div className="mx-auto h-14 w-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center border border-amber-200">
                <Check className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-neutral-800">Order Placed Successfully!</h3>
                <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
                  Assalamu Alaikum. Your restaurant takeaway or delivery order list is locked and prepared. Pay Cash On Delivery/Pickup.
                </p>
              </div>

              {/* Receipt */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-150 text-left text-xs font-mono space-y-3">
                <div className="border-b border-dashed border-neutral-200 pb-2 flex justify-between">
                  <span>ORDER INVOICE:</span>
                  <span className="font-bold">#DD-ORD-{successOrder.id}</span>
                </div>
                
                <div className="space-y-1">
                  {successOrder.items?.map((item: any) => (
                    <div key={item.menuItemId} className="flex justify-between text-neutral-600 text-[11px]">
                      <span>{item.name} (x{item.quantity})</span>
                      <span>৳{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-neutral-200 pt-2 flex justify-between text-[11px]">
                  <span>Order Type:</span>
                  <span className="font-bold uppercase text-amber-700">{successOrder.orderType}</span>
                </div>
                {successOrder.address && (
                  <div className="text-[11px] text-neutral-500 truncate">
                    <span>Address:</span> {successOrder.address}
                  </div>
                )}
                
                <div className="border-t border-dashed border-neutral-200 pt-2.5 flex justify-between text-sm font-bold text-neutral-900 leading-none">
                  <span>GRAND TOTAL (CASH):</span>
                  <span>৳{successOrder.total} BDT</span>
                </div>
              </div>

              <p className="text-[10px] text-neutral-500">
                Kitchen Status currently set to <span className="text-amber-600 font-semibold uppercase">Pending</span>. Standard preparation time is 25-35 minutes.
              </p>

              <button
                onClick={() => {
                  setSuccessOrder(null);
                  onClose();
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                Return to Dining Menu
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="mx-auto h-16 w-16 text-neutral-300 flex items-center justify-center">
                <Inbox className="h-12 w-12" />
              </div>
              <div>
                <p className="text-neutral-500 text-sm">Your basket is currently empty.</p>
                <p className="text-[11px] text-neutral-400 mt-1">Browse our premium menu and add items to begin!</p>
              </div>
              <button
                onClick={onClose}
                className="bg-amber-50 text-amber-700 hover:bg-amber-100 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border border-amber-200 cursor-pointer"
              >
                Go Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Added item rows */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Basket Items</h4>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-left">
                      <div className="flex-1 min-w-0 pr-3">
                        <h5 className="text-sm font-semibold text-neutral-800 truncate leading-snug">{item.name}</h5>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">৳{item.price} BDT per plate</p>
                      </div>
                      <div className="flex items-center space-x-2.5 shrink-0">
                        <div className="flex items-center space-x-1.5 bg-white border border-neutral-200 rounded-lg p-1">
                          <button
                            onClick={() => onUpdateQuantity(item.menuItemId, -1)}
                            className="p-1 rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold text-neutral-800 min-w-[16px] text-center font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.menuItemId, 1)}
                            className="p-1 rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-xs font-bold font-mono text-neutral-900 w-[60px] text-right">
                          ৳{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order fulfilment type split */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Fulfilment Method</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderType("takeaway")}
                    className={`flex items-center justify-center space-x-2 py-3 rounded-xl border font-bold text-xs pointer transition-all cursor-pointer ${
                      orderType === "takeaway"
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Takeaway / Pickup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderType("delivery")}
                    className={`flex items-center justify-center space-x-2 py-3 rounded-xl border font-bold text-xs pointer transition-all cursor-pointer ${
                      orderType === "delivery"
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    <span>Home Delivery</span>
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  {orderType === "delivery"
                    ? "Flat 60 Taka delivery fee applied. Delivered only inside Gulshan-1 and ambient circular ranges."
                    : "No charges. Collection from our venue near Gulshan-1 Circle. Ready in 25 mins."}
                </p>
              </div>

              {/* Contact Checkout Form */}
              <form onSubmit={handleCheckoutSubmit} className="space-y-3.5 border-t border-amber-100 pt-5 text-left">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Delivery & Billing Details</h4>
                {errorStr && (
                  <div className="p-2 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">
                    {errorStr}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-600 uppercase flex items-center space-x-1">
                    <UserIcon className="h-3 w-3 text-amber-500" />
                    <span>Your Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Forhad Hossain"
                    required
                    className="w-full text-xs bg-neutral-50/50 rounded-lg border border-neutral-200 px-3.5 py-2 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-600 uppercase flex items-center space-x-1">
                      <Phone className="h-3 w-3 text-amber-500" />
                      <span>Contact No. / bKash</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +880 181-XXXX"
                      required
                      className="w-full text-xs bg-neutral-50/50 rounded-lg border border-neutral-200 px-3.5 py-2 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  {/* Optional Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-600 uppercase flex items-center space-x-1">
                      <Mail className="h-3 w-3 text-amber-500" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. guest@domain.com"
                      className="w-full text-xs bg-neutral-50/50 rounded-lg border border-neutral-200 px-3.5 py-2 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Address (conditional) */}
                {orderType === "delivery" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-1"
                  >
                    <label className="text-[11px] font-bold text-neutral-600 uppercase flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-amber-500" />
                      <span>Complete Delivery Address (Gulshan-1 Dhaka only)</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="e.g. Apt 3B, House 12, Road 112, Gulshan 1, Dhaka"
                      required={orderType === "delivery"}
                      className="w-full text-xs bg-neutral-50/50 rounded-lg border border-neutral-200 px-3.5 py-2.5 focus:border-amber-400 focus:outline-none"
                    />
                  </motion.div>
                )}

                {/* Chef Instructions */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-600 uppercase flex items-center space-x-1">
                    <MessageSquare className="h-3 w-3 text-amber-500" />
                    <span>Special Kitchen Instructions</span>
                  </label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="e.g. Make Biryani medium chili spicy, extra salad lemon, leave at reception door..."
                    className="w-full text-xs bg-neutral-50/50 rounded-lg border border-neutral-200 px-3.5 py-2 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Cart pricing summaries */}
                <div className="bg-amber-50/75 rounded-2xl p-4 border border-amber-100 space-y-2 mt-5 font-mono">
                  <div className="flex justify-between text-neutral-600 text-xs text-left">
                    <span>Subtotal:</span>
                    <span>৳{subtotal} BDT</span>
                  </div>
                  {orderType === "delivery" && (
                    <div className="flex justify-between text-neutral-600 text-xs text-left">
                      <span>Delivery Charge (Flat):</span>
                      <span>৳{deliveryCharge} BDT</span>
                    </div>
                  )}
                  <div className="border-t border-amber-200/50 pt-2 flex justify-between font-bold text-neutral-900 text-sm text-left">
                    <span>Grand Total:</span>
                    <span className="text-amber-800">৳{grandTotal} BDT</span>
                  </div>
                </div>

                {/* Payment Option Notice */}
                <div className="flex items-start space-x-2 p-3 bg-neutral-50 border border-neutral-150 rounded-xl text-[10px] text-neutral-500 leading-normal mt-2">
                  <CreditCard className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-bold text-neutral-800">Cash On Delivery / Cash On Pickup</span>
                    Payment is secured locally using standard cash collections or personal bKash/Nagad transactions on receipt. Live credit card verification flows are held in compliance checks.
                  </div>
                </div>

                {/* Submit button */}
                <button
                  id="cart-submit-btn"
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all mt-4 ${
                    loading
                      ? "bg-amber-400 cursor-not-allowed animate-pulse"
                      : "bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/10 cursor-pointer hover:shadow-amber-500/25"
                  }`}
                >
                  {loading ? "Transmitting Order to Express SQLite..." : `Checkout Out (৳${grandTotal} BDT)`}
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
