import React, { useState, useMemo } from 'react';
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Printer, 
  Download, 
  Wifi, 
  Smartphone, 
  Armchair, 
  Film, 
  MapPin, 
  Sparkles,
  Popcorn
} from 'lucide-react';
import { generateQRSvg } from '../lib/qrCode';
import '../styles/qr-scanner.css';

export default function SeatQRModal({ 
  isOpen, 
  onClose, 
  cinemaDetails,
  onUpdateSeat
}) {
  if (!isOpen) return null;

  // 1. Standee Config State
  const [selectedSeat, setSelectedSeat] = useState(cinemaDetails?.seatNumber || 'F-14');
  const [selectedScreen, setSelectedScreen] = useState(
    cinemaDetails?.screenName || 'Screen 2 (Audi 2 - Dolby Atmos)'
  );
  const [theaterName, setTheaterName] = useState(
    cinemaDetails?.theaterName || 'PVR INOX Grand Cinema'
  );

  // 2. Base Host / IP: Default to active Wi-Fi IP (192.168.29.91:5173) if on localhost so phones can reach it
  const [baseHost, setBaseHost] = useState(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Default to known active local Wi-Fi IP so any phone on the network works
        return `http://192.168.29.91:5173`;
      }
      return `${window.location.protocol}//${hostname}${port}`;
    }
    return 'http://192.168.29.91:5173';
  });

  const [copied, setCopied] = useState(false);

  // 3. Generate Target In-Seat Ordering URL
  const targetUrl = useMemo(() => {
    try {
      const url = new URL(baseHost);
      url.searchParams.set('theater', theaterName);
      url.searchParams.set('screen', selectedScreen);
      url.searchParams.set('seat', selectedSeat.toUpperCase());
      url.searchParams.set('from', 'qr');
      return url.toString();
    } catch {
      return `${baseHost}/?theater=${encodeURIComponent(theaterName)}&screen=${encodeURIComponent(selectedScreen)}&seat=${encodeURIComponent(selectedSeat)}&from=qr`;
    }
  }, [baseHost, theaterName, selectedScreen, selectedSeat]);

  // 4. Generate Sharp SVG QR Code
  const qrSvg = useMemo(() => {
    try {
      return generateQRSvg(targetUrl, {
        size: 260,
        margin: 3,
        darkColor: '#000000',
        lightColor: '#FFFFFF'
      });
    } catch (err) {
      console.error('QR Generation failed:', err);
      return '';
    }
  }, [targetUrl]);

  // Copy URL to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = targetUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // Download QR as SVG file
  const handleDownloadSvg = () => {
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CineBite-Seat-${selectedSeat}-QR.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print Standee
  const handlePrint = () => {
    window.print();
  };

  const quickSeats = ['E-12', 'F-14', 'G-08', 'H-10', 'B-04', 'VIP-02'];

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qr-modal-header">
          <div className="qr-modal-header-title">
            <QrCode size={22} color="#E50914" />
            <h2>
              Cine<span>Bite</span> In-Seat Cinema QR Generator
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="qr-modal-header-badge">
              <Wifi size={12} />
              <span>Universal Phone Access</span>
            </div>

            <button 
              className="qr-modal-close-btn" 
              onClick={onClose}
              title="Close Scanner Modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="qr-modal-grid">
          {/* Left: The Physical Armrest Standee Card */}
          <div className="qr-standee-container">
            <div className="cinema-armrest-card">
              {/* Standee Header */}
              <div className="standee-header-ribbon">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Popcorn size={18} color="#E50914" />
                  <h3 className="standee-brand-name">
                    Cine<span>Bite</span>
                  </h3>
                </div>
                <span className="standee-subtitle">In-Seat Cinema Dining</span>
              </div>

              {/* Seat & Audi Display */}
              <div className="standee-seat-badge">
                <div className="standee-audi-label">
                  {selectedScreen.split('(')[0].trim()}
                </div>
                <div className="standee-seat-code">
                  SEAT {selectedSeat.toUpperCase()}
                </div>
              </div>

              {/* The Scannable QR Frame */}
              <div className="standee-qr-frame">
                <div 
                  className="standee-qr-svg-wrapper"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
                <div className="standee-qr-center-logo">
                  <Popcorn size={16} />
                </div>
              </div>

              {/* Standee Footer */}
              <div className="standee-footer-instructions">
                <span className="standee-scan-prompt">
                  Scan to Order In-Seat
                </span>
                <span className="standee-scan-subprompt">
                  Open your Phone Camera • No App Needed
                  <br />
                  Delivered directly to this seat during the movie
                </span>
              </div>
            </div>
          </div>

          {/* Right: Customization Controls & Testing Instructions */}
          <div className="qr-controls-container">
            {/* Network Guide */}
            <div className="qr-network-guide">
              <Smartphone size={20} color="#FF9F1C" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div className="qr-network-guide-text">
                <strong>How customers scan this in the theatre:</strong>
                <br />
                Point any smartphone camera (iPhone Camera app, Android Google Lens / Samsung Camera) at this QR code. It opens the CineBite dining menu directly on their phone with Seat <strong>{selectedSeat.toUpperCase()}</strong> pre-filled!
              </div>
            </div>

            {/* Target Seat & Audi Form */}
            <div className="qr-section-box">
              <span className="qr-section-label">
                <Armchair size={13} color="#E50914" />
                Select Cinema Seat & Screen
              </span>

              <div className="qr-seat-selection-grid">
                <div className="qr-input-group">
                  <label>Seat Number</label>
                  <input
                    type="text"
                    className="qr-form-input"
                    value={selectedSeat}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setSelectedSeat(val);
                      if (onUpdateSeat) onUpdateSeat(val);
                    }}
                    placeholder="e.g. F-14"
                  />
                </div>

                <div className="qr-input-group">
                  <label>Auditorium / Screen</label>
                  <select
                    className="qr-form-select"
                    value={selectedScreen}
                    onChange={(e) => setSelectedScreen(e.target.value)}
                  >
                    {cinemaDetails?.screensAvailable?.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    )) || (
                      <>
                        <option value="Screen 1 (IMAX Laser)">Screen 1 (IMAX Laser)</option>
                        <option value="Screen 2 (Audi 2 - Dolby Atmos)">Screen 2 (Audi 2 - Dolby Atmos)</option>
                        <option value="Screen 3 (Gold Class VIP)">Screen 3 (Gold Class VIP)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Quick Seat Chips */}
              <div className="qr-quick-seats-row">
                <span style={{ fontSize: '0.72rem', color: '#A0A5B5', alignSelf: 'center' }}>
                  Quick seats:
                </span>
                {quickSeats.map((qs) => (
                  <button
                    key={qs}
                    type="button"
                    className={`qr-seat-chip-btn ${selectedSeat === qs ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSeat(qs);
                      if (onUpdateSeat) onUpdateSeat(qs);
                    }}
                  >
                    {qs}
                  </button>
                ))}
              </div>
            </div>

            {/* Network Host / QR URL */}
            <div className="qr-section-box">
              <span className="qr-section-label">
                <Wifi size={13} color="#4ADE80" />
                Network Target URL (Accessible on Phones)
              </span>

              <div className="qr-url-row">
                <input
                  type="text"
                  className="qr-url-input"
                  value={targetUrl}
                  readOnly
                />
                <button 
                  className={`qr-btn-action ${copied ? 'copied' : ''}`} 
                  onClick={handleCopy}
                  title="Copy direct link"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="qr-btn-action"
                  title="Test link in browser"
                >
                  <ExternalLink size={14} />
                  <span>Test</span>
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: '#A0A5B5' }}>Base IP / Host:</span>
                <input
                  type="text"
                  value={baseHost}
                  onChange={(e) => setBaseHost(e.target.value)}
                  placeholder="e.g. http://192.168.29.91:5173"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    color: '#FF9F1C',
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    flex: 1
                  }}
                />
              </div>
            </div>

            {/* Step-by-Step Test Instructions */}
            <div className="qr-test-steps">
              <h4>📱 Test Right Now From Your Phone:</h4>
              <ol>
                <li>Ensure your phone is connected to the same Wi-Fi (<strong>192.168.29.x</strong>).</li>
                <li>Open your phone's camera app and point it at the QR code on the left.</li>
                <li>Tap the yellow/red link popup to open the CineBite dining menu directly on your phone!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="qr-modal-footer">
          <button className="qr-btn-action" onClick={handleDownloadSvg}>
            <Download size={14} />
            <span>Download QR SVG</span>
          </button>

          <button className="qr-btn-action" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Seat Standee</span>
          </button>

          <button className="qr-btn-primary" onClick={onClose}>
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
