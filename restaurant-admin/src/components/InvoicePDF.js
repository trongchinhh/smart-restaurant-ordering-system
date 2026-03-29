import React from 'react';
import { Page, Document, StyleSheet, View, Text, Image } from '@react-pdf/renderer';
import moment from 'moment';

// Styles for PDF
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 12,
        fontFamily: 'Helvetica'
    },
    header: {
        marginBottom: 20,
        borderBottom: 1,
        borderBottomColor: '#cccccc',
        paddingBottom: 10
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5
    },
    subtitle: {
        fontSize: 12,
        textAlign: 'center',
        color: '#666666',
        marginBottom: 20
    },
    orderInfo: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f5f5f5'
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 5
    },
    infoLabel: {
        width: 100,
        fontWeight: 'bold'
    },
    infoValue: {
        flex: 1
    },
    table: {
        marginTop: 20,
        marginBottom: 20
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        padding: 8,
        fontWeight: 'bold',
        borderBottom: 1,
        borderBottomColor: '#cccccc'
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottom: 1,
        borderBottomColor: '#eeeeee'
    },
    colName: {
        width: '40%'
    },
    colQuantity: {
        width: '15%',
        textAlign: 'center'
    },
    colPrice: {
        width: '20%',
        textAlign: 'right'
    },
    colTotal: {
        width: '25%',
        textAlign: 'right'
    },
    totalSection: {
        marginTop: 20,
        borderTop: 1,
        borderTopColor: '#cccccc',
        paddingTop: 10,
        alignItems: 'flex-end'
    },
    totalRow: {
        flexDirection: 'row',
        marginBottom: 5,
        width: 300
    },
    totalLabel: {
        width: 150,
        textAlign: 'right',
        fontWeight: 'bold'
    },
    totalValue: {
        width: 150,
        textAlign: 'right'
    },
    footer: {
        marginTop: 30,
        textAlign: 'center',
        color: '#999999',
        fontSize: 10
    },
    thankYou: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#52c41a'
    }
});

const InvoicePDF = ({ order }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (date) => {
        return moment(date).format('DD/MM/YYYY HH:mm:ss');
    };

    // Format item options
    const formatItemOptions = (item) => {
        try {
            const options = item.options ? JSON.parse(item.options) : null;
            if (!options) return null;

            const optionsList = [];
            if (options.size) optionsList.push(`Size: ${options.size}`);
            if (options.sugar) optionsList.push(`Đường: ${options.sugar}%`);
            if (options.ice) {
                const iceText = {
                    'none': 'Không đá',
                    'less': 'Ít đá',
                    'normal': 'Đá bình thường',
                    'more': 'Nhiều đá'
                };
                optionsList.push(`Đá: ${iceText[options.ice] || options.ice}`);
            }
            if (options.selectedIngredients && options.selectedIngredients.length > 0) {
                const toppings = options.selectedIngredients.map(ing =>
                    `${ing.name} x${ing.quantity}`
                ).join(', ');
                optionsList.push(`Thêm: ${toppings}`);
            }

            return optionsList.length > 0 ? `(${optionsList.join(', ')})` : null;
        } catch {
            return null;
        }
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>HÓA ĐƠN THANH TOÁN</Text>
                    <Text style={styles.subtitle}>Nhà hàng XYZ - 123 Đường ABC, Quận 1, TP.HCM</Text>
                    <Text style={styles.subtitle}>ĐT: (028) 1234 5678</Text>
                </View>

                {/* Order Information */}
                <View style={styles.orderInfo}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Mã đơn hàng:</Text>
                        <Text style={styles.infoValue}>#{order.order_number}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Bàn:</Text>
                        <Text style={styles.infoValue}>Bàn {order.table?.table_number || 'Takeaway'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Khách hàng:</Text>
                        <Text style={styles.infoValue}>{order.customer_name || 'Khách lẻ'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Số điện thoại:</Text>
                        <Text style={styles.infoValue}>{order.customer_phone || '---'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Số người:</Text>
                        <Text style={styles.infoValue}>{order.customer_count || 1}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Thời gian:</Text>
                        <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
                    </View>
                    {order.note && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Ghi chú:</Text>
                            <Text style={styles.infoValue}>{order.note}</Text>
                        </View>
                    )}
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    {/* Header */}
                    <View style={styles.tableHeader}>
                        <Text style={styles.colName}>Tên món</Text>
                        <Text style={styles.colQuantity}>SL</Text>
                        <Text style={styles.colPrice}>Đơn giá</Text>
                        <Text style={styles.colTotal}>Thành tiền</Text>
                    </View>

                    {/* Items */}
                    {order.items.map((item, index) => {
                        const options = formatItemOptions(item);
                        return (
                            <View key={item.id || index} style={styles.tableRow}>
                                <View style={styles.colName}>
                                    <Text>{item.menuItem?.name}</Text>
                                    {options && (
                                        <Text style={{ fontSize: 9, color: '#666' }}>
                                            {options}
                                        </Text>
                                    )}
                                    {item.note && (
                                        <Text style={{ fontSize: 9, color: '#ff4d4f' }}>
                                            Ghi chú: {item.note}
                                        </Text>
                                    )}
                                </View>
                                <Text style={styles.colQuantity}>{item.quantity}</Text>
                                <Text style={styles.colPrice}>
                                    {formatCurrency(item.unit_price)}
                                </Text>
                                <Text style={styles.colTotal}>
                                    {formatCurrency(item.subtotal)}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Total Section */}
                <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Tạm tính:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(order.subtotal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Thuế (10%):</Text>
                        <Text style={styles.totalValue}>{formatCurrency(order.tax)}</Text>
                    </View>
                    {order.discount > 0 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Giảm giá:</Text>
                            <Text style={styles.totalValue}>{formatCurrency(order.discount)}</Text>
                        </View>
                    )}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Tổng cộng:</Text>
                        <Text style={[styles.totalValue, { fontWeight: 'bold', fontSize: 14 }]}>
                            {formatCurrency(order.total)}
                        </Text>
                    </View>
                </View>

                {/* Payment Info */}
                {order.payment_method && (
                    <View style={[styles.orderInfo, { marginTop: 20 }]}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Phương thức thanh toán:</Text>
                            <Text style={styles.infoValue}>
                                {order.payment_method === 'cash' ? 'Tiền mặt' :
                                    order.payment_method === 'banking' ? 'Chuyển khoản' :
                                        order.payment_method === 'card' ? 'Thẻ ngân hàng' :
                                            order.payment_method === 'qr' ? 'QR Code' : order.payment_method}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Thời gian thanh toán:</Text>
                            <Text style={styles.infoValue}>{formatDate(new Date())}</Text>
                        </View>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Cảm ơn quý khách, hẹn gặp lại!</Text>
                    <Text>Website: www.nhahangxyz.com | Email: contact@nhahangxyz.com</Text>
                </View>
                <Text style={styles.thankYou}>---------------------------</Text>
            </Page>
        </Document>
    );
};

export default InvoicePDF;