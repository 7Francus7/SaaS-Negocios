import os
import sqlite3
from datetime import datetime

DB_NAME = "cuentas_corrientes.db"

class Database:
    def __init__(self, db_path=None):
        if db_path:
             self.db_path = db_path
        else:
             # Default to matching the script location or valid workspace path
             # For this environment, we'll assume it sits in the app root or logic handled by caller
             self.db_path = DB_NAME

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Access columns by name
        return conn

    def init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        # Enable WAL mode for better concurrency
        cursor.execute("PRAGMA journal_mode=WAL;")
        
        # TABLES
        # 1. Config
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT
        );
        """)

        # 2. Clients
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            dni_cuit TEXT UNIQUE,
            address TEXT,
            email TEXT,
            credit_limit REAL DEFAULT 0,
            grace_days INTEGER DEFAULT 0,
            interest_rate REAL DEFAULT 10.0,
            preference_reminder TEXT DEFAULT 'whatsapp',
            notes TEXT,
            iva_condition TEXT,
            payment_term TEXT,
            status TEXT DEFAULT 'Activo',
            active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 3. Movements
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            type TEXT NOT NULL,
            debit REAL DEFAULT 0, 
            credit REAL DEFAULT 0,
            description TEXT,
            reference TEXT,
            user TEXT DEFAULT 'admin',
            payment_method TEXT,
            active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id)
        );
        """)
        
        # MIGRATION: Add missing columns if they don't exist (Safe ALTER)
        # Clients 
        try: cursor.execute("ALTER TABLE clients ADD COLUMN notes TEXT") 
        except: pass
        try: cursor.execute("ALTER TABLE clients ADD COLUMN iva_condition TEXT") 
        except: pass
        try: cursor.execute("ALTER TABLE clients ADD COLUMN payment_term TEXT") 
        except: pass
        try: cursor.execute("ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'Activo'") 
        except: pass
        
        # Movements
        try: cursor.execute("ALTER TABLE movements ADD COLUMN payment_method TEXT")
        except: pass
        try: cursor.execute("ALTER TABLE movements ADD COLUMN products TEXT")
        except: pass
        
        # Indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_movements_client ON movements(client_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_movements_date ON movements(date_time);")

        # 4. Notifications
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            date_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            channel TEXT DEFAULT 'whatsapp',
            status TEXT,
            error TEXT,
            payload TEXT,
            FOREIGN KEY (client_id) REFERENCES clients(id)
        );
        """)

        conn.commit()
        conn.close()

db = Database()
