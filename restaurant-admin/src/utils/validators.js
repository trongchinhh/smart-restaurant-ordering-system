export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePhone = (phone) => {
    const re = /^[0-9]{10,11}$/;
    return re.test(phone.replace(/\D/g, ''));
};

export const validatePassword = (password) => {
    return password.length >= 6;
};

export const validateUsername = (username) => {
    const re = /^[a-zA-Z0-9_]{3,50}$/;
    return re.test(username);
};

export const validateTableNumber = (tableNumber) => {
    const re = /^[A-Z0-9]{1,10}$/;
    return re.test(tableNumber);
};

export const validatePrice = (price) => {
    return price >= 0;
};

export const validateQuantity = (quantity) => {
    return quantity >= 1 && quantity <= 999;
};

export const validatePreparationTime = (time) => {
    return time >= 1 && time <= 120;
};