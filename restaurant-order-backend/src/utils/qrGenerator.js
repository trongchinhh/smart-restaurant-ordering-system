const QRCode = require('qrcode');

const generateQR = async (text) => {
    try {
        const options = {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        };

        const qrCode = await QRCode.toDataURL(text, options);
        return qrCode;
    } catch (err) {
        console.error('Error generating QR code:', err);
        throw err;
    }
};

const generateTableQR = (tableId, baseUrl) => {
    const url = `${baseUrl}/menu?table=${tableId}`;
    return generateQR(url);
};

module.exports = {
    generateQR,
    generateTableQR
};