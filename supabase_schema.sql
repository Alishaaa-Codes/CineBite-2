-- =============================================================================
-- CineBite Cinema Food Ordering System: Database Schema & RLS Policies
-- Complete, Idempotent, Hardened PostgreSQL Schema for Supabase
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- -----------------------------------------------------------------------------
-- 1. THEATRES, SCREENS & SEATS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.theatres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Mumbai',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theatre_id UUID NOT NULL REFERENCES public.theatres(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  seat_code TEXT NOT NULL,       -- e.g. "F-14"
  row_letter TEXT NOT NULL,      -- e.g. "F"
  seat_number INT NOT NULL,      -- e.g. 14
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_screen_seat UNIQUE (screen_id, seat_code)
);

-- -----------------------------------------------------------------------------
-- 2. MENU CATEGORIES & ITEMS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,     -- e.g. "popcorn", "snacks", "pizza"
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0), -- Stored in INR (₹)
  image_url TEXT,
  is_veg BOOLEAN DEFAULT true,
  tag TEXT,                       -- e.g. "Bestseller", "Spicy 🔥"
  portion TEXT,                   -- e.g. "Large Tub (180g)"
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. STAFF ROLES (Restricted Staff & Admin Management)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theatre_id UUID REFERENCES public.theatres(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'kitchen_staff' CHECK (role IN ('kitchen_staff', 'manager', 'admin')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. ORDERS & ORDER ITEMS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,     -- e.g. "CB-4892"
  theatre_id UUID NOT NULL REFERENCES public.theatres(id) ON DELETE RESTRICT,
  screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE RESTRICT,
  theatre_name TEXT NOT NULL,            -- Snapshot at order time
  screen_name TEXT NOT NULL,             -- Snapshot at order time
  seat_code TEXT NOT NULL,               -- e.g. "F-14"
  customer_name TEXT DEFAULT 'Moviegoer',
  customer_phone TEXT,
  special_notes TEXT,
  status TEXT NOT NULL DEFAULT 'received' 
    CHECK (status IN ('received', 'preparing', 'ready', 'delivered', 'cancelled')),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  tax_amount NUMERIC(10, 2) NOT NULL CHECK (tax_amount >= 0),       -- 5% GST
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  order_access_token TEXT NOT NULL,      -- Secret client token to fetch own order
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
  item_name TEXT NOT NULL,               -- Snapshot at order time
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0), -- Trusted menu price
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Optimized indexes for fast dashboard queries and lookups
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_theatre_screen ON public.orders(theatre_id, screen_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);

-- Set Replica Identity for Supabase Realtime broadcast fidelity
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- -----------------------------------------------------------------------------
-- 5. AUTOMATIC TIMESTAMP TRIGGERS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 6. SECURITY DEFINER HELPER FUNCTIONS (Prevent RLS Infinite Recursion)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_staff(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles WHERE id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_admin_or_manager(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles 
    WHERE id = p_user_id AND role IN ('manager', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_staff(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.is_staff_admin_or_manager(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_admin_or_manager(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. ATOMIC ORDER CREATION RPC (Trusted Pricing & Transactional Consistency)
-- -----------------------------------------------------------------------------
-- This PostgreSQL function calculates all prices from the database table (NEVER trusting client price)
-- and inserts both the order and all order items within a single atomic transaction.
CREATE OR REPLACE FUNCTION public.place_cinema_order(
  p_theatre_id UUID,
  p_screen_id UUID,
  p_seat_code TEXT,
  p_items JSONB, -- Array of objects: [{"menu_item_id": "...", "quantity": 2}]
  p_customer_name TEXT DEFAULT 'Moviegoer',
  p_customer_phone TEXT DEFAULT NULL,
  p_special_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated authority to calculate trusted prices & insert
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_theatre_name TEXT;
  v_screen_name TEXT;
  v_order_id UUID;
  v_order_number TEXT;
  v_access_token TEXT;
  v_subtotal NUMERIC(10, 2) := 0;
  v_tax NUMERIC(10, 2) := 0;
  v_total NUMERIC(10, 2) := 0;
  v_item RECORD;
  v_menu_item RECORD;
  v_line_total NUMERIC(10, 2);
  v_items_count INT;
BEGIN
  -- 1. Validate seat code
  IF p_seat_code IS NULL OR length(trim(p_seat_code)) < 2 THEN
    RAISE EXCEPTION 'A valid seat code (at least 2 characters) is required.';
  END IF;

  -- 2. Validate theatre & screen
  SELECT name INTO v_theatre_name FROM public.theatres WHERE id = p_theatre_id;
  IF v_theatre_name IS NULL THEN
    RAISE EXCEPTION 'Invalid theatre specified.';
  END IF;

  SELECT name INTO v_screen_name FROM public.screens WHERE id = p_screen_id AND theatre_id = p_theatre_id;
  IF v_screen_name IS NULL THEN
    RAISE EXCEPTION 'Invalid screen specified for this theatre.';
  END IF;

  -- 3. Validate items array
  v_items_count := jsonb_array_length(p_items);
  IF v_items_count IS NULL OR v_items_count = 0 THEN
    RAISE EXCEPTION 'Cart contains 0 items. At least one menu item is required.';
  END IF;

  -- Generate order number (CB-XXXX) and cryptographically secure client access token
  v_order_number := 'CB-' || lpad((floor(random() * 9000 + 1000))::text, 4, '0');
  v_access_token := encode(gen_random_bytes(24), 'hex');
  v_order_id := gen_random_uuid();

  -- 4. Calculate trusted prices from public.menu_items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(menu_item_id UUID, quantity INT)
  LOOP
    IF v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity: %', v_item.quantity;
    END IF;

    SELECT id, name, price, is_available 
    INTO v_menu_item 
    FROM public.menu_items 
    WHERE id = v_item.menu_item_id;

    IF v_menu_item.id IS NULL THEN
      RAISE EXCEPTION 'Menu item % not found in database.', v_item.menu_item_id;
    END IF;

    IF NOT v_menu_item.is_available THEN
      RAISE EXCEPTION 'Item "%" is currently out of stock.', v_menu_item.name;
    END IF;

    v_line_total := v_menu_item.price * v_item.quantity;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  -- 5. Calculate GST (5%) and Grand Total
  v_tax := round(v_subtotal * 0.05, 2);
  v_total := v_subtotal + v_tax;

  -- 6. Insert Order Header
  INSERT INTO public.orders (
    id,
    order_number,
    theatre_id,
    screen_id,
    theatre_name,
    screen_name,
    seat_code,
    customer_name,
    customer_phone,
    special_notes,
    status,
    subtotal,
    tax_amount,
    delivery_fee,
    total_amount,
    order_access_token
  ) VALUES (
    v_order_id,
    v_order_number,
    p_theatre_id,
    p_screen_id,
    v_theatre_name,
    v_screen_name,
    upper(trim(p_seat_code)),
    coalesce(nullif(trim(p_customer_name), ''), 'Moviegoer'),
    nullif(trim(p_customer_phone), ''),
    nullif(trim(p_special_notes), ''),
    'received',
    v_subtotal,
    v_tax,
    0.00,
    v_total,
    v_access_token
  );

  -- 7. Insert Order Items using trusted database price snapshot
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(menu_item_id UUID, quantity INT)
  LOOP
    SELECT name, price INTO v_menu_item FROM public.menu_items WHERE id = v_item.menu_item_id;
    
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      item_name,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      v_order_id,
      v_item.menu_item_id,
      v_menu_item.name,
      v_item.quantity,
      v_menu_item.price,
      v_menu_item.price * v_item.quantity
    );
  END LOOP;

  -- 8. Return created order payload
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'status', 'received',
    'theatre_name', v_theatre_name,
    'screen_name', v_screen_name,
    'seat_code', upper(trim(p_seat_code)),
    'subtotal', v_subtotal,
    'tax_amount', v_tax,
    'total_amount', v_total,
    'access_token', v_access_token,
    'created_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_cinema_order(UUID, UUID, TEXT, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_cinema_order(UUID, UUID, TEXT, JSONB, TEXT, TEXT, TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 8. SECURE ORDER STATUS LOOKUP RPC (Token-Authenticated)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_order_status(
  p_order_id UUID,
  p_access_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_res JSONB;
BEGIN
  IF p_order_id IS NULL OR p_access_token IS NULL OR trim(p_access_token) = '' THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'status', o.status,
    'theatre_name', o.theatre_name,
    'screen_name', o.screen_name,
    'seat_code', o.seat_code,
    'subtotal', o.subtotal,
    'tax_amount', o.tax_amount,
    'total_amount', o.total_amount,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'items', (
      SELECT jsonb_agg(jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price
      ))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    )
  ) INTO v_res
  FROM public.orders o
  WHERE o.id = p_order_id AND o.order_access_token = p_access_token;

  RETURN v_res;
END;
$$;

REVOKE ALL ON FUNCTION public.get_order_status(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_status(UUID, TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.theatres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Theatres, Screens, Seats & Menu: Anyone can read active records
DROP POLICY IF EXISTS "Public can view theatres" ON public.theatres;
CREATE POLICY "Public can view theatres" 
  ON public.theatres FOR SELECT TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "Public can view screens" ON public.screens;
CREATE POLICY "Public can view screens" 
  ON public.screens FOR SELECT TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "Public can view seats" ON public.seats;
CREATE POLICY "Public can view seats" 
  ON public.seats FOR SELECT TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "Public can view active menu categories" ON public.menu_categories;
CREATE POLICY "Public can view active menu categories" 
  ON public.menu_categories FOR SELECT TO anon, authenticated 
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can view available menu items" ON public.menu_items;
CREATE POLICY "Public can view available menu items" 
  ON public.menu_items FOR SELECT TO anon, authenticated 
  USING (is_available = true);

-- Staff Profiles: Non-recursive security check
DROP POLICY IF EXISTS "Staff can view staff profiles" ON public.staff_profiles;
CREATE POLICY "Staff can view staff profiles" 
  ON public.staff_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_staff_admin_or_manager(auth.uid()));

-- Orders: Staff members can SELECT and UPDATE orders
DROP POLICY IF EXISTS "Staff can view orders" ON public.orders;
CREATE POLICY "Staff can view orders" 
  ON public.orders FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can update order status" ON public.orders;
CREATE POLICY "Staff can update order status" 
  ON public.orders FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Order Items: Staff can SELECT order items
DROP POLICY IF EXISTS "Staff can view order items" ON public.order_items;
CREATE POLICY "Staff can view order items" 
  ON public.order_items FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- -----------------------------------------------------------------------------
-- 10. REALTIME REPLICATION (For Kitchen Dashboard Live Streaming)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 11. SAMPLE SEED DATA (Idempotent upsert matching frontend default IDs)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_theatre_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_screen_1_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  v_screen_2_id UUID := '33333333-3333-3333-3333-333333333333'::UUID;
  v_cat_popcorn UUID := 'c0000000-0000-0000-0000-000000000001'::UUID;
  v_cat_snacks UUID := 'c0000000-0000-0000-0000-000000000002'::UUID;
  v_cat_pizza UUID := 'c0000000-0000-0000-0000-000000000003'::UUID;
  v_cat_drinks UUID := 'c0000000-0000-0000-0000-000000000004'::UUID;
  v_cat_combos UUID := 'c0000000-0000-0000-0000-000000000005'::UUID;
BEGIN
  -- Insert Theatre
  INSERT INTO public.theatres (id, name, city)
  VALUES (v_theatre_id, 'PVR INOX Grand Cinema', 'Mumbai')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- Insert Screens
  INSERT INTO public.screens (id, theatre_id, name)
  VALUES 
    (v_screen_1_id, v_theatre_id, 'Screen 1 (IMAX Laser)'),
    (v_screen_2_id, v_theatre_id, 'Screen 2 (Audi 2 - Dolby Atmos)')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- Insert Sample Seats for Screen 2
  INSERT INTO public.seats (screen_id, seat_code, row_letter, seat_number)
  VALUES 
    (v_screen_2_id, 'F-14', 'F', 14),
    (v_screen_2_id, 'E-12', 'E', 12),
    (v_screen_2_id, 'G-08', 'G', 8),
    (v_screen_2_id, 'H-10', 'H', 10),
    (v_screen_2_id, 'VIP-02', 'V', 2)
  ON CONFLICT ON CONSTRAINT uq_screen_seat DO NOTHING;

  -- Insert Categories
  INSERT INTO public.menu_categories (id, slug, name, display_order)
  VALUES 
    (v_cat_popcorn, 'popcorn', 'Popcorn', 1),
    (v_cat_snacks, 'snacks', 'Snacks', 2),
    (v_cat_pizza, 'pizza', 'Pizza', 3),
    (v_cat_drinks, 'drinks', 'Drinks', 4),
    (v_cat_combos, 'combos', 'Combos & Sweets', 5)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- Insert Menu Items with matching UUIDs
  INSERT INTO public.menu_items (id, category_id, name, description, price, is_veg, tag, portion, image_url)
  VALUES
    ('10000000-0000-0000-0000-000000000001', v_cat_popcorn, 'Caramel Gold Crunch Popcorn', 'Crispy jumbo mushroom corn coated in rich, slow-cooked buttery caramel syrup.', 280.00, true, 'Bestseller', 'Large Tub (180g)', 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=700&q=80'),
    ('10000000-0000-0000-0000-000000000002', v_cat_popcorn, 'Classic Golden Butter Popcorn', 'Freshly popped warm corn generously drizzled with melted dairy butter and sea salt.', 240.00, true, 'Classic', 'Large Tub (170g)', 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=700&q=80'),
    ('10000000-0000-0000-0000-000000000003', v_cat_popcorn, 'Peri-Peri Cheese Blast Popcorn', 'Spicy African birds-eye chili seasoning shaken with sharp cheddar dust.', 290.00, true, 'Spicy 🔥', 'Large Tub (180g)', 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=700&q=80'),
    ('20000000-0000-0000-0000-000000000001', v_cat_snacks, 'Loaded Nachos Grande with Salsa & Cheese', 'Crispy corn chips served with warm melted jalapeno cheese sauce and tangy salsa.', 320.00, true, 'Top Pick', 'Serves 2', 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=700&q=80'),
    ('20000000-0000-0000-0000-000000000002', v_cat_snacks, 'Crispy Golden Chicken Tenders', 'Juicy chicken breast strips crumbed with herb batter, served with chipotle dip.', 350.00, false, 'Chef Special', '5 Pcs', 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=700&q=80'),
    ('20000000-0000-0000-0000-000000000003', v_cat_snacks, 'Truffle Mayo Crinkle Fries', 'Crisp hot salted crinkle cut french fries tossed in herbs with black truffle mayo.', 260.00, true, 'Popular', 'Reg (220g)', 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=700&q=80'),
    ('20000000-0000-0000-0000-000000000004', v_cat_snacks, 'Paneer Tikka Stuffed Garlic Bread', 'Soft artisan baguette baked with garlic herb butter, smoky tandoori paneer cubes, and mozzarella.', 290.00, true, 'New', '4 Slices', 'https://images.unsplash.com/photo-1619860860774-1e2e17343432?auto=format&fit=crop&w=700&q=80'),
    ('30000000-0000-0000-0000-000000000001', v_cat_pizza, 'Classic Margherita Pan Pizza (8")', 'San Marzano tomato sauce, fresh buffalo mozzarella, aromatic basil, and olive oil.', 390.00, true, 'Bestseller', '8 Inch (4 Slices)', 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=700&q=80'),
    ('30000000-0000-0000-0000-000000000002', v_cat_pizza, 'Smoked Peri-Peri Chicken Pizza (8")', 'Tender pulled peri-peri chicken, roasted bell peppers, red onions, mozzarella.', 460.00, false, 'Spicy 🔥', '8 Inch (4 Slices)', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=80'),
    ('30000000-0000-0000-0000-000000000003', v_cat_pizza, 'Farmhouse Supreme Veg Pizza (8")', 'Loaded with sliced black olives, golden corn, crisp bell peppers, portobello mushrooms, and mozzarella.', 420.00, true, 'Loaded', '8 Inch (4 Slices)', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=80'),
    ('40000000-0000-0000-0000-000000000001', v_cat_drinks, 'Ice-Cold Coca-Cola Fountain', 'Chilled bubbly fountain soda served with crushed ice and a fresh lemon wedge.', 160.00, true, 'Essential', '600 ml', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80'),
    ('40000000-0000-0000-0000-000000000002', v_cat_drinks, 'Fresh Mint Lime Mojito', 'Sparkling citrus refresher with hand-muddled mint leaves, lime juice, and soda.', 220.00, true, 'Refreshing', '450 ml', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=80'),
    ('40000000-0000-0000-0000-000000000003', v_cat_drinks, 'Hazelnut Cold Brew Iced Coffee', '16-hour slow steeped Arabica coffee poured over cold milk and roasted hazelnut cream.', 240.00, true, 'Energy', '400 ml', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=700&q=80'),
    ('50000000-0000-0000-0000-000000000001', v_cat_combos, 'CineBite Blockbuster Combo', '1 Large Caramel Popcorn + 1 Loaded Nachos + 2 Large Fountain Cokes (600ml each).', 699.00, true, 'Save ₹160', 'Feeds 2-3', 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=700&q=80'),
    ('50000000-0000-0000-0000-000000000002', v_cat_combos, 'Molten Choco Lava Delight', 'Warm cocoa sponge filled with molten Belgian dark chocolate center, topped with sprinkles.', 230.00, true, 'Sweet Tooth', '110g', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80')
  ON CONFLICT (id) DO UPDATE SET 
    price = EXCLUDED.price,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

END $$;
