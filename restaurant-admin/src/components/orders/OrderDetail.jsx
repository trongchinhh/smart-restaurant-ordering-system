import React, { useState, useEffect } from 'react';
import ConfirmItemsModal from './ConfirmItemsModal';
import socket from '../../services/socket';
import { exportInvoiceToPDF } from '../../services/invoiceService';
import {
    Descriptions, Table, Tag, Space, Button,
    Timeline, Card, Row, Col, Statistic, Modal,
    message, Badge
} from 'antd';
import {
    PrinterOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../../services/api';
import PaymentModal from './PaymentModal';
import moment from 'moment';
import './OrderDetail.scss';


const OrderDetail = ({ orderId, onClose, onEdit }) => {
    const [paymentVisible, setPaymentVisible] = useState(false);
    const [confirmItemsVisible, setConfirmItemsVisible] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery(
        ['order', orderId],
        () => apiService.getOrder(orderId).then(res => res.data),
        {
            onError: (error) => {
                message.error('Không thể tải thông tin đơn hàng');
            }
        }
    );
    // Thêm các hàm này vào trong component OrderDetail
    const getPaymentStatusColor = (status) => {
        const colors = {
            unpaid: 'error',
            paid: 'success',
            partial: 'warning'
        };
        return colors[status] || 'default';
    };
    const handlePrintInvoice = async () => {
        try {
            message.loading({ content: 'Đang tạo hóa đơn...', key: 'printing' });
            await exportInvoiceToPDF(order);
            message.success({ content: 'Xuất hóa đơn thành công!', key: 'printing' });
        } catch (error) {
            console.error('Print error:', error);
            message.error({ content: 'Xuất hóa đơn thất bại!', key: 'printing' });
        }
    };
    const getPaymentStatusText = (status) => {
        const texts = {
            unpaid: 'Chưa thanh toán',
            paid: 'Đã thanh toán',
            partial: 'Thanh toán một phần'
        };
        return texts[status] || status;
    };
    const updateStatusMutation = useMutation(
        ({ id, status }) => apiService.updateOrderStatus(id, status),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['order', orderId]);
                queryClient.invalidateQueries('orders');
                message.success('Cập nhật trạng thái thành công');
            },
            onError: (error) => {
                message.error(error.response?.data?.message || 'Cập nhật thất bại');
            }
        }
    );

    const order = data?.data;
    const newItems = order?.items?.map(item => {
        try {
            return {
                ...item,
                options: item.options ? JSON.parse(item.options) : null
            };
        } catch {
            return item;
        }
    }).filter(item => item?.is_new) || [];
    const confirmItemMutation = useMutation(
        ({ orderId, itemId }) =>
            apiService.updateOrderItemStatus(orderId, itemId, 'preparing'),
        {
            onSuccess: () => {
                message.success('Đã xác nhận món mới');
                queryClient.invalidateQueries(['order', orderId]);
                queryClient.invalidateQueries('orders');
            },
            onError: () => {
                message.error('Xác nhận thất bại');
            }
        }
    );
    const cancelItemMutation = useMutation(
        ({ orderId, itemId }) => apiService.deleteOrderItem(orderId, itemId),
        {
            onSuccess: () => {
                message.success('Đã hủy món');
                queryClient.invalidateQueries(['order', orderId]);
                queryClient.invalidateQueries('orders');
            },
            onError: () => {
                message.error('Hủy món thất bại');
            }
        }
    );


    const handleCancelItem = (itemId) => {
        cancelItemMutation.mutate({ orderId, itemId });
    };
    const handleConfirmItem = (itemId) => {
        confirmItemMutation.mutate(
            { orderId, itemId }
            // 👇 XÓA phần onSuccess vì backend đã xử lý
        );
    };
    useEffect(() => {
        const handleAddItems = (data) => {
            if (Number(data?.orderId) === Number(orderId)) {
                message.warning(`🚨 Bàn ${data.tableNumber} vừa gọi thêm món!`);
                queryClient.invalidateQueries(['order', orderId]);
            }
            queryClient.invalidateQueries('orders');
        };

        const handleKitchenOrderUpdated = (data) => {
            if (Number(data?.orderId) === Number(orderId)) {
                queryClient.invalidateQueries(['order', orderId]);
            }
            queryClient.invalidateQueries('orders');
        };

        socket.on('kitchen-add-items', handleAddItems);
        socket.on('kitchen-order-updated', handleKitchenOrderUpdated);
        socket.on('order-status-updated', handleKitchenOrderUpdated);

        return () => {
            socket.off('kitchen-add-items', handleAddItems);
            socket.off('kitchen-order-updated', handleKitchenOrderUpdated);
            socket.off('order-status-updated', handleKitchenOrderUpdated);
        };
    }, [orderId, queryClient]);
    // const toppingsList = order.items.flatMap(item => {
    //     try {
    //         const options = item.options ? JSON.parse(item.options) : null;
    //         const ingredients = options?.selectedIngredients || [];

    //         return ingredients.map(ing => ({
    //             name: ing.name,
    //             quantity: ing.quantity * item.quantity,
    //             price: ing.price,
    //             total: ing.total * item.quantity
    //         }));
    //     } catch {
    //         return [];
    //     }
    // });
    if (!order || isLoading) {
        return <div className="loading">Đang tải...</div>;
    }
    const hasNewItems = order?.items?.some(item => item.is_new) || false;
    const isCancelled = order.status === 'cancelled';
    const isPaid = order.payment_status === 'paid';
    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            confirmed: 'processing',
            preparing: 'processing',
            ready: 'success',
            served: 'success',
            completed: 'default',
            cancelled: 'error',
            paid: 'success'
        };
        return colors[status] || 'default';
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            preparing: 'Đang chế biến',
            ready: 'Đã sẵn sàng',
            served: 'Đã phục vụ',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy',
            paid: 'Đã thanh toán'
        };
        return texts[status] || status;
    };

    const itemColumns = [
        {
            title: 'Món ăn',
            dataIndex: ['menuItem', 'name'],
            key: 'name',
            render: (text, record) => {

                const options = record.options ? JSON.parse(record.options) : null;
                const ingredients = options?.selectedIngredients || [];



                return (
                    <div className="menu-item-cell">
                        <div className="menu-name">{text}  {record.is_new && !isCancelled && (
                            <Tag color="red" style={{ marginLeft: 8 }}>
                                MỚI
                            </Tag>
                        )}</div>

                        {ingredients.length > 0 && (
                            <div className="topping-list">
                                {ingredients.map((ing, index) => (
                                    <div key={index} className="topping-item">
                                        <span className="topping-name">
                                            + {ing.name} x{ing.quantity}
                                        </span>

                                        <span className="topping-price">
                                            {ing.total.toLocaleString()} đ
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}


                    </div>
                );
            }
        },

        {
            title: 'Size',
            dataIndex: ['menuItem', 'name'],
            key: 'name',
            render: (text, record) => {

                const options = record.options
                    ? JSON.parse(record.options)
                    : null;
                return (
                    <Space direction="vertical" size={0}>


                        {options?.size && (
                            <Tag color="blue">
                                {options.size}
                            </Tag>
                        )}


                    </Space>
                );
            }
        },
        {
            title: 'Đơn giá',
            dataIndex: 'unit_price',
            key: 'unit_price',
            render: (price) => new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(price)
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity'
        },
        // {
        //     title: 'Giảm giá',
        //     dataIndex: 'discount',
        //     key: 'discount',
        //     render: (discount) => discount ? new Intl.NumberFormat('vi-VN', {
        //         style: 'currency',
        //         currency: 'VND'
        //     }).format(discount) : '-'
        // },
        {
            title: 'Thành tiền',
            dataIndex: 'subtotal',
            key: 'subtotal',
            render: (subtotal) => <strong>{new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(subtotal)}</strong>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors = {
                    pending: 'warning',
                    preparing: 'processing',
                    ready: 'success',
                    served: 'success',
                    cancelled: 'error'
                };
                const texts = {
                    pending: 'Chờ CB',
                    preparing: 'Đang CB',
                    ready: 'Đã CB',
                    served: 'Đã phục vụ',
                    cancelled: 'Đã hủy'
                };
                if (isCancelled) {
                    return <Tag color="error">{texts.cancelled}</Tag>;
                }
                if (isPaid) {
                    return <Tag color={colors['served'] || 'default'}>{texts['served']}</Tag>;
                }
                return <Tag color={colors[status] || 'default'}>{texts[status]}</Tag>;
            }
        },

    ];

    const handleStatusUpdate = (status) => {
        Modal.confirm({
            title: 'Xác nhận',
            content: `Bạn có chắc chắn muốn chuyển trạng thái đơn hàng sang "${getStatusText(status)}"?`,
            onOk: () => updateStatusMutation.mutate({ id: orderId, status })
        });
    };

    const statusActions = () => {
        const actions = [];

        if (order.status === 'pending') {
            // actions.push(
            //     <Button
            //         key="confirm"
            //         type="primary"
            //         icon={<CheckCircleOutlined />}
            //         onClick={() => handleStatusUpdate('confirmed')}
            //     >
            //         Xác nhận tất cả
            //     </Button>
            // );
            if (hasNewItems) {
                actions.push(
                    <Button
                        key="confirm-new"
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => setConfirmItemsVisible(true)} // mở modal xác nhận món mới
                    >
                        Xác nhận
                    </Button>
                );
            }
            actions.push(
                <Button
                    key="cancel"
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleStatusUpdate('cancelled')}
                >
                    Hủy đơn
                </Button>
            );
        }

        // if (order.status === 'confirmed') {
        //     actions.push(
        //         <Button
        //             key="prepare"
        //             type="primary"
        //             icon={<ClockCircleOutlined />}
        //             onClick={() => handleStatusUpdate('preparing')}
        //         >
        //             Bắt đầu chế biến
        //         </Button>
        //     );
        // }

        // if (order.status === 'preparing') {
        //     actions.push(
        //         <Button
        //             key="ready"
        //             type="primary"
        //             icon={<CheckCircleOutlined />}
        //             onClick={() => handleStatusUpdate('ready')}
        //         >
        //             Hoàn thành chế biến
        //         </Button>
        //     );
        // }

        // if (order.status === 'ready') {
        //     actions.push(
        //         <Button
        //             key="serve"
        //             type="primary"
        //             icon={<CheckCircleOutlined />}
        //             onClick={() => handleStatusUpdate('served')}
        //         >
        //             Đã phục vụ
        //         </Button>
        //     );
        // }

        return actions;
    };
    const orderNotes = order.items
        .map(item => {
            try {
                const options = item.options ? JSON.parse(item.options) : null;
                if (!options) return null;

                return `${item.menuItem?.name} :  Đường - ${options.sugar || '100%'} , Đá - ${options.ice || '-'} <br/>`;
            } catch {
                return null;
            }
        })
        .filter(Boolean)
        .join(' | ');
    return (
        <div className="order-detail">
            <div className="order-header">
                <div className="order-title">
                    <h2>Đơn hàng #{order.order_number}  {hasNewItems && !isCancelled && (
                        <Badge
                            count="Có món mới"
                            style={{ backgroundColor: 'red', marginLeft: 10 }}
                        />
                    )}</h2>
                    {/* Nút mở popup */}

                    <Tag color={getStatusColor(order.status)} size="large">
                        {getStatusText(order.status)}
                    </Tag>
                </div>
                <Space>
                    {statusActions()}
                    {/* {!isCancelled && order.payment_status === 'unpaid' && (
                        <Button
                            type="primary"
                            icon={<DollarOutlined />}
                            onClick={() => setPaymentVisible(true)}
                        >
                            Thanh toán
                        </Button>
                    )} */}
                    {!isCancelled && isPaid && (
                        <Button icon={<PrinterOutlined />}
                            onClick={handlePrintInvoice}
                        >
                            In hóa đơn
                        </Button>
                    )}


                </Space>
            </div>

            <Row gutter={[16, 16]}>
                <Col span={16}>
                    <Card title="Thông tin đơn hàng" className="info-card">
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="Bàn">{order.table?.table_number}</Descriptions.Item>
                            <Descriptions.Item label="Khách hàng">{order.customer_name}</Descriptions.Item>
                            <Descriptions.Item label="Số người">{order.customer_count}</Descriptions.Item>
                            <Descriptions.Item label="SĐT">{order.customer_phone || 'Không có'}</Descriptions.Item>
                            <Descriptions.Item label="Thời gian tạo" span={2}>
                                {moment(order.createdAt).format('DD/MM/YYYY HH:mm')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ghi chú" span={2}>
                                <div className="order-note-box">
                                    {order.note && (
                                        <div className="order-note-main">
                                            {order.note}
                                        </div>
                                    )}

                                    {order.items.map(item => {
                                        const options = item.options ? JSON.parse(item.options) : {};

                                        // Nếu cả 3 đều falsy, bỏ qua
                                        //  if (!item.note && !options.sugar && !options.ice) return null;

                                        return (
                                            <div key={item.id} className="order-note-item">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <strong>{item.menuItem?.name} :</strong>

                                                    {item.order_type === 'dine_in' && (
                                                        <Tag color="blue">Tại bàn</Tag>
                                                    )}

                                                    {item.order_type === 'takeaway' && (
                                                        <Tag color="green">Mang về</Tag>
                                                    )}
                                                </div>

                                                {item.note && (
                                                    <div className="item-note">
                                                        Ghi chú: {item.note}
                                                    </div>
                                                )}

                                                {(options.sugar || options.ice) && (
                                                    <div className="item-option">
                                                        Đường - {options.sugar || ''} , Đá - {options.ice || ''}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Descriptions.Item>
                            {order.special_requests && (
                                <Descriptions.Item label="Yêu cầu đặc biệt" span={2}>
                                    {order.special_requests}
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Card>

                    <Card title="Danh sách món" className="items-card">
                        <Table
                            columns={itemColumns}
                            dataSource={order.items}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            rowClassName={(record) => record.is_new && !isCancelled ? 'new-item-row' : ''}
                        />
                    </Card>

                </Col>

                <Col span={8}>
                    <Card title="Thông tin thanh toán" className="payment-card">
                        <Descriptions column={1} bordered>
                            <Descriptions.Item label="Tạm tính">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subtotal)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thuế (10%)">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.tax)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Giảm giá">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discount)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tổng cộng">
                                <strong className="total-amount">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}
                                </strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={getPaymentStatusColor(order.payment_status)}>
                                    {getPaymentStatusText(order.payment_status)}
                                </Tag>
                            </Descriptions.Item>
                            {order.payment_method && (
                                <Descriptions.Item label="Phương thức">
                                    {order.payment_method}
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        {!isCancelled && !isPaid && (
                            <Button
                                type="primary"
                                block
                                icon={<DollarOutlined />}
                                onClick={() => setPaymentVisible(true)}
                                style={{ marginTop: 16 }}
                            >
                                Thanh toán
                            </Button>
                        )}
                    </Card>

                    <Card title="Thời gian" className="timeline-card">
                        <Timeline>
                            <Timeline.Item color="green">
                                Tạo đơn: {moment(order.createdAt).format('HH:mm DD/MM')}
                            </Timeline.Item>
                            {order.confirmed_at && (
                                <Timeline.Item color="blue">
                                    Xác nhận: {moment(order.confirmed_at).format('HH:mm DD/MM')}
                                </Timeline.Item>
                            )}
                            {/* {order.preparing_at && (
                                <Timeline.Item color="orange">
                                    Bắt đầu chế biến: {moment(order.preparing_at).format('HH:mm DD/MM')}
                                </Timeline.Item>
                            )}
                            {order.ready_at && (
                                <Timeline.Item color="green">
                                    Hoàn thành: {moment(order.ready_at).format('HH:mm DD/MM')}
                                </Timeline.Item>
                            )}
                            {order.served_at && (
                                <Timeline.Item color="green">
                                    Phục vụ: {moment(order.served_at).format('HH:mm DD/MM')}
                                </Timeline.Item>
                            )}
                            {order.completed_at && (
                                <Timeline.Item color="green">
                                    Hoàn tất: {moment(order.completed_at).format('HH:mm DD/MM')}
                                </Timeline.Item>
                            )} */}
                        </Timeline>
                    </Card>
                </Col>
            </Row>
            <ConfirmItemsModal
                visible={confirmItemsVisible}
                onCancel={() => setConfirmItemsVisible(false)}
                items={newItems}
                onConfirmItem={handleConfirmItem}
                onCancelItem={handleCancelItem}
            />
            <PaymentModal
                visible={paymentVisible}
                onCancel={() => setPaymentVisible(false)}
                order={order}
                onSuccess={() => {
                    setPaymentVisible(false);
                    queryClient.invalidateQueries(['order', orderId]);
                }}
            />
        </div>
    );
};

export default OrderDetail;



