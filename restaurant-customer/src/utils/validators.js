export const validatePhone = (phone) => {
    const re = /^[0-9]{10,11}$/;
    return re.test(phone.replace(/\D/g, ''));
};

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validateName = (name) => {
    return name && name.trim().length >= 2;
};

export const validateQuantity = (quantity) => {
    return quantity >= 1 && quantity <= 99;
};

export const validateNote = (note) => {
    return !note || note.length <= 200;
};