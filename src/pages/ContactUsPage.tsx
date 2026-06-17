import { FormPage } from '../components/PageShell'

export function ContactUsPage() {
  return (
    <FormPage
      eyebrow="Support"
      title="Contact us"
      subtitle="Send a message to AGTRENZ support and we will get back to you."
      fields={[
        { label: 'Name', type: 'text', placeholder: 'Your name' },
        { label: 'Email address', type: 'email', placeholder: 'you@example.com' },
        { label: 'Message', type: 'text', placeholder: 'How can we help?' },
      ]}
      buttonText="Send message"
    />
  )
}
