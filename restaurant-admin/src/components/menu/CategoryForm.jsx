import React from 'react';
import { Form, Input, InputNumber, Switch, Button, Space } from 'antd';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from 'react-query';
import { apiService } from '../../services/api';
import { message } from 'antd';

const validationSchema = Yup.object({
    name: Yup.string()
        .required('Vui lòng nhập tên danh mục')
        .max(100, 'Tên không quá 100 ký tự'),
    name_en: Yup.string()
        .max(100, 'Tên tiếng Anh không quá 100 ký tự'),
    description: Yup.string()
        .max(500, 'Mô tả không quá 500 ký tự'),
    icon: Yup.string()
        .max(50, 'Icon không quá 50 ký tự'),
    sort_order: Yup.number()
        .min(0, 'Thứ tự phải lớn hơn hoặc bằng 0')
});

const CategoryForm = ({ initialValues, onSuccess, onCancel }) => {
    const queryClient = useQueryClient();

    const createMutation = useMutation(
        (data) => apiService.createCategory(data),
        {
            onSuccess: () => {
                message.success('Thêm danh mục thành công');
                formik.resetForm();
                queryClient.invalidateQueries('categories');
                onSuccess();
            },
            onError: (error) => {
                message.error(error.response?.data?.message || 'Thêm danh mục thất bại');
            }
        }
    );

    const updateMutation = useMutation(
        ({ id, data }) => apiService.updateCategory(id, data),
        {
            onSuccess: () => {
                message.success('Cập nhật danh mục thành công');
                queryClient.invalidateQueries('categories');
                onSuccess();
            },
            onError: (error) => {
                message.error(error.response?.data?.message || 'Cập nhật danh mục thất bại');
            }
        }
    );

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: initialValues || {
            name: '',
            name_en: '',
            description: '',
            icon: 'restaurant',
            sort_order: 0,
            is_active: true
        },
        validationSchema,
        onSubmit: async (values) => {
            if (initialValues) {
                await updateMutation.mutateAsync({ id: initialValues.id, data: values });
            } else {
                await createMutation.mutateAsync(values);
            }
        }
    });

    return (
        <Form
            layout="vertical"
            onFinish={formik.handleSubmit}
            className="category-form"
        >
            <Form.Item
                label="Tên danh mục"
                required
                validateStatus={formik.errors.name && formik.touched.name ? 'error' : ''}
                help={formik.touched.name && formik.errors.name}
            >
                <Input
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Nhập tên danh mục"
                />
            </Form.Item>

            <Form.Item
                label="Tên tiếng Anh"
                validateStatus={formik.errors.name_en && formik.touched.name_en ? 'error' : ''}
                help={formik.touched.name_en && formik.errors.name_en}
            >
                <Input
                    name="name_en"
                    value={formik.values.name_en}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Nhập tên tiếng Anh (nếu có)"
                />
            </Form.Item>

            <Form.Item
                label="Icon"
                validateStatus={formik.errors.icon && formik.touched.icon ? 'error' : ''}
                help={formik.touched.icon && formik.errors.icon}
            >
                <Input
                    name="icon"
                    value={formik.values.icon}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="VD: restaurant, coffee, wine-bar"
                />
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
                    placeholder="Nhập mô tả danh mục"
                    maxLength={500}
                    showCount
                />
            </Form.Item>

            <Form.Item
                label="Thứ tự hiển thị"
                validateStatus={formik.errors.sort_order && formik.touched.sort_order ? 'error' : ''}
                help={formik.touched.sort_order && formik.errors.sort_order}
            >
                <InputNumber
                    name="sort_order"
                    value={formik.values.sort_order}
                    onChange={(value) => formik.setFieldValue('sort_order', value)}
                    onBlur={formik.handleBlur}
                    min={0}
                    style={{ width: '100%' }}
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
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={createMutation.isLoading || updateMutation.isLoading}
                    >
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

export default CategoryForm;