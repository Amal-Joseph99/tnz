import { FormPage } from '../components/PageShell'

export function TrackOrderPage() {
  return (
    <FormPage
      eyebrow="Orders"
      title="Track order"
      subtitle="Enter your order ID and email address to check delivery status."
      fields={[
        { label: 'Order ID', type: 'text', placeholder: 'Example: AGT-123456' },
        { label: 'Email address', type: 'email', placeholder: 'you@example.com' },
      ]}
      buttonText="Track order"
    />
  )
}
