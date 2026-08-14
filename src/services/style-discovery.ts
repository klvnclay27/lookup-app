import type { ClosetCategory } from '@/constants/starter-wardrobe';
import type { WardrobeItem } from '@/services/my-locker';

export type StyleDiscoveryReason =
  | 'Complete Your Look'
  | 'Wardrobe Gap'
  | 'Try Something New'
  | 'Weather Ready';

export type StyleDiscoveryProduct = {
  id: string;
  name: string;
  category: ClosetCategory;
  brand: string;
  samplePrice: number;
  description: string;
  adventurous: boolean;
  weatherReady?: boolean;
};

export type StyleDiscoveryRecommendation = StyleDiscoveryProduct & {
  reason: StyleDiscoveryReason;
  reasonDetail: string;
};

const SAMPLE_STYLE_CATALOG: StyleDiscoveryProduct[] = [
  { id: 'sample-discovery-rain-shell', name: 'Lightweight Rain Shell', category: 'Jackets', brand: 'Northline', samplePrice: 89, description: 'A packable outer layer for wet or windy days.', adventurous: false, weatherReady: true },
  { id: 'sample-discovery-knit', name: 'Merino Blend Sweater', category: 'Shirts', brand: 'Common Thread', samplePrice: 74, description: 'A versatile layer that can move between casual and polished outfits.', adventurous: false },
  { id: 'sample-discovery-chinos', name: 'Tailored Everyday Chinos', category: 'Pants', brand: 'Form & Field', samplePrice: 68, description: 'A neutral bottom that works with polos, shirts, and simple sneakers.', adventurous: false },
  { id: 'sample-discovery-boots', name: 'Weatherproof Chelsea Boots', category: 'Shoes', brand: 'Harbor Standard', samplePrice: 118, description: 'Closed footwear designed for cooler and damp conditions.', adventurous: false, weatherReady: true },
  { id: 'sample-discovery-sneakers', name: 'Minimal Leather Sneakers', category: 'Shoes', brand: 'Common Ground', samplePrice: 92, description: 'A clean shoe that can finish casual and work-week combinations.', adventurous: false },
  { id: 'sample-discovery-overshirt', name: 'Textured Utility Overshirt', category: 'Jackets', brand: 'Open Range', samplePrice: 82, description: 'A more expressive layer that still pairs easily with wardrobe basics.', adventurous: true },
  { id: 'sample-discovery-pattern-shirt', name: 'Geometric Camp Collar Shirt', category: 'Shirts', brand: 'New Perspective', samplePrice: 58, description: 'A controlled pattern for trying something beyond neutral staples.', adventurous: true },
  { id: 'sample-discovery-tote', name: 'Structured Canvas Carryall', category: 'Accessories', brand: 'Daymark', samplePrice: 64, description: 'A practical accessory with a stronger shape and subtle color contrast.', adventurous: true },
];

function normalizedName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function reasonFor(product: StyleDiscoveryProduct, categoryCounts: Map<ClosetCategory, number>): StyleDiscoveryReason {
  if ((categoryCounts.get(product.category) ?? 0) === 0) return 'Wardrobe Gap';
  if (product.adventurous) return 'Try Something New';
  if (product.weatherReady) return 'Weather Ready';
  return 'Complete Your Look';
}

function reasonDetail(reason: StyleDiscoveryReason, product: StyleDiscoveryProduct) {
  if (reason === 'Wardrobe Gap') return `Your Locker does not currently include any ${product.category.toLowerCase()}.`;
  if (reason === 'Try Something New') return 'Adds a slightly different shape, texture, or pattern while staying easy to combine.';
  if (reason === 'Weather Ready') return 'Adds a practical option for wet, windy, or cooler conditions.';
  return `Complements pieces already stored in your ${product.category === 'Shoes' ? 'wardrobe' : 'Locker'}.`;
}

export function getStyleDiscoveryRecommendations(
  wardrobe: WardrobeItem[],
  options: { adventurous?: boolean; limit?: number } = {},
): StyleDiscoveryRecommendation[] {
  const ownedNames = new Set(wardrobe.map((item) => normalizedName(item.name)));
  const categoryCounts = wardrobe.reduce((counts, item) => {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    return counts;
  }, new Map<ClosetCategory, number>());

  return SAMPLE_STYLE_CATALOG
    .filter((product) => options.adventurous || !product.adventurous)
    .filter((product) => !ownedNames.has(normalizedName(product.name)))
    .map((product, index) => {
      const reason = reasonFor(product, categoryCounts);
      const score = (reason === 'Wardrobe Gap' ? 40 : 0)
        + (reason === 'Weather Ready' ? 18 : 0)
        + (reason === 'Try Something New' ? 28 : 0)
        - index;
      return { product, reason, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit ?? 3)
    .map(({ product, reason }) => ({
      ...product,
      reason,
      reasonDetail: reasonDetail(reason, product),
    }));
}
