import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createNotification } from '../../service/admin/api.admin.notification';
import { useToast } from '../../context/ToastContext';
import './SendNotificationModal.css';

/**
 * Reusable modal for sending notifications to users from admin pages.
 * 
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   userId: number - target user ID
 *   defaultTitle?: string - pre-filled title
 *   defaultMessage?: string - pre-filled message
 *   defaultType?: string - notification type
 *   defaultLink?: string - link to include
 *   userName?: string - display name for context
 */
export default function SendNotificationModal({ 
  isOpen, 
  onClose, 
  userId, 
  defaultTitle = '', 
  defaultMessage = '', 
  defaultType = 'info',
  defaultLink = '',
  userName = ''
}) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: defaultTitle,
    message: defaultMessage,
    type: defaultType,
    link: defaultLink
  });
  const [sending, setSending] = useState(false);

  // Reset form when modal opens with new defaults
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        title: defaultTitle,
        message: defaultMessage,
        type: defaultType,
        link: defaultLink
      });
    }
  }, [isOpen, defaultTitle, defaultMessage, defaultType, defaultLink]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.warning('Title and message are required');
      return;
    }

    setSending(true);
    try {
      const result = await createNotification({
        userId,
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type || undefined,
        link: formData.link.trim() || undefined
      });
      
      if (result.success !== false) {
        toast.success('Notification sent successfully');
        onClose();
      } else {
        toast.error(result.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px'}}>
        <div className="admin-modal-header">
          <h3>Send Notification {userName && <span style={{fontWeight: 400, fontSize: '0.9rem', color: '#64748b'}}>to {userName}</span>}</h3>
          <button className="admin-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            {/* <div className="notify-form-field">
              <label>User ID</label>
              <input type="text" value={userId} disabled className="notify-input" />
            </div> */}

            <div className="notify-form-field">
              <label>Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="notify-input"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="order">Order</option>
                <option value="listing">Listing</option>
                <option value="report">Report</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="notify-form-field">
              <label>Title <span style={{color: '#ef4444'}}>*</span></label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Notification title..."
                className="notify-input"
                required
              />
            </div>

            <div className="notify-form-field">
              <label>Message <span style={{color: '#ef4444'}}>*</span></label>
              <textarea 
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Notification message..."
                className="notify-textarea"
                rows={4}
                required
              />
            </div>

            <div className="notify-form-field">
              <label>Link (optional)</label>
              <input 
                type="text" 
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                placeholder="/orders/123 or https://..."
                className="notify-input"
              />
            </div>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose} disabled={sending}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={sending}>
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
