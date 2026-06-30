import {
  sellerAgreementFooter,
  sellerAgreementIntro,
  sellerAgreementSections,
  type SellerAgreementBlock,
} from '../../lib/sellerAgreementContent'

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

function AgreementBlock({ block }: { block: SellerAgreementBlock }) {
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

export function SellerAgreementBody() {
  return (
    <div className="seller-agreement-document__body">
      <header className="seller-agreement-document__intro">
        {sellerAgreementIntro.map((block, index) => (
          <AgreementBlock key={`intro-${index}`} block={block} />
        ))}
      </header>

      {sellerAgreementSections.map((section) => (
        <section key={section.title} className="seller-agreement-document__section">
          <h2 className="seller-agreement-document__section-title">{section.title}</h2>
          {section.blocks.map((block, index) => (
            <AgreementBlock key={`${section.title}-${index}`} block={block} />
          ))}
        </section>
      ))}

      <footer className="seller-agreement-document__footer">
        {sellerAgreementFooter.map((block, index) => (
          <AgreementBlock key={`footer-${index}`} block={block} />
        ))}
      </footer>
    </div>
  )
}
