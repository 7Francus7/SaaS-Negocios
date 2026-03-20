from app.db.database import db

class MovementRepository:
    def create(self, movement_data):
        conn = db.get_connection()
        cursor = conn.cursor()
        query = """
        INSERT INTO movements (client_id, type, debit, credit, description, reference, user, payment_method, products, date_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        """
        try:
            cursor.execute(query, (
                movement_data.get('client_id'),
                movement_data.get('type'),
                movement_data.get('debit', 0),
                movement_data.get('credit', 0),
                movement_data.get('description'),
                movement_data.get('reference'),
                movement_data.get('user', 'admin'),
                movement_data.get('payment_method'),
                movement_data.get('products')
            ))
            mid = cursor.lastrowid
            conn.commit()
            return mid
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    def get_by_client(self, client_id, include_inactive=False):
        conn = db.get_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM movements WHERE client_id = ?"
        if not include_inactive:
            query += " AND active = 1"
        query += " ORDER BY date_time DESC, id DESC"
        
        cursor.execute(query, (client_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_balance(self, client_id):
        conn = db.get_connection()
        cursor = conn.cursor()
        query = """
        SELECT SUM(debit - credit) as balance
        FROM movements
        WHERE client_id = ? AND active = 1
        """
        cursor.execute(query, (client_id,))
        row = cursor.fetchone()
        conn.close()
        return row['balance'] if row and row['balance'] is not None else 0.0

    def soft_delete(self, movement_id, user='admin'):
        """
        Anular movimiento: Instead of deleting, we could mark as active=0 
        OR create a compensatory movement. 
        The prompt suggests 'anulación sin borrar historial (soft delete o movimiento compensatorio)'.
        Soft delete is easier for queries, but compensatory is better for strict accounting.
        Let's do soft delete for simplicity as per 'CONDICIONES GENERALES'.
        """
        conn = db.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("UPDATE movements SET active = 0, description = description || ' [ANULADO]' WHERE id = ?", (movement_id,))
            conn.commit()
        finally:
            conn.close()

    def get_last_movement_date(self, client_id):
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(date_time) as last_date FROM movements WHERE client_id = ? AND active = 1", (client_id,))
        row = cursor.fetchone()
        conn.close()
        return row['last_date']

    def get_last_payment(self, client_id):
        conn = db.get_connection()
        cursor = conn.cursor()
        query = """
        SELECT date_time, credit, description 
        FROM movements 
        WHERE client_id = ? AND credit > 0 AND active = 1 
        ORDER BY date_time DESC LIMIT 1
        """
        cursor.execute(query, (client_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    def get_last_debt(self, client_id):
        conn = db.get_connection()
        cursor = conn.cursor()
        query = """
        SELECT date_time, debit, description 
        FROM movements 
        WHERE client_id = ? AND debit > 0 AND active = 1 
        ORDER BY date_time DESC LIMIT 1
        """
        cursor.execute(query, (client_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
