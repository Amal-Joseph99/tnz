import { useNavigate } from 'react-router-dom'

type PageBackButtonProps = {
  className?: string
}

export function PageBackButton({ className }: PageBackButtonProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/')
  }

  return (
    <button
      type="button"
      className={className ? `page-backbar__btn ${className}` : 'page-backbar__btn'}
      onClick={handleBack}
    >
      Back
    </button>
  )
}
