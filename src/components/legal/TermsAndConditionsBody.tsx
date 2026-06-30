import {
  termsAndConditionsIntro,
  termsAndConditionsSections,
  type TermsAndConditionsBlock,
} from '../../lib/termsAndConditionsContent'

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>
        }
        return part
      })}
    </>
  )
}

function TermsBlock({ block }: { block: TermsAndConditionsBlock }) {
  if (block.kind === 'ul') {
    return (
      <ul className="seller-agreement-document__list">
        {block.items.map((item) => (
          <li key={item}>
            <RichText text={item} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <p className="seller-agreement-document__paragraph">
      <RichText text={block.text} />
    </p>
  )
}

export function TermsAndConditionsBody() {
  return (
    <div className="seller-agreement-document__body">
      <header className="seller-agreement-document__intro">
        {termsAndConditionsIntro.map((block, index) => (
          <TermsBlock key={`intro-${index}`} block={block} />
        ))}
      </header>

      {termsAndConditionsSections.map((section) => (
        <section key={section.title} className="seller-agreement-document__section">
          <h2 className="seller-agreement-document__section-title">{section.title}</h2>
          {section.blocks.map((block, index) => (
            <TermsBlock key={`${section.title}-${index}`} block={block} />
          ))}
        </section>
      ))}
    </div>
  )
}
