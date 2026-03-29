import html2pdf from 'html2pdf.js';

// ================= EXPORT PDF =================
export const exportInvoiceToPDF = async (order) => {
    try {
        const invoiceHTML = generateInvoiceHTML(order);

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        iframe.contentDocument.open();
        iframe.contentDocument.write(invoiceHTML);
        iframe.contentDocument.close();

        await new Promise(resolve => setTimeout(resolve, 500));

        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `HoaDon_${order.order_number}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4' }
        };

        await html2pdf().set(opt).from(iframe.contentDocument.body).save();

        document.body.removeChild(iframe);
    } catch (err) {
        console.error(err);
    }
};

// ================= HTML =================
const generateInvoiceHTML = (order) => {

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);

    const formatDate = (date) =>
        new Date(date).toLocaleString('vi-VN');

    // 🔥 PAYMENT STATUS
    const getPaymentStatus = (status) => {
        const map = {
            unpaid: { text: 'Chưa thanh toán', color: '#ff4d4f' },
            paid: { text: 'Đã thanh toán', color: '#52c41a' },
            partial: { text: 'Thanh toán 1 phần', color: '#faad14' }
        };
        return map[status] || { text: status, color: '#999' };
    };

    // 🔥 QR CODE


    // 🔥 OPTIONS (ORDER TYPE + SIZE + ...)
    const formatItemOptions = (item) => {
        try {
            const options = typeof item.options === 'string'
                ? JSON.parse(item.options)
                : item.options;

            if (!options) return '';

            const list = [];

            if (options.order_type) {
                const map = {
                    dine_in: '🍽 Ăn tại quán',
                    takeaway: '🛍 Mang về'
                };
                list.push(`<span class="order-type">${map[options.order_type]}</span>`);
            }

            if (options.size) {
                list.push(`Size: ${options.size.toUpperCase()}`);
            }

            if (options.sugar) {
                list.push(`Đường: ${options.sugar}%`);
            }

            if (options.ice) {
                list.push(`Đá: ${options.ice}`);
            }

            if (options.selectedIngredients?.length) {
                const toppings = options.selectedIngredients
                    .map(i => `${i.name} x${i.quantity}`)
                    .join(', ');
                list.push(`Thêm: ${toppings}`);
            }

            return `<div class="item-options">${list.join(' • ')}</div>`;
        } catch {
            return '';
        }
    };

    const paymentStatus = getPaymentStatus(order.payment_status || 'unpaid');

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { font-family: Arial; padding:20px; background:#f5f5f5;}
.container { background:white; padding:20px; border-radius:10px;}
.header { text-align:center; margin-bottom:20px;}
.title { font-size:22px; font-weight:bold;}
.status { font-weight:bold;}

.table { width:100%; border-collapse:collapse;}
.table th, .table td { padding:10px; border-bottom:1px solid #eee;}
.text-right { text-align:right;}
.totals {
    margin-top: 20px;
    border-top: 1px dashed #ddd;
    padding-top: 10px;
}

.row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 13px;
}

.total-final {
    margin-top: 10px;
    font-weight: bold;
    font-size: 16px;
    color: green;
}
.item-options { font-size:11px; color:#666; margin-top:4px;}
.order-type { font-weight:600; color:#1890ff;}

.qr { text-align:center; margin-top:20px;}
.qr img { width:140px; }

.total { text-align:right; margin-top:20px; font-weight:bold;}
</style>
</head>

<body>
<div class="container">

<div class="header">
    <div class="title">Nhà Hàng ChiLin</div>
    <div>HÓA ĐƠN</div>
</div>

<div>
    <b>Mã đơn:</b> #${order.order_number} <br/>
    <b>Thời gian:</b> ${formatDate(order.createdAt)} <br/>
    <b>Trạng thái:</b> 
    <span class="status" style="color:${paymentStatus.color}">
        ${paymentStatus.text}
    </span>
</div>

<table class="table">
<thead>
<tr>
<th>Món</th>
<th class="text-right">SL</th>
<th class="text-right">Giá</th>
<th class="text-right">TT</th>
</tr>
</thead>

<tbody>
${order.items.map(item => `
<tr>
<td>
    <div>${item.menuItem?.name || item.name}</div>
    ${formatItemOptions(item)}
</td>
<td class="text-right">${item.quantity}</td>
<td class="text-right">${formatCurrency(item.unit_price)}</td>
<td class="text-right">${formatCurrency(item.subtotal)}</td>
</tr>
`).join('')}
</tbody>
</table>

<div class="totals">
    <div class="row">
        <span>Tạm tính:</span>
        <span>${formatCurrency(order.subtotal)}</span>
    </div>

    <div class="row">
        <span>VAT (10%):</span>
        <span>${formatCurrency(order.tax || order.subtotal * 0.1)}</span>
    </div>

  

    <div class="row total-final">
        <span>Tổng cộng:</span>
        <span>${formatCurrency(order.total)}</span>
    </div>
</div>



</div>
</body>
</html>
`;
};