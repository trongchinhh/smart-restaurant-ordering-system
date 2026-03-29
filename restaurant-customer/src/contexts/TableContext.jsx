import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import cartService from '../services/cart';
import { getTableInfo } from '../services/api';

// Export context
export const TableContext = createContext();

// Export hook
export const useTable = () => {
    const context = useContext(TableContext);
    if (!context) {
        throw new Error('useTable must be used within TableProvider');
    }
    return context;
};

export const TableProvider = ({ children }) => {
    const [searchParams] = useSearchParams();
    const [tableId, setTableId] = useState(null);
    const [tableInfo, setTableInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const idFromUrl = searchParams.get('table');
        const savedId = cartService.getTableId();

        const id = idFromUrl || savedId;

        if (id) {
            setTableId(id);
            cartService.setTableId(id);
            fetchTableInfo(id);
        } else {
            setError('Không tìm thấy thông tin bàn');
            setLoading(false);
        }
    }, [searchParams]);

    const fetchTableInfo = async (id) => {
        try {
            setLoading(true);
            const response = await getTableInfo(id);
            setTableInfo(response.data);
            setError(null);
        } catch (err) {
            setError('Không thể tải thông tin bàn');
        } finally {
            setLoading(false);
        }
    };

    const value = {
        tableId,
        tableInfo,
        loading,
        error
    };

    return (
        <TableContext.Provider value={value}>
            {children}
        </TableContext.Provider>
    );
};