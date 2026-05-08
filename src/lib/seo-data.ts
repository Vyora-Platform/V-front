export const TOOLS = [
  { slug: 'crm', name: 'CRM Software', desc: 'Powerful local CRM' },
  { slug: 'billing', name: 'Billing Software', desc: 'GST ready billing' },
  { slug: 'marketing', name: 'Marketing Automation', desc: 'Grow your reach' },
  { slug: 'pos', name: 'POS System', desc: 'Point of sale software' },
  { slug: 'website-builder', name: 'Website Builder', desc: 'Free business website' },
  { slug: 'booking', name: 'Appointment Booking', desc: 'Easy scheduling' }
];

export const FEATURES = [
  { slug: 'automation', name: 'Automation' },
  { slug: 'payments', name: 'Payments Collection' },
  { slug: 'analytics', name: 'Business Analytics' }
];

export const INDUSTRIES = [
  { slug: 'gyms', name: 'Gyms & Fitness Centers', s: 'Gym', l: 'Fitness Centers' },
  { slug: 'clinics', name: 'Clinics & Hospitals', s: 'Clinic', l: 'Hospitals' },
  { slug: 'salons', name: 'Salons & Spas', s: 'Salon', l: 'Spas' },
  { slug: 'restaurants', name: 'Restaurants & Cafes', s: 'Restaurant', l: 'Cafes' },
  { slug: 'retail', name: 'Retail Shops', s: 'Retail', l: 'Shops' },
  { slug: 'real-estate', name: 'Real Estate Agencies', s: 'Real Estate', l: 'Agencies' },
  { slug: 'pharmacy', name: 'Pharmacies & Medical Stores', s: 'Pharmacy', l: 'Medical Stores' },
  { slug: 'education', name: 'Schools & Coaching Centers', s: 'Education', l: 'Coaching' },
  { slug: 'automotive', name: 'Automobile Showrooms', s: 'Auto', l: 'Showrooms' },
  { slug: 'travel', name: 'Travel & Tourism Agencies', s: 'Travel', l: 'Agencies' },
  { slug: 'wedding', name: 'Wedding & Event Planners', s: 'Wedding', l: 'Planners' },
  { slug: 'logistics', name: 'Logistics & Transport', s: 'Logistics', l: 'Transport' },
  { slug: 'fitness-wellness', name: 'Yoga & Wellness Centers', s: 'Wellness', l: 'Centers' },
  { slug: 'legal', name: 'Law Firms & Legal Services', s: 'Legal', l: 'Consultancy' },
  { slug: 'jewelry', name: 'Jewelry & Watch Stores', s: 'Jewelry', l: 'Stores' }
];

// Tier 1 and 2 Cities
export const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
  'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar', 'Varanasi',
  'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Howrah', 'Ranchi', 'Gwalior', 'Jabalpur',
  'Coimbatore', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli-Dharwad'
];

// Subcities localized to Tier 1
export const SUBCITIES: Record<string, { slug: string; name: string }[]> = {
  mumbai: [
    { slug: 'andheri', name: 'Andheri' },
    { slug: 'bandra', name: 'Bandra' },
    { slug: 'borivali', name: 'Borivali' }
  ],
  delhi: [
    { slug: 'connaught-place', name: 'Connaught Place' },
    { slug: 'dwarka', name: 'Dwarka' },
    { slug: 'rohini', name: 'Rohini' }
  ],
  bangalore: [
    { slug: 'whitefield', name: 'Whitefield' },
    { slug: 'koramangala', name: 'Koramangala' },
    { slug: 'indiranagar', name: 'Indiranagar' }
  ],
  hyderabad: [
    { slug: 'hitec-city', name: 'HITEC City' },
    { slug: 'gachibowli', name: 'Gachibowli' },
    { slug: 'banjara-hills', name: 'Banjara Hills' }
  ]
};

// Helpers for parameter validation
export const isTool = (slug: string | null | undefined) => slug ? TOOLS.find(t => t.slug.toLowerCase() === slug.toLowerCase()) : null;
export const isFeature = (slug: string | null | undefined) => slug ? FEATURES.find(f => f.slug.toLowerCase() === slug.toLowerCase()) : null;
export const isIndustry = (slug: string | null | undefined) => slug ? INDUSTRIES.find(i => i.slug.toLowerCase() === slug.toLowerCase()) : null;
export const isCity = (name: string | null | undefined) => name ? CITIES.find(c => c.toLowerCase() === name.toLowerCase()) : null;
export const isSubcity = (slug: string | null | undefined) => slug ? Object.values(SUBCITIES).flat().find(sc => sc.slug.toLowerCase() === slug.toLowerCase()) : null;
export const getCityBySubcity = (subcitySlug: string | null | undefined) => {
  if (!subcitySlug) return null;
  for (const [city, subcities] of Object.entries(SUBCITIES)) {
    if (subcities.find(s => s.slug.toLowerCase() === subcitySlug.toLowerCase())) return city;
  }
  return null;
}
