import { toast } from "sonner"

export const toastError = (error: Error | any) => {
  const message = error?.message || 'Đã có lỗi xảy ra.';
  const code = error?.code || '';
  toast.error(message, {
    id: `${message}${code}`, // Deduplicate
    duration: 5000,
  })
}

export const toastSuccess = (message: string) => {
  toast.success(message, {
    id: message, // Deduplicate
    duration: 3000,
  })
}
