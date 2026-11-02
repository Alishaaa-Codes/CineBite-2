export const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: 'Sparkles' },
  { id: 'popcorn', label: 'Popcorn', icon: 'Popcorn', hasWeightSpecification: true },
  { id: 'snacks', label: 'Snacks', icon: 'Cookie' },
  { id: 'pizza', label: 'Pizza', icon: 'Pizza' },
  { id: 'drinks', label: 'Drinks', icon: 'CupSoda' },
  { id: 'combos', label: 'Combos & Sweets', icon: 'Package' }
];

export const MENU_ITEMS = [
  // Popcorn
  {
    id: '10000000-0000-0000-0000-000000000001',
    categoryId: 'popcorn',
    name: 'Caramel Gold Crunch Popcorn',
    description: 'Crispy jumbo mushroom corn coated in rich, slow-cooked buttery caramel syrup.',
    price: 280,
    isVeg: true,
    tag: 'Bestseller',
    portion: 'Large Tub (250g)',
    imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=700&q=80',
    hasWeightOptions: true,
    weightOptions: [
      { id: 'small', name: 'Small', weight: '90g', price: 180, description: 'Single serve tub (90g)' },
      { id: 'medium', name: 'Medium', weight: '150g', price: 230, description: 'Standard cinema tub (150g)' },
      { id: 'large', name: 'Large', weight: '250g', price: 280, description: 'Jumbo sharing tub (250g)' }
    ]
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    categoryId: 'popcorn',
    name: 'Classic Golden Butter Popcorn',
    description: 'Freshly popped warm corn generously drizzled with melted dairy butter and sea salt.',
    price: 240,
    isVeg: true,
    tag: 'Classic',
    portion: 'Large Tub (250g)',
    imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=700&q=80',
    hasWeightOptions: true,
    weightOptions: [
      { id: 'small', name: 'Small', weight: '90g', price: 150, description: 'Single serve tub (90g)' },
      { id: 'medium', name: 'Medium', weight: '150g', price: 200, description: 'Standard cinema tub (150g)' },
      { id: 'large', name: 'Large', weight: '250g', price: 240, description: 'Jumbo sharing tub (250g)' }
    ]
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    categoryId: 'popcorn',
    name: 'Peri-Peri Cheese Blast Popcorn',
    description: 'Spicy African birds-eye chili seasoning shaken with sharp cheddar dust for the ultimate kick.',
    price: 290,
    isVeg: true,
    tag: 'Spicy 🔥',
    portion: 'Large Tub (250g)',
    imageUrl: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=700&q=80',
    hasWeightOptions: true,
    weightOptions: [
      { id: 'small', name: 'Small', weight: '90g', price: 190, description: 'Single serve tub (90g)' },
      { id: 'medium', name: 'Medium', weight: '150g', price: 240, description: 'Standard cinema tub (150g)' },
      { id: 'large', name: 'Large', weight: '250g', price: 290, description: 'Jumbo sharing tub (250g)' }
    ]
  },

  // Snacks
  {
    id: '20000000-0000-0000-0000-000000000001',
    categoryId: 'snacks',
    name: 'Loaded Nachos Grande with Salsa & Cheese',
    description: 'Crispy stone-ground corn chips served with warm melted jalapeno cheese sauce and tangy Mexican tomato salsa.',
    price: 320,
    isVeg: true,
    tag: 'Top Pick',
    portion: 'Serves 2',
    imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    categoryId: 'snacks',
    name: 'Crispy Golden Chicken Tenders',
    description: 'Juicy chicken breast strips crumbed with herb batter, fried golden and served with chipotle dip.',
    price: 350,
    isVeg: false,
    tag: 'Chef Special',
    portion: '5 Pcs',
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    categoryId: 'snacks',
    name: 'Truffle Mayo Crinkle Fries',
    description: 'Crisp hot salted crinkle cut french fries tossed in herbs and served with gourmet black truffle mayo.',
    price: 260,
    isVeg: true,
    tag: 'Popular',
    portion: 'Large Box (260g)',
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=700&q=80',
    hasWeightOptions: true,
    weightOptions: [
      { id: 'small', name: 'Small', weight: '120g', price: 170, description: 'Snack cup (120g)' },
      { id: 'medium', name: 'Medium', weight: '180g', price: 220, description: 'Regular box (180g)' },
      { id: 'large', name: 'Large', weight: '260g', price: 260, description: 'Large sharing box (260g)' }
    ]
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    categoryId: 'snacks',
    name: 'Paneer Tikka Stuffed Garlic Bread',
    description: 'Soft artisan baguette baked with garlic herb butter, smoky tandoori paneer cubes, and mozzarella.',
    price: 290,
    isVeg: true,
    tag: 'New',
    portion: '4 Slices',
    imageUrl: 'https://images.unsplash.com/photo-1619860860774-1e2e17343432?auto=format&fit=crop&w=700&q=80'
  },

  // Pizza
  {
    id: '30000000-0000-0000-0000-000000000001',
    categoryId: 'pizza',
    name: 'Classic Margherita Pan Pizza (8")',
    description: 'Italian San Marzano tomato sauce, fresh buffalo mozzarella, aromatic sweet basil, and extra virgin olive oil.',
    price: 390,
    isVeg: true,
    tag: 'Bestseller',
    portion: '8 Inch (4 Slices)',
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    categoryId: 'pizza',
    name: 'Smoked Peri-Peri Chicken Pizza (8")',
    description: 'Tender pulled peri-peri chicken, roasted bell peppers, red onions, mozzarella, and fiery chili oil.',
    price: 460,
    isVeg: false,
    tag: 'Spicy 🔥',
    portion: '8 Inch (4 Slices)',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    categoryId: 'pizza',
    name: 'Farmhouse Supreme Veg Pizza (8")',
    description: 'Loaded with sliced black olives, golden corn, crisp bell peppers, portobello mushrooms, and mozzarella cheese.',
    price: 420,
    isVeg: true,
    tag: 'Loaded',
    portion: '8 Inch (4 Slices)',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=80'
  },

  // Drinks
  {
    id: '40000000-0000-0000-0000-000000000001',
    categoryId: 'drinks',
    name: 'Ice-Cold Coca-Cola Fountain',
    description: 'Chilled bubbly fountain soda served with crushed ice and a fresh lemon wedge.',
    price: 160,
    isVeg: true,
    tag: 'Essential',
    portion: '600 ml',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    categoryId: 'drinks',
    name: 'Fresh Mint Lime Mojito',
    description: 'Sparkling citrus refresher with hand-muddled mint leaves, lime juice, brown sugar, and soda.',
    price: 220,
    isVeg: true,
    tag: 'Refreshing',
    portion: '450 ml',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    categoryId: 'drinks',
    name: 'Hazelnut Cold Brew Iced Coffee',
    description: '16-hour slow steeped Arabica coffee poured over cold milk and roasted hazelnut cream.',
    price: 240,
    isVeg: true,
    tag: 'Energy',
    portion: '400 ml',
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=700&q=80'
  },

  // Combos & Sweets
  {
    id: '50000000-0000-0000-0000-000000000001',
    categoryId: 'combos',
    name: 'CineBite Blockbuster Combo',
    description: '1 Large Caramel Popcorn + 1 Loaded Nachos with Cheese + 2 Large Fountain Cokes (600ml each). Great for couples.',
    price: 699,
    isVeg: true,
    tag: 'Save ₹160',
    portion: 'Feeds 2-3',
    imageUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    categoryId: 'combos',
    name: 'Molten Choco Lava Delight',
    description: 'Warm cocoa sponge filled with molten Belgian dark chocolate center, topped with chocolate sprinkles.',
    price: 230,
    isVeg: true,
    tag: 'Sweet Tooth',
    portion: '110g',
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80'
  }
];

export const DEFAULT_CINEMA_DETAILS = {
  theatreId: '11111111-1111-1111-1111-111111111111',
  screenId: '33333333-3333-3333-3333-333333333333',
  theaterName: 'PVR INOX Grand Cinema',
  screenName: 'Screen 2 (Audi 2 - Dolby Atmos)',
  seatNumber: 'F-14',
  screensAvailable: [
    'Screen 1 (IMAX Laser)',
    'Screen 2 (Audi 2 - Dolby Atmos)',
    'Screen 3 (Gold Class VIP)',
    'Screen 4 (4DX Experience)'
  ]
};
