const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for public operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for service operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database schema setup
const setupDatabase = async () => {
  try {
    // Create tables if they don't exist
    const { error: usersError } = await supabaseAdmin.rpc('create_users_table');
    const { error: productsError } = await supabaseAdmin.rpc('create_products_table');
    const { error: slidersError } = await supabaseAdmin.rpc('create_sliders_table');
    const { error: bannersError } = await supabaseAdmin.rpc('create_banners_table');
    const { error: contentError } = await supabaseAdmin.rpc('create_content_table');
    
    if (usersError) console.log('Users table setup:', usersError.message);
    if (productsError) console.log('Products table setup:', productsError.message);
    if (slidersError) console.log('Sliders table setup:', slidersError.message);
    if (bannersError) console.log('Banners table setup:', bannersError.message);
    if (contentError) console.log('Content table setup:', contentError.message);
    
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup error:', error);
  }
};

// Initialize database on startup
if (process.env.NODE_ENV === 'development') {
  setupDatabase();
}

module.exports = {
  supabase,
  supabaseAdmin,
  setupDatabase
};