import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qnzkwgwdfrtztlwnnnre.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuemt3Z3dkZnJ0enRsd25ubnJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc0OTYzOSwiZXhwIjoyMDk0MzI1NjM5fQ.9TCOpLZNBOzYH5sRrYtbBnWBdlIaGGnvfKJoCqxL64M';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('Fetching users...');
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  let adminId = users.find(u => u.email === 'admin_real@avtoshkola.local')?.id;
  let instId = users.find(u => u.email === 'instructor_real@avtoshkola.local')?.id;
  let studId = users.find(u => u.email === 'student_real@avtoshkola.local')?.id;

  if (!adminId) {
    const { data } = await supabase.auth.admin.createUser({ email: 'admin_real@avtoshkola.local', password: 'password123', email_confirm: true });
    adminId = data?.user?.id;
  }
  if (!instId) {
    const { data } = await supabase.auth.admin.createUser({ email: 'instructor_real@avtoshkola.local', password: 'password123', email_confirm: true });
    instId = data?.user?.id;
  }
  if (!studId) {
    const { data } = await supabase.auth.admin.createUser({ email: 'student_real@avtoshkola.local', password: 'password123', email_confirm: true });
    studId = data?.user?.id;
  }

  console.log('Updating profiles...');
  if (adminId) {
    await supabase.from('profiles').upsert({ id: adminId, role: 'admin', first_name: 'Admin', last_name: 'Adminov', phone: '0888111222' });
  }
  if (instId) {
    await supabase.from('profiles').upsert({ id: instId, role: 'instructor', first_name: 'Ivan', last_name: 'Ivanov', phone: '0888333444' });
    const { data: existingInst } = await supabase.from('instructors').select('id').eq('profile_id', instId);
    if (!existingInst || existingInst.length === 0) {
      await supabase.from('instructors').insert({ profile_id: instId, license_number: 'LIC-' + Date.now(), is_active: true });
    }
  }
  if (studId) {
    await supabase.from('profiles').upsert({ id: studId, role: 'student', first_name: 'Petar', last_name: 'Petrov', phone: '0888555666' });
    const { data: existingStud } = await supabase.from('students').select('id').eq('profile_id', studId);
    if (!existingStud || existingStud.length === 0) {
      await supabase.from('students').insert({ profile_id: studId, egn: '990101' + Math.floor(1000 + Math.random() * 9000), status: 'active' });
    }
  }

  console.log('Done! You can login with:');
  console.log('Admin: admin_real@avtoshkola.local / password123');
  console.log('Instructor: instructor_real@avtoshkola.local / password123');
  console.log('Student: student_real@avtoshkola.local / password123');
}

run();