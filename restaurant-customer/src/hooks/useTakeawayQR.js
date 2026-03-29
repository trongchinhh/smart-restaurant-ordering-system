import { useState, useEffect } from 'react';
import { validateTakeawayQR, createTakeawayOrder } from '../services/api';

export const useTakeawayQR = (code) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (code) {
            validateQR();
        }
    }, [code]);

    const validateQR = async () => {
        try {
            setLoading(true);
            const response = await validateTakeawayQR(code);
            setData(response.data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Mã QR không hợp lệ');
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error };
};

export const useCreateTakeawayOrder = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = async (code, orderData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await createTakeawayOrder(code, orderData);
            return response;
        } catch (err) {
            setError(err.message || 'Đặt món thất bại');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { mutate, loading, error };
};