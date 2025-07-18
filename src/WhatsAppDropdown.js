import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const WhatsAppDropdown = ({ contacts, position, onSend, onClose }) => {
  const [filter, setFilter] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const container = useRef(document.createElement('div'));

  useEffect(() => {
    const portalRoot = document.body;
    const el = container.current;
    portalRoot.appendChild(el);
    return () => portalRoot.removeChild(el);
  }, []);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(filter.toLowerCase()) ||
    contact.number.includes(filter)
  );

  const handleSend = async () => {
    if (!selectedContact) return;
    
    setIsSending(true);
    try {
      await onSend(selectedContact);
      onClose();
    } catch (error) {
      console.error('Error sending:', error);
    } finally {
      setIsSending(false);
    }
  };

  const dropdownStyle = {
    position: 'absolute',
    top: position.top + 'px',
    left: position.left + 'px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    padding: '12px',
    zIndex: 1000,
    minWidth: '280px',
    maxWidth: '350px',
  };

  return createPortal(
    <div style={dropdownStyle} onMouseDown={(e) => e.stopPropagation()}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '8px'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: '600',
          color: '#1f2937'
        }}>
          📱 Send to WhatsApp
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search contacts..."
        autoFocus
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '2px solid #e5e7eb',
          borderRadius: '6px',
          fontSize: '14px',
          outline: 'none',
          marginBottom: '12px',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s ease'
        }}
        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
      />

      {/* Selected Contact Display */}
      {selectedContact && (
        <div style={{
          background: '#f0f9ff',
          border: '2px solid #3b82f6',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Profile Picture */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            background: selectedContact.profilePicUrl ? 'transparent' : '#bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            {selectedContact.profilePicUrl ? (
              <img
                src={selectedContact.profilePicUrl}
                alt={selectedContact.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '👤';
                  e.target.parentElement.style.color = '#3730a3';
                }}
              />
            ) : (
              <span style={{ color: '#3730a3' }}>👤</span>
            )}
          </div>

          {/* Contact Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '500', color: '#1e40af' }}>
              ✓ Selected: {selectedContact.name}
            </div>
            <div style={{ fontSize: '12px', color: '#3730a3' }}>
              +{selectedContact.number}
            </div>
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div style={{
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        marginBottom: '12px'
      }}>
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: selectedContact?.id === contact.id ? '#eff6ff' : 'white',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseOver={(e) => {
                if (selectedContact?.id !== contact.id) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseOut={(e) => {
                if (selectedContact?.id !== contact.id) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {/* Profile Picture */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                background: contact.profilePicUrl ? 'transparent' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                {contact.profilePicUrl ? (
                  <img
                    src={contact.profilePicUrl}
                    alt={contact.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '👤';
                      e.target.parentElement.style.color = '#6b7280';
                    }}
                  />
                ) : (
                  <span style={{ color: '#6b7280' }}>👤</span>
                )}
              </div>

              {/* Contact Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: '500', 
                  fontSize: '14px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {contact.name}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  +{contact.number}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            No contacts found
          </div>
        )}
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!selectedContact || isSending}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: selectedContact && !isSending 
            ? 'linear-gradient(135deg, #10b981, #059669)' 
            : '#d1d5db',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: selectedContact && !isSending ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        {isSending ? (
          <>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid transparent',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Sending...
          </>
        ) : (
          <>
            📤 Send PDF to WhatsApp
          </>
        )}
      </button>

      {/* Add CSS animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    container.current
  );
};

export default WhatsAppDropdown; 