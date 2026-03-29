import { useState, useEffect } from 'react';
import { getCategories, getMenuItems } from '../services/api';

export const useCategories = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await getCategories();
            setData(response);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error };
};

export const useMenu = (categoryId, searchQuery, discount, bestseller, page, minPrice, maxPrice, sortPrice) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMenu();
    }, [categoryId, searchQuery, discount, bestseller, page, minPrice, maxPrice, sortPrice]);

    const fetchMenu = async () => {
        try {
            setLoading(true);
            const params = {};
            if (categoryId) params.category_id = categoryId;
            if (searchQuery) params.search = searchQuery;
            if (discount) {
                params.discount = true;
            }
            if (bestseller) {
                params.bestseller = true;
            }
            if (minPrice) params.min_price = minPrice;
            if (maxPrice) params.max_price = maxPrice;
            if (sortPrice) params.sort_price = sortPrice; // 👈 THÊM
            params.page = page;
            params.limit = 10; // 👈 luôn 10 món
            const response = await getMenuItems(params);
            setData(response);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error };
};