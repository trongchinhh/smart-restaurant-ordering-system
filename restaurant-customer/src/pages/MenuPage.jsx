import React, { useState, useEffect, useRef } from 'react';
import { useTable } from '../contexts/TableContext';
import Layout from '../components/layout/Layout';
import CategoryTabs from '../components/menu/CategoryTabs';
import MenuGrid from '../components/menu/MenuGrid';
import MenuItemDetail from '../components/menu/MenuItemDetail';
import Loading from '../components/common/Loading';
import { useCategories, useMenu } from '../hooks/useMenu';
import { useCart } from '../hooks/useCart';
import './MenuPage.scss';
import { Popup } from 'antd-mobile';
const MenuPage = () => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [page, setPage] = useState(1);
    const { tableInfo, loading: tableLoading } = useTable();
    const { data: categoriesData, loading: categoriesLoading } = useCategories();
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortPrice, setSortPrice] = useState('');
    const searchRef = useRef(null);
    const [isSearching, setIsSearching] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);
    const categoryId =
        selectedCategory !== 'discount' && selectedCategory !== 'bestseller'
            ? selectedCategory
            : null;

    const discount = selectedCategory === 'discount';

    const bestseller = selectedCategory === 'bestseller';
    console.log('check page')
    const { data: menuData, loading: menuLoading } =
        useMenu(categoryId, searchQuery, discount, bestseller, page, minPrice, maxPrice, sortPrice);
    useEffect(() => {
        setPage(1);
    }, [selectedCategory, searchQuery, minPrice, maxPrice]);
    const { addToCart } = useCart();

    const categories = categoriesData?.data || [];
    const menuItems = menuData?.data || [];

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setDetailVisible(true);
    };

    const handleAddToCart = (item, quantity, note) => {
        addToCart(item);
        setDetailVisible(false);
    };
    const handleApplyFilter = () => {
        setFilterVisible(false); // đóng popup
    };
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };
    const formatNumber = (value) => {
        if (!value) return '';
        return Number(value).toLocaleString('vi-VN');
    };
    const handleFocusSearch = () => {
        setIsSearching(true);

        setTimeout(() => {
            searchRef.current?.focus();
            searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    if (tableLoading || categoriesLoading) {
        return <Loading fullScreen text="Đang tải thông tin bàn..." />;
    }

    return (
        <Layout title={tableInfo?.table_number ? `Bàn ${tableInfo.table_number}` : 'Thực đơn'}
            hasFilter={!!(minPrice || maxPrice || sortPrice)}
            onOpenFilter={() => setFilterVisible(true)}
            onSearchClick={handleFocusSearch}
        >

            <div className="menu-page">

                {/* SEARCH */}
                {isSearching && (
                    <div className="search-section">

                        <div className="search-box">

                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="🔍 Tìm món ăn..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.target.blur();
                                    }
                                }}
                                className="search-input"
                            />

                            {/* ❌ NÚT CLEAR / CLOSE */}
                            <div
                                className="clear-btn"
                                onClick={() => {
                                    if (searchQuery) {
                                        setSearchQuery(''); // 👉 có text → xóa
                                    } else {
                                        setIsSearching(false); // 👉 không có → đóng
                                    }
                                }}
                            >
                                ✕
                            </div>

                        </div>

                    </div>
                )}
                {(minPrice || maxPrice) && (
                    <div className="active-filter">
                        <span>
                            💰 {formatPrice(minPrice) || 0} - {formatPrice(maxPrice) || '∞'}
                        </span>

                        <button
                            onClick={() => {
                                setMinPrice('');
                                setMaxPrice('');
                                setSortPrice('');
                            }}
                        >
                            ✕
                        </button>
                    </div>
                )}
                {sortPrice && (
                    <div className="active-filter">
                        <span>
                            🔽 {sortPrice === 'asc' ? 'Giá thấp → cao' : 'Giá cao → thấp'}
                        </span>

                        <button onClick={() => setSortPrice('')}>
                            ✕
                        </button>
                    </div>
                )}
                <Popup
                    visible={filterVisible}
                    onMaskClick={() => setFilterVisible(false)}
                    position="bottom"
                    bodyStyle={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}
                >
                    <div className="filter-popup">

                        <h3>Lọc theo giá</h3>

                        <div className="filter-inputs">
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                enterKeyHint="next"
                                placeholder="Giá từ"
                                value={formatNumber(minPrice)}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, '');
                                    setMinPrice(raw);
                                }}

                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        document.getElementById('maxPriceInput')?.focus();
                                    }
                                }}
                            />
                            <input
                                id="maxPriceInput"
                                pattern="[0-9]*"
                                type="text"
                                inputMode="numeric"
                                placeholder="Đến"
                                enterKeyHint="done"
                                value={formatNumber(maxPrice)}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, '');
                                    setMaxPrice(raw);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.target.blur(); // tắt bàn phím
                                        handleApplyFilter(); // 🔥 áp dụng luôn
                                    }
                                }}
                            />
                        </div>

                        <h3 className='sort'>Sắp xếp</h3>

                        <div className="sort-options">

                            <button
                                className={sortPrice === 'asc' ? 'active' : ''}
                                onClick={() => setSortPrice('asc')}
                            >
                                Giá thấp → cao
                            </button>

                            <button
                                className={sortPrice === 'desc' ? 'active' : ''}
                                onClick={() => setSortPrice('desc')}
                            >
                                Giá cao → thấp
                            </button>
                        </div>
                        <div className="filter-actions">
                            <button
                                className="btn-clear"
                                onClick={() => {
                                    setMinPrice('');
                                    setMaxPrice('');
                                    setSortPrice('');
                                }}
                            >
                                Xóa lọc
                            </button>

                            <button
                                className="btn-apply"
                                onClick={handleApplyFilter}
                            >
                                Áp dụng
                            </button>
                        </div>

                    </div>
                </Popup>

                {/* CATEGORY */}
                <CategoryTabs
                    categories={categories}
                    activeCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                />

                {/* MENU LIST */}
                <div className="menu-list">
                    {menuLoading ? (
                        <Loading text="Đang tải thực đơn..." />
                    ) : (
                        <MenuGrid
                            items={menuItems}
                            onItemClick={handleItemClick}
                            page={page}
                            setPage={setPage}
                            pagination={menuData?.pagination}
                        />
                    )}
                </div>

                <MenuItemDetail
                    visible={detailVisible}
                    item={selectedItem}
                    onClose={() => {
                        setDetailVisible(false);
                        setSelectedItem(null);
                    }}
                    onAddToCart={handleAddToCart}
                />

            </div>

        </Layout>
    );
};

export default MenuPage;