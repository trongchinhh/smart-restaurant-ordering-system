import React from 'react';
import { Table, Space, Button, Tag, Tooltip, Progress, message } from 'antd';
import {
    EyeOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    PrinterOutlined
} from '@ant-design/icons';
import { exportInvoiceToPDF } from '../../services/invoiceService';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../services/config';
import moment from 'moment';
import './OrderList.scss';

const OrderList = ({
    orders,
    pagination,
    loading,
    onViewDetail,
    onEdit,
    filters,
    onFilterChange
}) => {

    // ✅ TÍNH TRẠNG THÁI THỰC TẾ TỪ ITEMS
    const getComputedStatus = (record) => {
        const items = record.items || [];
        if (record.status === 'cancelled') {
            return 'cancelled';
        }

        if (record.payment_status === 'paid') {
            return 'completed';
        }

        if (items.some(item => item.is_new)) return 'pending';

        if (items.some(item => item.status === 'preparing')) return 'preparing';
        if (items.some(item => item.status === 'ready')) return 'ready';
        if (items.some(item => item.status === 'served')) return 'served';

        return record.status;
    };
    const handlePrintInvoice = async (data) => {
        try {
            message.loading({ content: 'Đang tạo hóa đơn...', key: 'printing' });
            await exportInvoiceToPDF(data);
            message.success({ content: 'Xuất hóa đơn thành công!', key: 'printing' });
        } catch (error) {
            console.error('Print error:', error);
            message.error({ content: 'Xuất hóa đơn thất bại!', key: 'printing' });
        }
    };
    // ✅ TÍNH SỐ MÓN ĐÃ HOÀN THÀNH
    const getCompletedItemsCount = (record) => {
        const items = record.items || [];
        return items.filter(item =>
            item.status === 'ready' || item.status === 'served'
        ).length;
    };

    // ✅ TÍNH TỔNG SỐ MÓN
    const getTotalItemsCount = (record) => {
        return record.items?.length || 0;
    };

    // ✅ TÍNH TIẾN ĐỘ PHẦN TRĂM
    const getProgressPercent = (record) => {
        const total = getTotalItemsCount(record);
        if (total === 0) return 0;
        const completed = getCompletedItemsCount(record);
        return Math.round((completed / total) * 100);
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            confirmed: 'processing',
            preparing: 'processing',
            ready: 'success',
            served: 'success',
            completed: 'success',
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

    const getPaymentStatusColor = (status) => {
        const colors = {
            unpaid: 'error',
            paid: 'success',
            partial: 'warning'
        };
        return colors[status] || 'default';
    };

    const getPaymentStatusText = (status) => {
        const texts = {
            unpaid: 'Chưa thanh toán',
            paid: 'Đã thanh toán',
            partial: 'Thanh toán 1 phần'
        };
        return texts[status] || status;
    };

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'order_number',
            key: 'order_number',
            width: 120,
            fixed: 'left',
            render: (text, record) => {
                const computedStatus = getComputedStatus(record);
                const hasNewItems =
                    computedStatus !== 'cancelled' &&
                    record.items?.some(item => item.is_new);

                return (
                    <Space>
                        <strong>{text}</strong>
                        {hasNewItems && <Tag color="red" style={{ marginLeft: 4 }}>Mới</Tag>}
                    </Space>
                );
            }
        },
        {
            title: 'Bàn',
            dataIndex: ['table', 'table_number'],
            key: 'table',
            width: 80,
            render: (text) => text ? `Bàn ${text}` : 'Takeaway'
        },
        {
            title: 'SL món',
            key: 'itemCount',
            width: 100,
            render: (_, record) => {
                const total = getTotalItemsCount(record);
                const completed = getCompletedItemsCount(record);
                const progress = getProgressPercent(record);

                return (
                    <Tooltip title={`${completed}/${total} món (${progress}%)`}>
                        <Space direction="vertical" size={2} style={{ width: '100%' }}>
                            <div style={{ fontSize: '12px' }}>
                                {completed}/{total}
                            </div>
                            <Progress
                                percent={progress}
                                size="small"
                                strokeColor={progress === 100 ? '#52c41a' : '#1890ff'}
                                showInfo={false}
                                style={{ margin: 0 }}
                            />
                        </Space>
                    </Tooltip>
                );
            }
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'total',
            key: 'total',
            width: 120,
            render: (total) => new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(total)
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 130,
            render: (_, record) => {
                const computedStatus = getComputedStatus(record);
                const progress = getProgressPercent(record);
                const statusText = getStatusText(computedStatus);

                return (
                    <Tooltip title={`${statusText} (${progress}%)`}>
                        <Tag color={getStatusColor(computedStatus)} style={{ margin: 0 }}>
                            {statusText}
                            {progress > 0 && progress < 100 && ` ${progress}%`}
                        </Tag>
                    </Tooltip>
                );
            },
            filters: Object.entries(ORDER_STATUS).map(([key, value]) => ({
                text: getStatusText(value),
                value
            })),
            filteredValue: filters.status ? [filters.status] : null,
            onFilter: (value, record) =>
                getComputedStatus(record) === value
        },
        {
            title: 'Thanh toán',
            key: 'payment_status',
            width: 90,
            render: (_, record) => (
                <Tooltip title={record.payment_method ? `PT: ${record.payment_method}` : ''}>
                    <Tag color={getPaymentStatusColor(record.payment_status)}>
                        {getPaymentStatusText(record.payment_status)}
                    </Tag>
                </Tooltip>
            ),
            filters: Object.entries(PAYMENT_STATUS).map(([key, value]) => ({
                text: getPaymentStatusText(value),
                value
            })),
            filteredValue: filters.payment_status ? [filters.payment_status] : null,
            onFilter: (value, record) =>
                record.payment_status === value
        },
        {
            title: 'Thời gian',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 140,
            render: (date) => moment(date).format('DD/MM HH:mm'),
            sorter: (a, b) =>
                moment(a.createdAt).unix() - moment(b.createdAt).unix()
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            fixed: 'right',
            render: (_, record) => {
                const computedStatus = getComputedStatus(record);
                const isCancelled = computedStatus === 'cancelled';
                const progress = getProgressPercent(record);
                const hasPartialCompletion = progress > 0 && progress < 100;

                return (
                    <Space size="small">
                        <Tooltip title={hasPartialCompletion ?
                            `Đã xong ${getCompletedItemsCount(record)}/${getTotalItemsCount(record)} món` :
                            "Xem chi tiết"}>
                            <Button
                                type="primary"
                                icon={<EyeOutlined />}
                                size="small"
                                onClick={() => onViewDetail(record)}
                                className={hasPartialCompletion ? 'btn-partial' : ''}
                            />
                        </Tooltip>
                        {!isCancelled && (
                            <Tooltip title="In hóa đơn">
                                <Button icon={<PrinterOutlined />}
                                    onClick={() => handlePrintInvoice(record)}
                                    // type='primary'
                                    size='small'
                                >

                                </Button>
                            </Tooltip>
                        )}
                        {!isCancelled && record.payment_status === 'unpaid' && (
                            <Tooltip title="Thanh toán">
                                <Button
                                    type="primary"
                                    icon={<DollarOutlined />}
                                    size="small"
                                    onClick={() => onViewDetail(record)}
                                />
                            </Tooltip>
                        )}
                    </Space>
                );
            }
        }
    ];

    const handleTableChange = (pagination, tableFilters) => {
        onFilterChange(prev => ({
            ...prev,
            page: pagination.current,
            limit: pagination.pageSize,
            status: tableFilters.status?.[0] || '',
            payment_status: tableFilters.payment_status?.[0] || prev.payment_status
        }));
    };

    return (
        <div className="order-list">
            <Table
                columns={columns}
                dataSource={orders}
                rowKey="id"
                loading={loading}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng số ${total} đơn hàng`,
                    pageSizeOptions: ['10', '20', '50', '100']
                }}
                onChange={handleTableChange}
                scroll={{ x: 880 }}
                className="order-list-table"
                rowClassName={(record) => {
                    const computedStatus = getComputedStatus(record);
                    const progress = getProgressPercent(record);

                    if (computedStatus === 'cancelled') return 'row-cancelled';
                    if (computedStatus === 'completed') return 'row-completed';
                    if (record.items?.some(i => i.is_new)) return 'row-new';
                    if (progress > 0 && progress < 100) return 'row-partial';

                    return '';
                }}
                size="middle"
            />
        </div>
    );
};

export default OrderList;