// Script to set up database schema in Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('Setting up Supabase database schema...');
  
  // Create Supabase client with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // SQL statements to create tables
  const createTablesSQL = `
    -- Table: users (if not exists)
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table: photos
    DROP TABLE IF EXISTS photos CASCADE;
    CREATE TABLE photos (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        storage_path TEXT NOT NULL,
        file_url TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table: models
    DROP TABLE IF EXISTS models CASCADE;
    CREATE TABLE models (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        model_id TEXT NOT NULL,
        trigger_word VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Processing',
        parameters JSONB NOT NULL,
        version_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table: model_photos
    DROP TABLE IF EXISTS model_photos CASCADE;
    CREATE TABLE model_photos (
        id SERIAL PRIMARY KEY,
        model_id INT REFERENCES models(id) ON DELETE CASCADE,
        photo_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table: generations
    DROP TABLE IF EXISTS generations CASCADE;
    CREATE TABLE generations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        model_id INT REFERENCES models(id) ON DELETE SET NULL,
        prompt TEXT NOT NULL,
        enhanced_prompt TEXT,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  try {
    // Execute SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: createTablesSQL });
    
    if (error) {
      console.error('Error creating tables:', error);
      
      // Alternative approach if rpc fails
      console.log('Trying alternative approach...');
      
      // Split SQL into individual statements
      const statements = createTablesSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      // Execute each statement
      for (const statement of statements) {
        const { error } = await supabase.sql(statement + ';');
        if (error) {
          console.error('Error executing SQL:', error);
          console.error('Failed statement:', statement);
        }
      }
    } else {
      console.log('Database schema created successfully');
    }
  } catch (err) {
    console.error('Error setting up database:', err);
    
    // Last resort: log SQL for manual execution
    console.log('\nPlease execute this SQL manually in the Supabase SQL editor:');
    console.log(createTablesSQL);
  }
}

// Run the setup
setupDatabase().catch(console.error); 