import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function check() {
  const newProd = {
      id: `prod-${Date.now()}`,
      name: "Teste",
      category: "BURGER",
      price: 10.0,
      costPrice: 5.0,
      image: "https://...",
      available: true,
      description: "Teste",
      prepTimeMin: 10,
      recipe: [],
      minStock: 5,
      maxStock: 10,
      salesCountMonthly: 45
  };
  const { data, error } = await supabase.from('products').insert(newProd);
  console.log("Error:", error);
}

check();
