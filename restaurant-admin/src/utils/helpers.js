import moment from 'moment';

export const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value || 0);
};

export const formatDate = (date, format = 'DD/MM/YYYY HH:mm') => {
    return moment(date).format(format);
};

export const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{4})(\d{3})(\d{3})$/);
    if (match) {
        return `${match[1]}.${match[2]}.${match[3]}`;
    }
    return phone;
};

export const getStatusColor = (status, type = 'order') => {
    const colors = {
        order: {
            pending: 'warning',
            confirmed: 'processing',
            preparing: 'processing',
            ready: 'success',
            served: 'success',
            completed: 'default',
            cancelled: 'error',
            paid: 'success'
        },
        payment: {
            unpaid: 'error',
            paid: 'success',
            partial: 'warning'
        },
        table: {
            available: 'success',
            occupied: 'processing',
            reserved: 'warning',
            cleaning: 'default'
        },
        menu: {
            available: 'success',
            unavailable: 'default',
            sold_out: 'error'
        }
    };
    return colors[type]?.[status] || 'default';
};

export const getStatusText = (status, type = 'order') => {
    const texts = {
        order: {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            preparing: 'Đang chế biến',
            ready: 'Đã sẵn sàng',
            served: 'Đã phục vụ',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy',
            paid: 'Đã thanh toán'
        },
        payment: {
            unpaid: 'Chưa thanh toán',
            paid: 'Đã thanh toán',
            partial: 'Thanh toán một phần'
        },
        table: {
            available: 'Trống',
            occupied: 'Đang phục vụ',
            reserved: 'Đã đặt',
            cleaning: 'Đang dọn'
        },
        menu: {
            available: 'Còn món',
            unavailable: 'Hết món',
            sold_out: 'Tạm hết'
        }
    };
    return texts[type]?.[status] || status;
};

export const calculateOrderTotal = (items) => {
    return items.reduce((sum, item) => {
        const price = item.discount_price || item.price;
        return sum + (price * item.quantity);
    }, 0);
};

export const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${year}${month}${day}${random}`;
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const downloadQR = (qrCode, fileName) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const printQR = (qrCode, tableNumber) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
    <html>
      <head>
        <title>QR Code - Bàn ${tableNumber}</title>
        <style>
          body { display: flex; justify-content: center; align-items: center; height: 100vh; }
          .container { text-align: center; }
          img { max-width: 300px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Bàn ${tableNumber}</h2>
          <img src="${qrCode}" />
          <p>Quét mã QR để xem thực đơn và đặt món</p>
        </div>
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.print();
};