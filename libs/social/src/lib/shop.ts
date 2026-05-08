// ---------------------------------------------------------------------------
// Shop & Sally Coins – cosmetics, coin packs, IAP product IDs
// ---------------------------------------------------------------------------

export interface ShopItem {
  id: string;
  name: Record<string, string>;
  type: 'card_skin' | 'card_back' | 'avatar' | 'tournament_entry' | 'coin_pack';
  price: number; // Sally Coins (0 = real-money IAP)
  iapProductId?: string; // App Store / Play Store product ID
  isAvailable: boolean;
}

// ---- Catalogue -------------------------------------------------------------

export const SHOP_ITEMS: ShopItem[] = [
  // ---- Coin Packs (real money via IAP) ----
  {
    id: 'coins_500',
    name: { en: 'Starter Pack', fr: 'Pack Débutant' },
    type: 'coin_pack',
    price: 0,
    iapProductId: 'com.sallycards.coins500',
    isAvailable: true,
  },
  {
    id: 'coins_2000',
    name: { en: 'Classic Pack', fr: 'Pack Classique' },
    type: 'coin_pack',
    price: 0,
    iapProductId: 'com.sallycards.coins2000',
    isAvailable: true,
  },
  {
    id: 'coins_5500',
    name: { en: 'Premium Pack', fr: 'Pack Premium' },
    type: 'coin_pack',
    price: 0,
    iapProductId: 'com.sallycards.coins5500',
    isAvailable: true,
  },
  {
    id: 'coins_12000',
    name: { en: 'Mega Pack', fr: 'Méga Pack' },
    type: 'coin_pack',
    price: 0,
    iapProductId: 'com.sallycards.coins12000',
    isAvailable: true,
  },

  // ---- Card Skins (Sally Coins) ----
  {
    id: 'skin_moroccan_gold',
    name: { en: 'Moroccan Gold', fr: 'Or Marocain' },
    type: 'card_skin',
    price: 200,
    isAvailable: true,
  },
  {
    id: 'skin_desert_sand',
    name: { en: 'Desert Sand', fr: 'Sable du Désert' },
    type: 'card_skin',
    price: 150,
    isAvailable: true,
  },
  {
    id: 'skin_ocean_blue',
    name: { en: 'Ocean Blue', fr: 'Bleu Océan' },
    type: 'card_skin',
    price: 150,
    isAvailable: true,
  },
  {
    id: 'skin_dark_night',
    name: { en: 'Dark Night', fr: 'Nuit Noire' },
    type: 'card_skin',
    price: 300,
    isAvailable: true,
  },
  {
    id: 'skin_royal_purple',
    name: { en: 'Royal Purple', fr: 'Violet Royal' },
    type: 'card_skin',
    price: 250,
    isAvailable: true,
  },
  {
    id: 'skin_emerald_garden',
    name: { en: 'Emerald Garden', fr: 'Jardin Émeraude' },
    type: 'card_skin',
    price: 200,
    isAvailable: true,
  },

  // ---- Card Backs ----
  {
    id: 'back_zellige',
    name: { en: 'Zellige Pattern', fr: 'Motif Zellige' },
    type: 'card_back',
    price: 100,
    isAvailable: true,
  },
  {
    id: 'back_arabesque',
    name: { en: 'Arabesque', fr: 'Arabesque' },
    type: 'card_back',
    price: 100,
    isAvailable: true,
  },
  {
    id: 'back_atlas_cedar',
    name: { en: 'Atlas Cedar', fr: 'Cèdre de l\'Atlas' },
    type: 'card_back',
    price: 120,
    isAvailable: true,
  },
  {
    id: 'back_geometric',
    name: { en: 'Geometric', fr: 'Géométrique' },
    type: 'card_back',
    price: 100,
    isAvailable: true,
  },

  // ---- Avatars ----
  {
    id: 'avatar_sultan',
    name: { en: 'Sultan', fr: 'Sultan' },
    type: 'avatar',
    price: 150,
    isAvailable: true,
  },
  {
    id: 'avatar_princess',
    name: { en: 'Princess', fr: 'Princesse' },
    type: 'avatar',
    price: 150,
    isAvailable: true,
  },
  {
    id: 'avatar_merchant',
    name: { en: 'Merchant', fr: 'Marchand' },
    type: 'avatar',
    price: 120,
    isAvailable: true,
  },
  {
    id: 'avatar_scholar',
    name: { en: 'Scholar', fr: 'Érudit' },
    type: 'avatar',
    price: 120,
    isAvailable: true,
  },
  {
    id: 'avatar_explorer',
    name: { en: 'Explorer', fr: 'Explorateur' },
    type: 'avatar',
    price: 150,
    isAvailable: true,
  },

  // ---- Tournament Entries ----
  {
    id: 'tourney_entry_bronze',
    name: { en: 'Bronze Tournament Entry', fr: 'Entrée Tournoi Bronze' },
    type: 'tournament_entry',
    price: 100,
    isAvailable: true,
  },
  {
    id: 'tourney_entry_silver',
    name: { en: 'Silver Tournament Entry', fr: 'Entrée Tournoi Argent' },
    type: 'tournament_entry',
    price: 250,
    isAvailable: true,
  },
  {
    id: 'tourney_entry_gold',
    name: { en: 'Gold Tournament Entry', fr: 'Entrée Tournoi Or' },
    type: 'tournament_entry',
    price: 500,
    isAvailable: true,
  },
];

// ---- In-memory inventory (placeholder) ------------------------------------

const inventoryStore: Map<string, Set<string>> = new Map();

function getInventory(userId: string): Set<string> {
  let inv = inventoryStore.get(userId);
  if (!inv) {
    inv = new Set();
    inventoryStore.set(userId, inv);
  }
  return inv;
}

// ---- Public API ------------------------------------------------------------

/**
 * Check whether a user can afford a shop item.
 */
export function canAfford(userCoins: number, item: ShopItem): boolean {
  // IAP items (price === 0) are purchased through the store – always "affordable"
  if (item.price === 0) return true;
  return userCoins >= item.price;
}

/**
 * Attempt to purchase an item with Sally Coins.
 * Returns success status and remaining coin balance.
 */
export function purchaseItem(
  userId: string,
  itemId: string,
  userCoins: number,
): { success: boolean; remainingCoins: number; message?: string } {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) {
    return { success: false, remainingCoins: userCoins, message: 'Item not found' };
  }
  if (!item.isAvailable) {
    return { success: false, remainingCoins: userCoins, message: 'Item not available' };
  }

  // IAP items require native store flow
  if (item.price === 0 && item.iapProductId) {
    return {
      success: false,
      remainingCoins: userCoins,
      message: 'Use in-app purchase flow for this item',
    };
  }

  const inv = getInventory(userId);
  if (inv.has(itemId)) {
    return { success: false, remainingCoins: userCoins, message: 'Already owned' };
  }

  if (userCoins < item.price) {
    return { success: false, remainingCoins: userCoins, message: 'Not enough coins' };
  }

  inv.add(itemId);
  return { success: true, remainingCoins: userCoins - item.price };
}

/**
 * Check whether a user already owns an item.
 */
export function ownsItem(userId: string, itemId: string): boolean {
  return getInventory(userId).has(itemId);
}

/**
 * Grant an item (e.g. after IAP receipt validation).
 */
export function grantItem(userId: string, itemId: string): void {
  getInventory(userId).add(itemId);
}

/**
 * Return all items a user owns.
 */
export function getOwnedItems(userId: string): string[] {
  return [...getInventory(userId)];
}

/**
 * Get shop items by type.
 */
export function getShopItemsByType(type: ShopItem['type']): ShopItem[] {
  return SHOP_ITEMS.filter((i) => i.type === type && i.isAvailable);
}
