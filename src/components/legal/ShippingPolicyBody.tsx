import {
  shippingPolicyIntro,
  shippingPolicySections,
  type ShippingPolicyBlock,
} from '../../lib/shippingPolicyContent'

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

function PolicyBlock({ block }: { block: ShippingPolicyBlock }) {
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

export function ShippingPolicyBody() {
  return (
    <div className="seller-agreement-document__body">
      <header className="seller-agreement-document__intro">
        {shippingPolicyIntro.map((block, index) => (
          <PolicyBlock key={`intro-${index}`} block={block} />
        ))}
      </header>

      {shippingPolicySections.map((section) => (
        <section key={section.title} className="seller-agreement-document__section">
          <h2 className="seller-agreement-document__section-title">{section.title}</h2>
          {section.blocks.map((block, index) => (
            <PolicyBlock key={`${section.title}-${index}`} block={block} />
          ))}
        </section>
      ))}
    </div>
  )
}
