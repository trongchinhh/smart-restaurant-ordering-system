import { useState, useEffect } from 'react';
import { createOrder, getOrder } from '../services/api';

export const useCreateOrder = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = async (orderData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await createOrder(orderData);
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { mutate, loading, error };
};

export const useOrder = (orderId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await getOrder(orderId);
            setData(response);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error };
};