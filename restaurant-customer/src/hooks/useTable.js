import { useContext } from 'react';
import { TableContext } from '../contexts/TableContext';

export const useTable = () => {
    const context = useContext(TableContext);
    if (!context) {
        throw new Error('useTable must be used within TableProvider');
    }
    return context;
};