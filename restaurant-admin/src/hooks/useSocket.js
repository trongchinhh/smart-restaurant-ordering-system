import { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../contexts/SocketContext';

export const useSocket = (event, handler) => {
    const context = useContext(SocketContext);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (context?.socket) {
            setIsConnected(true);

            if (event && handler) {
                context.on(event, handler);
            }

            return () => {
                if (event && handler) {
                    context.off(event, handler);
                }
            };
        }
    }, [context, event, handler]);

    const emit = (event, data) => {
        if (context?.socket && isConnected) {
            context.emit(event, data);
        }
    };

    return {
        socket: context?.socket,
        isConnected,
        emit,
        on: context?.on,
        off: context?.off
    };
};