import React, { useState, useEffect } from 'react';
import { X, ChevronRight, AlertCircle, Film, MapPin, Armchair, Check } from 'lucide-react';
import feastBg from '../assets/images/cinema-feast-bg.png';
import '../styles/netflix-modal.css';

export const CINEMA_SEAT_REGEX = /^(?:[A-Z]{1,2}|VIP|BOX|BALC|BALCONY|RECLINER|SOFA)[- ]?[0-9]{1,3}$/i;

export function formatCinemaSeat(seatInput) {
  if (!seatInput) return '';
  const trimmed = seatInput.trim().toUpperCase();
  const match = trimmed.match(/^([A-Z]{1,2}|VIP|BOX|BALC|BALCONY|RECLINER|SOFA)[- ]?([0-9]{1,3})$/i);
  if (match) {
    return `${match[1].toUpperCase()}-${match[2]}`;
  }
  return trimmed;
}

export default function SeatModal({ 
  isOpen, 
  onClose, 
  cinemaDetails, 
  onSave
}) {
  if (!isOpen) return null;

  const [theater, setTheater] = useState(cinemaDetails.theaterName || 'PVR INOX Grand Cinema');
  const [screen, setScreen] = useState(cinemaDetails.screenName || 'Screen 2 (Audi 2 - Dolby Atmos)');
  const [seat, setSeat] = useState(cinemaDetails.seatNumber || '');
  const [errorMsg, setErrorMsg] = useState('');

  const isFromQR = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('from') === 'qr' ||
    Boolean(new URLSearchParams(window.location.search).get('seat'))
  );

  // Sync state if cinemaDetails change
  useEffect(() => {
    if (cinemaDetails) {
      setTheater(cinemaDetails.theaterName || 'PVR INOX Grand Cinema');
      setScreen(cinemaDetails.screenName || 'Screen 2 (Audi 2 - Dolby Atmos)');
      setSeat(cinemaDetails.seatNumber || '');
    }
  }, [cinemaDetails]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!theater.trim()) {
      setErrorMsg('Please enter your cinema / theatre name.');
      return;
    }
    if (!screen.trim()) {
      setErrorMsg('Please select a cinema screen/auditorium.');
      return;
    }

    const trimmedSeat = seat.trim().toUpperCase();
    if (!trimmedSeat) {
      setErrorMsg('Please enter your seat number (e.g., F-14, A-08, VIP-02).');
      return;
    }

    if (!CINEMA_SEAT_REGEX.test(trimmedSeat)) {
      setErrorMsg('Invalid seat format. Please enter a valid cinema seat number (e.g. F-14, A-08, VIP-02). Arbitrary text or names like "F-alisha" are not permitted.');
      return;
    }

    const formattedSeat = formatCinemaSeat(trimmedSeat);

    setErrorMsg('');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cinebite_seat_confirmed', 'true');
    }
    onSave({
      ...cinemaDetails,
      theaterName: theater.trim(),
      screenName: screen.trim(),
      seatNumber: formattedSeat
    });
    onClose();
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cinebite_seat_confirmed', 'true');
    }
    onClose();
  };

  return (
    <div className="netflix-modal-backdrop" onClick={onClose}>
      {/* 1. Cinematic Feast Image Background */}
      <div 
        className="netflix-bg-feast-image" 
        style={{ backgroundImage: `url(${feastBg})` }}
      />

      {/* 2. Dark Vignette & Atmospheric Glow Overlay */}
      <div className="netflix-vignette-overlay" />

      {/* 3. Foreground Container */}
      <div className="netflix-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Top Bar */}
        <header className="netflix-top-bar">
          <div className="netflix-brand-logo" onClick={handleSkip}>
            CINEBITE<span>™</span>
          </div>

          <div className="netflix-top-actions">
            <div className="netflix-lang-pill">
              <MapPin size={14} color="#E50914" />
              <span>In-Seat Dining</span>
            </div>

            <button 
              type="button" 
              className="netflix-close-btn"
              onClick={handleSkip}
              title="Close and explore menu"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Center Hero Content */}
        <main className="netflix-hero-center">
          {isFromQR && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(34, 197, 94, 0.16)',
              border: '1px solid rgba(34, 197, 94, 0.45)',
              color: '#4ADE80',
              padding: '5px 14px',
              borderRadius: '100px',
              fontSize: '0.8rem',
              fontWeight: 800,
              marginBottom: '1rem',
              boxShadow: '0 0 15px rgba(34, 197, 94, 0.25)'
            }}>
              <Check size={14} strokeWidth={3} />
              <span>Verified In-Seat QR Scan{seat ? ` • Seat ${seat}` : ''}</span>
            </div>
          )}

          <h1 className="netflix-hero-headline">
            Unlimited snacks, drinks, and more
          </h1>

          <p className="netflix-hero-prompt">
            {isFromQR 
              ? (seat ? `Seat ${seat} ready for in-seat delivery. Confirm to explore the food menu!` : 'In-seat delivery ready. Confirm your details to explore the food menu!')
              : 'Ready to order? Confirm your theatre & seat details to explore the menu.'}
          </p>

          {/* Interactive Form Card */}
          <form className="netflix-form-card" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="netflix-error-banner">
                <AlertCircle size={18} color="#E50914" style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="netflix-form-grid">
              <div className="netflix-input-box">
                <label className="netflix-input-label">
                  <MapPin size={13} color="#E50914" />
                  Theatre Name
                </label>
                <input
                  type="text"
                  className="netflix-text-input"
                  value={theater}
                  onChange={(e) => {
                    setTheater(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="e.g. PVR INOX Grand Cinema"
                  required
                />
              </div>

              <div className="netflix-input-box">
                <label className="netflix-input-label">
                  <Film size={13} color="#E50914" />
                  Screen / Audi
                </label>
                <select
                  className="netflix-select-input"
                  value={screen}
                  onChange={(e) => {
                    setScreen(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                >
                  {cinemaDetails.screensAvailable?.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
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

            {/* Seat Number & Order In-Seat Button (Pixel-Perfect Alignment) */}
            <div className="netflix-cta-group">
              <label className="netflix-input-label">
                <Armchair size={13} color="#E50914" />
                Seat Number
              </label>

              <div className="netflix-seat-action-row">
                <input
                  type="text"
                  className="netflix-text-input"
                  value={seat}
                  onChange={(e) => {
                    setSeat(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Enter seat (e.g. F-14 or A-08)"
                  required
                  autoFocus
                />

                <button type="submit" className="netflix-btn-get-started">
                  <span>Order In-Seat</span>
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>
              </div>

              <span className="netflix-input-hint">
                Format: Row Letter + Number (e.g. F-14, A-08, VIP-02)
              </span>
            </div>
          </form>
        </main>

        {/* 4. Netflix Signature Red Curved Bottom Divider */}
        <div className="netflix-curve-wrapper">
          <div className="netflix-curve-divider" />
        </div>
      </div>
    </div>
  );
}
