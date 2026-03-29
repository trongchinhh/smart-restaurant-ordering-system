export const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value || 0);
};

export const formatDate = (date) => {
    return new Date(date).toLocaleString('vi-VN');
};