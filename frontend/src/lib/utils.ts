import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrentUserRole(): 'STUDENT' | 'TEACHER' | 'ADMIN' | null {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.role || 'STUDENT';
  } catch {
    return 'STUDENT';
  }
}

