import toast from "react-hot-toast";

// Dismiss all existing toasts before showing a new one
const dismissAllAndShow = (toastFunction: () => string) => {
  toast.dismiss();
  return toastFunction();
};

// Custom toast functions that show only one notification at a time
export const showToast = {
  success: (message: string) => {
    return dismissAllAndShow(() => toast.success(message));
  },
  error: (message: string) => {
    return dismissAllAndShow(() => toast.error(message));
  },
  loading: (message: string) => {
    return dismissAllAndShow(() => toast.loading(message));
  },
  custom: (message: string, options?: any) => {
    return dismissAllAndShow(() => toast(message, options));
  },
};

// Export the original toast for cases where we don't want to dismiss others
export { toast };
