// src/App.js
import React, { useState, useEffect } from "react";
import './App.css';
import Spreadsheet from "./Spreadsheet";
import ExcelUploader from "./ExcelUploader";
import QRCode from "react-qr-code";

const { ipcRenderer } = window.require ? window.require('electron') : {};

function App() {
  const [excelData, setExcelData] = useState(null);
  const [showUploader, setShowUploader] = useState(true);
  const [whatsappQR, setWhatsappQR] = useState(null);
  const [whatsappStatus, setWhatsappStatus] = useState('connecting');
  const [whatsappContacts, setWhatsappContacts] = useState([]);

  useEffect(() => {
    if (!ipcRenderer) return;

    // Listen for WhatsApp QR code
    const handleQR = (event, qr) => {
      console.log('📱 QR received in React:', qr);
      setWhatsappQR(qr);
    };

    // Listen for WhatsApp status updates
    const handleStatus = (event, status) => {
      console.log('📱 WhatsApp status:', status);
      setWhatsappStatus(status);
      if (status === 'ready' || status === 'authenticated') {
        setWhatsappQR(null); // Clear QR when authenticated
      }
    };

    // Listen for WhatsApp contacts
    const handleContacts = (event, contacts) => {
      console.log('📱 Contacts received:', contacts.length);
      setWhatsappContacts(contacts);
    };

    // Listen for WhatsApp status message
    const handleStatusMessage = (event, message) => {
      console.log('📱 WhatsApp status message:', message);
    };

    ipcRenderer.on('whatsapp-qr', handleQR);
    ipcRenderer.on('whatsapp-status', handleStatus);
    ipcRenderer.on('whatsapp-contacts', handleContacts);
    ipcRenderer.on('whatsapp-status-message', handleStatusMessage);

    // Cleanup listeners
    return () => {
      ipcRenderer.removeListener('whatsapp-qr', handleQR);
      ipcRenderer.removeListener('whatsapp-status', handleStatus);
      ipcRenderer.removeListener('whatsapp-contacts', handleContacts);
    };
  }, []);

  const handleFileUpload = (uploadedData) => {
    setExcelData(uploadedData);
    setShowUploader(false);
  };

  const handleUploadNew = () => {
    setShowUploader(true);
  };

  // Show QR code if WhatsApp is not authenticated
  if (whatsappQR) {
    return (
      <div className="App">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h1 style={{ color: '#333', marginBottom: '1rem', fontSize: '1.8rem' }}>
              📱 Connect WhatsApp
            </h1>
            <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Scan this QR code with your WhatsApp mobile app to connect:
            </p>
            
            <div style={{
              background: '#f9f9f9',
              padding: '1rem',
              borderRadius: '12px',
              display: 'inline-block'
            }}>
              <QRCode
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={whatsappQR}
                viewBox={`0 0 200 200`}
              />
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ color: '#888', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                Status: <span style={{ 
                  color: whatsappStatus === 'ready' ? '#10b981' : '#f59e0b',
                  fontWeight: 'bold'
                }}>{whatsappStatus}</span>
              </p>
              <p style={{ color: '#888', fontSize: '0.8rem', lineHeight: '1.4' }}>
                1. Open WhatsApp on your phone<br/>
                2. Go to Settings → Linked Devices<br/>
                3. Tap "Link a Device"<br/>
                4. Scan this QR code
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error screen if WhatsApp fails to initialize
  if (whatsappStatus === 'error') {
    return (
      <div className="App">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            color: '#333',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ margin: '0 0 1rem 0', color: '#dc2626' }}>WhatsApp Connection Failed</h2>
            <p style={{ color: '#666', margin: '0 0 1.5rem 0', lineHeight: '1.6' }}>
              Unable to initialize WhatsApp Web. This might be due to:
            </p>
            <ul style={{ textAlign: 'left', color: '#666', margin: '0 0 1.5rem 0', paddingLeft: '1.5rem' }}>
              <li>Browser compatibility issues</li>
              <li>Network connection problems</li>
              <li>System security restrictions</li>
            </ul>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              🔄 Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen while connecting
  if (whatsappStatus === 'connecting') {
    return (
      <div className="App">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            color: '#333'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>Connecting to WhatsApp...</h2>
            <p style={{ color: '#666', margin: 0 }}>Please wait while we initialize WhatsApp Web</p>
          </div>
        </div>
      </div>
    );
  }

  // Show main app when WhatsApp is ready
  return (
    <div className="App">
      {showUploader && (
        <ExcelUploader 
          onFileUpload={handleFileUpload}
          onClose={() => setShowUploader(false)}
        />
      )}
      
      <Spreadsheet 
        data={excelData?.data}
        mergeCells={excelData?.mergeCells}
        fileName={excelData?.fileName}
        onUploadNew={handleUploadNew}
        whatsappContacts={whatsappContacts}
      />
    </div>
  );
}

export default App;
