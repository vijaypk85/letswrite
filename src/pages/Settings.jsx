import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function Settings() {
  usePageTitle('Settings')
  const { user, profile, updateDisplayName, deleteAccount } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState(null)

  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  async function handleSaveName(e) {
    e.preventDefault()
    setNameError(null)
    if (!displayName.trim()) {
      setNameError('Display name cannot be empty.')
      return
    }
    setSaving(true)
    try {
      await updateDisplayName(displayName)
      showToast('Display name updated.')
    } catch (err) {
      console.error(err)
      setNameError('Could not update your display name. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteError(null)
    if (confirmText !== 'DELETE') {
      setDeleteError('Type DELETE in the box to confirm.')
      return
    }

    setDeleting(true)
    try {
      await deleteAccount()
      showToast('Your account has been deleted.')
      navigate('/')
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/popup-closed-by-user') {
        setDeleteError('The confirmation popup was closed, so your account was not deleted.')
      } else {
        setDeleteError(
          'Could not delete your account. Please try again, or reach out from the Contact page.'
        )
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <p className="hero-line">your account</p>
        <h1 className="page-title">Settings</h1>

        <div className="info-block">
          <h2 className="section-heading">Display name</h2>
          <p>
            This is the name shown on any story or comment you publish from now on. Changing it
            won't update the author name on anything you've already published.
          </p>
          <form className="settings-form" onSubmit={handleSaveName}>
            <input
              className="settings-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={60}
            />
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save name'}
            </button>
          </form>
          {nameError && <p className="error-text">{nameError}</p>}
        </div>

        <div className="info-block danger-zone">
          <h2 className="section-heading danger-heading">Delete account</h2>
          <p>
            This permanently deletes your account and every story you've published. Comments
            you've left on other people's stories aren't automatically removed — reach out from
            the Contact page if you'd like those cleared too. This can't be undone, and Google
            will ask you to confirm your sign-in again before it happens.
          </p>
          <input
            className="settings-input"
            type="text"
            placeholder='Type "DELETE" to confirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <button
            className="btn btn-danger-solid"
            onClick={handleDeleteAccount}
            disabled={deleting || confirmText !== 'DELETE'}
          >
            {deleting ? 'Deleting…' : 'Delete my account'}
          </button>
          {deleteError && <p className="error-text">{deleteError}</p>}
        </div>
      </div>
    </div>
  )
}
