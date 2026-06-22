import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "./db.ts";
import {
  authenticateToken,
  requireRole,
  authRateLimiter,
  validateRegistration,
  validateLogin,
  validateBooking,
  validateOrder,
  JWT_SECRET,
  AuthenticatedRequest
} from "./middleware.ts";

const router = Router();

// ==========================================
// 1. AUTHENTICATION ROUTERS
// ==========================================

// POST /api/auth/register
router.post(
  "/auth/register",
  authRateLimiter,
  validateRegistration,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { username, email, password } = req.body;
      const db = await getDb();

      // Check if user already exists
      const existingUser = await db.get("SELECT id FROM users WHERE email = ? OR username = ?", [email, username]);
      if (existingUser) {
        res.status(409).json({ success: false, error: "Username or Email already registered." });
        await db.close();
        return;
      }

      // Hash password securely with bcryptjs
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Default role is 'user'. First custom registration is always user unless modified or seeded.
      const result = await db.run(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, "user"]
      );

      const userId = result.lastID;
      const user = {
        id: userId!,
        username,
        email,
        role: "user",
        createdAt: new Date().toISOString()
      };

      // Issue JWT Token
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        success: true,
        data: { token, user }
      });
      await db.close();
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ success: false, error: "An error occurred during registration." });
    }
  }
);

// POST /api/auth/login
router.post(
  "/auth/login",
  authRateLimiter,
  validateLogin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const db = await getDb();

      // Retrieve user securely
      const userRecord = await db.get(
        "SELECT id, username, email, password, role, created_at FROM users WHERE email = ?",
        [email]
      );

      if (!userRecord) {
        res.status(401).json({ success: false, error: "Invalid email or password combination." });
        await db.close();
        return;
      }

      // Verify password securely
      const isPasswordMatch = await bcrypt.compare(password, userRecord.password);
      if (!isPasswordMatch) {
        res.status(401).json({ success: false, error: "Invalid email or password combination." });
        await db.close();
        return;
      }

      const user = {
        id: userRecord.id,
        username: userRecord.username,
        email: userRecord.email,
        role: userRecord.role,
        createdAt: userRecord.created_at
      };

      // Sign token
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        data: { token, user }
      });
      await db.close();
    } catch (error: any) {
      console.error("Login trial error:", error);
      res.status(500).json({ success: false, error: "An error occurred during authentication." });
    }
  }
);

// GET /api/auth/me
router.get("/auth/me", authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Session expired or invalid" });
      return;
    }

    const db = await getDb();
    const userRecord = await db.get(
      "SELECT id, username, email, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!userRecord) {
      res.status(404).json({ success: false, error: "User account not found." });
      await db.close();
      return;
    }

    res.json({
      success: true,
      data: {
        id: userRecord.id,
        username: userRecord.username,
        email: userRecord.email,
        role: userRecord.role,
        createdAt: userRecord.created_at
      }
    });
    await db.close();
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Database authentication verification failed." });
  }
});


// ==========================================
// 2. MENU OPERATIONS (PUBLIC & ADMIN)
// ==========================================

// GET /api/menu (Public)
router.get("/menu", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const menuItems = await db.all("SELECT id, name, description, price, category, image_url as imageUrl, available, created_at as createdAt FROM menu_items ORDER BY category, name");
    
    // Map SQLite boolean integers to proper booleans
    const formatted = menuItems.map(item => ({
      ...item,
      available: item.available === 1
    }));

    res.json({ success: true, data: formatted });
    await db.close();
  } catch (error: any) {
    console.error("Failed to query menu:", error);
    res.status(500).json({ success: false, error: "Failed to grab menu collections." });
  }
});

// POST /api/menu (Admin and managers only RBAC)
router.post(
  "/menu",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, description, price, category, imageUrl, available } = req.body;

      if (!name || isNaN(Number(price)) || Number(price) <= 0 || !category || !imageUrl) {
        res.status(400).json({ success: false, error: "Menu item details are invalid or incomplete." });
        return;
      }

      const db = await getDb();
      const dbAvailable = available === false ? 0 : 1;

      const result = await db.run(
        "INSERT INTO menu_items (name, description, price, category, image_url, available) VALUES (?, ?, ?, ?, ?, ?)",
        [name, description || "", Number(price), category, imageUrl, dbAvailable]
      );

      res.status(201).json({
        success: true,
        data: {
          id: result.lastID,
          name,
          description,
          price: Number(price),
          category,
          imageUrl,
          available: dbAvailable === 1
        }
      });
      await db.close();
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Internal db error inserting menu item." });
    }
  }
);

// PUT /api/menu/:id (Admin only RBAC)
router.put(
  "/menu/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const { name, description, price, category, imageUrl, available } = req.body;

      if (!name || isNaN(Number(price)) || Number(price) <= 0 || !category || !imageUrl) {
        res.status(400).json({ success: false, error: "Invalid menu inputs." });
        return;
      }

      const db = await getDb();
      // Look up if exists
      const existing = await db.get("SELECT id FROM menu_items WHERE id = ?", [id]);
      if (!existing) {
        res.status(404).json({ success: false, error: "Menu item not found." });
        await db.close();
        return;
      }

      const dbAvailable = available === false ? 0 : 1;

      await db.run(
        "UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, image_url = ?, available = ? WHERE id = ?",
        [name, description || "", Number(price), category, imageUrl, dbAvailable, id]
      );

      res.json({
        success: true,
        data: {
          id,
          name,
          description,
          price: Number(price),
          category,
          imageUrl,
          available: dbAvailable === 1
        }
      });
      await db.close();
    } catch (error) {
      res.status(500).json({ success: false, error: "Database failed updating menu item." });
    }
  }
);

// DELETE /api/menu/:id (Admin only RBAC)
router.delete(
  "/menu/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const db = await getDb();

      // Look up if exists
      const existing = await db.get("SELECT id FROM menu_items WHERE id = ?", [id]);
      if (!existing) {
        res.status(404).json({ success: false, error: "Menu item not found." });
        await db.close();
        return;
      }

      await db.run("DELETE FROM menu_items WHERE id = ?", [id]);
      res.json({ success: true, data: { id, message: "Menu item deleted successfully." } });
      await db.close();
    } catch (error) {
      res.status(500).json({ success: false, error: "Database failed to delete menu item." });
    }
  }
);


// ==========================================
// 3. BOOKINGS MANAGEMENT
// ==========================================

// POST /api/bookings (Public booking creation, optionally authenticated)
router.post("/bookings", validateBooking, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, date, time, guests, specialRequests } = req.body;
    
    // Express req.user may exist if token was attached client side
    let userId: number | null = null;
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.split(" ")[1]) {
      try {
        const tokenToken = authHeader.split(" ")[1];
        const tokenPayload = jwt.verify(tokenToken, JWT_SECRET) as any;
        userId = tokenPayload.id || null;
      } catch (authError) {
        // Just continue as Guest booking
      }
    }

    const db = await getDb();
    
    const result = await db.run(
      "INSERT INTO bookings (user_id, name, email, phone, date, time, guests, special_requests, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [userId, name, email, phone, date, time, Number(guests), specialRequests || "", "Pending"]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.lastID,
        userId,
        name,
        email,
        phone,
        date,
        time,
        guests: Number(guests),
        specialRequests,
        status: "Pending",
        createdAt: new Date().toISOString()
      }
    });
    await db.close();
  } catch (error) {
    console.error("Booking write error:", error);
    res.status(500).json({ success: false, error: "Database failed while saving table booking." });
  }
});

// GET /api/bookings (Admin only view)
router.get(
  "/bookings",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const db = await getDb();
      const bookings = await db.all("SELECT id, user_id as userId, name, email, phone, date, time, guests, special_requests as specialRequests, status, created_at as createdAt FROM bookings ORDER BY date DESC, time DESC");
      res.json({ success: true, data: bookings });
      await db.close();
    } catch (error) {
      res.status(500).json({ success: false, error: "Database failed to supply table bookings." });
    }
  }
);

// PUT /api/bookings/:id/status (Admin change status like Confirmed, Cancelled, Pending)
router.put(
  "/bookings/:id/status",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      if (!status || !["Pending", "Confirmed", "Cancelled"].includes(status)) {
        res.status(400).json({ success: false, error: "Invalid booking status choice." });
        return;
      }

      const db = await getDb();
      const existing = await db.get("SELECT id FROM bookings WHERE id = ?", [id]);
      if (!existing) {
        res.status(404).json({ success: false, error: "Booking target not found." });
        await db.close();
        return;
      }

      await db.run("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
      res.json({ success: true, data: { id, status } });
      await db.close();
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to alter booking status." });
    }
  }
);


// ==========================================
// 4. ORDERS MANAGEMENT (TAKEAWAY & DELIVERY)
// ==========================================

// POST /api/orders (Public order creation, optionally authenticated)
router.post("/orders", validateOrder, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, items, total, orderType, address, instructions } = req.body;

    let userId: number | null = null;
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.split(" ")[1]) {
      try {
        const tokenToken = authHeader.split(" ")[1];
        const tokenPayload = jwt.verify(tokenToken, JWT_SECRET) as any;
        userId = tokenPayload.id || null;
      } catch (authError) {
        // Continue as Guest transaction
      }
    }

    const db = await getDb();

    // Store array items safely as serialized JSON string
    const serializedItems = JSON.stringify(items);

    const result = await db.run(
      `INSERT INTO orders 
      (user_id, name, email, phone, items, total, order_type, address, instructions, status, payment_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        email,
        phone,
        serializedItems,
        Number(total),
        orderType,
        address || "",
        instructions || "",
        "Pending",
        "Pending"
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.lastID,
        userId,
        name,
        email,
        phone,
        items,
        total: Number(total),
        orderType,
        address,
        instructions,
        status: "Pending",
        paymentStatus: "Pending",
        createdAt: new Date().toISOString()
      }
    });
    await db.close();
  } catch (error: any) {
    console.error("Order submit database error:", error);
    res.status(500).json({ success: false, error: "Database failed while registering takeaway order." });
  }
});

// GET /api/orders (Admin access only)
router.get(
  "/orders",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const db = await getDb();
      const rawOrders = await db.all(`
        SELECT id, user_id as userId, name, email, phone, items, total, order_type as orderType, 
               address, instructions, status, payment_status as paymentStatus, created_at as createdAt 
        FROM orders ORDER BY id DESC
      `);

      // Parse JSON items back before responding
      const formatted = rawOrders.map(ord => {
        try {
          return {
            ...ord,
            items: JSON.parse(ord.items)
          };
        } catch (e) {
          return {
            ...ord,
            items: []
          };
        }
      });

      res.json({ success: true, data: formatted });
      await db.close();
    } catch (error) {
      console.error("Query orders failed:", error);
      res.status(500).json({ success: false, error: "Database failed supplying orders registry." });
    }
  }
);

// PUT /api/orders/:id/status (Admin updates status like Preparing, Ready, Completed, Cancelled)
router.put(
  "/orders/:id/status",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      if (!status || !["Pending", "Preparing", "Ready", "Completed", "Cancelled"].includes(status)) {
        res.status(400).json({ success: false, error: "Invalid status state choice." });
        return;
      }

      const db = await getDb();
      const existing = await db.get("SELECT id FROM orders WHERE id = ?", [id]);
      if (!existing) {
        res.status(404).json({ success: false, error: "Order entry target not found." });
        await db.close();
        return;
      }

      await db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
      res.json({ success: true, data: { id, status } });
      await db.close();
    } catch (error) {
      res.status(500).json({ success: false, error: "Database failed altering order progress." });
    }
  }
);

// PUT /api/orders/:id/payment (Admin toggle Paid/Pending status)
router.put(
  "/orders/:id/payment",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const { paymentStatus } = req.body;

      if (!paymentStatus || !["Pending", "Paid"].includes(paymentStatus)) {
        res.status(400).json({ success: false, error: "Invalid payment status selection." });
        return;
      }

      const db = await getDb();
      const existing = await db.get("SELECT id FROM orders WHERE id = ?", [id]);
      if (!existing) {
        res.status(404).json({ success: false, error: "Order entry target not found." });
        await db.close();
        return;
      }

      await db.run("UPDATE orders SET payment_status = ? WHERE id = ?", [paymentStatus, id]);
      res.json({ success: true, data: { id, paymentStatus } });
      await db.close();
    } catch (error) {
      res.status(500).json({ success: false, error: "Database failed shifting order billing state." });
    }
  }
);

export default router;
