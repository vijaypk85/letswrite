import { useToast } from '../context/ToastContext.jsx'

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => dismissToast(t.id)}
          role="status"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
