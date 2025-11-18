import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'syshub',
  user: 'postgres',
  password: 'syshub2024',
});

async function createAdminUser() {
  try {
    // Gerar hash da senha "senha123"
    const passwordHash = await bcrypt.hash('senha123', 10);
    
    // Criar usuário admin
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = $2, full_name = $3, role = $4
       RETURNING id, email, full_name, role`,
      ['deltagarr@gmail.com', passwordHash, 'Wesley', 'admin']
    );

    console.log('✅ Usuário admin criado/atualizado:', result.rows[0]);
    console.log('📧 Email: deltagarr@gmail.com');
    console.log('🔑 Senha: senha123');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createAdminUser();
