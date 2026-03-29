import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from 'antd-mobile';
import { LeftOutlined } from '@ant-design/icons';
import { SearchOutline, ShopbagOutline, FilterOutline, AppOutline } from 'antd-mobile-icons';

import { useCart } from '../../hooks/useCart';
// import { useTable } from '../../hooks/useTable';
import CartDrawer from '../cart/CartDrawer';
import './Header.scss';

const Header = ({ title = "Thực đơn", showBack = false, onOpenFilter, hasFilter, onSearchClick }) => {
    const navigate = useNavigate();
    const { itemCount } = useCart();
    // const { tableInfo } = useTable();

    const [cartVisible, setCartVisible] = useState(false);

    return (
        <>
            <div className="customer-header">

                {/* LEFT */}
                <div className="header-left">

                    {showBack && (
                        <LeftOutlined
                            className="back-btn"
                            onClick={() => navigate(-1)}
                        />
                    )}

                    <div className="logo">
                        🍽
                    </div>

                    <div className="header-title">
                        {title}
                    </div>

                </div>


                {/* RIGHT */}
                <div className="header-right">

                    <div className="header-icon" onClick={() => onSearchClick && onSearchClick()}>
                        <SearchOutline fontSize={22} />
                    </div>
                    <Badge content={hasFilter ? '!' : null}>
                        <div
                            className="header-icon"
                            onClick={() => onOpenFilter && onOpenFilter()}
                        >
                            <FilterOutline fontSize={22} />
                        </div>
                    </Badge>
                    <Badge content={itemCount}>
                        <div
                            className="header-icon"
                            onClick={() => setCartVisible(true)}
                        >
                            <ShopbagOutline fontSize={22} />
                        </div>
                    </Badge>

                </div>

            </div>

            <CartDrawer
                visible={cartVisible}
                onClose={() => setCartVisible(false)}
            />
        </>
    );
};

export default Header;