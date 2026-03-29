import React from 'react';
import { Result, Button } from 'antd-mobile';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <Result
                        status="error"
                        title="Đã xảy ra lỗi"
                        description="Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại."
                    />
                    <Button color="primary" onClick={this.handleReset}>
                        Tải lại trang
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;