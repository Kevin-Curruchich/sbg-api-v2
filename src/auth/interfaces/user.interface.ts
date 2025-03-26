export default interface User {
  email: string | null;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  user_id: string;
  username: string;
  password_hash: string;
  role_id: string | null;
  admin_programs: { program_id: string }[];
}
