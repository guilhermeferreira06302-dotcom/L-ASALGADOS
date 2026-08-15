import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Missing env variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'sabor_gestao_data_v3')
        .single();
    
    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (data && data.value) {
        const val = data.value;
        console.log('--- SUPABASE DATA SUMMARY ---');
        console.log(`Last Updated: ${val.lastUpdated ? new Date(val.lastUpdated).toLocaleString() : 'No timestamp'}`);
        console.log(`Users count: ${val.users?.length || 0}`);
        if (val.users) {
            val.users.forEach((u: any) => console.log(` - User: ${u.name} (${u.role})`));
        }
        console.log(`Products count: ${val.products?.length || 0}`);
        if (val.products) {
            val.products.forEach((p: any) => console.log(` - Product: ${p.name}`));
        }
    } else {
        console.log('No data found for key sabor_gestao_data_v3');
    }
}

main();
