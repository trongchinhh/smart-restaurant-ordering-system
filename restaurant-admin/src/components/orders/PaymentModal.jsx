import React, { useState } from 'react';
import { Modal, Form, Radio, InputNumber, Button, Space, Typography, Divider } from 'antd';
import { useMutation, useQueryClient } from 'react-query';
import { apiService } from '../../services/api';
import { message } from 'antd';
import './PaymentModal.scss';

const { Text, Title } = Typography;

const PaymentModal = ({ visible, onCancel, order, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const queryClient = useQueryClient();

    const paymentMutation = useMutation(
        ({ id, data }) => apiService.processPayment(id, data),
        {
            onSuccess: () => {
                message.success('Thanh toán thành công');
                queryClient.invalidateQueries('orders');
                onSuccess();
            },
            onError: (error) => {
                message.error(error.response?.data?.message || 'Thanh toán thất bại');
            }
        }
    );

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await paymentMutation.mutateAsync({
                id: order.id,
                data: {
                    payment_method: values.payment_method,
                    amount: values.amount || order.total
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    return (
        <Modal
            title="Xử lý thanh toán"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={500}
            className="payment-modal"
        >
            <div className="payment-summary">
                <div className="summary-item">
                    <Text>Tổng tiền:</Text>
                    <Title level={3} className="total-amount">
                        {formatCurrency(order?.total)}
                    </Title>
                </div>
            </div>

            <Divider />

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    payment_method: 'cash',
                    amount: order?.total
                }}
            >
                <Form.Item
                    name="payment_method"
                    label="Phương thức thanh toán"
                    rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
                >
                    <Radio.Group>
                        <Space direction="vertical">
                            <Radio value="cash">Tiền mặt</Radio>
                            <Radio value="card">Thẻ ngân hàng</Radio>
                            <Radio value="transfer">Chuyển khoản</Radio>
                        </Space>
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    name="amount"
                    label="Số tiền thanh toán"
                    rules={[
                        { required: true, message: 'Vui lòng nhập số tiền' },
                        {
                            validator: (_, value) => {
                                if (value > order?.total) {
                                    return Promise.reject('Số tiền thanh toán không thể lớn hơn tổng tiền');
                                }
                                if (value <= 0) {
                                    return Promise.reject('Số tiền phải lớn hơn 0');
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        min={0}
                        max={order?.total}
                        step={1000}
                        addonAfter="VNĐ"
                    />
                </Form.Item>

                <Form.Item shouldUpdate>
                    {() => {
                        const amount = form.getFieldValue('amount');
                        const change = order?.total - amount;

                        return change > 0 && (
                            <div className="change-info">
                                <Text type="secondary">Tiền thừa:</Text>
                                <Text strong className="change-amount">
                                    {formatCurrency(change)}
                                </Text>
                            </div>
                        );
                    }}
                </Form.Item>

                <Form.Item className="form-actions">
                    <Space>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Xác nhận thanh toán
                        </Button>
                        <Button onClick={onCancel}>
                            Hủy
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default PaymentModal;