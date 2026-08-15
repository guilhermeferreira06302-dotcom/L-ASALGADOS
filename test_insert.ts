import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function testInsert() {
  console.log('Testing insert...');
  const { data, error } = await supabase.from('users').insert({
    id: `usr-${Date.now()}`,
    name: 'Test Insert',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    password: '123'
  });
  
  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert succeeded!', data);
  }
}

testInsert();
