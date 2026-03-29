import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Space, Table, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from 'react-query';
import { apiService } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import './OrderForm.scss';

const { Option } = Select;
const { TextArea } = Input;

const OrderForm = ({ initialValues, onSubmit, onCancel }) => {
    const [form] = Form.useForm();
    const [selectedItems, setSelectedItems] = useState([]);
    const [menuModalVisible, setMenuModalVisible] = useState(false);
    const { showError } = useNotification();

    const { data: tablesData } = useQuery(
        'tables',
        () => apiService.getTables({ limit: 100 }).then(res => res.data)
    );

    const { data: menuData } = useQuery(
        'menuItems',
        () => apiService.getMenuItems({ limit: 100 }).then(res => res.data)
    );

    const createOrderMutation = useMutation(
        (data) => apiService.createOrder(data),
        {
            onSuccess: () => {
                onSubmit?.();
            },
            onError: (error) => {
                showError(error.response?.data?.message || 'Tạo đơn hàng thất bại');
            }
        }
    );

    const tables = tablesData?.data || [];
    const menuItems = menuData?.data || [];

    const handleAddItem = (item) => {
        const existing = selectedItems.find(i => i.menu_item_id === item.id);
        if (existing) {
            setSelectedItems(selectedItems.map(i =>
                i.menu_item_id === item.id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
            ));
        } else {
            setSelectedItems([
                ...selectedItems,
                {
                    menu_item_id: item.id,
                    name: item.name,
                    price: item.discount_price || item.price,
                    quantity: 1,
                    note: ''
                }
            ]);
        }
        setMenuModalVisible(false);
    };

    const handleRemoveItem = (index) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const handleQuantityChange = (index, quantity) => {
        const newItems = [...selectedItems];
        newItems[index].quantity = quantity;
        setSelectedItems(newItems);
    };

    const handleNoteChange = (index, note) => {
        const newItems = [...selectedItems];
        newItems[index].note = note;
        setSelectedItems(newItems);
    };

    const calculateTotal = () => {
        return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleSubmit = async (values) => {
        if (selectedItems.length === 0) {
            showError('Vui lòng chọn ít nhất một món ăn');
            return;
        }

        const orderData = {
            ...values,
            items: selectedItems.map(({ menu_item_id, quantity, note }) => ({
                menu_item_id,
                quantity,
                note
            }))
        };

        if (initialValues) {
            // Update existing order
            await apiService.updateOrder(initialValues.id, orderData);
        } else {
            // Create new order
            await createOrderMutation.mutateAsync(orderData);
        }
    };

    const columns = [
        {
            title: 'Món ăn',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(price)
        },
        {
            title: 'Số lượng',
            key: 'quantity',
            render: (_, record, index) => (
                <InputNumber
                    min={1}
                    max={99}
                    value={record.quantity}
                    onChange={(value) => handleQuantityChange(index, value)}
                />
            )
        },
        {
            title: 'Ghi chú',
            key: 'note',
            render: (_, record, index) => (
                <Input
                    placeholder="Ghi chú"
                    value={record.note}
                    onChange={(e) => handleNoteChange(index, e.target.value)}
                />
            )
        },
        {
            title: 'Thành tiền',
            key: 'subtotal',
            render: (_, record) => new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(record.price * record.quantity)
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, __, index) => (
                <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(index)}
                />
            )
        }
    ];

    return (
        <div className="order-form">
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={initialValues || {
                    customer_name: 'Khách',
                    customer_count: 1
                }}
            >
                <Form.Item
                    name="table_id"
                    label="Chọn bàn"
                    rules={[{ required: true, message: 'Vui lòng chọn bàn' }]}
                >
                    <Select placeholder="Chọn bàn">
                        {tables.map(table => (
                            <Option key={table.id} value={table.id}>
                                Bàn {table.table_number} - {table.capacity} người ({table.status === 'available' ? 'Trống' : 'Đang dùng'})
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="customer_name"
                    label="Tên khách hàng"
                    rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
                >
                    <Input placeholder="Nhập tên khách hàng" />
                </Form.Item>

                <Form.Item
                    name="customer_phone"
                    label="Số điện thoại"
                >
                    <Input placeholder="Nhập số điện thoại" />
                </Form.Item>

                <Form.Item
                    name="customer_count"
                    label="Số người"
                    rules={[{ required: true, message: 'Vui lòng nhập số người' }]}
                >
                    <InputNumber min={1} max={20} style={{ width: '100%' }} />
                </Form.Item>

                <div className="items-section">
                    <div className="items-header">
                        <h3>Danh sách món</h3>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setMenuModalVisible(true)}
                        >
                            Thêm món
                        </Button>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={selectedItems}
                        rowKey="menu_item_id"
                        pagination={false}
                        footer={() => (
                            <div className="table-footer">
                                <strong>Tổng cộng: </strong>
                                {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND'
                                }).format(calculateTotal())}
                            </div>
                        )}
                    />
                </div>

                <Form.Item
                    name="note"
                    label="Ghi chú"
                >
                    <TextArea rows={3} placeholder="Ghi chú cho đơn hàng" />
                </Form.Item>

                <Form.Item className="form-actions">
                    <Space>
                        <Button type="primary" htmlType="submit" loading={createOrderMutation.isLoading}>
                            {initialValues ? 'Cập nhật' : 'Tạo đơn'}
                        </Button>
                        <Button onClick={onCancel}>
                            Hủy
                        </Button>
                    </Space>
                </Form.Item>
            </Form>

            <Modal
                title="Chọn món ăn"
                open={menuModalVisible}
                onCancel={() => setMenuModalVisible(false)}
                footer={null}
                width={800}
            >
                <div className="menu-items-grid">
                    {menuItems.map(item => (
                        <div
                            key={item.id}
                            className="menu-item-card"
                            onClick={() => handleAddItem(item)}
                        >
                            <div className="item-name">{item.name}</div>
                            <div className="item-price">
                                {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND'
                                }).format(item.discount_price || item.price)}
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
};

export default OrderForm;