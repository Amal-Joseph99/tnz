import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { isValidEmail, isValidPassword } from './authHelpers'

export function SignUpPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = () => {
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSuccess('Buyer account details accepted. Email OTP has been sent.')
    window.setTimeout(() => navigate('/buyer/verify-email'), 600)
  }

  return (
    <section className="seller-login-page auth-page">
      <div className="seller-login">
        <div className="seller-login__card">
          <div className="seller-login__header">
            <p>Buyer account</p>
            <h1>Create account</h1>
            <span>Sign up to shop faster, track orders, and manage your AGTRENZ profile.</span>
          </div>

          {error && <div className="auth-message auth-message--error">{error}</div>}
          {success && <div className="auth-message auth-message--success">{success}</div>}

          <form className="seller-login__form" onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}>
            <label>
              Full name
              <input value={name} type="text" placeholder="Enter your full name" onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Email address
              <input value={email} type="email" placeholder="you@example.com" onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Password
              <input value={password} type="password" placeholder="Minimum 8 characters" onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button type="submit" className="seller-login__submit">Create buyer account</button>
          </form>

          <p className="seller-login__signup">
            Already have an account? <Link to="/buyer/signin">Buyer login</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
