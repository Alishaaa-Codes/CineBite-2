import React from 'react';
import { 
  Sparkles, 
  Popcorn, 
  Cookie, 
  Pizza, 
  CupSoda, 
  Package 
} from 'lucide-react';

const ICON_MAP = {
  Sparkles: Sparkles,
  Popcorn: Popcorn,
  Cookie: Cookie,
  Pizza: Pizza,
  CupSoda: CupSoda,
  Package: Package
};

export default function CategoryNav({ categories, selectedCategory, onSelectCategory }) {
  return (
    <nav className="category-nav-wrapper" aria-label="Food Categories">
      <div className="category-scroll-container">
        {categories.map((cat) => {
          const IconComponent = ICON_MAP[cat.icon] || Sparkles;
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              className={`category-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <IconComponent size={16} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
