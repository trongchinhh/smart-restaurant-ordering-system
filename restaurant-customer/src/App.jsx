import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { TableProvider } from './contexts/TableContext';
import AppRoutes from './AppRoutes';
import './assets/styles/global.scss';

function App() {
    return (
        <BrowserRouter>
            <TableProvider>
                <CartProvider>
                    <AppRoutes />
                </CartProvider>
            </TableProvider>
        </BrowserRouter>
    );
}

export default App;