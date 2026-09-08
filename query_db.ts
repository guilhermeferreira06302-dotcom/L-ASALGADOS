import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .order('date', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log('Latest 10 stock movements:');
  data.forEach(mov => {
    console.log(`Date: ${mov.date}, Type: ${mov.type}, Product: ${mov.ingredientName}`);
  });
}

run();
