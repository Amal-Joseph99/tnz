import { Navigate } from 'react-router-dom'
import { legalDocuments } from '../lib/legalDocuments'

export function LegalDocumentBySlug({ slug }: { slug: string }) {
  const document = legalDocuments[slug]
  if (!document) return <Navigate to="/" replace />

  return (
    <section className="simple-page">
      <div className="container simple-page__inner">
        <div className="simple-page__header">
          <span>{document.eyebrow}</span>
          <h1>{document.title}</h1>
          <p>{document.subtitle}</p>
        </div>
        <article className="policy-document">
          {document.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </section>
  )
}
