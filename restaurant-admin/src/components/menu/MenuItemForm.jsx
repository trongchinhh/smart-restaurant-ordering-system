import React, { useState, useEffect } from 'react';
import {
    Form, Input, InputNumber, Select, Switch, Button, Space,
    Upload, message, Row, Col, Card, Tag, Table
} from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../../services/api';
import { UPLOAD_URL } from '../../services/config';
import './MenuItemForm.scss';

const { Option } = Select;
const { TextArea } = Input;

const formatPrice = (price) => {
    if (price === undefined || price === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
};

const validationSchema = Yup.object({
    name: Yup.string()
        .required('Vui lòng nhập tên món ăn')
        .max(200, 'Tên không quá 200 ký tự'),
    name_en: Yup.string()
        .max(200, 'Tên tiếng Anh không quá 200 ký tự'),
    price: Yup.number()
        .required('Vui lòng nhập giá')
        .min(0, 'Giá phải lớn hơn hoặc bằng 0'),
    discount_price: Yup.number()
        .min(0, 'Giá khuyến mãi phải lớn hơn hoặc bằng 0')
        .test('less-than-price', 'Giá khuyến mãi phải nhỏ hơn giá gốc', function (value) {
            if (!value) return true;
            return value < this.parent.price;
        }),
    category_id: Yup.string()
        .required('Vui lòng chọn danh mục'),
    preparation_time: Yup.number()
        .required('Vui lòng nhập thời gian chế biến')
        .min(1, 'Thời gian tối thiểu 1 phút')
        .max(120, 'Thời gian tối đa 120 phút'),
    description: Yup.string()
        .max(1000, 'Mô tả không quá 1000 ký tự')
});

const MenuItemForm = ({ initialValues, onSuccess, onCancel }) => {
    const [fileList, setFileList] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [ingredientInput, setIngredientInput] = useState({
        name: '',
        price: 0,
        maxQuantity: 1,
        defaultQuantity: 0
    });

    const [allergens, setAllergens] = useState([]);
    const [allergenInput, setAllergenInput] = useState('');
    const [removeImage, setRemoveImage] = useState(false);
    const [enableSize, setEnableSize] = useState(false);
    const [sizePrices, setSizePrices] = useState({
        S: '',
        M: '',
        L: ''
    });
    const [drinkOptions, setDrinkOptions] = useState({
        sugar: true,
        ice: true,
        toppings: true
    });

    const queryClient = useQueryClient();

    // Effect để load dữ liệu khi initialValues thay đổi
    useEffect(() => {
        if (initialValues) {
            // Load ingredients
            if (initialValues.ingredients) {
                setIngredients(initialValues.ingredients);
            }

            // Load allergens
            if (initialValues.allergens) {
                setAllergens(initialValues.allergens);
            }

            // Load size prices
            if (initialValues.size_prices) {
                setEnableSize(true);
                setSizePrices({
                    S: initialValues.size_prices.S || '',
                    M: initialValues.size_prices.M || '',
                    L: initialValues.size_prices.L || ''
                });
            } else {
                setEnableSize(false);
                setSizePrices({ S: '', M: '', L: '' });
            }

            // Load options
            if (initialValues.options) {
                setDrinkOptions({
                    sugar: initialValues.options.sugar ?? true,
                    ice: initialValues.options.ice ?? true,
                    toppings: initialValues.options.toppings ?? true
                });
            }

            // Load image if exists
            if (initialValues.image_url) {
                setFileList([]); // Không set fileList vì đây là URL, không phải file
            }
        } else {
            // Reset state khi tạo mới
            setIngredients([]);
            setAllergens([]);
            setEnableSize(false);
            setSizePrices({ S: '', M: '', L: '' });
            setDrinkOptions({ sugar: true, ice: true, toppings: true });
            setFileList([]);
            setRemoveImage(false);
        }
    }, [initialValues]);

    const { data: categoriesData } = useQuery(
        'categories',
        () => apiService.getCategories({ limit: 100 }).then(res => res.data)
    );

    const createMutation = useMutation(
        (data) => apiService.createMenuItem(data),
        {
            onSuccess: () => {
                message.success('Thêm món ăn thành công');
                formik.resetForm();
                setFileList([]);
                setIngredients([]);
                setAllergens([]);
                setRemoveImage(false);
                setEnableSize(false);
                setSizePrices({ S: '', M: '', L: '' });
                setDrinkOptions({ sugar: true, ice: true, toppings: true });

                queryClient.invalidateQueries('menuItems');
                onSuccess();
            },
            onError: (error) => {
                message.error(error.response?.data?.message || 'Thêm món ăn thất bại');
            }
        }
    );

    const updateMutation = useMutation(
        ({ id, data }) => apiService.updateMenuItem(id, data),
        {
            onSuccess: () => {
                message.success('Cập nhật món ăn thành công');
                queryClient.invalidateQueries('menuItems');
                onSuccess();
            },
            onError: (error) => {
                message.error(error.response?.data?.message || 'Cập nhật món ăn thất bại');
            }
        }
    );

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: initialValues || {
            name: '',
            name_en: '',
            description: '',
            price: 0,
            discount_price: null,
            category_id: '',
            preparation_time: 15,
            status: 'available',
            is_recommended: false,
            is_new: true,
            sort_order: 0
        },
        validationSchema,
        onSubmit: async (values) => {
            const formData = {
                ...values,
                ingredients,
                allergens,
                size_prices: enableSize ? sizePrices : null,
                options: drinkOptions
            };

            if (fileList.length > 0 && fileList[0].originFileObj) {
                formData.image = fileList[0].originFileObj;
            }
            if (removeImage) {
                formData.removeImage = true;
            }
            if (initialValues) {
                await updateMutation.mutateAsync({ id: initialValues.id, data: formData });
            } else {
                await createMutation.mutateAsync(formData);
            }
        }
    });

    const handleAddIngredient = () => {
        if (ingredientInput.name.trim() && ingredientInput.price > 0) {
            setIngredients([
                ...ingredients,
                {
                    name: ingredientInput.name.trim(),
                    price: ingredientInput.price,
                    maxQuantity: ingredientInput.maxQuantity || 1,
                    defaultQuantity: ingredientInput.defaultQuantity || 0
                }
            ]);
            setIngredientInput({
                name: '',
                price: 0,
                maxQuantity: 1,
                defaultQuantity: 0
            });
        } else {
            message.warning('Vui lòng nhập tên và giá thành phần');
        }
    };

    const handleRemoveIngredient = (index) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const handleAddAllergen = () => {
        if (allergenInput.trim()) {
            setAllergens([...allergens, allergenInput.trim()]);
            setAllergenInput('');
        }
    };

    const handleRemoveAllergen = (index) => {
        setAllergens(allergens.filter((_, i) => i !== index));
    };

    const uploadProps = {
        onRemove: (file) => {
            setFileList([]);
        },
        beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Chỉ chấp nhận file ảnh!');
                return false;
            }

            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Ảnh phải nhỏ hơn 5MB!');
                return false;
            }

            setFileList([
                {
                    uid: file.uid,
                    name: file.name,
                    status: 'done',
                    originFileObj: file
                }
            ]);

            return false;
        },
        fileList,
        maxCount: 1,
        listType: 'picture-card'
    };

    const categories = categoriesData?.data || [];

    return (
        <Form
            layout="vertical"
            onFinish={formik.handleSubmit}
            className="menu-item-form"
        >
            <Row gutter={16}>
                <Col span={16}>
                    <Card title="Thông tin cơ bản" className="form-card">
                        <Form.Item
                            label="Tên món ăn"
                            required
                            validateStatus={formik.errors.name && formik.touched.name ? 'error' : ''}
                            help={formik.touched.name && formik.errors.name}
                        >
                            <Input
                                name="name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder="Nhập tên món ăn"
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
                                placeholder="Nhập tên tiếng Anh"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Mô tả"
                            validateStatus={formik.errors.description && formik.touched.description ? 'error' : ''}
                            help={formik.touched.description && formik.errors.description}
                        >
                            <TextArea
                                name="description"
                                value={formik.values.description}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                rows={4}
                                placeholder="Nhập mô tả món ăn"
                                maxLength={1000}
                                showCount
                            />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Danh mục"
                                    required
                                    validateStatus={formik.errors.category_id && formik.touched.category_id ? 'error' : ''}
                                    help={formik.touched.category_id && formik.errors.category_id}
                                >
                                    <Select
                                        value={formik.values.category_id}
                                        onChange={(value) => formik.setFieldValue('category_id', value)}
                                        onBlur={formik.handleBlur}
                                        placeholder="Chọn danh mục"
                                    >
                                        {categories.map(cat => (
                                            <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Thời gian chế biến (phút)"
                                    required
                                    validateStatus={formik.errors.preparation_time && formik.touched.preparation_time ? 'error' : ''}
                                    help={formik.touched.preparation_time && formik.errors.preparation_time}
                                >
                                    <InputNumber
                                        name="preparation_time"
                                        value={formik.values.preparation_time}
                                        onChange={(value) => formik.setFieldValue('preparation_time', value)}
                                        onBlur={formik.handleBlur}
                                        min={1}
                                        max={120}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card title="Thành phần món ăn (Có thể thêm như topping)" className="form-card">
                        <div className="ingredients-section">
                            <Row gutter={8} style={{ marginBottom: 16 }}>
                                <Col span={8}>
                                    <Input
                                        value={ingredientInput.name}
                                        onChange={(e) => setIngredientInput({ ...ingredientInput, name: e.target.value })}
                                        placeholder="Tên thành phần (VD: Mì, Thịt...)"
                                    />
                                </Col>
                                <Col span={4}>
                                    <InputNumber
                                        value={ingredientInput.price}
                                        onChange={(value) => setIngredientInput({ ...ingredientInput, price: value })}
                                        placeholder="Giá"
                                        min={0}
                                        style={{ width: '100%' }}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                    />
                                </Col>
                                <Col span={3}>
                                    <InputNumber
                                        value={ingredientInput.maxQuantity}
                                        onChange={(value) => setIngredientInput({ ...ingredientInput, maxQuantity: value })}
                                        placeholder="Tối đa"
                                        min={1}
                                        max={10}
                                        style={{ width: '100%' }}
                                    />
                                </Col>
                                <Col span={3}>
                                    <InputNumber
                                        value={ingredientInput.defaultQuantity}
                                        onChange={(value) => setIngredientInput({ ...ingredientInput, defaultQuantity: value })}
                                        placeholder="Mặc định"
                                        min={0}
                                        max={ingredientInput.maxQuantity}
                                        style={{ width: '100%' }}
                                    />
                                </Col>
                                <Col span={6}>
                                    <Button type="primary" onClick={handleAddIngredient} block>
                                        <PlusOutlined /> Thêm
                                    </Button>
                                </Col>
                            </Row>

                            <div className="ingredients-list">
                                <Table
                                    dataSource={ingredients}
                                    rowKey={(record, index) => index}
                                    pagination={false}
                                    size="small"
                                    columns={[
                                        {
                                            title: 'Tên thành phần',
                                            dataIndex: 'name',
                                            key: 'name'
                                        },
                                        {
                                            title: 'Giá',
                                            dataIndex: 'price',
                                            key: 'price',
                                            render: (price) => formatPrice(price)
                                        },
                                        {
                                            title: 'Tối đa',
                                            dataIndex: 'maxQuantity',
                                            key: 'maxQuantity',
                                            render: (max) => `${max} phần`
                                        },
                                        {
                                            title: 'Mặc định',
                                            dataIndex: 'defaultQuantity',
                                            key: 'defaultQuantity',
                                            render: (defaultQty) => `${defaultQty} phần`
                                        },
                                        {
                                            title: '',
                                            key: 'action',
                                            render: (_, record, index) => (
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => handleRemoveIngredient(index)}
                                                />
                                            )
                                        }
                                    ]}
                                />
                            </div>

                            {ingredients.length === 0 && (
                                <div className="text-muted" style={{ textAlign: 'center', padding: 20 }}>
                                    Chưa có thành phần nào. Thêm thành phần để khách hàng có thể chọn thêm.
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Dị ứng" className="form-card">
                        <div className="allergens-section">
                            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                                <Input
                                    value={allergenInput}
                                    onChange={(e) => setAllergenInput(e.target.value)}
                                    placeholder="Nhập thành phần dị ứng (VD: Đậu phộng, Hải sản)"
                                    onPressEnter={handleAddAllergen}
                                />
                                <Button type="primary" onClick={handleAddAllergen}>
                                    <PlusOutlined /> Thêm
                                </Button>
                            </Space.Compact>

                            <div className="tags-list">
                                {allergens.map((allergen, index) => (
                                    <Tag
                                        key={index}
                                        color="error"
                                        closable
                                        onClose={() => handleRemoveAllergen(index)}
                                        className="allergen-tag"
                                    >
                                        {allergen}
                                    </Tag>
                                ))}
                                {allergens.length === 0 && (
                                    <span className="text-muted">Không có thành phần dị ứng</span>
                                )}
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col span={8}>
                    <Card title="Hình ảnh" className="form-card">
                        {/* Ảnh mới upload */}
                        {fileList.length > 0 && (
                            <Upload {...uploadProps} className="image-upload" />
                        )}

                        {/* Ảnh hiện tại */}
                        {initialValues?.image_url && fileList.length === 0 && !removeImage && (
                            <div className="current-image">
                                <img src={`${UPLOAD_URL}${initialValues.image_url}`} alt={initialValues.name} />
                                <Button
                                    danger
                                    block
                                    icon={<DeleteOutlined />}
                                    onClick={() => {
                                        setRemoveImage(true);
                                        setFileList([]);
                                    }}
                                >
                                    Xóa ảnh
                                </Button>
                            </div>
                        )}

                        {/* Upload khi chưa có ảnh */}
                        {(!initialValues?.image_url || removeImage) && fileList.length === 0 && (
                            <Upload {...uploadProps} className="image-upload">
                                <div>
                                    <PlusOutlined />
                                    <div>Tải ảnh lên</div>
                                </div>
                            </Upload>
                        )}
                    </Card>

                    <Card title="Giá cả" className="form-card">
                        <Form.Item
                            label="Giá"
                            required
                            validateStatus={formik.errors.price && formik.touched.price ? 'error' : ''}
                            help={formik.touched.price && formik.errors.price}
                        >
                            <InputNumber
                                name="price"
                                value={formik.values.price}
                                onChange={(value) => formik.setFieldValue('price', value)}
                                onBlur={formik.handleBlur}
                                min={0}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                style={{ width: '100%' }}
                                addonAfter="VNĐ"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Giá khuyến mãi"
                            validateStatus={formik.errors.discount_price && formik.touched.discount_price ? 'error' : ''}
                            help={formik.touched.discount_price && formik.errors.discount_price}
                        >
                            <InputNumber
                                name="discount_price"
                                value={formik.values.discount_price}
                                onChange={(value) => formik.setFieldValue('discount_price', value)}
                                onBlur={formik.handleBlur}
                                min={0}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                style={{ width: '100%' }}
                                addonAfter="VNĐ"
                            />
                        </Form.Item>

                        {/* <Form.Item>
                            <Switch
                                checked={drinkOptions.sugar}
                                onChange={(v) => setDrinkOptions({ ...drinkOptions, sugar: v })}
                            /> Cho phép chọn đường
                        </Form.Item> */}

                        {/* <Form.Item>
                            <Switch
                                checked={drinkOptions.ice}
                                onChange={(v) => setDrinkOptions({ ...drinkOptions, ice: v })}
                            /> Cho phép chọn đá
                        </Form.Item> */}

                        <Form.Item>
                            <Switch
                                checked={drinkOptions.toppings}
                                onChange={(v) => setDrinkOptions({ ...drinkOptions, toppings: v })}
                            /> Cho phép topping
                        </Form.Item>

                        <Form.Item>
                            <Switch
                                checked={enableSize}
                                onChange={(checked) => setEnableSize(checked)}
                            /> Có size (S / M / L)
                        </Form.Item>

                        {enableSize && (
                            <Row gutter={10}>
                                <Col span={8}>
                                    <Form.Item label="Size S">
                                        <InputNumber
                                            placeholder='VNĐ'
                                            value={sizePrices.S}
                                            onChange={(v) => setSizePrices({ ...sizePrices, S: v })}
                                            style={{ width: '100%' }}
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        // addonAfter="VNĐ"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label="Size M">
                                        <InputNumber
                                            placeholder='VNĐ'
                                            value={sizePrices.M}
                                            onChange={(v) => setSizePrices({ ...sizePrices, M: v })}
                                            style={{ width: '100%' }}
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        // addonAfter="VNĐ"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label="Size L">
                                        <InputNumber
                                            placeholder='VNĐ'
                                            value={sizePrices.L}
                                            onChange={(v) => setSizePrices({ ...sizePrices, L: v })}
                                            style={{ width: '100%' }}
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        // addonAfter="VNĐ"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}
                    </Card>

                    <Card title="Trạng thái" className="form-card">
                        <Form.Item label="Trạng thái">
                            <Select
                                value={formik.values.status}
                                onChange={(value) => formik.setFieldValue('status', value)}
                            >
                                <Option value="available">Còn món</Option>
                                <Option value="unavailable">Hết món</Option>
                                <Option value="sold_out">Tạm hết</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item>
                            <Switch
                                checked={formik.values.is_recommended}
                                onChange={(checked) => formik.setFieldValue('is_recommended', checked)}
                            /> Món gợi ý
                        </Form.Item>

                        <Form.Item>
                            <Switch
                                checked={formik.values.is_new}
                                onChange={(checked) => formik.setFieldValue('is_new', checked)}
                            /> Món mới
                        </Form.Item>

                        <Form.Item label="Thứ tự hiển thị">
                            <InputNumber
                                name="sort_order"
                                value={formik.values.sort_order}
                                onChange={(value) => formik.setFieldValue('sort_order', value)}
                                min={0}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Card>
                </Col>
            </Row>

            <Form.Item className="form-actions">
                <Space>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={createMutation.isLoading || updateMutation.isLoading}
                        size="large"
                    >
                        {initialValues ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                    <Button onClick={onCancel} size="large">
                        Hủy
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default MenuItemForm;