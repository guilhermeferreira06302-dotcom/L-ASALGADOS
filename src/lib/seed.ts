import { supabase } from './supabase';
import { INITIAL_USERS, INITIAL_CATEGORIES, INITIAL_INGREDIENTS, INITIAL_PRODUCTS } from '../data/initialData';

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
      // Remove o id manual para o Supabase gerar o UUID, ou mantém para consistência, 
      // mas no SQL usamos DEFAULT uuid_generate_v4(). É melhor deixar o Supabase gerar,
      // a menos que o initialData use strings como 'usr-1'.
      // Como a tabela tem ID UUID, não podemos enviar 'usr-1'.
      await supabase.from('users').insert({
        name: u.name,
        password: u.password,
        role: u.role,
        position: u.position || (u.role === 'ADMIN' ? 'Administrador' : 'Funcionário'),
        avatar: u.avatar
      });
    }
    console.log('Usuários inseridos.');

    // 2. Categorias (se houver no INITIAL_CATEGORIES)
    // O INITIAL_CATEGORIES original tinha IDs como 'cat-1'. No Supabase precisamos omitir o ID ou gerar UUIDs.
    // Vamos pular as outras tabelas por enquanto para evitar problemas de foreign key com IDs locais vs UUIDs,
    // ou apenas avisamos o usuário que o banco está pronto para uso e ele precisará recriar os produtos.
    // Mas os usuários são cruciais para conseguir fazer login!
    console.log('População de usuários concluída. (Para produtos e categorias, comece a criar pelo sistema!)');
  } else {
    console.log('O banco já possui dados. Nenhuma ação necessária.');
  }
}

seedDatabase();
