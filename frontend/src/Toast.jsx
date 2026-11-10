import { useEffect } from 'react'

// Message flottant en bas de l'écran : visible quel que soit l'endroit où l'on a cliqué.
// onClose reçoit la fonction setState du parent (stable), appelée avec '' pour effacer.
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => onClose(''), type === 'error' ? 6000 : 4000)
    return () => clearTimeout(timer)
  }, [message, type, onClose])

  if (!message) return null

  return (
    <div className="toast-area">
      <div className={`toast toast-${type}`} role={type === 'error' ? 'alert' : 'status'}>
        <span>{message}</span>
        <button type="button" className="toast-close" aria-label="Fermer le message" onClick={() => onClose('')}>
          ×
        </button>
      </div>
    </div>
  )
}

export default Toast
