// Trip membership RLS tests (#16).
// Runs ONLY against the local Supabase stack (never the remote project):
//   npx supabase start
//   npx supabase db reset        # applies all migrations
//   node supabase/tests/trip-members.test.mjs
// The anon key below is Supabase's public local-demo key, not a secret.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}${!ok && detail ? ` (${detail})` : ''}`);
  if (!ok) failures++;
}

async function newUser(label) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `${label}_${stamp}`;
  const { data, error } = await client.auth.signUp({
    email: `${username}@test.local`,
    password: 'password123',
    options: { data: { username } },
  });
  if (error) throw error;
  return { client, id: data.user.id, username };
}

async function run() {
  const owner = await newUser('owner');
  const friend = await newUser('friend');
  const stranger = await newUser('stranger');

  const { data: trip, error: tripError } = await owner.client
    .from('trips')
    .insert({ owner_id: owner.id, title: 'Members Test', start_date: '2026-12-01', end_date: '2026-12-03' })
    .select()
    .single();
  if (tripError) throw tripError;

  // Owner adds friend as editor
  const add = await owner.client.from('trip_members').insert({ trip_id: trip.id, user_id: friend.id, role: 'editor' });
  check('owner can add an editor', !add.error, add.error?.message);

  // Owner cannot grant 'owner'
  const addOwner = await owner.client.from('trip_members').insert({ trip_id: trip.id, user_id: stranger.id, role: 'owner' });
  check('owner cannot add someone as owner', !!addOwner.error);

  // Owner cannot promote to owner
  const promote = await owner.client
    .from('trip_members').update({ role: 'owner' })
    .eq('trip_id', trip.id).eq('user_id', friend.id).select();
  check('owner cannot promote a member to owner', !!promote.error || (promote.data ?? []).length === 0);

  // Editor cannot add members
  const editorAdd = await friend.client.from('trip_members').insert({ trip_id: trip.id, user_id: stranger.id, role: 'viewer' });
  check('editor cannot add members', !!editorAdd.error);

  // Members can see the member list with usernames
  const list = await friend.client.from('trip_members').select('user_id, role, profiles(username)').eq('trip_id', trip.id);
  check('member sees member list with usernames', !list.error && list.data.length === 2 && list.data.every((m) => m.profiles?.username));

  // Stranger cannot see the member list
  const strangerList = await stranger.client.from('trip_members').select('user_id').eq('trip_id', trip.id);
  check('non-member sees no members', !strangerList.error && strangerList.data.length === 0);

  // Stranger cannot remove the friend
  const strangerRemove = await stranger.client.from('trip_members').delete().eq('trip_id', trip.id).eq('user_id', friend.id).select();
  check('non-member cannot remove a member', (strangerRemove.data ?? []).length === 0);

  // Owner cannot leave (trigger)
  const ownerLeave = await owner.client.from('trip_members').delete().eq('trip_id', trip.id).eq('user_id', owner.id).select();
  check('owner cannot leave', !!ownerLeave.error);

  // Friend can leave
  const leave = await friend.client.from('trip_members').delete().eq('trip_id', trip.id).eq('user_id', friend.id).select();
  check('member can leave the trip', !leave.error && leave.data.length === 1, leave.error?.message);

  // After leaving, a private trip is no longer visible to the friend
  const tripAfter = await friend.client.from('trips').select('id').eq('id', trip.id);
  check('left member no longer sees the private trip', !tripAfter.error && tripAfter.data.length === 0);

  console.log(failures === 0 ? '\nAll membership tests passed.' : `\n${failures} test(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error('Test run crashed:', e.message);
  process.exit(1);
});
