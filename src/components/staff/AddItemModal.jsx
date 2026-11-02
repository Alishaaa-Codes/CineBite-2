import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Plus, 
  Sparkles, 
  Scale, 
  Check, 
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { id: 'popcorn', label: 'Popcorn', defaultWeightSpec: true },
  { id: 'snacks', label: 'Snacks', defaultWeightSpec: false },
  { id: 'pizza', label: 'Pizza', defaultWeightSpec: false },
  { id: 'drinks', label: 'Drinks', defaultWeightSpec: false },
  { id: 'combos', label: 'Combos & Sweets', defaultWeightSpec: false }
];

const DEFAULT_CATEGORY_IMAGES = {
  popcorn: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=700&q=80',
  snacks: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=700&q=80',
  pizza: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=700&q=80',
  drinks: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=80',
  combos: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=700&q=80'
};

export default function AddItemModal({ isOpen, onClose, onAddItem }) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('popcorn');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [tag, setTag] = useState('New');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  
  // Portions / Weights specification
  const [hasPortions, setHasPortions] = useState(true);
  const [smallWeight, setSmallWeight] = useState('90g');
  const [smallPrice, setSmallPrice] = useState('');
  const [medWeight, setMedWeight] = useState('150g');
  const [medPrice, setMedPrice] = useState('');
  const [largeWeight, setLargeWeight] = useState('250g');
  const [largePrice, setLargePrice] = useState('');
  const [singlePortionLabel, setSinglePortionLabel] = useState('Standard Serve');

  const [error, setError] = useState('');

  // Handle file picker upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('Image file is too large (max 4MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      setImagePreview(result);
      setImageUrl(result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleCategoryChange = (catId) => {
    setCategoryId(catId);
    if (catId === 'popcorn') {
      setHasPortions(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }

    const basePriceNum = Number(price);
    if (!hasPortions && (!price || isNaN(basePriceNum) || basePriceNum <= 0)) {
      setError('Please enter a valid base price.');
      return;
    }

    if (hasPortions) {
      const sP = Number(smallPrice || basePriceNum * 0.7);
      const mP = Number(medPrice || basePriceNum * 0.9);
      const lP = Number(largePrice || basePriceNum);
      if (isNaN(sP) || isNaN(mP) || isNaN(lP) || sP <= 0 || mP <= 0 || lP <= 0) {
        setError('Please enter valid prices for all portion sizes.');
        return;
      }
    }

    const finalImage = imageUrl || DEFAULT_CATEGORY_IMAGES[categoryId] || DEFAULT_CATEGORY_IMAGES.snacks;

    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      categoryId,
      description: description.trim() || 'Freshly prepared at CineBite cinema kitchen.',
      price: hasPortions ? Number(largePrice || price || 250) : basePriceNum,
      isVeg,
      tag: tag.trim() || undefined,
      portion: hasPortions ? `Large (${largeWeight || '250g'})` : (singlePortionLabel || 'Standard Serve'),
      imageUrl: finalImage,
      hasWeightOptions: hasPortions,
      isOutOfStock: false,
      createdAt: new Date().toISOString()
    };

    if (hasPortions) {
      newItem.weightOptions = [
        {
          id: 'small',
          name: 'Small',
          weight: smallWeight || '90g',
          price: Number(smallPrice || 150),
          description: `Single serve (${smallWeight || '90g'})`
        },
        {
          id: 'medium',
          name: 'Medium',
          weight: medWeight || '150g',
          price: Number(medPrice || 200),
          description: `Standard cinema tub (${medWeight || '150g'})`
        },
        {
          id: 'large',
          name: 'Large',
          weight: largeWeight || '250g',
          price: Number(largePrice || 250),
          description: `Jumbo sharing tub (${largeWeight || '250g'})`
        }
      ];
    }

    onAddItem(newItem);
    onClose();
  };

  const previewSrc = imagePreview || imageUrl || DEFAULT_CATEGORY_IMAGES[categoryId];

  return (
    <div className="kitchen-modal-backdrop" onClick={onClose}>
      <div className="kitchen-modal-card add-item-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="kitchen-modal-header">
          <div className="kitchen-modal-title-box">
            <div className="kitchen-modal-icon-badge">
              <Plus size={20} />
            </div>
            <div>
              <h3>Add New Menu Item</h3>
              <p>Directly publish a new dish to the live customer dining menu</p>
            </div>
          </div>
          <button className="kitchen-modal-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="add-item-form">
          {error && (
            <div className="add-item-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="add-item-grid">
            {/* Left Column: Details */}
            <div className="add-item-col">
              {/* Item Name */}
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Mexican Truffle Nachos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Category & Tag */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select 
                    className="form-select"
                    value={categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Badge Tag (Optional)</label>
                  <select 
                    className="form-select"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  >
                    <option value="">None</option>
                    <option value="New">New</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Chef Special">Chef Special</option>
                    <option value="Spicy 🔥">Spicy 🔥</option>
                    <option value="Classic">Classic</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  rows={2}
                  placeholder="Crispy corn chips smothered in artisanal aged cheddar and jalapenos..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Dietary Specification: Veg / Non-Veg */}
              <div className="form-group">
                <label className="form-label">Dietary Type *</label>
                <div className="diet-toggle-group">
                  <button
                    type="button"
                    className={`diet-btn ${isVeg ? 'active-veg' : ''}`}
                    onClick={() => setIsVeg(true)}
                  >
                    <span className="diet-indicator-square veg">
                      <span className="diet-dot-circle veg" />
                    </span>
                    <span>100% Vegetarian</span>
                  </button>
                  <button
                    type="button"
                    className={`diet-btn ${!isVeg ? 'active-nonveg' : ''}`}
                    onClick={() => setIsVeg(false)}
                  >
                    <span className="diet-indicator-square non-veg">
                      <span className="diet-dot-triangle non-veg" />
                    </span>
                    <span>Non-Vegetarian</span>
                  </button>
                </div>
              </div>

              {/* Base Price (if no portions) */}
              {!hasPortions && (
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 240"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required={!hasPortions}
                  />
                </div>
              )}
            </div>

            {/* Right Column: Image Upload & Portions */}
            <div className="add-item-col">
              {/* Image Upload Box */}
              <div className="form-group">
                <label className="form-label">Food Image</label>
                <div className="image-upload-wrapper">
                  <div className="image-preview-box">
                    <img src={previewSrc} alt="Preview" className="image-preview-thumb" />
                    <label className="image-upload-overlay" htmlFor="item-image-file">
                      <Upload size={18} />
                      <span>Upload Photo</span>
                    </label>
                    <input 
                      id="item-image-file" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input 
                      type="url" 
                      className="form-input image-url-input" 
                      placeholder="Or paste image URL"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview('');
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      Click preview to upload a file from your device, or paste a URL above.
                    </span>
                  </div>
                </div>
              </div>

              {/* Portions Specification Checkbox */}
              <div className="portion-toggle-box">
                <label className="portion-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={hasPortions}
                    onChange={(e) => setHasPortions(e.target.checked)}
                  />
                  <span>
                    <strong>Food involves portions / weights</strong> (Small, Medium, Large)
                  </span>
                </label>
              </div>

              {/* Portions Editor if enabled */}
              {hasPortions ? (
                <div className="portions-editor-card">
                  <div className="portions-editor-header">
                    <Scale size={14} color="#FF9F1C" />
                    <span>Weight & Portion Price Configuration</span>
                  </div>

                  <div className="portion-row">
                    <span className="portion-size-badge size-s">Small</span>
                    <input 
                      type="text" 
                      className="form-input portion-input-weight" 
                      placeholder="Weight (90g)" 
                      value={smallWeight}
                      onChange={(e) => setSmallWeight(e.target.value)}
                    />
                    <span className="rupee-symbol">₹</span>
                    <input 
                      type="number" 
                      className="form-input portion-input-price" 
                      placeholder="Price (180)" 
                      value={smallPrice}
                      onChange={(e) => setSmallPrice(e.target.value)}
                      required={hasPortions}
                    />
                  </div>

                  <div className="portion-row">
                    <span className="portion-size-badge size-m">Medium</span>
                    <input 
                      type="text" 
                      className="form-input portion-input-weight" 
                      placeholder="Weight (150g)" 
                      value={medWeight}
                      onChange={(e) => setMedWeight(e.target.value)}
                    />
                    <span className="rupee-symbol">₹</span>
                    <input 
                      type="number" 
                      className="form-input portion-input-price" 
                      placeholder="Price (230)" 
                      value={medPrice}
                      onChange={(e) => setMedPrice(e.target.value)}
                      required={hasPortions}
                    />
                  </div>

                  <div className="portion-row">
                    <span className="portion-size-badge size-l">Large</span>
                    <input 
                      type="text" 
                      className="form-input portion-input-weight" 
                      placeholder="Weight (250g)" 
                      value={largeWeight}
                      onChange={(e) => setLargeWeight(e.target.value)}
                    />
                    <span className="rupee-symbol">₹</span>
                    <input 
                      type="number" 
                      className="form-input portion-input-price" 
                      placeholder="Price (280)" 
                      value={largePrice}
                      onChange={(e) => setLargePrice(e.target.value)}
                      required={hasPortions}
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="form-label">Portion Label</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Standard Serve, 330ml Can, 2 Pcs"
                    value={singlePortionLabel}
                    onChange={(e) => setSinglePortionLabel(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="kitchen-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-add">
              <Plus size={16} />
              <span>Publish to Customer Menu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
