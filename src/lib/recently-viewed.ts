export interface RecentlyViewedItem {
  id: string
  title: string
  price: number
  image: string | null
  categorySlug: string
}

const KEY = "madsjeez_rv"
const MAX = 10

export function saveRecentlyViewed(item: RecentlyViewedItem) {
  try {
    const list = loadRecentlyViewed()
    const next = [item, ...list.filter((p) => p.id !== item.id)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {}
}

export function loadRecentlyViewed(): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as RecentlyViewedItem[]) : []
  } catch {
    return []
  }
}
