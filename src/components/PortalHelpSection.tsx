import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchHelpPortalContent,
  searchHelpArticles,
  submitSupportRequest,
  type HelpArticle,
  type HelpPortalContent,
  type HelpPortalKey,
} from '../lib/helpCenter'

type PortalHelpSectionProps = {
  portalKey: HelpPortalKey
  showSupportForm?: boolean
}

export function PortalHelpSection({ portalKey, showSupportForm = true }: PortalHelpSectionProps) {
  const [content, setContent] = useState<HelpPortalContent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<HelpArticle[] | null>(null)
  const [topicKey, setTopicKey] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void fetchHelpPortalContent(portalKey).then((data) => {
      setContent(data)
      setTopicKey(data.supportTopics[0]?.topicKey ?? '')
    })
  }, [portalKey])

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault()
    const results = await searchHelpArticles(portalKey, searchQuery.trim())
    setSearchResults(results)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setStatus('')
    setSubmitting(true)

    const result = await submitSupportRequest(portalKey, topicKey, message)
    setSubmitting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('')
    setStatus(`Support request #${result.requestId} submitted.`)
  }

  const articles = searchResults ?? content?.articles ?? []

  return (
    <section className="support-layout">
      <div className="support-search-panel">
        <h2>How can we help?</h2>
        <form onSubmit={(event) => void handleSearch(event)}>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search help articles..."
          />
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="support-grid">
        {(content?.topics ?? []).map((topic, index) => {
          const card = (
            <>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{topic.title}</h3>
              <p>{topic.summary}</p>
            </>
          )

          return topic.linkPath ? (
            <Link key={topic.topicKey} to={topic.linkPath} className="support-card">
              {card}
            </Link>
          ) : (
            <article key={topic.topicKey} className="support-card">
              {card}
            </article>
          )
        })}
      </div>

      {articles.length > 0 && (
        <section className="seller-console-card">
          <h2>Help articles</h2>
          <div className="seller-action-list">
            {articles.map((article) => (
              <details key={article.id}>
                <summary>{article.title}</summary>
                <p>{article.body}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {showSupportForm && (content?.supportTopics.length ?? 0) > 0 && (
        <section className="seller-console-card">
          <h2>Contact support</h2>
          <p>Raise a support request and our team will follow up on your account.</p>
          <form className="seller-console-form seller-console-form--single" onSubmit={(event) => void handleSubmit(event)}>
            <label>
              Support topic
              <select value={topicKey} onChange={(event) => setTopicKey(event.target.value)}>
                {(content?.supportTopics ?? []).map((topic) => (
                  <option key={topic.topicKey} value={topic.topicKey}>
                    {topic.displayLabel}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Message
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe the issue clearly"
                required
              />
            </label>
            {error && <div className="auth-message auth-message--error">{error}</div>}
            {status && <div className="auth-message auth-message--success">{status}</div>}
            <button type="submit" className="seller-primary-action" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit request'}
            </button>
          </form>
        </section>
      )}
    </section>
  )
}
