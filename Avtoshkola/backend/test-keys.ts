import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qnzkwgwdfrtztlwnnnre.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuemt3Z3dkZnJ0enRsd25ubnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NDk2MzksImV4cCI6MjA5NDMyNTYzOX0.EyhB2l6Nu-NLELIQWeoI04nN9FquNtOfzl2nkeAHcw8';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuemt3Z3dkZnJ0enRsd25ubnJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc0OTYzOSwiZXhwIjoyMDk0MzI1NjM5fQ.9TCOpLZNBOzYH5sRrYtbBnWBdlIaGGnvfKJoCqxL64M';

async function test() {
  console.log('Testing Anon Key...');
  const anonClient = createClient(supabaseUrl, anonKey);
  const { error: anonErr } = await anonClient.from('profiles').select('*').limit(1);
  if (anonErr) console.error('Anon Error:', anonErr.message);
  else console.log('Anon Key OK');

  console.log('Testing Service Role Key...');
  const srvClient = createClient(supabaseUrl, serviceRoleKey);
  const { error: srvErr } = await srvClient.from('profiles').select('*').limit(1);
  if (srvErr) console.error('Service Role Error:', srvErr.message);
  else console.log('Service Role Key OK');
}

test();
