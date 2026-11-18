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
  Popcorn,
  Building2
} from 'lucide-react';
import { generateQRSvg } from '../lib/qrCode';
import { getAllCinemas, resolveCinema } from '../data/cinemaRegistry';
import '../styles/qr-scanner.css';

export default function SeatQRModal({ 
  isOpen, 
  onClose, 
  cinemaDetails,
  onUpdateSeat
}) {
  if (!isOpen) return null;

  const cinemas = useMemo(() => getAllCinemas(), []);

  // 1. Selected Cinema State
  const [selectedCinemaSlug, setSelectedCinemaSlug] = useState(() => {
    return cinemaDetails?.theatreSlug || resolveCinema(cinemaDetails?.theaterName || cinemaDetails?.theatreId)?.slug || 'pvr-grand';
  });

  const selectedCinema = useMemo(() => {
    return resolveCinema(selectedCinemaSlug);
  }, [selectedCinemaSlug, cinemas]);

  // 2. Standee Config State
  const [selectedSeat, setSelectedSeat] = useState(cinemaDetails?.seatNumber || 'F-14');
  const [selectedScreen, setSelectedScreen] = useState(() => {
    return cinemaDetails?.screenName || selectedCinema?.defaultScreen || 'Screen 2 (Audi 2 - Dolby Atmos)';
  });

  // 3. Base Host / IP: Default to live Vercel production domain
  const [baseHost, setBaseHost] = useState(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'https://cine-bite-2-jo85.vercel.app';
      }
      return `${window.location.protocol}//${hostname}${port}`;
    }
    return 'https://cine-bite-2-jo85.vercel.app';
  });

  const [copied, setCopied] = useState(false);

  // 4. Generate Target In-Seat Ordering URL
  const targetUrl = useMemo(() => {
    try {
      const url = new URL(baseHost);
      url.searchParams.set('cinema', selectedCinema.slug);
      url.searchParams.set('theatre', selectedCinema.name);
      url.searchParams.set('screen', selectedScreen);
      url.searchParams.set('seat', selectedSeat.toUpperCase());
      url.searchParams.set('from', 'qr');
      return url.toString();
    } catch {
      return `${baseHost}/?cinema=${encodeURIComponent(selectedCinema.slug)}&theatre=${encodeURIComponent(selectedCinema.name)}&screen=${encodeURIComponent(selectedScreen)}&seat=${encodeURIComponent(selectedSeat)}&from=qr`;
    }
  }, [baseHost, selectedCinema, selectedScreen, selectedSeat]);

  // 5. Generate Sharp SVG QR Code
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

  // Handle cinema change
  const handleCinemaChange = (newSlug) => {
    setSelectedCinemaSlug(newSlug);
    const newCinema = resolveCinema(newSlug);
    if (newCinema) {
      const defaultSc = newCinema.defaultScreen || (typeof newCinema.screens?.[0] === 'string' ? newCinema.screens[0] : newCinema.screens?.[0]?.name);
      if (defaultSc) setSelectedScreen(defaultSc);
    }
  };

  // Copy URL to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
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
    a.download = `CineBite-${selectedCinema.slug}-Seat-${selectedSeat}-QR.svg`;
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
              Cine<span>Bite</span> Cinema QR Standee Generator
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
                  <Popcorn size={18} color={selectedCinema.brandColor || '#E50914'} />
                  <h3 className="standee-brand-name">
                    Cine<span>Bite</span>
                  </h3>
                </div>
                <span className="standee-subtitle">{selectedCinema.name}</span>
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
                  Delivered to this seat at <strong>{selectedCinema.name}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Customization Controls & Testing Instructions */}
          <div className="qr-controls-container">
            {/* Cinema Selection & Network Guide */}
            <div className="qr-network-guide">
              <Smartphone size={20} color="#FF9F1C" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div className="qr-network-guide-text">
                <strong>Multi-Cinema QR Routing:</strong>
                <br />
                Scanning this QR code links customer phones directly to <strong>{selectedCinema.name}</strong> ({selectedCinema.city}). All orders go straight to this cinema's kitchen portal!
              </div>
            </div>

            {/* Target Cinema, Seat & Audi Form */}
            <div className="qr-section-box">
              <span className="qr-section-label">
                <Building2 size={13} color="#FF9F1C" />
                Select Cinema / Theatre
              </span>

              <div style={{ marginBottom: '12px' }}>
                <select
                  className="qr-form-select"
                  value={selectedCinemaSlug}
                  onChange={(e) => handleCinemaChange(e.target.value)}
                  style={{ width: '100%', fontWeight: 700 }}
                >
                  {cinemas.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

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
                    {selectedCinema.screens?.map((s) => {
                      const screenVal = typeof s === 'string' ? s : s.name;
                      return (
                        <option key={screenVal} value={screenVal}>{screenVal}</option>
                      );
                    })}
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

            {/* Generated Destination URL Bar */}
            <div className="qr-section-box">
              <span className="qr-section-label">
                <Sparkles size={13} color="#FFB703" />
                Encoded QR Destination Link
              </span>

              <div className="qr-url-box">
                <input 
                  type="text" 
                  readOnly 
                  value={targetUrl} 
                  className="qr-url-input"
                  title="Target in-seat ordering URL"
                />
                <button 
                  type="button" 
                  onClick={handleCopy} 
                  className="qr-copy-btn"
                  title="Copy link to clipboard"
                >
                  {copied ? <Check size={14} color="#4ADE80" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* Quick Open in New Tab Button */}
              <div style={{ marginTop: '8px' }}>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="qr-open-link-btn"
                >
                  <ExternalLink size={13} />
                  <span>Test Mobile Menu for {selectedCinema.name} in New Tab</span>
                </a>
              </div>
            </div>

            {/* Action Buttons: Print Standee & Download SVG */}
            <div className="qr-action-buttons-row">
              <button 
                type="button" 
                className="qr-print-btn"
                onClick={handlePrint}
                title="Print physical armrest standee card"
              >
                <Printer size={15} />
                <span>Print Standee</span>
              </button>

              <button 
                type="button" 
                className="qr-download-btn"
                onClick={handleDownloadSvg}
                title="Download scalable SVG QR code for graphic design"
              >
                <Download size={15} />
                <span>Download SVG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
