import { supabase } from './supabase'

export type HelpPortalKey = 'buyer' | 'seller' | 'admin'

export type HelpPortal = {
  portalKey: string
  title: string
  subtitle: string
}

export type HelpTopic = {
  id: number
  portalKey: string
  topicKey: string
  title: string
  summary: string
  linkPath: string | null
  sortOrder: number
}

export type HelpArticle = {
  id: number
  portalKey: string
  topicKey: string | null
  title: string
  body: string
  sortOrder: number
}

export type SupportRequestTopic = {
  topicKey: string
  portalKey: string
  displayLabel: string
  sortOrder: number
}

export type HelpPortalContent = {
  portal: HelpPortal | null
  topics: HelpTopic[]
  articles: HelpArticle[]
  supportTopics: SupportRequestTopic[]
}

function mapTopic(row: Record<string, unknown>): HelpTopic {
  return {
    id: Number(row.id),
    portalKey: String(row.portal_key),
    topicKey: String(row.topic_key),
    title: String(row.title),
    summary: String(row.summary),
    linkPath: row.link_path ? String(row.link_path) : null,
    sortOrder: Number(row.sort_order ?? 0),
  }
}

function mapArticle(row: Record<string, unknown>): HelpArticle {
  return {
    id: Number(row.id),
    portalKey: String(row.portal_key),
    topicKey: row.topic_key ? String(row.topic_key) : null,
    title: String(row.title),
    body: String(row.body),
    sortOrder: Number(row.sort_order ?? 0),
  }
}

function mapSupportTopic(row: Record<string, unknown>): SupportRequestTopic {
  return {
    topicKey: String(row.topic_key),
    portalKey: String(row.portal_key),
    displayLabel: String(row.display_label),
    sortOrder: Number(row.sort_order ?? 0),
  }
}

export async function fetchHelpPortalContent(portalKey: HelpPortalKey): Promise<HelpPortalContent> {
  if (!supabase) {
    return { portal: null, topics: [], articles: [], supportTopics: [] }
  }

  const { data, error } = await supabase.rpc('list_help_portal_content', { p_portal_key: portalKey })
  if (error || !data) {
    return { portal: null, topics: [], articles: [], supportTopics: [] }
  }

  const portalRow = data.portal as Record<string, unknown> | null

  return {
    portal: portalRow
      ? {
          portalKey: String(portalRow.portal_key),
          title: String(portalRow.title),
          subtitle: String(portalRow.subtitle),
        }
      : null,
    topics: Array.isArray(data.topics)
      ? (data.topics as Record<string, unknown>[]).map((row) => mapTopic(row))
      : [],
    articles: Array.isArray(data.articles)
      ? (data.articles as Record<string, unknown>[]).map((row) => mapArticle(row))
      : [],
    supportTopics: Array.isArray(data.supportTopics)
      ? (data.supportTopics as Record<string, unknown>[]).map((row) => mapSupportTopic(row))
      : [],
  }
}

export async function searchHelpArticles(portalKey: HelpPortalKey, query: string): Promise<HelpArticle[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('search_help_articles', {
    p_portal_key: portalKey,
    p_query: query,
  })

  if (error || !data || !Array.isArray(data)) return []

  return data.map((row) => mapArticle(row as Record<string, unknown>))
}

export async function submitSupportRequest(
  portalKey: HelpPortalKey,
  topicKey: string,
  message: string,
): Promise<{ ok: true; requestId: number } | { ok: false; message: string }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase.rpc('submit_support_request', {
    p_portal_key: portalKey,
    p_topic_key: topicKey,
    p_message: message,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true, requestId: Number(data) }
}
