import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import pg from 'pg';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
let pool: any;
let sqliteDb: any;

const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

async function initDatabase() {
  if (isPostgres) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    console.log('PostgreSQL (Supabase) initialized');
  } else {
    await new Promise<void>((resolve, reject) => {
      sqliteDb = new sqlite3.Database('./database.sqlite', (err) => {
        if (err) {
          console.error('Error opening SQLite database:', err.message);
          reject(err);
        } else {
          console.log('SQLite (Local) initialized');
          resolve();
        }
      });
    });
  }

  const schema = `
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY ${isPostgres ? 'SERIAL' : 'AUTOINCREMENT'},
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      other_contact TEXT,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY ${isPostgres ? 'SERIAL' : 'AUTOINCREMENT'},
      client_id INTEGER REFERENCES clients(id),
      brand_name TEXT,
      slogan TEXT,
      description TEXT,
      target_audience TEXT,
      budget TEXT,
      deadline TEXT,
      service_type TEXT,
      graphic_style TEXT,
      selected_colors TEXT,
      custom_colors TEXT,
      typography TEXT,
      references_link TEXT,
      ai_score INTEGER,
      ai_analysis TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY ${isPostgres ? 'SERIAL' : 'AUTOINCREMENT'},
      type TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'paid',
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    if (isPostgres) {
      await pool.query(schema);
    } else {
      const statements = schema.split(';').filter(s => s.trim());
      for (const s of statements) {
        await query(s);
      }
    }
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
}

// Database query wrapper
const query = async (text: string, params: any[] = []) => {
  if (isPostgres) {
    return await pool.query(text, params);
  } else {
    return new Promise((resolve, reject) => {
      // Convert $1, $2... to ? for SQLite
      const sqliteText = text.replace(/\$(\d+)/g, '?');
      
      if (text.trim().toLowerCase().startsWith('select')) {
        sqliteDb.all(sqliteText, params, (err: any, rows: any) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      } else {
        sqliteDb.run(sqliteText, params, function(this: any, err: any) {
          if (err) reject(err);
          else resolve({ rows: [{ id: this.lastID }], rowCount: this.changes });
        });
      }
    });
  }
};


async function startServer() {
  await initDatabase();
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Middleware to check Admin PIN
  const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const pin = req.headers['x-admin-pin'];
    const adminPin = process.env.VITE_ADMIN_PIN || '2026';
    if (pin === adminPin) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.post('/api/projects', async (req, res) => {
    try {
      const { ai_analysis, ai_score, ...formData } = req.body;
      
      // 1. Save to DB
      const clientResult = await query(`
        INSERT INTO clients (name, email, phone, other_contact, address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        formData.clientName || formData.brandName,
        formData.email,
        formData.phone,
        formData.otherContact,
        formData.address
      ]);
      const clientId = clientResult.rows[0].id;

      await query(`
        INSERT INTO projects (
          client_id, brand_name, slogan, description, target_audience, budget, deadline,
          service_type, graphic_style, selected_colors, custom_colors, typography, references_link,
          ai_score, ai_analysis
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        clientId,
        formData.brandName,
        formData.slogan,
        formData.description,
        formData.targetAudience,
        formData.budget,
        formData.deadline,
        JSON.stringify(formData.serviceType),
        JSON.stringify(formData.graphicStyle),
        JSON.stringify(formData.selectedColors),
        formData.customColors,
        JSON.stringify(formData.typography),
        formData.references,
        ai_score,
        JSON.stringify(ai_analysis)
      ]);

      // Emit notification to admin
      io.emit('new_project', { 
        clientName: formData.clientName || formData.brandName,
        brandName: formData.brandName,
        serviceType: formData.serviceType
      });

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get('/api/admin/data', adminAuth, async (req, res) => {
    try {
      const [clientsResult, projectsResult, transactionsResult] = await Promise.all([
        query('SELECT * FROM clients ORDER BY created_at DESC'),
        query('SELECT * FROM projects ORDER BY created_at DESC'),
        query('SELECT * FROM transactions ORDER BY date DESC')
      ]);

      const clients = clientsResult.rows;
      const projects = projectsResult.rows;
      const transactions = transactionsResult.rows;

      // Parse JSON fields in projects
      const parsedProjects = projects.map((p: any) => ({
        ...p,
        service_type: typeof p.service_type === 'string' ? JSON.parse(p.service_type || "[]") : p.service_type,
        graphic_style: typeof p.graphic_style === 'string' ? JSON.parse(p.graphic_style || "[]") : p.graphic_style,
        selected_colors: typeof p.selected_colors === 'string' ? JSON.parse(p.selected_colors || "[]") : p.selected_colors,
        typography: typeof p.typography === 'string' ? JSON.parse(p.typography || "[]") : p.typography,
        ai_analysis: typeof p.ai_analysis === 'string' ? JSON.parse(p.ai_analysis || "{}") : p.ai_analysis,
      }));

      res.json({ clients, projects: parsedProjects, transactions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/admin/transactions', adminAuth, async (req, res) => {
    try {
      const { type, amount, description, date, status } = req.body;
      await query(
        'INSERT INTO transactions (type, amount, description, date, status) VALUES ($1, $2, $3, $4, $5)',
        [type, amount, description, date || new Date().toISOString(), status || 'paid']
      );
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
