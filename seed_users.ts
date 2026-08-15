import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

const INITIAL_USERS = [
  {
    id: 'usr-1',
    name: 'Carlos Mendes',
    password: '123456',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    position: 'Sócio Gerente'
  },
  {
    id: 'usr-2',
    name: 'Mariana Silva',
    password: '123456',
    role: 'FUNCIONARIO',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    shift: 'Tarde / Noite',
    position: 'Caixa & Atendimento PDV'
  },
  {
    id: 'usr-3',
    name: 'Roberto Chaves',
    password: '123456',
    role: 'FUNCIONARIO',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&auto=format&fit=crop&q=80',
    shift: 'Manhã',
    position: 'Chapeiro'
  }
];

async function seedUsers() {
  console.log('Seeding users...');
  const { data, error } = await supabase.from('users').upsert(INITIAL_USERS);
  if (error) console.error('Error inserting users:', error);
  else console.log('Users inserted successfully!');
}

seedUsers();
