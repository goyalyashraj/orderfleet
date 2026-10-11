export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductReview {
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface ProductMetadata {
  brand: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  specs: ProductSpec[];
  highlights: string[];
  inBox: string[];
  reviews: ProductReview[];
  svgArtwork: string;
  accentColor: string;
}

export const PRODUCT_METADATA_MAP: Record<string, ProductMetadata> = {
  // 1. Active Smartwatch Series 5
  'SW-ACT-05': {
    brand: 'ApexGear',
    rating: 4.8,
    reviewCount: 348,
    badge: "Amazon's Choice",
    accentColor: '#3b82f6',
    specs: [
      { label: 'Display', value: '1.43" Super AMOLED 466x466 (Always-On)' },
      { label: 'Battery Life', value: 'Up to 7 days (Fast charge 0-80% in 35m)' },
      { label: 'Water Resistance', value: '5 ATM / 50 meters water resistant' },
      { label: 'Sensors', value: 'Optical Heart Rate, SpO2, Dual-band GPS, Sleep' },
      { label: 'Connectivity', value: 'Bluetooth 5.3 Low Energy, NFC' },
      { label: 'Warranty', value: '2-Year International Replacement' }
    ],
    highlights: [
      'Stunning 1,000-nit peak brightness AMOLED display visible in bright sunlight',
      'Continuous 24/7 heart rate and blood oxygen monitoring with abnormal alerts',
      'Over 110 dedicated sports and workout tracking modes with GPS routing',
      'Instant notifications, call answering, and music playback controls'
    ],
    inBox: [
      'Active Smartwatch Series 5 with Midnight Black Fluoroelastomer Strap',
      'Magnetic Rapid Wireless Charging Puck',
      'User Manual & Safety Documentation'
    ],
    reviews: [
      {
        author: 'Marcus K.',
        rating: 5,
        date: 'October 1, 2026',
        comment: 'Unbeatable value. The screen is gorgeous, GPS locks in seconds, and battery easily lasts 5 full days with workouts.',
        verified: true
      },
      {
        author: 'Elena R.',
        rating: 5,
        date: 'September 28, 2026',
        comment: 'Very sleek on the wrist. Sleep tracking is uncannily accurate compared to my Oura ring.',
        verified: true
      }
    ],
    svgArtwork: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-100 h-100">
      <defs>
        <linearGradient id="sw_strap" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="50%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
        <linearGradient id="sw_case" x1="60" y1="50" x2="140" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#475569"/>
          <stop offset="50%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#090d16"/>
        </linearGradient>
        <radialGradient id="sw_screen" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="70%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
      </defs>
      <!-- Straps Top & Bottom -->
      <rect x="75" y="10" width="50" height="45" rx="6" fill="url(#sw_strap)" stroke="#334155" stroke-width="1.5"/>
      <line x1="75" y1="22" x2="125" y2="22" stroke="#334155" stroke-width="1"/>
      <line x1="75" y1="34" x2="125" y2="34" stroke="#334155" stroke-width="1"/>
      <rect x="75" y="145" width="50" height="45" rx="6" fill="url(#sw_strap)" stroke="#334155" stroke-width="1.5"/>
      <line x1="75" y1="160" x2="125" y2="160" stroke="#334155" stroke-width="1"/>
      <line x1="75" y1="172" x2="125" y2="172" stroke="#334155" stroke-width="1"/>
      <!-- Case Watch Body -->
      <rect x="52" y="48" width="96" height="104" rx="28" fill="url(#sw_case)" stroke="#64748b" stroke-width="2"/>
      <!-- Crown & Button -->
      <rect x="148" y="70" width="6" height="20" rx="3" fill="#cbd5e1"/>
      <rect x="148" y="104" width="4" height="18" rx="2" fill="#64748b"/>
      <!-- AMOLED Display Screen -->
      <rect x="58" y="54" width="84" height="92" rx="22" fill="url(#sw_screen)" stroke="#0284c7" stroke-width="1"/>
      <!-- UI Screen Graphics -->
      <text x="100" y="88" fill="#ffffff" font-size="20" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">10:42</text>
      <!-- Activity Rings -->
      <circle cx="100" cy="118" r="16" stroke="#1e293b" stroke-width="3" fill="none"/>
      <circle cx="100" cy="118" r="16" stroke="#f43f5e" stroke-width="3" fill="none" stroke-dasharray="100" stroke-dashoffset="30" stroke-linecap="round"/>
      <circle cx="100" cy="118" r="11" stroke="#10b981" stroke-width="2.5" fill="none" stroke-dasharray="70" stroke-dashoffset="15" stroke-linecap="round"/>
      <!-- Heart Rate Icon & Value -->
      <path d="M96 116 L98 114 L100 120 L102 112 L104 118 L105 116" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
  },

  // 2. Fitness Tracker Smart Band
  'FB-TRK-06': {
    brand: 'FitPro',
    rating: 4.6,
    reviewCount: 512,
    badge: 'Best Budget',
    accentColor: '#10b981',
    specs: [
      { label: 'Display', value: '1.1" Full Color Dynamic AMOLED' },
      { label: 'Battery Life', value: '14 Days standard use, 20 days battery saver' },
      { label: 'Weight', value: 'Ultra-lightweight 13.5g without band' },
      { label: 'Waterproof', value: '5 ATM Swim-proof up to 50m' },
      { label: 'Charging', value: 'Snap-on Magnetic Fast Charger' },
      { label: 'Compatibility', value: 'Android 8.0+ & iOS 12.0+' }
    ],
    highlights: [
      'Up to 14 days of ultra-long battery life on a single 1-hour charge',
      'All-day automatic activity, distance, calorie burn, and step tracking',
      'REM sleep stage analysis and daily recovery score metrics',
      'Water resistant to 50 meters with automatic swim stroke detection'
    ],
    inBox: [
      'Fitness Tracker Smart Band Core',
      'Silicone Anti-Bacterial Wrist Strap',
      'Magnetic USB Fast Charger',
      'Quick Start Guide'
    ],
    reviews: [
      {
        author: 'Samantha W.',
        rating: 5,
        date: 'October 2, 2026',
        comment: 'Charges once every two weeks! So lightweight I forget I have it on while sleeping.',
        verified: true
      },
      {
        author: 'David L.',
        rating: 4,
        date: 'September 24, 2026',
        comment: 'Great fitness tracker for the price. The screen is clear and step counter is spot on.',
        verified: true
      }
    ],
    svgArtwork: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-100 h-100">
      <defs>
        <linearGradient id="band_body" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="band_capsule" x1="80" y1="50" x2="120" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#334155"/>
          <stop offset="50%" stop-color="#020617"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      <!-- Slim Strap -->
      <rect x="86" y="10" width="28" height="180" rx="14" fill="url(#band_body)" stroke="#334155" stroke-width="1.5"/>
      <!-- Inner Band Holes -->
      <circle cx="100" cy="25" r="2.5" fill="#334155"/>
      <circle cx="100" cy="37" r="2.5" fill="#334155"/>
      <circle cx="100" cy="165" r="2.5" fill="#334155"/>
      <circle cx="100" cy="177" r="2.5" fill="#334155"/>
      <!-- Central Oval Capsule Tracker -->
      <rect x="80" y="55" width="40" height="90" rx="20" fill="url(#band_capsule)" stroke="#10b981" stroke-width="1.5"/>
      <!-- OLED Screen Inner Display -->
      <rect x="84" y="62" width="32" height="76" rx="16" fill="#000000"/>
      <!-- Display Content -->
      <text x="100" y="85" fill="#ffffff" font-size="11" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">09:30</text>
      <!-- Steps counter -->
      <circle cx="94" cy="98" r="4" fill="#10b981"/>
      <path d="M92 98 L94 99 L97 96" stroke="#ffffff" stroke-width="1" fill="none"/>
      <text x="105" y="101" fill="#10b981" font-size="9" font-family="monospace" font-weight="bold">8,420</text>
      <!-- Battery and Calories -->
      <rect x="90" y="112" width="20" height="3" rx="1.5" fill="#334155"/>
      <rect x="90" y="112" width="16" height="3" rx="1.5" fill="#34d399"/>
      <text x="100" y="127" fill="#64748b" font-size="7" font-family="system-ui" text-anchor="middle">STEPS GOAL</text>
    </svg>`
  },

  // 3. 4K Ultra HD Streaming Webcam
  'WC-UHD-07': {
    brand: 'AuraVision',
    rating: 4.7,
    reviewCount: 284,
    badge: 'Top Rated',
    accentColor: '#6366f1',
    specs: [
      { label: 'Video Resolution', value: '4K Ultra HD (3840x2160) @ 30fps / 1080p @ 60fps' },
      { label: 'Sensor', value: 'Sony STARVIS™ 1/2.8" CMOS Sensor with HDR' },
      { label: 'Field of View', value: 'Adjustable 65° / 78° / 90° Wide Angle' },
      { label: 'Audio', value: 'Dual Omnidirectional Noise-Cancelling Microphones' },
      { label: 'Privacy', value: 'Physical Magnetic Slide-To-Cover Shutter' },
      { label: 'Mounting', value: 'Universal Monitor Clip + 1/4" Standard Tripod Thread' }
    ],
    highlights: [
      'Ultra-sharp 4K HDR video sensor delivers studio quality even in low lighting',
      'Dual AI noise-cancelling mics filter out background keyboard clatter and fan noise',
      'Instant phase-detection auto-focus keeps face crisply focused as you move',
      'Built-in sliding privacy shutter provides guaranteed hardware privacy'
    ],
    inBox: [
      'AuraVision 4K Ultra HD Streaming Webcam',
      'Integrated 2.0m Braided USB-C to USB-A Cable',
      'Adjustable Aluminum Desktop Mini-Tripod',
      'Privacy Shutter Pre-Installed'
    ],
    reviews: [
      {
        author: 'Alex T.',
        rating: 5,
        date: 'October 3, 2026',
        comment: 'Night and day difference for Zoom and Twitch streaming. Low-light performance in my dim room is unbelievable.',
        verified: true
      },
      {
        author: 'Rachel M.',
        rating: 5,
        date: 'September 29, 2026',
        comment: 'Crystal clear 4K picture and the physical privacy shutter gives peace of mind.',
        verified: true
      }
    ],
    svgArtwork: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-100 h-100">
      <defs>
        <linearGradient id="cam_body" x1="40" y1="60" x2="160" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#334155"/>
          <stop offset="50%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <radialGradient id="cam_lens" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="35%" stop-color="#1e1b4b"/>
          <stop offset="75%" stop-color="#0369a1"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
      </defs>
      <!-- Monitor Stand / Base Clip -->
      <path d="M85 130 L100 115 L115 130 L120 160 L80 160 Z" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
      <rect x="70" y="160" width="60" height="8" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
      <!-- Main Camera Body Pill -->
      <rect x="30" y="70" width="140" height="52" rx="26" fill="url(#cam_body)" stroke="#475569" stroke-width="2"/>
      <!-- Dual Microphones -->
      <circle cx="50" cy="96" r="3" fill="#0f172a" stroke="#475569" stroke-width="1"/>
      <circle cx="50" cy="96" r="1" fill="#64748b"/>
      <circle cx="150" cy="96" r="3" fill="#0f172a" stroke="#475569" stroke-width="1"/>
      <circle cx="150" cy="96" r="1" fill="#64748b"/>
      <!-- Central Lens Bezel -->
      <circle cx="100" cy="96" r="24" fill="#090d16" stroke="#6366f1" stroke-width="2"/>
      <circle cx="100" cy="96" r="18" fill="url(#cam_lens)"/>
      <circle cx="95" cy="91" r="5" fill="rgba(255,255,255,0.4)"/>
      <!-- Status Indicator LED -->
      <circle cx="130" cy="96" r="2.5" fill="#38bdf8"/>
    </svg>`
  },

  // 4. 7-in-1 Aluminum USB-C Hub
  'HB-USB-08': {
    brand: 'TitanLink',
    rating: 4.8,
    reviewCount: 420,
    badge: 'Popular Gear',
    accentColor: '#0ea5e9',
    specs: [
      { label: 'Power Delivery', value: '100W USB-C PD 3.0 Pass-Through Fast Charging' },
      { label: 'Video Output', value: '4K @ 60Hz HDMI Ultra HD' },
      { label: 'USB Ports', value: '3x USB 3.2 Gen 1 (5Gbps High Speed Data)' },
      { label: 'Card Reader', value: 'SD & MicroSD (TF) Dual Card Simultaneous Read' },
      { label: 'Material', value: 'Space Gray Aerospace Anodized Aluminum Alloy' },
      { label: 'Cable', value: 'Braided Nylon Reinforced 20cm Cord' }
    ],
    highlights: [
      'Expand a single USB-C laptop port into 7 full-speed enterprise ports',
      'Supports 100W pass-through charging so your laptop charges at maximum speed',
      'Crystal clear 4K@60Hz video output to external monitors and 4K TVs',
      'Premium space-gray aluminum unibody dissipates heat efficiently under load'
    ],
    inBox: [
      'TitanLink 7-in-1 Aluminum USB-C Hub with Braided Cable',
      'Protective Travel Velvet Pouch',
      'Instruction Manual'
    ],
    reviews: [
      {
        author: 'Jordan P.',
        rating: 5,
        date: 'October 2, 2026',
        comment: 'Flawless 4K 60Hz on my MacBook Air. Never overheats even with an external SSD and 100W power plugged in.',
        verified: true
      },
      {
        author: 'Chris B.',
        rating: 5,
        date: 'September 20, 2026',
        comment: 'Super sturdy aluminum build. SD card transfers 60GB of photos in a couple of minutes.',
        verified: true
      }
    ],
    svgArtwork: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-100 h-100">
      <defs>
        <linearGradient id="hub_metal" x1="40" y1="70" x2="160" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#475569"/>
          <stop offset="40%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      <!-- Braided USB-C Cable -->
      <path d="M100 25 C100 50, 100 55, 100 70" stroke="#64748b" stroke-width="5" stroke-linecap="round"/>
      <rect x="94" y="15" width="12" height="15" rx="3" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <rect x="96" y="8" width="8" height="7" rx="1.5" fill="#cbd5e1"/>
      <!-- Hub Main Aluminum Enclosure -->
      <rect x="45" y="70" width="110" height="60" rx="12" fill="url(#hub_metal)" stroke="#64748b" stroke-width="2"/>
      <!-- Ports Top Side / Face -->
      <!-- 4K HDMI Port -->
      <rect x="55" y="82" width="22" height="7" rx="1.5" fill="#090d16" stroke="#94a3b8" stroke-width="1"/>
      <text x="66" y="99" fill="#94a3b8" font-size="6" font-family="system-ui" text-anchor="middle">4K HDMI</text>
      <!-- USB 3.0 Ports -->
      <rect x="85" y="82" width="16" height="7" rx="1.5" fill="#0284c7" stroke="#38bdf8" stroke-width="1"/>
      <text x="93" y="99" fill="#38bdf8" font-size="6" font-family="system-ui" text-anchor="middle">USB 3.0</text>
      <rect x="107" y="82" width="16" height="7" rx="1.5" fill="#0284c7" stroke="#38bdf8" stroke-width="1"/>
      <text x="115" y="99" fill="#38bdf8" font-size="6" font-family="system-ui" text-anchor="middle">USB 3.0</text>
      <!-- 100W PD Port -->
      <rect x="130" y="83" width="14" height="5" rx="2" fill="#090d16" stroke="#f59e0b" stroke-width="1"/>
      <text x="137" y="99" fill="#f59e0b" font-size="6" font-family="system-ui" text-anchor="middle">100W</text>
      <!-- Power Status Glow -->
      <circle cx="100" cy="118" r="2.5" fill="#38bdf8"/>
    </svg>`
  },

  // 5. Flagship Titanium Smartphone 18
  'SK-18': {
    brand: 'TitanTech',
    rating: 4.9,
    reviewCount: 689,
    badge: 'Flagship Edition',
    accentColor: '#f59e0b',
    specs: [
      { label: 'Display', value: '6.7" ProMotion Super Retina XDR OLED (1-120Hz)' },
      { label: 'Processor', value: '3nm Ultra Bionic Chip with 6-core Neural Engine' },
      { label: 'Cameras', value: 'Triple 48MP Sapphire (Wide, Ultra-Wide, 5x Telephoto)' },
      { label: 'Storage', value: '256GB High-Speed NVMe Storage' },
      { label: 'Battery', value: 'All-Day 4,500mAh with 35W Fast & MagCharge' },
      { label: 'Chassis', value: 'Aerospace Grade 5 Titanium with Ceramic Shield' }
    ],
    highlights: [
      'Next-generation Grade 5 Titanium precision enclosure for lightweight durability',
      'Dynamic Island interactive pill for live sports, orders, and music controls',
      'ProMotion 120Hz refresh rate delivers butter-smooth scrolling and gaming',
      'Triple pro camera array with 4K Dolby Vision Cinematic recording'
    ],
    inBox: [
      'TitanTech Flagship Smartphone 18 in Natural Titanium',
      'Braided USB-C Charge Cable (1m)',
      'SIM Ejector Pin & Documentation'
    ],
    reviews: [
      {
        author: 'Nathan G.',
        rating: 5,
        date: 'October 4, 2026',
        comment: 'The titanium feel in hand is extraordinary. Cameras capture DSLR-like depth and color accuracy.',
        verified: true
      },
      {
        author: 'Chloe M.',
        rating: 5,
        date: 'October 1, 2026',
        comment: 'Battery easily lasts 1.5 days. Screen brightness under full sun is unmatched.',
        verified: true
      }
    ],
    svgArtwork: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-100 h-100">
      <defs>
        <linearGradient id="phone_frame" x1="60" y1="20" x2="140" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#94a3b8"/>
          <stop offset="50%" stop-color="#475569"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
        <linearGradient id="phone_screen" x1="65" y1="25" x2="135" y2="175" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="35%" stop-color="#312e81"/>
          <stop offset="70%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <!-- Titanium Frame -->
      <rect x="62" y="20" width="76" height="160" rx="22" fill="url(#phone_frame)" stroke="#cbd5e1" stroke-width="1.5"/>
      <!-- Buttons -->
      <rect x="59" y="55" width="3" height="15" rx="1.5" fill="#94a3b8"/>
      <rect x="59" y="75" width="3" height="25" rx="1.5" fill="#94a3b8"/>
      <rect x="138" y="65" width="3" height="30" rx="1.5" fill="#94a3b8"/>
      <!-- Screen Display -->
      <rect x="65" y="23" width="70" height="154" rx="19" fill="url(#phone_screen)"/>
      <!-- Dynamic Island Pill -->
      <rect x="88" y="28" width="24" height="6" rx="3" fill="#000000"/>
      <circle cx="106" cy="31" r="1.5" fill="#1e293b"/>
      <!-- Display Clock & Widget UI -->
      <text x="100" y="62" fill="#ffffff" font-size="16" font-family="system-ui, sans-serif" font-weight="800" text-anchor="middle">9:41</text>
      <text x="100" y="72" fill="#94a3b8" font-size="7" font-family="system-ui" font-weight="600" text-anchor="middle">Sunday, Oct 4</text>
      <!-- Lock Screen Wallpaper Wave Accent -->
      <path d="M68 135 C85 110, 115 150, 132 120" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
      <path d="M68 145 C90 125, 110 160, 132 135" stroke="#ec4899" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
      <!-- Home Indicator Bar -->
      <rect x="85" y="170" width="30" height="2" rx="1" fill="#ffffff" opacity="0.8"/>
    </svg>`
  },

  // 6. Cyberpunk RGB Mechanical Keyboard
  'FLASH-KB-PRO': {
    brand: 'QuantumRGB',
    rating: 4.9,
    reviewCount: 310,
    badge: '⚡ FLASH SALE EXCLUSIVE',
    accentColor: '#ec4899',
    specs: [
      { label: 'Layout', value: 'Compact 75% Layout (82 Keys) with Rotary Knob' },
      { label: 'Switches', value: 'Custom Pre-lubed Linear Gateron Pro Yellow' },
      { label: 'Keycaps', value: 'Custom Dye-Sub PBT Cyberpunk Translucent' },
      { label: 'Lighting', value: 'Per-Key South-Facing RGB + Underglow Diffuser (16.8M)' },
      { label: 'Connectivity', value: 'Tri-Mode: 2.4GHz Wireless, Bluetooth 5.1, USB-C' },
      { label: 'Battery', value: 'High-Capacity 4,000mAh Rechargeable' }
    ],
    highlights: [
      'Gasket mounted acoustic structure with 5 layers of sound-dampening foam',
      'Hot-swappable PCB supports 3-pin and 5-pin mechanical switches effortlessly',
      'Multifunctional CNC aluminum rotary encoder knob for master volume and brightness',
      'Ultra-fast 1,000Hz polling rate in 2.4GHz wireless mode for zero competitive latency'
    ],
    inBox: [
      'QuantumRGB 75% Cyberpunk Mechanical Keyboard',
      '2-in-1 Switch & Keycap Puller Tool',
      'Braided Aviator Coiled USB-C to USB-A Cable',
      '2.4GHz Ultra-Low Latency USB Receiver',
      '4 Extra Mac/Windows Accent Keycaps'
    ],
    reviews: [
      {
        author: 'Zane V.',
        rating: 5,
        date: 'October 3, 2026',
        comment: 'The sound is pure marbly goodness right out of the box! Zero ping, switches are perfectly factory lubed.',
        verified: true
      },
      {
        author: 'Aiden K.',
        rating: 5,
        date: 'September 30, 2026',
        comment: 'RGB diffusion is mesmerizing. The volume knob has very satisfying clicks.',
        verified: true
      }
    ],
    svgArtwork: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-100 h-100">
      <defs>
        <linearGradient id="kb_case" x1="20" y1="60" x2="180" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="50%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#18181b"/>
        </linearGradient>
        <linearGradient id="rgb_glow" x1="25" y1="135" x2="175" y2="135" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#06b6d4"/>
          <stop offset="35%" stop-color="#8b5cf6"/>
          <stop offset="70%" stop-color="#ec4899"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </linearGradient>
      </defs>
      <!-- RGB Underglow Diffuser -->
      <rect x="23" y="68" width="154" height="66" rx="14" fill="url(#rgb_glow)" filter="drop-shadow(0 0 8px #ec4899)"/>
      <!-- Main Keyboard Enclosure -->
      <rect x="25" y="70" width="150" height="62" rx="12" fill="url(#kb_case)" stroke="#a855f7" stroke-width="1.5"/>
      <!-- Rotary Encoder Knob -->
      <circle cx="162" cy="80" r="5" fill="#f43f5e" stroke="#ffffff" stroke-width="1"/>
      <!-- Keycap Matrix Row 1 -->
      <rect x="32" y="76" width="9" height="7" rx="1.5" fill="#06b6d4"/>
      <rect x="44" y="76" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#38bdf8" stroke-width="0.5"/>
      <rect x="56" y="76" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#38bdf8" stroke-width="0.5"/>
      <rect x="68" y="76" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#8b5cf6" stroke-width="0.5"/>
      <rect x="80" y="76" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#8b5cf6" stroke-width="0.5"/>
      <rect x="92" y="76" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#ec4899" stroke-width="0.5"/>
      <rect x="104" y="76" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#ec4899" stroke-width="0.5"/>
      <rect x="116" y="76" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#f43f5e" stroke-width="0.5"/>
      <rect x="128" y="76" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#f43f5e" stroke-width="0.5"/>
      <rect x="140" y="76" width="13" height="7" rx="1.5" fill="#f43f5e"/>
      <!-- Keycap Matrix Row 2 -->
      <rect x="32" y="86" width="12" height="7" rx="1.5" fill="#06b6d4"/>
      <rect x="47" y="86" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#38bdf8" stroke-width="0.5"/>
      <rect x="59" y="86" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#8b5cf6" stroke-width="0.5"/>
      <rect x="71" y="86" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#8b5cf6" stroke-width="0.5"/>
      <rect x="83" y="86" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#ec4899" stroke-width="0.5"/>
      <rect x="95" y="86" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#ec4899" stroke-width="0.5"/>
      <rect x="107" y="86" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#f43f5e" stroke-width="0.5"/>
      <rect x="119" y="86" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#f43f5e" stroke-width="0.5"/>
      <rect x="131" y="86" width="12" height="7" rx="1.5" fill="#06b6d4"/>
      <rect x="146" y="86" width="9" height="7" rx="1.5" fill="#ec4899"/>
      <!-- Keycap Matrix Row 3 (WASD / Home Row) -->
      <rect x="32" y="96" width="14" height="7" rx="1.5" fill="#334155"/>
      <rect x="49" y="96" width="9" height="7" rx="1.5" fill="#06b6d4"/>
      <rect x="61" y="96" width="9" height="7" rx="1.5" fill="#06b6d4"/>
      <rect x="73" y="96" width="9" height="7" rx="1.5" fill="#06b6d4"/>
      <rect x="85" y="96" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#ec4899" stroke-width="0.5"/>
      <rect x="97" y="96" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#ec4899" stroke-width="0.5"/>
      <rect x="109" y="96" width="9" height="7" rx="1.5" fill="#1e293b" stroke="#f43f5e" stroke-width="0.5"/>
      <rect x="121" y="96" width="14" height="7" rx="1.5" fill="#ec4899"/>
      <rect x="138" y="96" width="9" height="7" rx="1.5" fill="#f59e0b"/>
      <!-- Keycap Matrix Row 4 (Spacebar & Modifiers) -->
      <rect x="32" y="106" width="16" height="7" rx="1.5" fill="#8b5cf6"/>
      <rect x="51" y="106" width="12" height="7" rx="1.5" fill="#1e293b"/>
      <rect x="66" y="106" width="48" height="7" rx="1.5" fill="#ec4899"/>
      <rect x="117" y="106" width="12" height="7" rx="1.5" fill="#1e293b"/>
      <rect x="132" y="106" width="8" height="7" rx="1.5" fill="#06b6d4"/>
      <rect x="143" y="106" width="8" height="7" rx="1.5" fill="#06b6d4"/>
    </svg>`
  },

  // 7. Studio Pro ANC Wireless Earbuds
  'EAR-ANC-09': {
    brand: 'AuraSound',
    rating: 4.8,
    reviewCount: 418,
    badge: 'Spatial Audio',
    accentColor: '#8b5cf6',
    specs: [
      { label: 'Active Noise Cancelling', value: 'Hybrid ANC with 40dB ambient suppression' },
      { label: 'Drivers', value: '11mm Custom High-Excursion Titanium Drivers' },
      { label: 'Spatial Audio', value: '360° Spatial Audio with dynamic head tracking' },
      { label: 'Battery Life', value: '8.5h earbuds / 36h total with wireless case' },
      { label: 'Charging', value: 'Qi Wireless Charging + USB-C Rapid (10m = 3h)' },
      { label: 'Water Resistance', value: 'IPX5 Sweat & Water Resistant' }
    ],
    highlights: [
      'Custom 11mm titanium dynamic drivers deliver punchy deep bass and pristine highs',
      'Hybrid Active Noise Cancellation adapts 50,000 times per second to silence ambient roar',
      'Transparency Mode lets natural environmental sound in with a single touch',
      'Clear voice call technology with 6 beamforming microphones and wind shielding'
    ],
    inBox: [
      'AuraSound Studio Pro ANC Wireless Earbuds (Left & Right)',
      'Wireless Magnetic Fast-Charging Smart Case',
      '3 Sizes of Soft Liquid Silicone Ear Tips (S / M / L)',
      'Braided USB-C Charging Cable',
      'Warranty & Manual'
    ],
    reviews: [
      {
        author: 'Liam D.',
        rating: 5,
        date: 'October 4, 2026',
        comment: 'ANC is practically identical to the AirPods Pro 2. Bass is tight and impactful without overpowering vocals.',
        verified: true
      },
      {
        author: 'Sophie H.',
        rating: 5,
        date: 'October 2, 2026',
        comment: 'Very comfortable for 6-hour work flights. The transparency mode sounds completely natural.',
        verified: true
      }
    ],
    svgArtwork: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-100 h-100">
      <defs>
        <linearGradient id="case_grad" x1="60" y1="60" x2="140" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#334155"/>
          <stop offset="40%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="ear_stem" x1="120" y1="40" x2="160" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#e2e8f0"/>
          <stop offset="50%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#64748b"/>
        </linearGradient>
      </defs>
      <!-- Earbud Charging Case -->
      <rect x="52" y="75" width="96" height="74" rx="28" fill="url(#case_grad)" stroke="#8b5cf6" stroke-width="1.5"/>
      <line x1="52" y1="102" x2="148" y2="102" stroke="#475569" stroke-width="1"/>
      <circle cx="100" cy="118" r="2.5" fill="#34d399"/>
      <!-- Left Earbud Floating Out -->
      <path d="M72 45 C64 45, 58 52, 60 62 C62 70, 70 72, 76 68 C80 65, 82 58, 80 50 C78 46, 75 45, 72 45 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
      <rect x="67" y="65" width="6" height="22" rx="3" fill="#cbd5e1"/>
      <circle cx="70" cy="85" r="1.5" fill="#38bdf8"/>
      <!-- Right Earbud Floating Out -->
      <path d="M128 45 C120 45, 118 52, 120 62 C122 70, 130 72, 136 68 C140 65, 142 58, 140 50 C138 46, 135 45, 128 45 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
      <rect x="127" y="65" width="6" height="22" rx="3" fill="#cbd5e1"/>
      <circle cx="130" cy="85" r="1.5" fill="#38bdf8"/>
    </svg>`
  }
};

/**
 * Fallback metadata generator for any custom products added dynamically by Admin
 */
export function getProductMetadata(sku: string, title: string, categoryName: string): ProductMetadata {
  if (PRODUCT_METADATA_MAP[sku]) {
    return PRODUCT_METADATA_MAP[sku];
  }

  // Smart heuristic based on title or category
  const lowerTitle = title.toLowerCase();
  const lowerCat = categoryName.toLowerCase();

  let brand = 'OrderFleet Pro';
  let accentColor = '#3b82f6';
  let badge = 'Verified Quality';

  if (lowerCat.includes('audio') || lowerTitle.includes('headphone') || lowerTitle.includes('audio')) {
    brand = 'AuraSound';
    accentColor = '#8b5cf6';
    badge = 'Studio Mastered';
  } else if (lowerCat.includes('wear') || lowerTitle.includes('watch') || lowerTitle.includes('band')) {
    brand = 'ApexGear';
    accentColor = '#10b981';
    badge = 'Next-Gen Tracker';
  } else if (lowerCat.includes('access') || lowerTitle.includes('cable') || lowerTitle.includes('hub')) {
    brand = 'TitanLink';
    accentColor = '#0ea5e9';
    badge = 'Essential Gear';
  } else if (lowerTitle.includes('key') || lowerTitle.includes('game') || lowerTitle.includes('rgb')) {
    brand = 'QuantumRGB';
    accentColor = '#ec4899';
    badge = 'Gamer Choice';
  }

  return {
    brand,
    rating: 4.8,
    reviewCount: 142,
    badge,
    accentColor,
    specs: [
      { label: 'Category', value: categoryName },
      { label: 'SKU Model', value: sku },
      { label: 'Warranty', value: '1-Year Full Manufacturer Warranty' },
      { label: 'Quality Standard', value: 'Certified ISO-9001 Tested & Inspected' }
    ],
    highlights: [
      'High-grade commercial materials built for sustained performance',
      'Backed by OrderFleet express doorstep replacement guarantee',
      'Seamless multi-platform compatibility and plug-and-play ease'
    ],
    inBox: [
      `${title} Unit`,
      'Power / Connection Accessories',
      'Inspection Certificate & User Guide'
    ],
    reviews: [
      {
        author: 'Verified Customer',
        rating: 5,
        date: 'October 2026',
        comment: 'High build quality, arrived in pristine packaging. Operates exactly as advertised.',
        verified: true
      }
    ],
    svgArtwork: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-100 h-100">
      <rect x="40" y="40" width="120" height="120" rx="24" fill="#1e293b" stroke="${accentColor}" stroke-width="2"/>
      <circle cx="100" cy="100" r="36" fill="rgba(59, 130, 246, 0.15)"/>
      <path d="M100 75 L125 90 L125 115 L100 130 L75 115 L75 90 Z" stroke="${accentColor}" stroke-width="2" fill="none"/>
      <text x="100" y="105" fill="#ffffff" font-size="12" font-family="system-ui" font-weight="bold" text-anchor="middle">PRO</text>
    </svg>`
  };
}
