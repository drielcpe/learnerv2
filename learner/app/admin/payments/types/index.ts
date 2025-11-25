// Student types
export interface Student {
  id: number;
  student_id: string;
  student_name: string;
  grade: string;
  section: string;
  adviser: string;
  contact_number?: string;
  email?: string;
  address?: string;
  birth_date?: string;
  enrollment_date: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  created_at: string;
  updated_at: string;
}

// Payment Method types
export interface PaymentMethod {
  id: number;
  method_code: string;
  method_name: string;
  description: string;
  is_active: boolean;
  has_qr: boolean;
  qr_code_image?: string;
  account_number?: string;
  account_name?: string;
  instructions: string;
  created_at: string;
  updated_at: string;
}

// Payment types
export interface Payment {
  id: number;
  student_id: number;
  payment_method_id: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  reference_number?: string;
  description?: string;
  due_date?: string;
  transaction_proof?: string;
  uploaded_at?: string;
  admin_notes?: string;
  processed_by?: number;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data (optional - for API responses with joins)
  student?: Student;
  payment_method?: PaymentMethod;
}

// Attendance types
export interface Attendance {
  id: number;
  student_id: number;
  student_name: string;
  grade?: string;
  section?: string;
  attendance?: {
    [day: string]: {
      [period: string]: 'present' | 'absent' | 'late' | 'excused';
    };
  };
}

export type DayKey = string;
export type PeriodKey = string;
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

// Section types
export interface Section {
  id: number;
  grade: string;
  section: string;
  teacher: string;
  room_number?: string;
  student_count: number;
  created_at: string;
  updated_at: string;
}

// Admin User types
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'secretary';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}