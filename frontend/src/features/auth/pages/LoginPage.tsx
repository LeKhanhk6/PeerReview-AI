import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { loginApi } from '../api/auth.api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkAuth, isAuthenticated, setAuth, user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const defaultDashboard = `/${user.role.toLowerCase()}/dashboard`;
      navigate(defaultDashboard, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await loginApi(data);
      const userObj = response.user;
      const token = (response as any).accessToken || (response as any).token;
      setAuth(userObj, token);
      
      try {
        await checkAuth();
      } catch (e) {
        // If checkAuth fails, setAuth still has valid user object
      }

      toast.success('Login successful!');
      
      if (userObj?.role) {
        navigate(`/${userObj.role.toLowerCase()}/dashboard`, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            PeerReview AI
          </h2>
          <p className="mt-4 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {new URLSearchParams(window.location.search).get('reason') === 'locked' && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-800 text-center">
            ⚠️ Phiên làm việc đã kết thúc hoặc tài khoản của bạn đã bị khóa bởi Quản trị viên.
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`appearance-none block w-full px-3 py-2.5 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors ${
                    errors.email 
                      ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={`appearance-none block w-full px-3 py-2.5 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors ${
                    errors.password 
                      ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full flex justify-center py-3"
              isLoading={isSubmitting}
            >
              Sign in
            </Button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Register now
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
