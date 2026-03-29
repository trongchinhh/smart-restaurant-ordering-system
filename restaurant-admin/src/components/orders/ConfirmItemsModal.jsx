import React from 'react';
import { Modal, Table, Button, Tag, Space, Popconfirm } from 'antd';

const ConfirmItemsModal = ({ visible, onCancel, items, onConfirmItem, onCancelItem }) => {
    const columns = [
        {
            title: 'Món ăn',
            dataIndex: ['menuItem', 'name'],
            key: 'name',
            render: (text, record) => (
                <div>
                    {text} {record.is_new && <Tag color="red">MỚI</Tag>}
                </div>
            )
        },
        {
            title: 'SL',
            dataIndex: 'quantity',
            key: 'quantity'
        },
        {
            title: 'Size',
            key: 'size',
            render: (_, record) => {
                const size = record.options?.size;

                if (!size) {
                    return <Tag>--</Tag>;
                }

                const sizeMap = {
                    s: { label: 'S', color: 'default' },
                    m: { label: 'M', color: 'blue' },
                    l: { label: 'L', color: 'red' }
                };

                const current = sizeMap[size.toLowerCase()] || {
                    label: size.toUpperCase(),
                    color: 'default'
                };

                return (
                    <Tag color={current.color} style={{ fontWeight: 600 }}>
                        {current.label}
                    </Tag>
                );
            }
        },
        {
            title: 'Hình thức',
            key: 'order_type',
            render: (_, record) => {
                const orderType = record.options?.order_type;
                if (orderType === 'dine_in') {
                    return <Tag color="blue" icon={<span>🍽️</span>}>Ăn tại quán</Tag>;
                } else if (orderType === 'takeaway') {
                    return <Tag color="green" icon={<span>🛍️</span>}>Mang về</Tag>;
                }
                return <Tag color="default">Chưa xác định</Tag>;
            }
        },
        {
            title: 'Thành tiền',
            dataIndex: 'subtotal',
            key: 'subtotal',
            render: (subtotal) =>
                new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(subtotal)
        },

        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    {record.is_new && (
                        <>
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => onConfirmItem(record.id)}
                            >
                                Xác nhận
                            </Button>

                            <Popconfirm
                                title="Hủy món này?"
                                description="Món sẽ bị xóa khỏi đơn hàng."
                                onConfirm={() => onCancelItem(record.id)}
                                okText="Đồng ý"
                                cancelText="Không"
                            >
                                <Button danger size="small">
                                    Hủy món
                                </Button>
                            </Popconfirm>
                        </>
                    )}
                </Space>
            )
        }
    ];



    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📋 Xác nhận món mới</span>
                    {items.length > 0 && (
                        <Tag color="orange">{items.length} món</Tag>
                    )}
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
        >

            <Table
                columns={columns}
                dataSource={items}
                rowKey="id"
                pagination={false}
            />
        </Modal>
    );
};

export default ConfirmItemsModal;