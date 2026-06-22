import React from "react";
import { motion } from "motion/react";
import { Calendar, Users, Clock, MessageSquare, Phone, User as UserIcon, Mail, CheckCircle } from "lucide-react";
import { User } from "../types";

interface BookingFormProps {
  user: User | null;
}

export default function BookingForm({ user }: BookingFormProps) {
  const [formData, setFormData] = React.useState({
    name: user?.username || "",
    email: user?.email || "",
    phone: "",
    date: "",
    time: "",
    guests: "2",
    specialRequests: ""
  });

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Auto populate name/email if user logs in later
  React.useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.username,
        email: user.email
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Dynamic Validation Check
    if (!formData.name.trim()) return setError("Full name is required.");
    if (!formData.email.trim()) return setError("Email is required.");
    if (!formData.phone.trim() || formData.phone.length < 6) return setError("Please input a valid phone number.");
    if (!formData.date) return setError("Please select a date.");
    if (!formData.time) return setError("Please select a dining time slot.");
    
    // Check if date is in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setLoading(false);
      return setError("Reservation date cannot be in the past.");
    }

    try {
      // Collect JWT if optionally signed-in to link the booking
      const token = localStorage.getItem("token");
      const headers: any = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers,
        body: JSON.stringify(formData)
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || "Failed to finalize the booking.");
      }

      setSuccess(resJson.data);
      // Reset non-essential fields
      setFormData({
        name: user?.username || "",
        email: user?.email || "",
        phone: "",
        date: "",
        time: "",
        guests: "2",
        specialRequests: ""
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Obtain today's date string format to lock the input selector minimum boundary
  const getTodayDateString = () => {
    const d = new Date();
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  };

  return (
    <div id="booking-container" className="bg-amber-50/50 rounded-3xl p-6 sm:p-10 border border-amber-100 max-w-4xl mx-auto shadow-sm">
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 space-y-6 max-w-md mx-auto bg-white p-8 rounded-2xl border border-amber-200 shadow-lg"
        >
          <div className="mx-auto h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200">
            <CheckCircle className="h-10 w-10 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-bold text-neutral-800">Reservation Confirmed!</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Assalamu Alaikum, <span className="font-semibold text-neutral-800">{success.name}</span>. Your dining table for <span className="font-semibold text-neutral-800">{success.guests} guests</span> on <span className="font-semibold text-neutral-800">{success.date}</span> at <span className="font-semibold text-neutral-800">{success.time}</span> is now recorded in our system.
            </p>
          </div>

          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-left text-xs space-y-2 font-mono">
            <div><span className="text-neutral-400">TICKET REF:</span> #DD-{success.id}-{100 + success.id}</div>
            <div><span className="text-neutral-400">PHONE:</span> {success.phone}</div>
            <div><span className="text-neutral-400">STATUS:</span> <span className="text-amber-600 font-bold">PENDING APPROVAL</span></div>
            <div><span className="text-neutral-400">VENUE:</span> Plot 14, Road 112, Gulshan 1, Dhaka</div>
          </div>

          <p className="text-[11px] text-neutral-500">
            Our hosting desk will check availability and call or text you shortly to lock your table.
          </p>

          <button
            onClick={() => setSuccess(null)}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-xs font-bold tracking-wider uppercase cursor-pointer"
          >
            Make Another Reservation
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Instructions column */}
          <div className="md:col-span-5 text-left space-y-4">
            <h3 className="font-serif text-3xl font-bold text-neutral-800">
              Reserve Your <span className="text-amber-500 underline decoration-amber-200">Exclusive Table</span>
            </h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Whether celebrating a special occasion with family, organizing an business high-tea in Gulshan-1, or having a candlelight dinner, secure your spot with us.
            </p>
            
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start space-x-3 text-xs">
                <Clock className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-neutral-800">Operating Hours</span>
                  <span className="text-neutral-500">Everyday: 12:00 PM – 11:30 PM</span>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-xs">
                <Users className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-neutral-800">Large Dinings (12+ Guests)</span>
                  <span className="text-neutral-500">Call us directly at <span className="text-amber-600 font-semibold">+880 171-889922</span></span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/50 text-[11px] text-neutral-600">
              <span className="font-bold text-amber-800">Note:</span> Tables are held for 15 minutes past reservation times. Special requests are processed based on guest flow on the floor.
            </div>
          </div>

          {/* Form inputs column */}
          <form onSubmit={handleSubmit} className="md:col-span-7 space-y-4 text-left">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase flex items-center space-x-1">
                  <UserIcon className="h-3 w-3 text-amber-500" />
                  <span>Full Name</span>
                </label>
                <input
                  id="booking-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Forhad Kabir"
                  required
                  className="w-full text-sm bg-white rounded-xl border border-neutral-200 px-3.5 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase flex items-center space-x-1">
                  <Mail className="h-3 w-3 text-amber-500" />
                  <span>Email Address</span>
                </label>
                <input
                  id="booking-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="forhad@gmail.com"
                  required
                  className="w-full text-sm bg-white rounded-xl border border-neutral-200 px-3.5 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone (required) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase flex items-center space-x-1">
                  <Phone className="h-3 w-3 text-amber-500" />
                  <span>Contact Phone</span>
                </label>
                <input
                  id="booking-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +880 171-XXXXXX"
                  required
                  className="w-full text-sm bg-white rounded-xl border border-neutral-200 px-3.5 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              {/* Guests Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase flex items-center space-x-1">
                  <Users className="h-3 w-3 text-amber-500" />
                  <span>Number of Guests</span>
                </label>
                <select
                  id="booking-guests"
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  className="w-full text-sm bg-white rounded-xl border border-neutral-200 px-3.5 py-2.5 focus:border-amber-400 focus:outline-none"
                >
                  <option value="1">1 Person</option>
                  <option value="2">2 Persons</option>
                  <option value="3">3 Persons</option>
                  <option value="4">4 Persons</option>
                  <option value="5">5 Persons</option>
                  <option value="6">6 Persons</option>
                  <option value="8">8 Persons (Party)</option>
                  <option value="10">10+ Persons (Banquet)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Selecting Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-amber-500" />
                  <span>Choose Date</span>
                </label>
                <input
                  id="booking-date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={getTodayDateString()}
                  required
                  className="w-full text-sm bg-white rounded-xl border border-neutral-200 px-3.5 py-2.5 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Choosing Time Slot */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-amber-500" />
                  <span>Preferred Time</span>
                </label>
                <select
                  id="booking-time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full text-sm bg-white rounded-xl border border-neutral-200 px-3.5 py-2.5 focus:border-amber-400 focus:outline-none"
                >
                  <option value="">Select Time</option>
                  <option value="12:00">12:00 PM (Lunch)</option>
                  <option value="12:30">12:30 PM (Lunch)</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="13:30">01:30 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="18:00">06:00 PM (Dinner)</option>
                  <option value="18:30">06:30 PM (Dinner)</option>
                  <option value="19:00">07:00 PM</option>
                  <option value="19:30">07:30 PM</option>
                  <option value="20:00">08:00 PM</option>
                  <option value="20:30">08:30 PM</option>
                  <option value="21:00">09:00 PM</option>
                  <option value="21:30">09:30 PM</option>
                </select>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase flex items-center space-x-1">
                <MessageSquare className="h-3 w-3 text-amber-500" />
                <span>Special Requests / Occasion Details</span>
              </label>
              <textarea
                id="booking-requests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                rows={3}
                placeholder="e.g. Birthday dining table set, highchair for infant, gluten-free, etc."
                className="w-full text-sm bg-white rounded-xl border border-neutral-200 px-3.5 py-2 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <button
              id="booking-submit-btn"
              type="submit"
              disabled={loading}
              className={`w-full py-4.5 rounded-xl font-bold tracking-wider uppercase text-xs text-white transition-all duration-300 ${
                loading
                  ? "bg-amber-400 cursor-not-allowed animate-pulse"
                  : "bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 cursor-pointer"
              }`}
            >
              {loading ? "Registering Table in DB..." : "Confirm My Table Reservation"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
