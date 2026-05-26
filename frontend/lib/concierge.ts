/**
 * TH Concierge — fully offline knowledge base.
 * No LLM calls, no APIs, no credits used. The bot scores each query against a
 * curated list of intents (keywords) and returns a conversational response.
 */

export interface KnowledgeEntry {
  /** Lowercase keywords / phrases used for matching */
  keys: string[];
  /** One or many variants the bot can pick from — feels less repetitive */
  replies: string[];
  /** Optional follow-up suggestions to render as quick-reply chips */
  followups?: string[];
}

/** Strip non-alphanumeric, lowercase, collapse spaces. */
const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9 ₹]/g, ' ').replace(/\s+/g, ' ').trim();

/** Pick a random element from an array. */
const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ---------------- KNOWLEDGE BASE ----------------

const KB: KnowledgeEntry[] = [
  // ===== Brand / Heritage =====
  {
    keys: ['heritage', 'history', 'brand story', 'tommy hilfiger story', 'who is tommy', 'about tommy', 'founder'],
    replies: [
      'Tommy Hilfiger launched the namesake brand in 1985 in New York with a now-iconic preppy-with-a-twist look — clean American sportswear in red, white & navy. The brand belongs to PVH Corp today and is known for the corporate flag logo, varsity styling, and the “Modern Heritage” design language.',
    ],
    followups: ['Tell me about the logo', 'Top product lines', 'Brand colours'],
  },
  {
    keys: ['logo', 'flag', 'navy red white', 'brand colors', 'brand colour'],
    replies: [
      'The flag logo — navy and red with a white band — is inspired by international maritime signal flags. The exact palette: TH Navy #1B2A4A, TH Red #C8102E, White. It signals trust, sport, and Americana — perfect for showcasing on the Polo Window Wall.',
    ],
    followups: ['Best products for the Polo Window?', 'How to style with red?'],
  },

  // ===== Product lines =====
  {
    keys: ['product lines', 'collections', 'what does tommy sell', 'categories'],
    replies: [
      'Big buckets at TH India: 1) Polos (Pique, Slim, Stretch) — heroes of the brand. 2) Custom Fit Shirts. 3) Denim (TH Modern Heritage + TJ for the younger crowd). 4) Knitwear & sweatshirts. 5) Outerwear. 6) Footwear (sneakers + loafers). 7) Accessories — belts, bags, caps, fragrances. 8) Kids & Tommy Jeans (TJ).',
    ],
    followups: ['Tell me about Polos', 'TJ vs main line', 'Footwear bestsellers'],
  },
  {
    keys: ['polo', 'pique', 'piqué'],
    replies: [
      'Polos are the brand\'s DNA. Three core fits: Classic, Slim, and Stretch. The Stretch Pique has a touch of elastane — great for warm Mumbai weather. Style tip: pair a navy or white polo with stone chinos for a daytime look; collar up only if you commit fully.',
    ],
    followups: ['Polo + denim?', 'Wedding-ready polo look', 'Cross-merch with polos'],
  },
  {
    keys: ['denim', 'jeans', 'tj', 'tommy jeans'],
    replies: [
      'TH denim splits into two: Modern Heritage (cleaner, slimmer, dressier) and Tommy Jeans / TJ (Gen-Z, fashion-forward, often distressed or coloured). Mention "Scanton" for slim, "Ryan" for tapered, "Ethan" for relaxed when guiding men. For women, "Sylvia" high-rise sells well.',
    ],
    followups: ['Denim care tips', 'Pair with what shoes?', 'Best denim window display'],
  },
  {
    keys: ['shirt', 'shirts', 'formal shirt', 'oxford', 'custom fit'],
    replies: [
      'Tommy shirts come in Custom Fit (slightly tailored) and Classic Fit. Hero fabrics: Oxford cotton (slightly textured), poplin (smooth, dressy), and linen blends for summer. Push the Oxford for a smart-casual office look — looks great untucked too.',
    ],
    followups: ['Shirt + chinos?', 'Best fabric for Mumbai humidity', 'Wedding shirt look'],
  },
  {
    keys: ['fragrance', 'perfume', 'cologne', 'eau de toilette'],
    replies: [
      'Bestseller is Tommy (the original) — fresh, citrusy, very versatile. Tommy Girl is the matching feminine icon. Newer launches like Impact and Tommy Now lean fresh/woody. Cross-sell fragrance at the cash wrap — quick add, high margin.',
    ],
    followups: ['Pairing fragrance with occasion?', 'Cross-merch ideas'],
  },
  {
    keys: ['kids', 'children', 'kidswear'],
    replies: [
      'Tommy Kids mirrors the adult line in mini form — polos, denim, sweatshirts, varsity outerwear. Big draw for gifting in India around Rakhi, birthdays, and Diwali — keep a "Mini Me" display near the front during festive weeks.',
    ],
    followups: ['Festive kids display', 'Gifting price-points'],
  },

  // ===== Styling tips =====
  {
    keys: ['wedding', 'sangeet', 'reception', 'cocktail', 'wedding outfit'],
    replies: [
      'For an Indian wedding sangeet / cocktail evening: go for a slim Custom Fit shirt in navy or burgundy, stone chinos, and brown loafers. Add a TH belt with the gold flag buckle. Top it with a knit blazer for AC venues. For day functions, breathable linen shirts in white or sky blue work beautifully.',
    ],
    followups: ['Reception outfit', 'Daytime mehendi look', 'Accessory pairing'],
  },
  {
    keys: ['office', 'work outfit', 'corporate', 'business casual', 'workwear'],
    replies: [
      'Smart business casual TH stack: Custom Fit Oxford shirt + slim chinos + leather loafers + a slim TH belt. Add a fine-gauge merino knit when the AC is brutal. For Friday casual, swap chinos for dark Scanton denim and add a sneaker.',
    ],
    followups: ['Tie or no tie?', 'Friday casual', 'Best layering pieces'],
  },
  {
    keys: ['casual', 'weekend', 'brunch', 'cafe', 'mall look'],
    replies: [
      'Weekend uniform: TH Polo + Scanton slim denim + white low-top sneakers + a cap with the flag logo. Toss a varsity bomber over the polo if the AC is cold. Simple, on-brand, and works for anyone 22-45.',
    ],
    followups: ['Brunch with friends', 'Movie date outfit', 'Travel look'],
  },
  {
    keys: ['summer', 'humid', 'hot', 'mumbai weather', 'breathable'],
    replies: [
      'For Mumbai\'s humidity, push linen and breathable cotton: linen shirts, pique polos, and lightweight Stretch chinos. Light colours (white, sand, sky blue) reflect heat. Avoid dark denim before sunset — guide guests to dark wash chinos instead.',
    ],
    followups: ['Best fabrics in summer', 'Light colour palette'],
  },
  {
    keys: ['winter', 'cold', 'layering', 'jacket', 'sweater', 'knit'],
    replies: [
      'For Indian winter: layer a long-sleeve shirt under a quarter-zip knit, finish with a TH puffer or varsity bomber. Wool blends in navy/grey, plus dark denim, do the heavy lifting. Add a beanie + scarf combo for North-India travel customers.',
    ],
    followups: ['Office winter look', 'Travel layering', 'Quarter-zip styling'],
  },
  {
    keys: ['diwali', 'festive', 'festival', 'eid'],
    replies: [
      'Festive styling: a deep maroon or navy Custom Fit shirt, tonal chinos, and a slim belt does wonders. Add a varsity bomber in red or navy if cool. Push fragrance and gift boxes hard — Diwali is gifting season; price-point ₹1,999-₹4,999 sells fastest in BKC.',
    ],
    followups: ['Diwali window ideas', 'Top gifting picks', 'Eid look'],
  },

  // ===== Visual merchandising =====
  {
    keys: ['vm', 'visual merchandising', 'window display', 'display', 'merchandising', 'window'],
    replies: [
      'Strong VM principles: 1) Storytelling — every wall tells a single colour or occasion story. 2) Rule of three — three pillars per fixture (top, bottom, accessory). 3) Eye level = buy level — heroes at 4.5-5.5 ft. 4) Cross-merch — pair a polo with denim with a belt on the same fixture. 5) Lighting at 30-45° to highlight texture.',
    ],
    followups: ['Polo Window Wall ideas', 'Folding standards', 'Mannequin styling'],
  },
  {
    keys: ['mannequin', 'mannequins', 'styling mannequin'],
    replies: [
      'Mannequin rules: full head-to-toe styling — top, bottom, footwear, one accessory, one belt. Pin from the back so the fit looks tailored. Rotate the storytelling weekly. For TH BKC, the focal wall mannequin should always carry the season hero polo + bestselling denim.',
    ],
    followups: ['Window refresh frequency', 'Pinning tricks'],
  },
  {
    keys: ['folding', 'jiffy', 'stack', 'fixture'],
    replies: [
      'Folding standards: TH folds are 25 cm wide for shirts, 22 cm for tees. Use the folding board every single time — no eyeballing. Jiffy steam any garment within 5 sec of display. Stacks max 5 high for visibility; refold the top piece every 30 min during peak hours.',
    ],
    followups: ['Steamer tips', 'Stock-density rules'],
  },
  {
    keys: ['lighting', 'lights', 'spotlight', 'illumination'],
    replies: [
      'Light heroes at 3000K warm-white at 30-45°. Wash walls with a 4000K cooler tone for crisp brand colours. Avoid down-lighting flat onto mannequin heads — it casts shadows on the body. Check every bulb during opening huddle.',
    ],
    followups: ['Window lighting tips', 'Energy saving'],
  },

  // ===== Sales scripts / objection handling =====
  {
    keys: ['upsell', 'cross sell', 'cross-sell', 'add on', 'attach rate', 'upt'],
    replies: [
      'Easy upsells that lift UPT: 1) Show the matching belt at the trial room — never ask, just bring it. 2) Pair fragrance at the cash wrap ("This will go beautifully with that polo"). 3) Suggest a contrasting tee under the shirt for layering. Aim for one add-on per bill; that\'s how UPT moves from 1.4 to 1.8.',
    ],
    followups: ['Closing the sale', 'Fragrance cross-sell script', 'How to push belts'],
  },
  {
    keys: ['objection', 'too expensive', 'price', 'discount', 'why so costly'],
    replies: [
      'When the customer says "too expensive": acknowledge first ("I hear you"), then re-frame to cost-per-wear ("this polo will last you 80+ wears"), then anchor on the build quality (mercerised cotton, garment-washed). Avoid offering discount in the first 2 mins — protect the brand. If they walk, capture them as a lead for the next promo.',
    ],
    followups: ['Loyalty pitch', 'How to capture leads', 'When to offer discount'],
  },
  {
    keys: ['greet', 'greeting', 'opening', 'first 30 seconds'],
    replies: [
      'Open with warmth, not "Can I help you?" Try: "Welcome to Tommy! Have you been with us before, or is this your first time?" — this gives them a choice. Step away after 10-15 sec to let them browse, then return with a hero piece you picked for them.',
    ],
    followups: ['Returning customer script', 'Closing greeting'],
  },
  {
    keys: ['close', 'closing', 'asking for sale'],
    replies: [
      'Closing line that works: "I\'ll keep these two at the cash wrap — and grab you a fragrance to try. Cash, card, or UPI today?" — assumes the sale and offers payment optionality. Never finish with a yes/no question that lets them say no.',
    ],
    followups: ['Cross-sell at cash wrap', 'UPI conversation'],
  },

  // ===== KPI definitions =====
  {
    keys: ['asp', 'average selling price'],
    replies: [
      'ASP = Net Sale ÷ Quantity sold. It tells you what the average product going out the door is worth. Move ASP up by pushing higher-priced styles (knits over tees, leather belts over canvas) and avoiding heavy markdowns.',
    ],
    followups: ['How to lift ASP', 'ASP vs ATV difference'],
  },
  {
    keys: ['atv', 'average transaction'],
    replies: [
      'ATV = Net Sale ÷ Bills. It tells you what each customer spent. Lift ATV with cross-sells (UPT goes up) or higher-priced units (ASP goes up). Target for premium TH stores: ATV ≥ ₹6,500.',
    ],
    followups: ['How to lift ATV', 'UPT formula'],
  },
  {
    keys: ['upt', 'units per transaction'],
    replies: [
      'UPT = Quantity ÷ Bills. Average items per bill. Strong stores run 1.6-2.0. Push UPT with belt-with-trouser bundles, fragrance at cash wrap, and a "complete the look" trial-room habit.',
    ],
    followups: ['Cross-sell ideas', 'Trial room tips'],
  },
  {
    keys: ['clv', 'customer lifetime value', 'lifetime value'],
    replies: [
      'CLV = AOV × Purchase Frequency/year × Customer Lifespan in years. For TH BKC, if a loyalist buys ₹8,000 × 3 visits × 5 yrs = ₹1.2L CLV. Build CLV with leads-database follow-ups, birthday calls, and exclusive sale previews.',
    ],
    followups: ['Lift CLV with promos', 'Birthday call script'],
  },
  {
    keys: ['lfl', 'like for like', 'comp sales'],
    replies: [
      'LFL = (TY − LY) ÷ LY × 100. Compares same store, same period, year-on-year. Healthy benchmark for premium retail: +6% to +12% LFL. Negative LFL is a red flag; investigate footfall × conversion × ATV breakdown.',
    ],
    followups: ['How to improve LFL', 'TY vs LY tracking'],
  },
  {
    keys: ['conversion', 'walk in to bill', 'footfall'],
    replies: [
      'Conversion = Bills ÷ Footfall × 100. Premium retail benchmark: 18-25%. If it dips, audit the first-greet, fitting-room recovery, and queue at the cash wrap. The biggest leak is usually a non-greeted walk-in.',
    ],
    followups: ['Greeting script', 'Cash wrap queues'],
  },
  {
    keys: ['churn', 'attrition', 'lost customer'],
    replies: [
      'Churn rate = Customers lost ÷ Customers at start × 100. For premium fashion, healthy churn is ≤ 5% / period. Reduce churn with personalised WhatsApp follow-ups within 7 days of purchase, and a birthday offer.',
    ],
    followups: ['WhatsApp script', 'Reactivation campaign'],
  },
  {
    keys: ['big bill', 'big bills', 'high value', 'big ticket'],
    replies: [
      'Big bill = single transaction > ₹20,000. Drive these with hero-cross-merch (polo + denim + belt + fragrance in one bag) and dedicated VIP service: water, fitting-room reserved, manager intro. Track them — a single big bill can equal half a day\'s footfall conversion.',
    ],
    followups: ['VIP service checklist', 'Cross-merch bundles'],
  },
  {
    keys: ['sspd', 'sales per square foot', 'sales per sqft'],
    replies: [
      'SSPD = Daily Sale ÷ Store Sq Ft. Use it to compare zone productivity. Polo Window Wall typically has 2-3× higher SSPD than Back-Wall accessories. If a zone underperforms its sq-ft share, refresh story or relocate the fixture.',
    ],
    followups: ['Best SSPD zones', 'How to lift zone SSPD'],
  },
  {
    keys: ['nps', 'net promoter', 'csat', 'satisfaction'],
    replies: [
      'NPS = % Promoters (9-10) − % Detractors (0-6). Premium retail target: > 60. Promoters bring 2.5× referral revenue. Detractors? Call them within 48 hrs — half of them flip to neutral after the recovery call.',
    ],
    followups: ['NPS recovery script', 'How to lift NPS'],
  },

  // ===== Promo / JOG =====
  {
    keys: ['jog', 'voucher', 'redemption', 'slab'],
    replies: [
      'JOG (Just One Glance / scratch-card style) drives the next visit. Slab 1 = ₹7,999, Slab 2 = ₹13,999, Slab 3 = ₹24,999. Push Slab 2 — best balance of attach rate and ATV uplift. Always hand the voucher with the receipt and tell them the validity verbally.',
    ],
    followups: ['Slab math', 'How to push JOG'],
  },

  // ===== Greetings / fallback flavour =====
  {
    keys: ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening', 'yo'],
    replies: [
      'Hey there! 👋 I\'m TH Concierge. Ask me about Tommy Hilfiger styling, sales scripts, VM ideas, or any retail KPI — I\'ve got you.',
      'Hello! 🎯 Need help with a styling question, an objection script, or a window idea? Fire away.',
      'Hi! Happy to help with anything TH, retail, or VM-related. What\'s on your mind?',
    ],
    followups: ['Top styling tips', 'How to lift ATV', 'Window display ideas'],
  },
  {
    keys: ['thanks', 'thank you', 'thx', 'ty'],
    replies: [
      'Anytime! Good luck on the floor today. 💪',
      'You got it. Crush those KPIs! 🚀',
      'Happy to help — come back whenever you need a quick prompt.',
    ],
  },
  {
    keys: ['who are you', 'what are you', 'what can you do', 'your name', 'whats your name'],
    replies: [
      'I\'m Tommy — your built-in helper inside the Growth Intelligence app. I know Tommy Hilfiger product, styling, VM standards, retail KPIs, and sales scripts. I run fully offline, so I won\'t use any data or credits.',
    ],
    followups: ['Show me styling tips', 'KPI cheatsheet', 'VM standards'],
  },
];

// ---------------- MATCHING ----------------

/** Score how well a user message matches a knowledge entry. */
function scoreEntry(query: string, entry: KnowledgeEntry): number {
  let score = 0;
  const q = ` ${query} `;
  for (const key of entry.keys) {
    const k = key.toLowerCase();
    if (q.includes(` ${k} `)) score += 10 + k.length;
    else if (q.includes(k)) score += 5 + k.length / 2;
  }
  return score;
}

export interface BotReply {
  text: string;
  followups?: string[];
}

/** Pick the best matching entry for a query; fall back gracefully. */
export function answer(rawQuery: string): BotReply {
  const q = normalize(rawQuery);
  if (!q) {
    return {
      text: 'Hmm — try typing a real question, like "How to style a polo for a wedding?" or "How do I lift ATV?"',
      followups: ['Top styling tips', 'How to lift ATV', 'VM checklist'],
    };
  }

  let best: { entry: KnowledgeEntry; score: number } | null = null;
  for (const entry of KB) {
    const s = scoreEntry(q, entry);
    if (s > 0 && (!best || s > best.score)) best = { entry, score: s };
  }

  if (best && best.score >= 10) {
    return {
      text: pickRandom(best.entry.replies),
      followups: best.entry.followups,
    };
  }

  // Soft fallback — still feels conversational, points to suggestions
  const fallbacks = [
    'Good question! I don\'t have a crisp answer for that one, but I can help with TH styling, VM standards, sales scripts, KPIs (ASP, ATV, UPT, LFL, CLV, churn), or festive looks. Want to try one of these?',
    'Hmm, that one\'s outside my baked-in knowledge. I\'m strongest on Tommy Hilfiger styling, retail KPIs, visual merchandising, and customer scripts. Try any of those?',
    'I want to help but I\'m not sure I got that. I can talk products, fits, fabrics, window displays, KPIs, or sales objections — pick one!',
  ];
  return {
    text: pickRandom(fallbacks),
    followups: ['Styling for a wedding', 'How to lift UPT', 'Best window display ideas', 'JOG slab math'],
  };
}

/** Top quick-reply chips shown when the conversation is fresh. */
export const STARTERS: string[] = [
  'How do I style a Polo for a wedding?',
  'Best window display ideas for Diwali?',
  'How to lift ATV and UPT?',
  'What\'s a good upsell script?',
  'Tell me about TH heritage',
  'Explain CLV and churn',
];
