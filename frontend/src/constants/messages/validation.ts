export const validationMessages = {
  required: 'Trường này không được để trống.',
  invalidEmail: 'Địa chỉ email không hợp lệ.',
  minLength: (min: number) => `Vui lòng nhập ít nhất ${min} ký tự.`,
  maxLength: (max: number) => `Vui lòng nhập tối đa ${max} ký tự.`,
  passwordMismatch: 'Mật khẩu xác nhận không khớp.',
  numeric: 'Trường này phải là một số.',
};
