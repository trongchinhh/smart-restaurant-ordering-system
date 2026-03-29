import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useCart } from '../../hooks/useCart';
import './Layout.scss';

const Layout = ({ children, title, showBack = false, onOpenFilter, hasFilter, onSearchClick, showFooter = true }) => {
    const { itemCount } = useCart();
    return (
        <div className={`customer-layout ${itemCount > 0 ? 'has-cart' : ''}`}>
            <Header
                title={title}
                showBack={showBack}
                onOpenFilter={onOpenFilter}
                hasFilter={hasFilter}
                onSearchClick={onSearchClick} // 👈 thêm
            />
            <main className="main-content">
                {children}
            </main>
            {showFooter && <Footer />}
        </div>
    );
};

export default Layout;