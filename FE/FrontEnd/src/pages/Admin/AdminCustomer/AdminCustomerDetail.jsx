import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2, Check, X, Bell } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { fetchCustomerById, updateCustomerById, deleteCustomerById } from '../../../service/admin/api.customer';
import { useToast } from '../../../context/ToastContext';
import SendNotificationModal from '../../../components/Admin/SendNotificationModal';
import './admin-customers.css';

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomerById(id);
      setCustomer(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');
  const formatTime = (d) => (d ? new Date(d).toLocaleString('vi-VN') : 'Never');

  const getStatusBadgeClass = (s) => (s === 'Active' ? 'badge-success' : s === 'Deleted' ? 'badge-danger' : 'badge-secondary');
  const getRoleBadgeClass = (r) => (r === 'Admin' ? 'badge-danger' : r === 'Manager' ? 'badge-warning' : r === 'User' ? 'badge-info' : 'badge-secondary');

  const startEditing = () => {
    const profile = customer.profile || {};
    let birthday = '';
    const rawBirthday = profile.birthday || customer.birthday;
    if (rawBirthday) {
      birthday = new Date(rawBirthday).toISOString().split('T')[0];
    }
    setEditForm({
      email: customer.email || '',
      phone: customer.phone || '',
      fullName: profile.fullName || customer.fullName || '',
      birthday,
      gender: profile.gender || customer.gender || '',
      address: profile.address || customer.address || '',
      bio: profile.bio || customer.bio || '',
      avatarUrl: profile.avatarUrl || customer.avatarUrl || '',
      status: customer.status,
      role: customer.role,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      if (!editForm.email || !editForm.phone) {
        toast.error('Email and Phone are required');
        return;
      }
      const updateData = {
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        status: editForm.status,
        fullName: editForm.fullName.trim(),
        birthday: editForm.birthday || '',
        gender: editForm.gender || '',
        address: editForm.address.trim(),
        bio: editForm.bio.trim(),
        avatarUrl: editForm.avatarUrl.trim(),
      };
      await updateCustomerById(customer.userId, updateData);
      toast.success('Customer updated successfully');
      setEditing(false);
      await loadCustomer();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update customer';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await deleteCustomerById(customer.userId);
      toast.success('Customer deleted');
      navigate('/admin/customers');
    } catch (err) {
      toast.error('Failed to delete customer');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-customers-page">
          <div className="admin-loading">Loading customer details...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="admin-customers-page">
          <div className="admin-empty-state"><p>Customer not found</p></div>
        </div>
      </AdminLayout>
    );
  }

  const profile = customer.profile || {};

  return (
    <AdminLayout>
      <div className="admin-customers-page">
        {/* Header */}
        <div className="admin-page-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/customers')}
              style={{padding: '6px 10px'}}>
              <ArrowLeft size={18} />
            </button>
          </div>
          <div style={{display: 'flex', gap: '8px'}}>
            {!editing ? (
              <>
                <button className="admin-btn admin-btn-primary" onClick={startEditing}>
                  <Edit2 size={16} /> Edit
                </button>
                <button className="admin-btn admin-btn-secondary" onClick={() => setNotifyModalOpen(true)}>
                  <Bell size={16} /> Notify
                </button>
                <button className="admin-btn admin-btn-secondary" style={{color: '#ef4444'}} onClick={handleDelete}>
                  <Trash2 size={16} /> Delete
                </button>
              </>
            ) : (
              <>
                <button className="admin-btn admin-btn-primary" onClick={handleSave}>
                  <Check size={16} /> Save
                </button>
                <button className="admin-btn admin-btn-secondary" onClick={() => setEditing(false)}>
                  <X size={16} /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', marginTop: '20px'}}>
          {/* Left: Avatar + Quick Info */}
          <div className="admin-card" style={{padding: '20px', textAlign: 'center'}}>
            <img
              src={profile.avatarUrl || 'https://via.placeholder.com/120'}
              alt="avatar"
              style={{width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e2e8f0', margin: '0 auto'}}
              onError={(e) => e.target.src = 'https://via.placeholder.com/120'}
            />
            <h3 style={{marginTop: '12px', fontSize: '1rem'}}>{profile.fullName || customer.fullName || 'N/A'}</h3>
            <p style={{color: '#64748b', fontSize: '0.85rem'}}>{customer.email}</p>
            <div style={{marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center'}}>
              <span className={`admin-badge ${getRoleBadgeClass(customer.role)}`}>{customer.role}</span>
              <span className={`admin-badge ${getStatusBadgeClass(customer.status)}`}>{customer.status}</span>
            </div>
            <div style={{marginTop: '16px', textAlign: 'left', fontSize: '0.85rem', color: '#475569'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9'}}>
                <span>Joined</span>
                <span>{formatDate(customer.createdAt)}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9'}}>
                <span>Last Login</span>
                <span>{formatTime(customer.lastLoginAt)}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9'}}>
                <span>Email Verified</span>
                <span style={{color: customer.emailVerified ? '#22c55e' : '#ef4444'}}>{customer.emailVerified ? '✓ Yes' : '✗ No'}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '6px 0'}}>
                <span>Phone Verified</span>
                <span style={{color: customer.phoneVerified ? '#22c55e' : '#ef4444'}}>{customer.phoneVerified ? '✓ Yes' : '✗ No'}</span>
              </div>
            </div>
          </div>

          {/* Right: Editable fields */}
          <div className="admin-card" style={{padding: '20px'}}>
            <h3 style={{marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600}}>
              {editing ? 'Edit Customer' : 'Customer Information'}
            </h3>

            {editing ? (
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px'}}>
                <FormField label="Email" value={editForm.email} onChange={(v) => setEditForm({...editForm, email: v})} type="email" />
                <FormField label="Phone" value={editForm.phone} onChange={(v) => setEditForm({...editForm, phone: v})} type="tel" />
                <FormField label="Full Name" value={editForm.fullName} onChange={(v) => setEditForm({...editForm, fullName: v})} />
                <FormField label="Birthday" value={editForm.birthday} onChange={(v) => setEditForm({...editForm, birthday: v})} type="date" />
                <div>
                  <label style={{display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '4px'}}>Gender</label>
                  <select value={editForm.gender} onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                    className="admin-input" style={{width: '100%'}}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <FormField label="Address" value={editForm.address} onChange={(v) => setEditForm({...editForm, address: v})} />
                <div style={{gridColumn: '1 / -1'}}>
                  <label style={{display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '4px'}}>Bio</label>
                  <textarea value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    className="admin-input" rows={3} style={{width: '100%', resize: 'vertical'}} />
                </div>
                <FormField label="Avatar URL" value={editForm.avatarUrl} onChange={(v) => setEditForm({...editForm, avatarUrl: v})} type="url" />
                <div />
                <div>
                  <label style={{display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '4px'}}>Role</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="admin-input" style={{width: '100%'}}>
                    <option value="User">User</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '4px'}}>Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="admin-input" style={{width: '100%'}}>
                    <option value="Active">Active</option>
                    <option value="Deleted">Deleted</option>
                  </select>
                </div>
              </div>
            ) : (
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px'}}>
                <InfoRow label="Email" value={customer.email} />
                <InfoRow label="Phone" value={customer.phone} />
                <InfoRow label="Full Name" value={profile.fullName || customer.fullName || 'N/A'} />
                <InfoRow label="Birthday" value={profile.birthday ? formatDate(profile.birthday) : 'N/A'} />
                <InfoRow label="Gender" value={profile.gender || 'N/A'} />
                <InfoRow label="Address" value={profile.address || 'N/A'} />
                <div style={{gridColumn: '1 / -1'}}>
                  <InfoRow label="Bio" value={profile.bio || 'N/A'} />
                </div>
                <InfoRow label="Avatar URL" value={profile.avatarUrl || 'N/A'} />
              </div>
            )}
          </div>
        </div>
      </div>

      <SendNotificationModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        userId={customer.userId}
        userName={profile.fullName || customer.fullName || customer.email}
        defaultType="system"
      />
    </AdminLayout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span style={{display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, marginBottom: '2px'}}>{label}</span>
      <span style={{fontSize: '0.9rem', color: '#1e293b', wordBreak: 'break-all'}}>{value}</span>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={{display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '4px'}}>{label}</label>
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)}
        className="admin-input" style={{width: '100%'}} />
    </div>
  );
}
