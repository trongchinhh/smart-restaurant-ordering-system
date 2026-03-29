import React from 'react';
import './CategoryTabs.scss';

const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
    return (
        <div className="category-tabs">
            <div className="tabs-container">

                {/* ALL */}
                <button
                    className={`tab-item ${!activeCategory ? 'active' : ''}`}
                    onClick={() => onCategoryChange(null)}
                >
                    Tất cả
                </button>
                {/* RECOMMENDED */}
                <button
                    className={`tab-item ${activeCategory === 'bestseller' ? 'active' : ''}`}
                    onClick={() => onCategoryChange('bestseller')}
                >
                    🔥 Bán chạy
                </button>
                {/* DISCOUNT */}
                <button
                    className={`tab-item ${activeCategory === 'discount' ? 'active' : ''}`}
                    onClick={() => onCategoryChange('discount')}
                >
                    🔥 Giảm giá
                </button>

                {/* CATEGORY */}
                {categories.map(category => (
                    <button
                        key={category.id}
                        className={`tab-item ${activeCategory === category.id ? 'active' : ''}`}
                        onClick={() => onCategoryChange(category.id)}
                    >
                        {category.name}
                    </button>
                ))}

            </div>
        </div>
    );
};

export default CategoryTabs;