import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function checkUsers() {
  console.log('--- BUSCANDO DADOS REAIS DO BANCO SUPABASE ---');
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Erro:', error);
  } else {
    console.log(`Encontrados ${data.length} usuários no banco de dados na nuvem:`);
    data.forEach(user => {
      console.log(`- Nome: ${user.name} | Role: ${user.role} | ID: ${user.id}`);
    });
  }
}

checkUsers();
