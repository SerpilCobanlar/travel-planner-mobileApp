const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = `testuser${Math.floor(Math.random()*10000)}@gmail.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123'
  });
  if (authError) throw authError;

  const uid = authData.user.id;
  
  // Trip A: 2026-09-01
  const { data: tripA, error: errA } = await supabase.from('trips').insert({
    owner_id: uid, title: 'Trip A', start_date: '2026-09-01', end_date: '2026-09-01'
  }).select().single();
  if (errA) throw errA;
  const { data: daysA } = await supabase.from('trip_days').select('*').eq('trip_id', tripA.id).order('day_number');
  
  // Trip B: 2026-09-10 to 2026-09-12
  const { data: tripB, error: errB } = await supabase.from('trips').insert({
    owner_id: uid, title: 'Trip B', start_date: '2026-09-10', end_date: '2026-09-12'
  }).select().single();
  if (errB) throw errB;
  const { data: daysB } = await supabase.from('trip_days').select('*').eq('trip_id', tripB.id).order('day_number');

  // Trip C: 2026-12-30 to 2027-01-02
  const { data: tripC, error: errC } = await supabase.from('trips').insert({
    owner_id: uid, title: 'Trip C', start_date: '2026-12-30', end_date: '2027-01-02'
  }).select().single();
  if (errC) throw errC;
  const { data: daysC } = await supabase.from('trip_days').select('*').eq('trip_id', tripC.id).order('day_number');

  console.log('--- TEST RESULTS ---');
  console.log('Trip A days:', daysA.length, daysA.map(d => `${d.day_number}: ${d.day_date}`));
  console.log('Trip B days:', daysB.length, daysB.map(d => `${d.day_number}: ${d.day_date}`));
  console.log('Trip C days:', daysC.length, daysC.map(d => `${d.day_number}: ${d.day_date}`));
}

run().catch(console.error);
