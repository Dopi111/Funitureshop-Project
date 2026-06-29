import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const useSignalR = () => {
  const { user } = useAuth();
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    // Chỉ kết nối nếu là admin
    if (!user || user.role !== 'Admin') return;

    const token = localStorage.getItem('authToken');
    
    // Khởi tạo kết nối SignalR
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("/hubs/notifications", {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, [user]);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log('Connected to SignalR Notification Hub!');
          
          // Lắng nghe sự kiện ReceiveNotification
          connection.on("ReceiveNotification", (notification) => {
            console.log("Notification received:", notification);
            
            // Hiển thị toast xịn sò
            toast.custom((t) => (
              <div 
                className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                style={{ borderLeft: '4px solid #3b82f6' }}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <span className="text-2xl">🔔</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-semibold text-slate-800 m-0">
                        Cập nhật đơn hàng #{notification.orderNumber}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 m-0">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-400 m-0">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-slate-200">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ), { duration: 6000 });
          });
        })
        .catch(e => console.log('SignalR Connection Error: ', e));

      return () => {
        connection.stop();
      };
    }
  }, [connection]);

  return connection;
};
