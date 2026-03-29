import React from 'react';
import MenuItemCard from './MenuItemCard';
import './MenuGrid.scss';

const MenuGrid = ({ items, onItemClick, onAddToCart, page,
    setPage,
    pagination }) => {
    // Kiểm tra items có tồn tại và là mảng không
    if (!items || !Array.isArray(items) || items.length === 0) {
        return (
            <div className="empty-menu">
                <p>Không có món ăn nào</p>
            </div>
        );
    }

    return (
        <>
            <div className="menu-grid">
                {items.map(item => (
                    <MenuItemCard
                        key={item?.id || Math.random()}
                        item={item}
                        onClick={onItemClick}
                        onAddToCart={onAddToCart}
                    />
                ))}
            </div>
            {pagination?.pages > 1 && (
                <div className="pagination">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)}>←</button>

                    {[...Array(pagination.pages)].map((_, i) => (
                        <button
                            key={i}
                            className={page === i + 1 ? 'active' : ''}
                            onClick={() => setPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        disabled={page >= pagination.pages}
                        onClick={() => setPage(page + 1)}
                    >
                        →
                    </button>
                </div>
            )}
        </>
    );
};

export default MenuGrid;