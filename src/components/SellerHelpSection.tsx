import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchHelpPortalContent,
  searchHelpArticles,
  submitSupportRequest,
  type HelpArticle,
  type HelpPortalContent,
} from '../lib/helpCenter'
import { MailIcon, WhatsAppIcon } from './Icons'

const SELLER_WHATSAPP_URL = 'https://wa.me/917736122139'
const SELLER_SUPPORT_EMAIL = 'support@agtrenz.com'

const SELLER_TICKET_TOPIC_KEYS = [
  'seller_kyc',
  'seller_listing',
  'seller_payout',
  'seller_order',
] as const

export function SellerHelpSection() {
  const [content, setContent] = useState<HelpPortalContent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<HelpArticle[] | null>(null)
  const [topicKey, setTopicKey] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const ticketTopics = useMemo(
    () =>
      (content?.supportTopics ?? []).filter((topic) =>
        SELLER_TICKET_TOPIC_KEYS.includes(topic.topicKey as (typeof SELLER_TICKET_TOPIC_KEYS)[number]),
      ),
    [content?.supportTopics],
  )

  useEffect(() => {
    void fetchHelpPortalContent('seller').then((data) => {
      setContent(data)
      const firstTicketTopic = data.supportTopics.find((topic) =>
        SELLER_TICKET_TOPIC_KEYS.includes(topic.topicKey as (typeof SELLER_TICKET_TOPIC_KEYS)[number]),
      )
      setTopicKey(firstTicketTopic?.topicKey ?? '')
    })
  }, [])

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault()
    const results = await searchHelpArticles('seller', searchQuery.trim())
    setSearchResults(results)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setStatus('')
    setSubmitting(true)

    const result = await submitSupportRequest('seller', topicKey, message)
    setSubmitting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('')
    setStatus(`Ticket #${result.requestId} submitted. Our team will follow up soon.`)
  }

  const articles = searchResults ?? content?.articles ?? []

  return (
    <section className="support-layout">
      <div className="buyer-help-contact">
        <a
          href={SELLER_WHATSAPP_URL}
          className="buyer-help-contact__card buyer-help-contact__card--whatsapp"
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon className="buyer-help-contact__icon" />
          <div>
            <strong>Contact us on WhatsApp</strong>
            <span>+91 77361 22139</span>
          </div>
        </a>

        <a href={`mailto:${SELLER_SUPPORT_EMAIL}`} className="buyer-help-contact__card buyer-help-contact__card--email">
          <MailIcon className="buyer-help-contact__icon" />
          <div>
            <strong>Contact on email</strong>
            <span>{SELLER_SUPPORT_EMAIL}</span>
          </div>
        </a>
      </div>

      <section className="seller-console-card buyer-help-ticket">
        <h2>Create your ticket</h2>
        <p>Choose a section and describe your issue. We will respond on your registered seller email.</p>

        {ticketTopics.length === 0 ? (
          <p className="buyer-help-ticket__signin">
            Ticket sections are unavailable right now. Please use WhatsApp or email, or{' '}
            <Link to="/seller/signin">sign in</Link> as a seller.
          </p>
        ) : (
          <form className="seller-console-form seller-console-form--single" onSubmit={(event) => void handleSubmit(event)}>
            <label>
              Select a section
              <select value={topicKey} onChange={(event) => setTopicKey(event.target.value)} required>
                {ticketTopics.map((topic) => (
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
                placeholder="Describe your KYC, listing, payout, or order issue"
                required
              />
            </label>
            {error && <div className="auth-message auth-message--error">{error}</div>}
            {status && <div className="auth-message auth-message--success">{status}</div>}
            <button type="submit" className="seller-primary-action" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit ticket'}
            </button>
          </form>
        )}
      </section>

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
    </section>
  )
}
