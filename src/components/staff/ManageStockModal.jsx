import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  PackageX, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Filter
} from 'lucide-react';

export default function ManageStockModal({ 
  isOpen, 
  onClose, 
  menuItems = [], 
  onToggleStock 
}) {
  if (!isOpen) return null;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(menuItems.map(i => i.categoryId).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [menuItems]);

  // Filtered items
  const filtered = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.categoryId === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        item.description?.toLowerCase().includes(q) ||
        item.categoryId?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, search]);

  const outOfStockCount = menuItems.filter(i => i.isOutOfStock).length;

  return (
    <div className="kitchen-modal-backdrop" onClick={onClose}>
      <div className="kitchen-modal-card stock-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="kitchen-modal-header">
          <div className="kitchen-modal-title-box">
            <div className="kitchen-modal-icon-badge stock-badge">
              <PackageX size={20} />
            </div>
            <div>
              <h3>Item Availability & Stock Control</h3>
              <p>Items marked Out of Stock are immediately locked and shown as Sold Out on customer phones</p>
            </div>
          </div>
          <button className="kitchen-modal-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Stock Status Bar */}
        <div className="stock-summary-bar">
          <div className="stock-summary-stat">
            <span className="stock-summary-num">{menuItems.length}</span>
            <span className="stock-summary-lbl">Total Menu Items</span>
          </div>
          <div className="stock-summary-divider" />
          <div className="stock-summary-stat">
            <span className="stock-summary-num in-stock">{menuItems.length - outOfStockCount}</span>
            <span className="stock-summary-lbl">In Stock (Active)</span>
          </div>
          <div className="stock-summary-divider" />
          <div className="stock-summary-stat">
            <span className="stock-summary-num out-stock">{outOfStockCount}</span>
            <span className="stock-summary-lbl">Out of Stock</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="stock-controls-row">
          <div className="stock-search-box">
            <Search size={15} color="var(--text-muted)" />
            <input 
              type="text" 
              className="stock-search-input"
              placeholder="Search dishes to toggle stock..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="stock-category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`stock-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Items List */}
        <div className="stock-items-scroll">
          {filtered.length === 0 ? (
            <div className="stock-empty-state">
              <AlertCircle size={28} />
              <p>No food items match your filter.</p>
            </div>
          ) : (
            <div className="stock-items-grid">
              {filtered.map((item) => {
                const isOut = Boolean(item.isOutOfStock);
                return (
                  <div key={item.id} className={`stock-item-row ${isOut ? 'is-out' : 'is-in'}`}>
                    <div className="stock-item-media">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className={`stock-item-thumb ${isOut ? 'grayscale' : ''}`} 
                      />
                      <span className={`stock-status-pill ${isOut ? 'out' : 'in'}`}>
                        {isOut ? 'OUT OF STOCK' : 'IN STOCK'}
                      </span>
                    </div>

                    <div className="stock-item-info">
                      <div className="stock-item-name-row">
                        <span className={`diet-indicator-square ${item.isVeg ? 'veg' : 'non-veg'}`}>
                          <span className={item.isVeg ? 'diet-dot-circle veg' : 'diet-dot-triangle non-veg'} />
                        </span>
                        <h4 className="stock-item-name">{item.name}</h4>
                      </div>
                      <div className="stock-item-meta">
                        <span className="stock-item-cat">{item.categoryId}</span>
                        <span>•</span>
                        <span className="stock-item-price">₹{item.price}</span>
                        {item.portion && (
                          <>
                            <span>•</span>
                            <span className="stock-item-portion">{item.portion}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Quick Toggle Button */}
                    <div className="stock-item-action">
                      <button
                        type="button"
                        className={`stock-toggle-btn ${isOut ? 'btn-restock' : 'btn-mark-out'}`}
                        onClick={() => onToggleStock(item.id)}
                        title={isOut ? 'Make available to customers again' : 'Mark as Out of Stock for customers'}
                      >
                        {isOut ? (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Mark In Stock</span>
                          </>
                        ) : (
                          <>
                            <PackageX size={14} />
                            <span>Mark Out of Stock</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="kitchen-modal-actions" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Changes sync instantly to all connected customer dining phones.
          </span>
          <button type="button" className="btn-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
