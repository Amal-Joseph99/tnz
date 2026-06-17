import { PageShell } from '../components/PageShell'

export function ReturnsPage() {
  return (
    <PageShell
      eyebrow="Support"
      title="Returns"
      subtitle="Start a return, review return eligibility, and understand refund timelines."
    >
      <div className="returns-layout">
        <section className="returns-card">
          <h2>Start a return</h2>
          <p>Enter your order number to check eligibility and available return options.</p>
          <form onSubmit={(event) => event.preventDefault()}>
            <label>
              Order number
              <input type="text" placeholder="Example: AGT-10291" />
            </label>
            <label>
              Email or phone
              <input type="text" placeholder="Used during checkout" />
            </label>
            <button type="submit">Check eligibility</button>
          </form>
        </section>

        <section className="returns-card">
          <h2>Return process</h2>
          <ol className="returns-steps">
            <li><strong>Request</strong><span>Select the item and reason.</span></li>
            <li><strong>Pickup or drop-off</strong><span>Choose the available return method.</span></li>
            <li><strong>Refund</strong><span>Refund is processed after inspection approval.</span></li>
          </ol>
        </section>
      </div>
    </PageShell>
  )
}
