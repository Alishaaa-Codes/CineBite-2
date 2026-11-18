/**
 * CineBite Multi-Cinema / Multi-Tenant Registry
 * Manages cinema locations, dedicated QR codes, screens, and staff authentication
 */

export const MASTER_STAFF_PASSCODES = [
  'cinebite2026',
  'staff123',
  '1234',
  'admin123',
  'chef123'
];

export const PRESET_CINEMAS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'pvr-grand',
    name: 'PVR INOX Grand Cinema',
    city: 'Mumbai (Phoenix Palladium)',
    brandColor: '#E50914',
    tagline: 'Luxury Cinema Dining',
    passcodes: ['pvr2026', 'pvr123'],
    defaultScreen: 'Screen 2 (Audi 2 - Dolby Atmos)',
    defaultScreenId: '33333333-3333-3333-3333-333333333333',
    screens: [
      { id: '22222222-2222-2222-2222-222222222222', name: 'Screen 1 (IMAX Laser)' },
      { id: '33333333-3333-3333-3333-333333333333', name: 'Screen 2 (Audi 2 - Dolby Atmos)' },
      { id: '44444444-4444-4444-4444-444444444444', name: 'Screen 3 (Gold Class VIP)' },
      { id: '55555555-5555-5555-5555-555555555555', name: 'Screen 4 (4DX Motion)' }
    ]
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    slug: 'cinepolis',
    name: 'Cinepolis Megaplex',
    city: 'Bengaluru (Nexus Mall)',
    brandColor: '#2563EB',
    tagline: 'The Best Movie Experience',
    passcodes: ['cinepolis2026', 'cinepolis123'],
    defaultScreen: 'Audi 2 (Dolby Atmos 4K)',
    defaultScreenId: '66666666-6666-6666-6666-000000000002',
    screens: [
      { id: '66666666-6666-6666-6666-000000000001', name: 'Audi 1 (Macro XE Laser)' },
      { id: '66666666-6666-6666-6666-000000000002', name: 'Audi 2 (Dolby Atmos 4K)' },
      { id: '66666666-6666-6666-6666-000000000003', name: 'Audi 3 (VIP Lounge Recliners)' },
      { id: '66666666-6666-6666-6666-000000000004', name: 'Audi 4 (Junior Play Screen)' }
    ]
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    slug: 'inox-luxe',
    name: 'INOX Luxe Multiplex',
    city: 'Delhi NCR (Worldmark Aerocity)',
    brandColor: '#D97706',
    tagline: 'Gourmet Live In-Seat Feast',
    passcodes: ['inox2026', 'inox123'],
    defaultScreen: 'Audi 1 (Insignia Luxury)',
    defaultScreenId: '77777777-7777-7777-7777-000000000001',
    screens: [
      { id: '77777777-7777-7777-7777-000000000001', name: 'Audi 1 (Insignia Luxury)' },
      { id: '77777777-7777-7777-7777-000000000002', name: 'Audi 2 (MX4D Immersive)' },
      { id: '77777777-7777-7777-7777-000000000003', name: 'Audi 3 (Club Dolby Atmos)' }
    ]
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    slug: 'miraj-cinemas',
    name: 'Miraj Cinemas',
    city: 'Ahmedabad (City Center)',
    brandColor: '#10B981',
    tagline: 'Fresh Cinema Bites',
    passcodes: ['miraj2026', 'miraj123'],
    defaultScreen: 'Audi 1 (RGB Laser 3D)',
    defaultScreenId: '88888888-8888-8888-8888-000000000001',
    screens: [
      { id: '88888888-8888-8888-8888-000000000001', name: 'Audi 1 (RGB Laser 3D)' },
      { id: '88888888-8888-8888-8888-000000000002', name: 'Audi 2 (Dolby 7.1 Prime)' },
      { id: '88888888-8888-8888-8888-000000000003', name: 'Audi 3 (Recliner Gold)' }
    ]
  }
];

export const DEFAULT_CINEMA = PRESET_CINEMAS[0];

/**
 * Retrieve all registered cinemas (presets + custom saved)
 */
export function getAllCinemas() {
  if (typeof window === 'undefined') return PRESET_CINEMAS;
  try {
    const raw = localStorage.getItem('cinebite_custom_cinemas');
    if (raw) {
      const customList = JSON.parse(raw);
      if (Array.isArray(customList) && customList.length > 0) {
        const customSlugs = new Set(customList.map(c => c.slug));
        const filteredPresets = PRESET_CINEMAS.filter(p => !customSlugs.has(p.slug));
        return [...filteredPresets, ...customList];
      }
    }
  } catch (e) {
    console.warn('Error reading custom cinemas:', e);
  }
  return PRESET_CINEMAS;
}

/**
 * Register a new custom cinema (persisted to localStorage & available across tabs)
 */
export function registerCinema({ name, city = 'India', screens = [], passcode = '1234' }) {
  if (!name || !name.trim()) throw new Error('Cinema name is required.');
  
  const cleanName = name.trim();
  const baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const slug = baseSlug || `cinema-${Date.now()}`;
  const id = `theatre-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const screenObjects = (screens.length > 0 ? screens : ['Screen 1 (Main Hall)', 'Screen 2 (VIP Recliner)']).map((s, idx) => {
    if (typeof s === 'object' && s.name) return s;
    return {
      id: `${id}-screen-${idx + 1}`,
      name: String(s)
    };
  });

  const newCinema = {
    id,
    slug,
    name: cleanName,
    city: city.trim() || 'Cinema City',
    brandColor: '#E50914',
    tagline: 'Fresh In-Seat Dining',
    passcodes: [passcode.trim(), 'cinebite2026'],
    defaultScreen: screenObjects[0].name,
    defaultScreenId: screenObjects[0].id,
    screens: screenObjects,
    isCustom: true,
    createdAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const current = getAllCinemas();
      const updated = [newCinema, ...current.filter(c => c.slug !== slug && c.id !== id)];
      const customOnly = updated.filter(c => c.isCustom);
      localStorage.setItem('cinebite_custom_cinemas', JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Failed to save custom cinema:', e);
    }
  }


  return newCinema;
}

/**
 * Resolve a cinema from slug, name, or UUID
 */
export function resolveCinema(slugOrNameOrId) {
  if (!slugOrNameOrId) return DEFAULT_CINEMA;
  const target = String(slugOrNameOrId).trim().toLowerCase();
  const all = getAllCinemas();

  // 1. Match slug exact
  let match = all.find(c => c.slug.toLowerCase() === target);
  if (match) return match;

  // 2. Match ID exact
  match = all.find(c => c.id.toLowerCase() === target);
  if (match) return match;

  // 3. Match Name exact
  match = all.find(c => c.name.toLowerCase() === target);
  if (match) return match;

  // 4. Match Name fuzzy (contains)
  match = all.find(c => c.name.toLowerCase().includes(target) || target.includes(c.name.toLowerCase()));
  if (match) return match;

  // 5. Match by brand prefix (e.g. 'pvr', 'cinepolis', 'inox', 'miraj')
  match = all.find(c => target.includes(c.slug) || c.slug.includes(target));
  if (match) return match;

  // Fallback: create an on-the-fly cinema structure for this name
  return {
    id: `theatre-${target.replace(/[^a-z0-9]/g, '') || 'custom'}`,
    slug: target.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'custom-cinema',
    name: slugOrNameOrId,
    city: 'Cinema City',
    brandColor: '#E50914',
    tagline: 'In-Seat Cinema Dining',
    passcodes: ['cinebite2026', '1234'],
    defaultScreen: 'Screen 1 (Main Hall)',
    defaultScreenId: 'default-screen-1',
    screens: [
      { id: 'screen-1', name: 'Screen 1 (Main Hall)' },
      { id: 'screen-2', name: 'Screen 2 (VIP Recliner)' }
    ]
  };
}

/**
 * Validates staff authentication against cinema's authorized credentials
 */
export function validateCinemaStaff({ cinemaSlugOrId, password }) {
  const cleanPass = (password || '').trim();
  if (!cleanPass) return { authorized: false, error: 'Password or PIN required.' };

  // Master passcodes unlock all cinemas
  if (MASTER_STAFF_PASSCODES.includes(cleanPass)) {
    return { authorized: true, isMaster: true };
  }

  const cinema = resolveCinema(cinemaSlugOrId);
  if (!cinema) {
    return { authorized: false, error: 'Cinema not found in registry.' };
  }

  const isCinemaPass = (cinema.passcodes || []).some(p => p.toLowerCase() === cleanPass.toLowerCase());
  if (isCinemaPass) {
    return { authorized: true, cinema };
  }

  return {
    authorized: false,
    error: `Incorrect security PIN for ${cinema.name}. Use cinema PIN (${cinema.passcodes?.[0] || 'pvr2026'}) or master passcode (cinebite2026).`
  };
}
