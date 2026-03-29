import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/lib/locale/vi_VN';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AppRoutes from './AppRoutes';
import './assets/styles/global.scss';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30000
        }
    }
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ConfigProvider locale={viVN}>
                <BrowserRouter>
                    <AuthProvider>
                        <NotificationProvider>
                            <SocketProvider>
                                <AppRoutes />
                                <Toaster
                                    position="top-right"
                                    toastOptions={{
                                        duration: 4000,
                                        style: {
                                            background: '#363636',
                                            color: '#fff'
                                        }
                                    }}
                                />
                            </SocketProvider>
                        </NotificationProvider>
                    </AuthProvider>
                </BrowserRouter>
            </ConfigProvider>
        </QueryClientProvider>
    );
}

export default App;