import type {
  Category,
  CategoryId,
  Channel,
  ChannelId,
  CustomerSegment,
  Product,
  Region,
  RegionId,
} from '~/types/domain'
import { getLang, type Lang } from '~/utils/locale'

/**
 * Static reference data (the "master data" of the fictional store
 * "Aurora Living Co."). Shared by the mock API and the UI so labels are
 * always consistent. In a real system this would come from a products /
 * settings service.
 */

export const CHANNELS: Channel[] = [
  { id: 'organic', label: 'Organic Search' },
  { id: 'paid', label: 'Paid Ads' },
  { id: 'social', label: 'Social Media' },
  { id: 'email', label: 'Email' },
  { id: 'direct', label: 'Direct' },
  { id: 'referral', label: 'Referral' },
]

export const CATEGORIES: Category[] = [
  { id: 'electronics', label: 'Electronics' },
  { id: 'home', label: 'Home & Living' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'sports', label: 'Sports & Outdoors' },
  { id: 'books', label: 'Books & Stationery' },
]

export const REGIONS: Region[] = [
  { id: 'tw', label: 'Taiwan' },
  { id: 'jp', label: 'Japan' },
  { id: 'hk', label: 'Hong Kong' },
  { id: 'sg', label: 'Singapore' },
  { id: 'my', label: 'Malaysia' },
  { id: 'au', label: 'Australia' },
  { id: 'us', label: 'United States' },
]

export const SEGMENTS: { id: CustomerSegment; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'plus', label: 'Plus Member' },
  { id: 'vip', label: 'VIP' },
]

export const PRODUCTS: Product[] = [
  // Electronics
  { id: 'p-101', name: 'Aurora Wireless Earbuds', category: 'electronics', price: 129, weight: 9 },
  { id: 'p-102', name: 'Lumen Smart Desk Lamp', category: 'electronics', price: 79, weight: 7 },
  { id: 'p-103', name: 'Pulse Fitness Watch', category: 'electronics', price: 199, weight: 6 },
  { id: 'p-104', name: 'Echo Bluetooth Speaker', category: 'electronics', price: 89, weight: 6 },
  { id: 'p-105', name: 'Nova Power Bank 20K', category: 'electronics', price: 49, weight: 8 },
  { id: 'p-106', name: 'Orbit 4K Webcam', category: 'electronics', price: 149, weight: 3 },
  { id: 'p-107', name: 'Volt USB-C Hub', category: 'electronics', price: 59, weight: 5 },
  // Home & Living
  { id: 'p-201', name: 'Nordic Ceramic Mug Set', category: 'home', price: 36, weight: 9 },
  { id: 'p-202', name: 'Linen Bedding Set', category: 'home', price: 159, weight: 4 },
  { id: 'p-203', name: 'Aroma Diffuser', category: 'home', price: 45, weight: 7 },
  { id: 'p-204', name: 'Bamboo Storage Boxes', category: 'home', price: 29, weight: 6 },
  { id: 'p-205', name: 'Cast Iron Skillet', category: 'home', price: 64, weight: 5 },
  { id: 'p-206', name: 'Wool Throw Blanket', category: 'home', price: 89, weight: 4 },
  { id: 'p-207', name: 'Glass Pour-over Kit', category: 'home', price: 42, weight: 5 },
  // Fashion
  { id: 'p-301', name: 'Everyday Canvas Tote', category: 'fashion', price: 32, weight: 8 },
  { id: 'p-302', name: 'Merino Crew Sweater', category: 'fashion', price: 98, weight: 5 },
  { id: 'p-303', name: 'Classic Leather Belt', category: 'fashion', price: 45, weight: 4 },
  { id: 'p-304', name: 'Urban Rain Jacket', category: 'fashion', price: 138, weight: 4 },
  { id: 'p-305', name: 'Organic Cotton Tee', category: 'fashion', price: 28, weight: 9 },
  { id: 'p-306', name: 'Minimal Sneakers', category: 'fashion', price: 112, weight: 5 },
  { id: 'p-307', name: 'Silk Scarf', category: 'fashion', price: 54, weight: 3 },
  // Beauty
  { id: 'p-401', name: 'Hydra Glow Serum', category: 'beauty', price: 48, weight: 8 },
  { id: 'p-402', name: 'Botanical Face Mask (5pk)', category: 'beauty', price: 24, weight: 9 },
  { id: 'p-403', name: 'Daily SPF 50 Sunscreen', category: 'beauty', price: 26, weight: 8 },
  { id: 'p-404', name: 'Matte Lip Collection', category: 'beauty', price: 39, weight: 5 },
  { id: 'p-405', name: 'Rose Hand Cream', category: 'beauty', price: 18, weight: 7 },
  { id: 'p-406', name: 'Night Repair Cream', category: 'beauty', price: 62, weight: 4 },
  // Sports & Outdoors
  { id: 'p-501', name: 'Trail Running Shoes', category: 'sports', price: 135, weight: 5 },
  { id: 'p-502', name: 'Cork Yoga Mat', category: 'sports', price: 68, weight: 6 },
  { id: 'p-503', name: 'Insulated Water Bottle', category: 'sports', price: 34, weight: 9 },
  { id: 'p-504', name: 'Ultralight Daypack', category: 'sports', price: 79, weight: 4 },
  { id: 'p-505', name: 'Resistance Band Set', category: 'sports', price: 29, weight: 6 },
  { id: 'p-506', name: 'Camping Hammock', category: 'sports', price: 59, weight: 3 },
  // Books & Stationery
  { id: 'p-601', name: 'Dot Grid Notebook', category: 'books', price: 19, weight: 8 },
  { id: 'p-602', name: 'Fountain Pen Starter Kit', category: 'books', price: 46, weight: 4 },
  { id: 'p-603', name: 'Data Storytelling (Book)', category: 'books', price: 34, weight: 3 },
  { id: 'p-604', name: 'Weekly Planner 2027', category: 'books', price: 24, weight: 7 },
  { id: 'p-605', name: 'Watercolor Paint Set', category: 'books', price: 38, weight: 4 },
]

// --- Lookup helpers (O(1) access by id) ---------------------------------

const productMap = new Map(PRODUCTS.map((p) => [p.id, p]))
const channelMap = new Map(CHANNELS.map((c) => [c.id, c]))
const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]))
const regionMap = new Map(REGIONS.map((r) => [r.id, r]))

export function getProduct(id: string): Product | undefined {
  return productMap.get(id)
}

// --- Traditional Chinese labels ------------------------------------------
// Master data is bilingual. The browser uses the current UI language
// (utils/locale.ts); the server always passes the request's `lang` explicitly.

const ZH_CHANNEL: Record<ChannelId, string> = {
  organic: '自然搜尋',
  paid: '付費廣告',
  social: '社群媒體',
  email: 'Email',
  direct: '直接造訪',
  referral: '推薦連結',
}

const ZH_CATEGORY: Record<CategoryId, string> = {
  electronics: '3C 電子',
  home: '居家生活',
  fashion: '服飾',
  beauty: '美妝保養',
  sports: '運動戶外',
  books: '書籍文具',
}

const ZH_REGION: Record<RegionId, string> = {
  tw: '台灣',
  jp: '日本',
  hk: '香港',
  sg: '新加坡',
  my: '馬來西亞',
  au: '澳洲',
  us: '美國',
}

const ZH_SEGMENT: Record<CustomerSegment, string> = { standard: '一般會員', plus: 'Plus 會員', vip: 'VIP' }

const ZH_PRODUCT: Record<string, string> = {
  'p-101': 'Aurora 無線藍牙耳機',
  'p-102': 'Lumen 智慧檯燈',
  'p-103': 'Pulse 智慧運動手錶',
  'p-104': 'Echo 藍牙喇叭',
  'p-105': 'Nova 20K 行動電源',
  'p-106': 'Orbit 4K 網路攝影機',
  'p-107': 'Volt USB-C 擴充座',
  'p-201': '北歐陶瓷馬克杯組',
  'p-202': '亞麻寢具組',
  'p-203': '香氛擴香機',
  'p-204': '竹製收納盒',
  'p-205': '鑄鐵平底鍋',
  'p-206': '羊毛毯',
  'p-207': '玻璃手沖咖啡組',
  'p-301': '日常帆布托特包',
  'p-302': '美麗諾圓領毛衣',
  'p-303': '經典皮革腰帶',
  'p-304': '都會防水外套',
  'p-305': '有機棉 T 恤',
  'p-306': '極簡休閒鞋',
  'p-307': '真絲絲巾',
  'p-401': '玻尿酸精華液',
  'p-402': '植萃保濕面膜（5 片）',
  'p-403': '日常防曬乳 SPF50',
  'p-404': '霧面唇膏組',
  'p-405': '玫瑰護手霜',
  'p-406': '夜間修護霜',
  'p-501': '越野慢跑鞋',
  'p-502': '軟木瑜珈墊',
  'p-503': '保溫水壺',
  'p-504': '超輕量後背包',
  'p-505': '彈力帶組',
  'p-506': '露營吊床',
  'p-601': '點陣筆記本',
  'p-602': '鋼筆入門組',
  'p-603': '《資料說故事》',
  'p-604': '2027 週計畫手帳',
  'p-605': '水彩顏料組',
}

const zh = (lang: Lang) => lang === 'zh-TW'

export function channelLabel(id: ChannelId | string, lang: Lang = getLang()): string {
  return (zh(lang) && ZH_CHANNEL[id as ChannelId]) || channelMap.get(id as ChannelId)?.label || id
}

export function categoryLabel(id: CategoryId | string, lang: Lang = getLang()): string {
  return (zh(lang) && ZH_CATEGORY[id as CategoryId]) || categoryMap.get(id as CategoryId)?.label || id
}

export function regionLabel(id: RegionId | string, lang: Lang = getLang()): string {
  return (zh(lang) && ZH_REGION[id as RegionId]) || regionMap.get(id as RegionId)?.label || id
}

export function segmentLabel(id: CustomerSegment | string, lang: Lang = getLang()): string {
  return (zh(lang) && ZH_SEGMENT[id as CustomerSegment]) || SEGMENTS.find((s) => s.id === id)?.label || id
}

export function productLabel(id: string, lang: Lang = getLang()): string {
  return (zh(lang) && ZH_PRODUCT[id]) || productMap.get(id)?.name || id
}

export const CHANNEL_IDS = CHANNELS.map((c) => c.id) as [ChannelId, ...ChannelId[]]
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]]
export const REGION_IDS = REGIONS.map((r) => r.id) as [RegionId, ...RegionId[]]
