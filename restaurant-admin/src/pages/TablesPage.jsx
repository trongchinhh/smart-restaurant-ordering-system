import React, { useState } from 'react';
import { Row, Col, Button, Modal, Space, Tag } from 'antd';
import { PlusOutlined, QrcodeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import TableList from '../components/tables/TableList';
import TableForm from '../components/tables/TableForm';
import TableQR from '../components/tables/TableQR';
import Loading from '../components/common/Loading';
import { showDeleteConfirm } from '../components/common/ConfirmDialog';
import { useNotification } from '../hooks/useNotification';
import RoleGuard from '../components/common/RoleGuard';
import { usePermissions } from '../hooks/usePermissions';
import './TablesPage.scss';

const TablesPage = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [qrVisible, setQrVisible] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [filters, setFilters] = useState({ status: '', location: '' });

    const queryClient = useQueryClient();
    const { showSuccess, showError } = useNotification();
    const { can } = usePermissions();

    const { data, isLoading } = useQuery(
        ['tables', filters],
        () => apiService.getTables(filters).then(res => res.data)
    );

    const createMutation = useMutation(
        (data) => apiService.createTable(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('tables');
                showSuccess('Thêm bàn thành công');
                setModalVisible(false);
            },
            onError: (error) => {
                showError(error.response?.data?.message || 'Thêm bàn thất bại');
            }
        }
    );

    const updateMutation = useMutation(
        ({ id, data }) => apiService.updateTable(id, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('tables');
                showSuccess('Cập nhật bàn thành công');
                setModalVisible(false);
                setSelectedTable(null);
            },
            onError: (error) => {
                showError(error.response?.data?.message || 'Cập nhật bàn thất bại');
            }
        }
    );

    const deleteMutation = useMutation(
        (id) => apiService.deleteTable(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('tables');
                showSuccess('Xóa bàn thành công');
            },
            onError: (error) => {
                showError(error.response?.data?.message || 'Xóa bàn thất bại');
            }
        }
    );

    const handleAdd = () => {
        setSelectedTable(null);
        setModalVisible(true);
    };

    const handleEdit = (table) => {
        setSelectedTable(table);
        setModalVisible(true);
    };

    const handleDelete = (table) => {
        showDeleteConfirm({
            content: `Bạn có chắc chắn muốn xóa bàn ${table.table_number}?`,
            onOk: () => deleteMutation.mutate(table.id)
        });
    };

    const handleShowQR = (table) => {
        setSelectedTable(table);
        setQrVisible(true);
    };

    const handleSubmit = (values) => {
        if (selectedTable) {
            updateMutation.mutate({ id: selectedTable.id, data: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const handleStatusChange = (filters) => {
        setFilters(filters);
    };

    if (isLoading) {
        return <Loading />;
    }

    const tables = data?.data || [];
    const pagination = data?.pagination;

    return (
        <RoleGuard roles={['admin', 'manager', 'receptionist']}>
            <div className="tables-page">
                <div className="page-header">
                    <h1>Quản lý bàn</h1>
                    <Space>
                        {can('createTable') && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAdd}
                            >
                                Thêm bàn mới
                            </Button>
                        )}
                    </Space>
                </div>

                <TableList
                    tables={tables}
                    pagination={pagination}
                    loading={isLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onShowQR={handleShowQR}
                    onStatusChange={handleStatusChange}
                    canEdit={can('updateTable')}
                    canDelete={can('deleteTable')}
                    canGenerateQR={can('generateQR')}
                />

                <Modal
                    title={selectedTable ? 'Chỉnh sửa bàn' : 'Thêm bàn mới'}
                    open={modalVisible}
                    onCancel={() => {
                        setModalVisible(false);
                        setSelectedTable(null);
                    }}
                    footer={null}
                    width={600}
                >
                    <TableForm
                        initialValues={selectedTable}
                        onSubmit={handleSubmit}
                        loading={createMutation.isLoading || updateMutation.isLoading}
                    />
                </Modal>

                <Modal
                    title={`QR Code - Bàn ${selectedTable?.table_number}`}
                    open={qrVisible}
                    onCancel={() => {
                        setQrVisible(false);
                        setSelectedTable(null);
                    }}
                    footer={null}
                    width={400}
                >
                    {selectedTable && (
                        <TableQR
                            table={selectedTable}
                            onClose={() => setQrVisible(false)}
                        />
                    )}
                </Modal>
            </div>
        </RoleGuard>
    );
};

export default TablesPage;