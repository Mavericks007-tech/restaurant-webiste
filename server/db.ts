import { open } from "sqlite";
import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

// Explicitly resolve the database file path in the workspace root
const dbPath = path.resolve(process.cwd(), "database.sqlite");

export async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}

export async function initDb() {
  const db = await getDb();
  
  // Enable foreign keys
  await db.get("PRAGMA foreign_keys = ON;");

  // Create Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Menu Items Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      available INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Bookings Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      guests INTEGER NOT NULL,
      special_requests TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Create Orders Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      items TEXT NOT NULL, -- Stored as JSON string
      total REAL NOT NULL,
      order_type TEXT NOT NULL, -- 'takeaway' or 'delivery'
      address TEXT,
      instructions TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Seed default admin user if none exists
  const adminEmail = "admin@dhakadine.com";
  const existingAdmin = await db.get("SELECT id FROM users WHERE email = ?", [adminEmail]);
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.run(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      ["Admin.Gulshan", adminEmail, hashedPassword, "admin"]
    );
    console.log("Database: Default admin account created (admin@dhakadine.com / admin123)");
  }

  // Clear previous traditional seed items if they existed, so we transition correctly to Jamaican/American Brunch
  const checkOldSeed = await db.get("SELECT id FROM menu_items WHERE category = 'Traditional' LIMIT 1");
  if (checkOldSeed) {
    await db.exec("DELETE FROM menu_items;");
    console.log("Database: Cleared old traditional seed items.");
  }

  // Seed default menu items if the table is empty
  const menuCount = await db.get("SELECT COUNT(*) as count FROM menu_items");
  if (menuCount && (menuCount as any).count === 0) {
    const seedItems = [
      {
        name: "Signature Truffle Wagyu Benedict",
        description: "Two poached premium organic eggs, paper-thin shaved Italian black truffles, and butter-seared Wagyu tenderloin medallions on artisanal house sourdough. Drizzled with gold-leaf hollandaise sauce.",
        price: 2450,
        category: "American Brunch",
        image_url: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&q=80&w=600",
        available: 1,
      },
      {
        name: "Montego Bay Kingston Jerk Chicken",
        description: "An authentic masterpiece. Half-spring chicken slow-smoked over aromatic pimento wood, rubbed in a fiery Kingston scotch bonnet pepper paste, allspice, and fresh thyme. Served with rich red beans & coconut rice.",
        price: 1950,
        category: "Jamaican Mains",
        image_url: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=600",
        available: 1,
      },
      {
        name: "Island Royal Lobster Rundown",
        description: "Fresh Bay of Bengal lobster tail poached gently in a traditional reduction of spiced sweet coconut milk, scotch bonnets, ripe tomatoes, sweet bell peppers, and scallions. Pure luxury.",
        price: 3600,
        category: "Jamaican Mains",
        image_url: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&q=80&w=600",
        available: 1,
      },
      {
        name: "Gourmet Buttermilk Chicken & Waffles",
        description: "Spiced triple-dredged organic chicken breast fried crisp, seated on a golden Belgian sugar-pearl waffle, accompanied by luxurious bourbon vanilla butter and heated dark Vermont maple glaze.",
        price: 1650,
        category: "American Brunch",
        image_url: "https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&q=80&w=600",
        available: 1,
      },
      {
        name: "Bel-Air Smoked Salmon Croissant Boat",
        description: "Giant golden butter croissant split and filled with sliced premium oak-smoked Norwegian salmon roses, rich dill infusion cream cheese, wild caper berries, and fresh trout caviar.",
        price: 1850,
        category: "American Brunch",
        image_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600",
        available: 1,
      },
      {
        name: "Montego Bay Escovitch Red Snapper",
        description: "A whole pristine local Red Snapper seasoned with Jamaican sea salt, fried to a magnificent golden shell, and dressed with a hot pickled medley of bell peppers, carrots, scotch bonnets, and vinegar onions.",
        price: 2800,
        category: "Jamaican Mains",
        image_url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600",
        available: 1,
      },
      {
        name: "American Prime Aged Ribeye & Eggs",
        description: "Dry-aged custom-cut American Ribeye steak (350g) pan-seared in garlic herb butter. Delivered with two sunny-side organic eggs and rosemary-roasted fingerling potatoes.",
        price: 4200,
        category: "American Brunch",
        image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600",
        available: 1,
      },
      {
        name: "Kingston Sweet Cocoa Bread Sliders",
        description: "Thick sweet yeast Jamaican cocoa breads stuffed with pan-fried spicy saltfish and ackee egg scramble and finished with a wild coriander house-mayo drop.",
        price: 1350,
        category: "Jamaican Mains",
        image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
        available: 1,
      },
      {
        name: "Portland Wild-Berry French Toast Flambé",
        description: "Thick brioche bread block soaked in spiced organic cinnamon custard, pan-caramelized with Jamaica dark rum, topped with heavy clotted cream and hot organic garden berry compote.",
        price: 1250,
        category: "Desserts",
        image_url: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&q=80&w=600",
        available: 1,
      },
      {
        name: "Saffron Blue Mountain Affogato",
        description: "A single-origin shot of roasted Jamaican Blue Mountain espresso poured hot over dual scoops of Madagascar vanilla bean gelato, dusted with fresh saffron filaments and almond biscotti.",
        price: 950,
        category: "Beverages",
        image_url: "https://images.unsplash.com/photo-1594911774802-8822a707c935?auto=format&fit=crop&q=80&w=600",
        available: 1,
      },
      {
        name: "Island Spice Mango-Ginger Mimosa",
        description: "A luxury mocktail combining freshly pureed mango pulp, squeezed limes, authentic Jamaican spicy ginger brew, and non-alcoholic premium white grape sparkling cider.",
        price: 750,
        category: "Beverages",
        image_url: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=600",
        available: 1,
      }
    ];

    for (const item of seedItems) {
      await db.run(
        "INSERT INTO menu_items (name, description, price, category, image_url, available) VALUES (?, ?, ?, ?, ?, ?)",
        [item.name, item.description, item.price, item.category, item.image_url, item.available]
      );
    }
    console.log("Database: Seeded premium high-end Jamaican-American cuisines.");
  }

  await db.close();
}
