import { supabase } from './supabase';
import { INITIAL_USERS, INITIAL_INGREDIENTS, INITIAL_PRODUCTS } from '../data/initialData';

async function seedDatabase() {
  console.log('Verificando se o banco precisa ser populado...');

  // Verifica se há usuários
  const { data: users, error: userErr } = await supabase.from('users').select('id').limit(1);
  if (userErr) {
    console.error('Erro ao verificar usuários:', userErr);
    return;
  }

  if (users && users.length === 0) {
    console.log('Banco vazio. Populando dados iniciais...');

    // 1. Inserir usuários
    for (const u of INITIAL_USERS) {
      await supabase.from('users').insert({
        name: u.name,
        password: u.password,
        role: u.role,
        position: u.position || (u.role === 'ADMIN' ? 'Administrador' : 'Funcionário'),
        avatar: u.avatar
      });
    }
    console.log('Usuários inseridos.');

    console.log('População de usuários concluída. (Para produtos e categorias, comece a criar pelo sistema!)');

  } else {
    console.log('O banco já possui dados. Nenhuma ação necessária.');
  }
}

seedDatabase();
