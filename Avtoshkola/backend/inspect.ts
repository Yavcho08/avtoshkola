import { supabase } from './src/config/supabase';

async function main() {
  console.log('Testing insert with egn = null...');
  const { data: d1, error: e1 } = await supabase
    .from('students')
    .insert({
      profile_id: '8bfed753-af50-455e-b05e-a6a3ed31a099', // using a known valid profile ID from the fetch result
      egn: null,
      status: 'active',
      registration_date: new Date().toISOString().split('T')[0]
    });
  console.log('Insert with EGN null result:', { d1, e1 });

  console.log('Testing insert with empty egn...');
  const { data: d2, error: e2 } = await supabase
    .from('students')
    .insert({
      profile_id: '8bfed753-af50-455e-b05e-a6a3ed31a099',
      egn: '',
      status: 'active',
      registration_date: new Date().toISOString().split('T')[0]
    });
  console.log('Insert with EGN empty result:', { d2, e2 });
}

main().catch(console.error);
