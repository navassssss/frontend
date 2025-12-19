import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

export interface Student {
  id: string;
  username: string;
  name: string;
  email: string;
  photo?: string;
  department?: string;
  class: string;
  rollNumber: string;
  joinedAt: string;
  totalPoints: number;
  stars: number;
  monthlyPoints: number;
  walletBalance: number;
  opening_balance?: number;
}

interface StudentAuthContextType {
  student: Student | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined);

export function StudentAuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('student_token');

      // If student token exists, clear any staff session
      if (token) {
        localStorage.removeItem('token');
      }

      if (token) {
        try {
          const response = await api.get('/student/me');
          const { user, student: studentData } = response.data;

          setStudent({
            id: studentData.id,
            username: studentData.username,
            name: user.name,
            email: user.email,
            photo: studentData.photo,
            department: studentData.class?.department,
            class: studentData.class?.name || 'Not Assigned',
            rollNumber: studentData.roll_number,
            joinedAt: studentData.joined_at,
            totalPoints: studentData.total_points,
            stars: studentData.stars,
            monthlyPoints: studentData.monthly_points,
            walletBalance: parseFloat(studentData.wallet_balance) || 0,
            opening_balance: parseFloat(studentData.opening_balance) || 0,
          });
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem('student_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Clear any existing staff session
      localStorage.removeItem("token");

      const response = await api.post('/student/login', {
        login: username, // Can be email or username
        password,
      });

      const { token, user, student: studentData } = response.data;

      // Store token
      localStorage.setItem('student_token', token);

      // Update state
      setStudent({
        id: studentData.id,
        username: studentData.username,
        name: user.name,
        email: user.email,
        photo: studentData.photo,
        department: studentData.class?.department,
        class: studentData.class?.name || 'Not Assigned',
        rollNumber: studentData.roll_number,
        joinedAt: studentData.joined_at,
        totalPoints: studentData.total_points,
        stars: studentData.stars,
        monthlyPoints: studentData.monthly_points,
        walletBalance: parseFloat(studentData.wallet_balance) || 0,
        opening_balance: parseFloat(studentData.opening_balance) || 0,
      });

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await api.post('/student/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call result
      localStorage.removeItem('student_token');
      setStudent(null);
    }
  };

  return (
    <StudentAuthContext.Provider value={{
      student,
      isAuthenticated: !!student,
      isLoading,
      login,
      logout
    }}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const context = useContext(StudentAuthContext);
  if (context === undefined) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return context;
}
