from datetime import datetime, timedelta
from app.db.repositories.client_repo import ClientRepository
from app.db.repositories.movement_repo import MovementRepository
from app.db.database import db

class AccountingService:
    def __init__(self):
        self.client_repo = ClientRepository()
        self.movement_repo = MovementRepository()

    def get_client_status(self, client_id):
        balance = self.movement_repo.get_balance(client_id)
        limit = 0 
        client = self.client_repo.get_by_id(client_id)
        if client:
            limit = client['credit_limit']
        
        status = "AL DIA"
        aging = self.calculate_aging(client_id, client['payment_term'] if client.get('payment_term') else 7)
        
        if balance > 0:
            status = "CON DEUDA"
            if aging['overdue'] > 0:
                status = "VENCIDO"
            if balance > limit:
                status = "EXCEDIDO"
        
        return {
            "balance": balance,
            "status": status,
            "credit_limit": limit,
            "aging": aging
        }

    def register_movement(self, client_id, type_mov, amount, description, reference="", user="admin", payment_method=None, products=None):
        debit = 0
        credit = 0

        if type_mov in ["DEUDA", "RECARGO", "NOTA_DEBITO"]:
            debit = amount
        elif type_mov in ["PAGO", "AJUSTE_FAVOR", "NOTA_CREDITO"]:
            credit = amount

        data = {
            "client_id": client_id,
            "type": type_mov,
            "debit": debit,
            "credit": credit,
            "description": description,
            "reference": reference,
            "user": user,
            "payment_method": payment_method,
            "products": products
        }
        return self.movement_repo.create(data)

    def calculate_aging(self, client_id, term_days=7):
        """
        Calculates how much of the debt is 'Overdue' (Vencido) vs 'Coming Due' (A Vencer).
        Simplified 'Balance Aging' approach:
        1. Get current balance.
        2. Sum up Debts from (Now - Term) to Now. This is 'Fresh Debt' (A Vencer).
        3. Any balance remaining is 'Overdue'.
        """
        current_balance = self.movement_repo.get_balance(client_id)
        if current_balance <= 0:
            return {"overdue": 0, "fresh": 0}
            
        # Get movements within the 'Fresh' window (LAST X DAYS)
        # Note: Ideally we match invoices, but for Cta Cte aggregate, this standard approach works.
        conn = db.get_connection()
        cutoff_date = (datetime.now() - timedelta(days=term_days)).strftime("%Y-%m-%d %H:%M:%S")
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT SUM(debit) as fresh_debt 
            FROM movements 
            WHERE client_id = ? AND active = 1 AND date_time >= ? 
            AND type IN ('DEUDA', 'RECARGO', 'NOTA_DEBITO')
        """, (client_id, cutoff_date))
        
        row = cursor.fetchone()
        conn.close()
        
        fresh_debt_issued = row['fresh_debt'] if row and row['fresh_debt'] else 0
        
        # Logic: If I owe 1000 total, and I bought 200 yesterday (fresh), then 800 is old.
        # But if I paid recently? Payments usually cover oldest debt (FIFO). 
        # So yes, Fresh Debt is the upper cap of what ISNT overdue.
        # But wait, if I have credit note? 
        # Simplified: Overdue = Max(0, Balance - Fresh_Debt_Issued_In_Window)
        
        overdue = max(0, current_balance - fresh_debt_issued)
        fresh = current_balance - overdue
        
        return {"overdue": overdue, "fresh": fresh}

    def can_sell(self, client_id, amount_to_add):
        status = self.get_client_status(client_id)
        client = self.client_repo.get_by_id(client_id)
        
        # 1. Check Status
        if str(client.get('status')).lower() == 'blocked':
            return False, "Cliente BLOQUEADO administrativamente."

        # 2. Check Limit
        new_balance = status['balance'] + amount_to_add
        if new_balance > client['credit_limit']:
            # Allow tolerance? No, strict for now.
            return False, f"Supera límite de crédito. (Limite: ${client['credit_limit']})"

        # 3. Check Overdue
        # Configurable strictness. If has ANY overdue? or threshold?
        # Let's say if Overdue > 0, block.
        if status['aging']['overdue'] > 0:
             return False, f"Cliente con deuda VENCIDA de ${status['aging']['overdue']:,.2f}."
             
        return True, "OK"

    def get_sales_chart_data(self, days=7):
        conn = db.get_connection()
        cursor = conn.cursor()
        
        dates = []
        sales = []
        collections = []
        
        for i in range(days-1, -1, -1):
            d = datetime.now() - timedelta(days=i)
            d_str = d.strftime("%Y-%m-%d")
            dates.append(d.strftime("%d/%m"))
            
            # Sales (Deuda generated) - Exclude initial adjustments if needed, but normally DEUDA is sales
            cursor.execute("SELECT SUM(debit) as val FROM movements WHERE type IN ('DEUDA', 'NOTA_DEBITO', 'RECARGO') AND active=1 AND date(date_time) = date(?)", (d_str,))
            row = cursor.fetchone()
            sales.append(row['val'] if row and row['val'] else 0)
            
            # Collections (Pagos)
            cursor.execute("SELECT SUM(credit) as val FROM movements WHERE type IN ('PAGO', 'NOTA_CREDITO', 'AJUSTE_FAVOR') AND active=1 AND date(date_time) = date(?)", (d_str,))
            row = cursor.fetchone()
            collections.append(row['val'] if row and row['val'] else 0)
            
        conn.close()
        return {"dates": dates, "sales": sales, "collections": collections}

    def get_recent_global_movements(self, limit=5):
        conn = db.get_connection()
        cursor = conn.cursor()
        # Join with clients to get name
        query = """
        SELECT m.*, c.name as client_name 
        FROM movements m
        JOIN clients c ON m.client_id = c.id
        WHERE m.active = 1
        ORDER BY m.date_time DESC 
        LIMIT ?
        """
        cursor.execute(query, (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
        
    def get_dashboard_metrics(self):
        clients = self.client_repo.get_all()
        
        total_debt_vencida = 0
        total_debt_fresh = 0
        collected_today = 0
        limit_exceeded_count = 0
        top_debtors = []
        
        # Calculate Collected Today
        # Efficient query
        conn = db.get_connection()
        today = datetime.now().strftime("%Y-%m-%d")
        cursor = conn.cursor()
        cursor.execute("SELECT SUM(credit) as collected FROM movements WHERE type='PAGO' AND date(date_time) = date(?)", (today,))
        row = cursor.fetchone()
        collected_today = row['collected'] if row and row['collected'] else 0
        conn.close()
        
        total_receivable = 0
        
        for c in clients:
            st = self.get_client_status(c['id'])
            bal = st['balance']
            
            if bal > 0:
                total_receivable += bal
                total_debt_vencida += st['aging']['overdue']
                total_debt_fresh += st['aging']['fresh']
                
                if bal > c['credit_limit']:
                    limit_exceeded_count += 1
                
                top_debtors.append({
                    "name": c['name'],
                    "balance": bal,
                    "status": "Vencido" if st['aging']['overdue'] > 0 else "Al Día"
                })

        top_debtors.sort(key=lambda x: x['balance'], reverse=True)
        
        return {
            "total_receivable": total_receivable,
            "overdue_debt": total_debt_vencida,
            "due_7_days": total_debt_fresh, # Reusing this field name to mean "Not Overdue"
            "collected_today": collected_today,
            "limit_exceeded_count": limit_exceeded_count,
            "top_debtors": top_debtors[:5]
        }
