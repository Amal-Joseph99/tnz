import { supabase } from './supabase'
import { isSignedInUser } from './userLocation'

const GUEST_SEARCH_HISTORY_KEY = 'agtrenz-search-history'
const MAX_HISTORY_ITEMS = 50

export type SearchHistoryEntry = {
  searchInput: string
  productId: number | null
  productName: string
  searchedAt: string
}

function normalizeEntry(raw: Partial<SearchHistoryEntry>): SearchHistoryEntry | null {
  const searchInput = raw.searchInput?.trim()
  const productName = raw.productName?.trim()
  if (!searchInput || !productName) return null

  return {
    searchInput,
    productId: typeof raw.productId === 'number' ? raw.productId : null,
    productName,
    searchedAt: raw.searchedAt ?? new Date().toISOString(),
  }
}

function readGuestSearchHistory(): SearchHistoryEntry[] {
  try {
    const saved = window.localStorage.getItem(GUEST_SEARCH_HISTORY_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved) as Partial<SearchHistoryEntry>[]
    return parsed
      .map((entry) => normalizeEntry(entry))
      .filter((entry): entry is SearchHistoryEntry => Boolean(entry))
  } catch {
    return []
  }
}

function writeGuestSearchHistory(entries: SearchHistoryEntry[]) {
  window.localStorage.setItem(GUEST_SEARCH_HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY_ITEMS)))
}

export async function readSearchHistory(): Promise<SearchHistoryEntry[]> {
  if (!supabase || !(await isSignedInUser())) {
    return readGuestSearchHistory()
  }

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return readGuestSearchHistory()

  const { data, error } = await supabase
    .from('user_search_history')
    .select('search_input, product_id, product_name, searched_at')
    .eq('user_id', user.id)
    .order('searched_at', { ascending: false })
    .limit(MAX_HISTORY_ITEMS)

  if (error || !data) return []

  return data
    .map((row) => normalizeEntry({
      searchInput: row.search_input,
      productId: row.product_id,
      productName: row.product_name,
      searchedAt: row.searched_at,
    }))
    .filter((entry): entry is SearchHistoryEntry => Boolean(entry))
}

export async function appendSearchHistory(input: {
  searchInput: string
  productId?: number | null
  productName?: string
}) {
  const searchInput = input.searchInput.trim()
  if (!searchInput) return

  const productName = (input.productName?.trim() || searchInput)
  const entry = normalizeEntry({
    searchInput,
    productId: input.productId ?? null,
    productName,
    searchedAt: new Date().toISOString(),
  })
  if (!entry) return

  if (!supabase || !(await isSignedInUser())) {
    const existing = readGuestSearchHistory().filter((item) => item.searchInput !== entry.searchInput)
    writeGuestSearchHistory([entry, ...existing])
    return
  }

  const { error } = await supabase.rpc('record_search_history', {
    p_search_input: entry.searchInput,
    p_product_id: entry.productId,
    p_product_name: entry.productName,
  })

  if (error) {
    console.error('Failed to record search history', error.message)
  }
}
