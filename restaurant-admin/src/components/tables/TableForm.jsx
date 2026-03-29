import React from 'react';
import { Form, Input, InputNumber, Select, Switch, Button, Space } from 'antd';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const { Option } = Select;

const validationSchema = Yup.object({
    table_number: Yup.string()
        .required('Vui lòng nhập số bàn')
        .max(10, 'Số bàn không quá 10 ký tự'),
    capacity: Yup.number()
        .required('Vui lòng nhập sức chứa')
        .min(1, 'Sức chứa tối thiểu 1 người')
        .max(20, 'Sức chứa tối đa 20 người'),
    location: Yup.string()
        .required('Vui lòng chọn khu vực'),
    status: Yup.string()
        .required('Vui lòng chọn trạng thái'),
    description: Yup.string()
        .max(500, 'Mô tả không quá 500 ký tự')
});

const TableForm = ({ initialValues, onSubmit, loading, onCancel }) => {
    const formik = useFormik({
        initialValues: initialValues || {
            table_number: '',
            capacity: 4,
            location: 'inside',
            status: 'available',
            description: '',
            is_active: true
        },
        validationSchema,
        onSubmit: async (values) => {
            await onSubmit(values);
        }
    });

    return (
        <Form
            layout="vertical"
            onFinish={formik.handleSubmit}
            className="table-form"
        >
            <Form.Item
                label="Số bàn"
                required
                validateStatus={formik.errors.table_number && formik.touched.table_number ? 'error' : ''}
                help={formik.touched.table_number && formik.errors.table_number}
            >
                <Input
                    name="table_number"
                    value={formik.values.table_number}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Nhập số bàn (VD: B01)"
                    maxLength={10}
                />
            </Form.Item>

            <Form.Item
                label="Sức chứa"
                required
                validateStatus={formik.errors.capacity && formik.touched.capacity ? 'error' : ''}
                help={formik.touched.capacity && formik.errors.capacity}
            >
                <InputNumber
                    name="capacity"
                    value={formik.values.capacity}
                    onChange={(value) => formik.setFieldValue('capacity', value)}
                    onBlur={formik.handleBlur}
                    min={1}
                    max={20}
                    style={{ width: '100%' }}
                />
            </Form.Item>

            <Form.Item
                label="Khu vực"
                required
                validateStatus={formik.errors.location && formik.touched.location ? 'error' : ''}
                help={formik.touched.location && formik.errors.location}
            >
                <Select
                    value={formik.values.location}
                    onChange={(value) => formik.setFieldValue('location', value)}
                    onBlur={formik.handleBlur}
                >
                    <Option value="inside">Trong nhà</Option>
                    <Option value="outside">Ngoài trời</Option>
                    <Option value="vip">VIP</Option>
                </Select>
            </Form.Item>

            <Form.Item
                label="Trạng thái"
                required
                validateStatus={formik.errors.status && formik.touched.status ? 'error' : ''}
                help={formik.touched.status && formik.errors.status}
            >
                <Select
                    value={formik.values.status}
                    onChange={(value) => formik.setFieldValue('status', value)}
                    onBlur={formik.handleBlur}
                >
                    <Option value="available">Trống</Option>
                    <Option value="occupied">Đang phục vụ</Option>
                    <Option value="reserved">Đã đặt</Option>
                    <Option value="cleaning">Đang dọn</Option>
                </Select>
            </Form.Item>

            <Form.Item
                label="Mô tả"
                validateStatus={formik.errors.description && formik.touched.description ? 'error' : ''}
                help={formik.touched.description && formik.errors.description}
            >
                <Input.TextArea
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows={4}
                    placeholder="Nhập mô tả thêm về bàn (nếu có)"
                    maxLength={500}
                    showCount
                />
            </Form.Item>

            <Form.Item label="Kích hoạt">
                <Switch
                    checked={formik.values.is_active}
                    onChange={(checked) => formik.setFieldValue('is_active', checked)}
                />
            </Form.Item>

            <Form.Item className="form-actions">
                <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {initialValues ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                    <Button onClick={onCancel}>
                        Hủy
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default TableForm;