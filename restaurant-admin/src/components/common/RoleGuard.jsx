import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const RoleGuard = ({ children, roles, fallback = null }) => {
    const { hasRole } = useAuth();
    const navigate = useNavigate();

    if (!hasRole(roles)) {
        if (fallback) {
            return fallback;
        }

        return (
            <Result
                status="403"
                title="403"
                subTitle="Sorry, you are not authorized to access this page."
                extra={
                    <Button type="primary" onClick={() => navigate(-1)}>
                        Go Back
                    </Button>
                }
            />
        );
    }

    return children;
};

export default RoleGuard;