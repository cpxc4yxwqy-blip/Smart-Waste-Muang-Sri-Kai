import React, { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * Global Error Boundary
 * ตัวจับและจัดการ errors ที่เกิดขึ้นในแอปพลิเคชัน
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ล็อกข้อมูล error
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    // บันทึกข้อมูล error ไปยัง localStorage สำหรับ debugging
    const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    errorLogs.push({
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
    });
    
    // เก็บเฉพาะ 20 error logs ล่าสุด
    if (errorLogs.length > 20) {
      errorLogs.shift();
    }
    
    localStorage.setItem('errorLogs', JSON.stringify(errorLogs));

    // ส่ง analytics event
    try {
      if (window.analytics) {
        window.analytics.customEvent('error_boundary_triggered', {
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Failed to send analytics:', e);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorCount: 0 });
    // โหลดหน้าใหม่เพื่อรีเซ็ตสถานะทั้งหมด
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 rounded-full p-4">
                <AlertTriangle size={40} className="text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">
              เกิดข้อผิดพลาด
            </h1>
            <p className="text-slate-600 text-center mb-6 text-sm">
              ขออภัย ระบบพบข้อผิดพลาดที่ไม่คาดคิด
            </p>

            {/* Error Details (สำหรับ Development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-xs font-mono max-h-32 overflow-y-auto">
                <p className="text-red-700 font-bold mb-2">ข้อมูล Error:</p>
                <p className="text-red-600 break-words">{this.state.error.message}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                โหลดใหม่
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all duration-300"
              >
                กลับไปหน้าแรก
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-6">
              ข้อมูล error ได้ถูกบันทึกและจะช่วยให้เราแก้ไขปัญหา
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
