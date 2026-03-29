import React from 'react';
import { Result, Button } from 'antd';
import { FrownOutlined } from '@ant-design/icons';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error caught by ErrorBoundary:', error, errorInfo);
        }

        // You can also log to an error reporting service here
        // logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    handleGoBack = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.history.back();
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="error-boundary">
                    <Result
                        icon={<FrownOutlined style={{ color: '#f5222d' }} />}
                        status="error"
                        title="Đã xảy ra lỗi"
                        subTitle="Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau."
                        extra={[
                            <Button type="primary" key="reload" onClick={this.handleReset}>
                                Tải lại trang
                            </Button>,
                            <Button key="back" onClick={this.handleGoBack}>
                                Quay lại
                            </Button>
                        ]}
                    />
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <div className="error-details">
                            <h4>Chi tiết lỗi (Development only):</h4>
                            <p className="error-message">{this.state.error.toString()}</p>
                            <pre className="error-stack">
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

// HOC for using ErrorBoundary with functional components
export const withErrorBoundary = (WrappedComponent, fallback) => {
    return function WithErrorBoundary(props) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
};

// ErrorBoundary styles
const styles = `
.error-boundary {
  padding: 48px 24px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
}

.error-details {
  margin-top: 24px;
  padding: 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
}

.error-details h4 {
  margin: 0 0 12px;
  color: #f5222d;
  font-size: 16px;
}

.error-message {
  color: #f5222d;
  margin-bottom: 12px;
  font-family: monospace;
}

.error-stack {
  background: #fff;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
`;

// Inject styles
const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);

export default ErrorBoundary;