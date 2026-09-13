import * as THREE from 'three'

/**
 * Shared "shelf of repeated items" system for every stocked-goods interior
 * (supermarket groceries, clothing racks, gun-shop vitrines). A layout pass
 * plans where every slot goes as plain data (no meshes yet); a single
 * `materializeSlots` call then batches all of it into one `InstancedMesh`
 * per distinct color, which is what keeps a store with dozens of shelf
 * slots down to a handful of draw calls instead of one mesh per item.
 */

export interface CatalogItem {
  name: string
  price: number
  category: string
  color: number
}

export const GROCERY_CATALOG: CatalogItem[] = [
  // Vegetables
  { name: 'עגבניות', price: 6.9, category: 'ירקות', color: 0xd9483a },
  { name: 'מלפפונים', price: 5.5, category: 'ירקות', color: 0x4f8f3f },
  { name: 'פלפלים', price: 7.9, category: 'ירקות', color: 0xd9a53a },
  { name: 'חסה', price: 4.9, category: 'ירקות', color: 0x6fae4a },
  { name: 'גזר', price: 4.5, category: 'ירקות', color: 0xe08a2e },
  { name: 'תפוחי אדמה', price: 5.9, category: 'ירקות', color: 0xc9a35f },
  // Dairy
  { name: 'חלב', price: 7.9, category: 'מוצרי חלב', color: 0xf2f2f2 },
  { name: 'גבינה לבנה', price: 8.5, category: 'מוצרי חלב', color: 0xfafaf0 },
  { name: 'יוגורט', price: 3.9, category: 'מוצרי חלב', color: 0xf5e3c0 },
  { name: 'גבינה צהובה', price: 12.9, category: 'מוצרי חלב', color: 0xf2c94c },
  { name: 'חמאה', price: 9.5, category: 'מוצרי חלב', color: 0xf4e0a0 },
  // Bakery / dry goods
  { name: 'לחם', price: 8.5, category: 'מוצרי מזון', color: 0xc9924a },
  { name: 'ביצים', price: 14.9, category: 'מוצרי מזון', color: 0xe8d5b0 },
  { name: 'אורז', price: 9.9, category: 'מוצרי מזון', color: 0xede3c8 },
  { name: 'פסטה', price: 6.5, category: 'מוצרי מזון', color: 0xe8c65a },
  { name: 'דגני בוקר', price: 15.9, category: 'מוצרי מזון', color: 0xd9622e },
  { name: 'שימורים', price: 7.5, category: 'מוצרי מזון', color: 0x8a3a3a },
  { name: 'חטיפים', price: 4.9, category: 'מוצרי מזון', color: 0xd9a53a },
  // Drinks
  { name: 'מים', price: 3.5, category: 'שתייה', color: 0x9fd3e8 },
  { name: 'מיץ', price: 8.9, category: 'שתייה', color: 0xe08a2e },
  { name: 'משקה קל', price: 6.9, category: 'שתייה', color: 0x3a5fd9 },
]

export const MEAT_CATALOG: CatalogItem[] = [
  { name: 'עוף טרי', price: 24.9, category: 'בשר', color: 0xe8b8a0 },
  { name: 'בקר טחון', price: 39.9, category: 'בשר', color: 0xa8453f },
  { name: 'נקניקיות', price: 22.9, category: 'בשר', color: 0xb8583f },
]

export const CLEANING_CATALOG: CatalogItem[] = [
  { name: 'נוזל כלים', price: 12.9, category: 'ניקיון', color: 0x3aa5d9 },
  { name: 'אבקת כביסה', price: 34.9, category: 'ניקיון', color: 0xf2f2f2 },
  { name: 'מגבוני ניקוי', price: 9.9, category: 'לבית', color: 0xe8e0c8 },
]

export const CLOTHING_CATALOG: CatalogItem[] = [
  { name: 'חולצה', price: 59, category: 'חולצות', color: 0x3a5fd9 },
  { name: 'מכנסיים', price: 89, category: 'מכנסיים', color: 0x2c2c3a },
  { name: 'מעיל', price: 149, category: 'מעילים', color: 0x4a4a4a },
  { name: 'שמלה', price: 119, category: 'שמלות', color: 0xd9488f },
  { name: 'נעליים', price: 139, category: 'נעליים', color: 0xf2f2f2 },
  { name: 'כובע', price: 39, category: 'כובעים', color: 0x8a3a3a },
  { name: 'תיק', price: 99, category: 'תיקים', color: 0x6b4a32 },
]

export interface WeaponCatalogItem {
  name: string
  price: number
  color: number
}

/** Original, fictional weapon names/shapes only - no real manufacturer or trademarked names. */
export const WEAPON_CATALOG: WeaponCatalogItem[] = [
  { name: 'אקדח קליע-9', price: 899, color: 0x2c2c2c },
  { name: 'רובה סער RX-4', price: 2499, color: 0x3a3a2a },
  { name: 'רובה ציד "פלקון"', price: 1799, color: 0x5b4636 },
  { name: 'מיניגן "סופת אש"', price: 4999, color: 0x3f3f42 },
  { name: 'תחמושת - קופסה', price: 149, color: 0x8a6a2a },
]

export interface ProductSlot {
  position: THREE.Vector3
  rotY: number
  color: number
  /** width, height, depth of the box representing this item. */
  size: [number, number, number]
}

/** Groups slots by (rounded) color and rotation bucket into a handful of InstancedMesh objects - the whole point being far fewer draw calls than one mesh per slot. */
export function materializeSlots(slots: ProductSlot[]): THREE.Object3D[] {
  const groups = new Map<string, { color: number; size: [number, number, number]; items: ProductSlot[] }>()
  for (const slot of slots) {
    const key = `${slot.color}-${slot.size.join('x')}`
    let g = groups.get(key)
    if (!g) {
      g = { color: slot.color, size: slot.size, items: [] }
      groups.set(key, g)
    }
    g.items.push(slot)
  }

  const objects: THREE.Object3D[] = []
  const dummy = new THREE.Object3D()
  for (const g of groups.values()) {
    const geo = new THREE.BoxGeometry(...g.size)
    const material = new THREE.MeshStandardMaterial({ color: g.color, roughness: 0.7, metalness: 0.05 })
    const inst = new THREE.InstancedMesh(geo, material, g.items.length)
    inst.castShadow = true
    inst.receiveShadow = true
    g.items.forEach((slot, i) => {
      dummy.position.copy(slot.position)
      dummy.rotation.set(0, slot.rotY, 0)
      dummy.updateMatrix()
      inst.setMatrixAt(i, dummy.matrix)
    })
    inst.instanceMatrix.needsUpdate = true
    objects.push(inst)
  }
  return objects
}
