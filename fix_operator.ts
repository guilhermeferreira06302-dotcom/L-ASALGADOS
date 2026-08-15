import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function fixOperator() {
  console.log('Fixing operators in ingredients...');
  const { data, error } = await supabase.from('ingredients')
    .update({ operator: 'Sistema' })
    .eq('operator', 'Carlos Mendes');
    
  if (error) {
    console.error('Update ingredients failed:', error);
  } else {
    console.log('Ingredients updated successfully!');
  }

  console.log('Fixing operators in stock_movements...');
  const { data: data2, error: error2 } = await supabase.from('stock_movements')
    .update({ operator: 'Sistema' })
    .eq('operator', 'Carlos Mendes');
    
  if (error2) {
    console.error('Update stock_movements failed:', error2);
  } else {
    console.log('Stock movements updated successfully!');
  }
}

fixOperator();
