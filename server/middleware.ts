import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

// Define JWT Secret (defaulting to a secure random/static fallback if not configured in .env)
export const JWT_SECRET = process.env.JWT_SECRET || "gulshan_dhaka_dine_exclusive_jwt_secret_token";

// Type-safe Express Request wrapper that supports populated user sessions
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

// 1. JWT Authentication verification middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

  if (!token) {
    res.status(401).json({ success: false, error: "Access token is missing" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ success: false, error: "Access token is invalid or expired" });
      return;
    }
    // Set user onto req
    req.user = user as any;
    next();
  });
}

// 2. Role-Based Access Control checker
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: "Forbidden: You do not have permission" });
      return;
    }
    
    next();
  };
}

// 3. Proper Rate Limiting for Authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs for authentication
  message: {
    success: false,
    error: "Too many attempts from this IP. Please try again after 15 minutes."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// 4. Input Validation Middleware definitions to ensure robust parameters
export function validateRegistration(req: Request, res: Response, next: NextFunction): void {
  const { username, email, password } = req.body;

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    res.status(400).json({ success: false, error: "Username must be at least 3 characters long." });
    return;
  }

  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    res.status(400).json({ success: false, error: "A valid email address is required." });
    return;
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ success: false, error: "Password must be at least 6 characters long." });
    return;
  }

  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: "Email and password are required." });
    return;
  }

  next();
}

export function validateBooking(req: Request, res: Response, next: NextFunction): void {
  const { name, email, phone, date, time, guests } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ success: false, error: "Customer name is required." });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    res.status(400).json({ success: false, error: "A valid email is required." });
    return;
  }

  // Bangladesh/global formatting phone check
  if (!phone || phone.trim().length < 6) {
    res.status(400).json({ success: false, error: "A valid contact phone number is required." });
    return;
  }

  // Simple date format check (YYYY-MM-DD or equivalent)
  if (!date || isNaN(Date.parse(date))) {
    res.status(400).json({ success: false, error: "A valid booking date is required." });
    return;
  }

  // Time format check (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!time || !timeRegex.test(time)) {
    res.status(400).json({ success: false, error: "A valid booking time is required (HH:MM)." });
    return;
  }

  const numGuests = Number(guests);
  if (isNaN(numGuests) || numGuests < 1 || numGuests > 30) {
    res.status(400).json({ success: false, error: "Select number of guests between 1 and 30." });
    return;
  }

  next();
}

export function validateOrder(req: Request, res: Response, next: NextFunction): void {
  const { name, email, phone, items, total, orderType, address } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ success: false, error: "Name is required for order fulfillment." });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    res.status(400).json({ success: false, error: "A valid email is required." });
    return;
  }

  if (!phone || phone.trim().length < 6) {
    res.status(400).json({ success: false, error: "A valid phone number is required." });
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: "Orders must contain at least one menu item." });
    return;
  }

  if (isNaN(Number(total)) || Number(total) <= 0) {
    res.status(400).json({ success: false, error: "Order total must be greater than zero." });
    return;
  }

  if (orderType !== "takeaway" && orderType !== "delivery") {
    res.status(400).json({ success: false, error: "Select order type: either takeaway or delivery." });
    return;
  }

  if (orderType === "delivery" && (!address || address.trim().length < 5)) {
    res.status(400).json({ success: false, error: "Delivery address (minimum 5 characters) is required." });
    return;
  }

  next();
}
