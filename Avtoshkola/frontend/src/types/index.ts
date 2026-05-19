// ─── Enum Literal Types ───────────────────────────────────────────────────────
// Must stay in sync with the backend src/types/index.ts and the Supabase schema.

export type UserRole = 'admin' | 'instructor' | 'student';
export type StudentStatus = 'active' | 'graduated' | 'dropped';
export type VehicleStatus = 'active' | 'in_repair' | 'retired';
export type LessonType = 'theory' | 'practice';
export type LessonStatus = 'scheduled' | 'completed' | 'cancelled';
export type ExamType =
  | 'internal_theory'
  | 'internal_practice'
  | 'state_theory'
  | 'state_practice';
export type ExamStatus = 'scheduled' | 'passed' | 'failed';
export type PaymentType =
  | 'installment'
  | 'full_course'
  | 'extra_hours'
  | 'state_exam_fee';
export type PaymentStatus = 'pending' | 'paid' | 'overdue';
export type ExpenseCategory =
  | 'vehicle_maintenance'
  | 'fuel'
  | 'salaries'
  | 'rent'
  | 'other';

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string | null;
}

export interface Instructor {
  id: string;
  profile_id: string;
  license_number: string;
  is_active: boolean;
}

export interface Student {
  id: string;
  profile_id: string;
  egn: string;
  registration_date: string;
  status: StudentStatus;
}

export interface Category {
  id: string;
  name: string;
}

export interface Vehicle {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  category_id: string;
  technical_inspection_date: string;
  status: VehicleStatus;
}

export interface StudentCategory {
  id: string;
  student_id: string;
  category_id: string;
  instructor_id: string;
  readiness_status: number;
}

export interface Lesson {
  id: string;
  student_id: string;
  instructor_id: string;
  vehicle_id: string | null;
  type: LessonType;
  start_time: string;
  end_time: string;
  location: string | null;
  status: LessonStatus;
  instructor_notes: string | null;
  grade: number | null;
}

export interface Exam {
  id: string;
  student_id: string;
  type: ExamType;
  exam_date: string;
  status: ExamStatus;
  score: number | null;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  due_date: string;
  payment_date: string | null;
  invoice_number: string | null;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  category: ExpenseCategory;
}

// ─── Joined / Composite Types (mirrors backend JOIN responses) ────────────────

export interface InstructorWithProfile extends Instructor {
  profiles: Profile;
}

export interface StudentWithProfile extends Student {
  profiles: Profile;
}

export interface VehicleWithCategory extends Vehicle {
  categories: Category;
}

export interface LessonWithRelations extends Lesson {
  students: StudentWithProfile;
  instructors: InstructorWithProfile;
  vehicles: Vehicle | null;
}

export interface ExamWithStudent extends Exam {
  students: StudentWithProfile;
}

export interface PaymentWithStudent extends Payment {
  students: StudentWithProfile;
}

// ─── Auth Context Types ───────────────────────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  profile: Profile;
}

// ─── API Response Envelope ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  error: string | null;
}

// ─── Dashboard / Aggregation Types ───────────────────────────────────────────

export interface AdminDashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalInstructors: number;
  activeInstructors: number;
  totalVehicles: number;
  activeVehicles: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  upcomingExams: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
  overduePayments: number;
}

export interface StudentProgressSummary {
  completedTheoryHours: number;
  completedPracticeHours: number;
  requiredTheoryHours: number;
  requiredPracticeHours: number;
  examsPassed: number;
  examsFailed: number;
  totalPaid: number;
  totalOwed: number;
}
