import customtkinter as ctk
from datetime import datetime
from app.db.repositories.movement_repo import MovementRepository
from app.db.repositories.client_repo import ClientRepository
from app.services.accounting_service import AccountingService
from app.ui.styles import *

class TypeChip(ctk.CTkFrame):
    def __init__(self, master, type_name):
        color, text_color = self.get_colors(type_name)
        # Compact Chip
        super().__init__(master, fg_color=color, corner_radius=4, height=18, width=60)
        self.pack_propagate(False)
        
        # Abbreviate
        txt = type_name.upper()
        if txt == "NOTA_DEBITO": txt = "N. DEB"
        elif txt == "NOTA_CREDITO": txt = "N. CRED"
        elif txt == "AJUSTE_FAVOR": txt = "AJUSTE"
        
        ctk.CTkLabel(self, text=txt[:9], font=("Segoe UI", 8, "bold"), text_color=text_color).place(relx=0.5, rely=0.5, anchor="center")

    def get_colors(self, t):
        t = t.upper()
        if t in ["DEUDA", "RECARGO", "NOTA_DEBITO"]: return COLOR_DANGER_BG, COLOR_DANGER
        elif t in ["PAGO", "NOTA_CREDITO", "AJUSTE_FAVOR"]: return COLOR_SUCCESS_BG, COLOR_SUCCESS
        return COLOR_NEUTRAL, "white"

class MovementsView(ctk.CTkFrame):
    def __init__(self, master, client_id=None, **kwargs):
        super().__init__(master, fg_color="transparent", **kwargs)
        self.client_id = client_id
        self.movement_repo = MovementRepository()
        self.client_repo = ClientRepository()
        self.accounting = AccountingService()
        
        # Grid Layout
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(2, weight=1) # Row 2 (History) expands
        
        # State
        self.filter_type = "Todos"
        self.show_annulled = False
        self.search_text = ctk.StringVar()
        self.search_text.trace("w", self.on_filter_change)

        # 1. Profile Header (Compact)
        self.create_header()
        
        # 2. Toolbar (Search, Filters, Actions)
        self.create_toolbar()
        
        # 3. History Card (The "Container")
        self.create_history_card()
        
        if client_id:
            self.refresh_movements()

    def create_header(self):
        self.header_frame = ctk.CTkFrame(self, fg_color="#0F172A", corner_radius=0, height=80)
        self.header_frame.grid(row=0, column=0, sticky="ew")
        self.header_frame.grid_columnconfigure(1, weight=1)
        
        inner = ctk.CTkFrame(self.header_frame, fg_color="transparent")
        inner.pack(fill="both", expand=True, padx=SPACING_CONTAINER, pady=15)
        
        # Left: Identity
        self.info_panel = ctk.CTkFrame(inner, fg_color="transparent")
        self.info_panel.pack(side="left")
        
        self.lbl_name = ctk.CTkLabel(self.info_panel, text="...", font=("Segoe UI", 20, "bold"), text_color="white", anchor="w")
        self.lbl_name.pack(anchor="w")
        
        self.sub_info = ctk.CTkFrame(self.info_panel, fg_color="transparent")
        self.sub_info.pack(anchor="w", pady=(2,0))
        
        # Right: Balance
        self.bal_panel = ctk.CTkFrame(inner, fg_color="transparent")
        self.bal_panel.pack(side="right")
        
        ctk.CTkLabel(self.bal_panel, text="SALDO ACTUAL", font=("Segoe UI", 10, "bold"), text_color=COLOR_TEXT_SEC).pack(anchor="e")
        self.lbl_balance = ctk.CTkLabel(self.bal_panel, text="$0.00", font=("Segoe UI", 28, "bold"), text_color="white")
        self.lbl_balance.pack(anchor="e")
        
        self.lbl_last_act = ctk.CTkLabel(self.bal_panel, text="...", font=("Segoe UI", 11), text_color=COLOR_TEXT_SEC)
        self.lbl_last_act.pack(anchor="e")

    def create_toolbar(self):
        self.toolbar = ctk.CTkFrame(self, height=50, fg_color="transparent")
        self.toolbar.grid(row=1, column=0, sticky="ew", padx=SPACING_CONTAINER, pady=(15, 10))
        
        # Left: Search & Filter
        self.txt_search = ctk.CTkEntry(self.toolbar, placeholder_text="🔍 Filtrar movimientos...", 
                                       width=200, height=32, border_width=1, border_color=COLOR_BORDER,
                                       textvariable=self.search_text)
        self.txt_search.pack(side="left", padx=(0, 15))
        
        self.filter_seg = ctk.CTkSegmentedButton(self.toolbar, values=["Todos", "Deudas", "Pagos"], 
                                                 width=200, height=28, command=self.set_filter_type)
        self.filter_seg.set("Todos")
        self.filter_seg.pack(side="left")
        
        self.switch_annulled = ctk.CTkSwitch(self.toolbar, text="Ver anulados", font=("Segoe UI", 11), 
                                             command=self.toggle_annulled, onvalue=True, offvalue=False,
                                             width=100, height=20, progress_color=COLOR_PRIMARY)
        self.switch_annulled.pack(side="left", padx=20)
        
        # Right: Actions
        self.btn_pay = ctk.CTkButton(self.toolbar, text="REGISTRAR PAGO", width=130, height=32,
                                     fg_color=COLOR_SUCCESS, hover_color=COLOR_SUCCESS_BG, text_color="white",
                                     font=("Segoe UI", 11, "bold"), command=self.add_payment)
        self.btn_pay.pack(side="right", padx=(10, 0))
        
        self.btn_debt = ctk.CTkButton(self.toolbar, text="+ NUEVA DEUDA", width=120, height=32,
                                      fg_color=COLOR_SURFACE_HOVER, hover_color=COLOR_BORDER, text_color=COLOR_DANGER,
                                      font=("Segoe UI", 11, "bold"), command=self.add_debt)
        self.btn_debt.pack(side="right")
        
        self.btn_notify = ctk.CTkButton(self.toolbar, text="💬", width=40, height=32, 
                                        fg_color=COLOR_SURFACE, hover_color=COLOR_SURFACE_HOVER, text_color=COLOR_SUCCESS)

    def create_history_card(self):
        # The "Card" container
        self.card = ctk.CTkFrame(self, fg_color=COLOR_SURFACE, corner_radius=CORNER_RADIUS, border_width=1, border_color=COLOR_BORDER)
        self.card.grid(row=2, column=0, sticky="nsew", padx=SPACING_CONTAINER, pady=(0, SPACING_CONTAINER))
        
        self.card.grid_columnconfigure(0, weight=1)
        self.card.grid_rowconfigure(1, weight=1)
        
        # 1. Card Title
        f_title = ctk.CTkFrame(self.card, fg_color="transparent", height=40)
        f_title.grid(row=0, column=0, sticky="ew", padx=20, pady=5)
        
        self.lbl_mov_title = ctk.CTkLabel(f_title, text="Movimientos", font=("Segoe UI", 14, "bold"), text_color="white")
        self.lbl_mov_title.pack(side="left", pady=10)
        
        # 2. Table Area
        self.table_frame = ctk.CTkFrame(self.card, fg_color="transparent")
        self.table_frame.grid(row=1, column=0, sticky="nsew", padx=2, pady=2)
        
        # Headers
        self.headers = ctk.CTkFrame(self.table_frame, height=30, fg_color="transparent")
        self.headers.pack(fill="x", padx=10)
        self.headers.grid_columnconfigure(2, weight=1) 
        
        cols = [("FECHA", 80, "w"), ("TIPO", 60, "w"), ("DESCRIPCIÓN", 0, "w"), ("IMPORTE", 90, "e")]
        for i, (txt, w, anchor) in enumerate(cols):
            lbl = ctk.CTkLabel(self.headers, text=txt, font=("Segoe UI", 11, "bold"), text_color=COLOR_TEXT_SEC, anchor=anchor)
            if w > 0:
                lbl.configure(width=w)
                lbl.grid(row=0, column=i, padx=5, sticky=anchor)
            else:
                lbl.grid(row=0, column=i, padx=5, sticky="ew")
                
        # Separator
        ctk.CTkFrame(self.table_frame, height=1, fg_color=COLOR_BORDER).pack(fill="x")
        
        # Scrollable
        self.scroll = ctk.CTkScrollableFrame(self.table_frame, fg_color="transparent")
        self.scroll.pack(fill="both", expand=True)

    def load_client(self, client_id):
        self.client_id = client_id
        self.refresh_movements()
        
    def set_filter_type(self, val):
        self.filter_type = val
        self.refresh_movements()
        
    def toggle_annulled(self):
        self.show_annulled = self.switch_annulled.get() == 1
        self.refresh_movements()
        
    def on_filter_change(self, *args):
        self.refresh_movements()

    def refresh_movements(self):
        if not self.client_id: return
        
        client = self.client_repo.get_by_id(self.client_id)
        status = self.accounting.get_client_status(self.client_id)
        movements = self.movement_repo.get_by_client(self.client_id, include_inactive=True)
        
        self.lbl_name.configure(text=client['name'])
        balance = status['balance']
        self.lbl_balance.configure(text=f"${balance:,.2f}")
        
        # Sub Info
        for w in self.sub_info.winfo_children(): w.destroy()
        ctk.CTkLabel(self.sub_info, text=f"{client.get('phone', 'Sin tel.')}", text_color=COLOR_TEXT_SEC, font=("Segoe UI", 12)).pack(side="left")
        
        st_text, st_col = "AL DIA", COLOR_SUCCESS
        if status['status'] in ["VENCIDO", "EXCEDIDO"]: st_text, st_col = status['status'], COLOR_DANGER
        elif balance > 0: st_text, st_col = "CON DEUDA", COLOR_WARNING
        
        ctk.CTkLabel(self.sub_info, text=" • ", text_color=COLOR_TEXT_SEC).pack(side="left")
        ctk.CTkLabel(self.sub_info, text=st_text, text_color=st_col, font=("Segoe UI", 11, "bold")).pack(side="left")
        
        # Last Act
        last_pay = self.movement_repo.get_last_payment(self.client_id)
        if last_pay:
            self.lbl_last_act.configure(text=f"Último pago: ${last_pay.get('credit',0):,.0f} ({str(last_pay['date_time'])[:10]})")
        else:
             self.lbl_last_act.configure(text="")
        
        self.btn_notify.pack_forget()
        if balance > 0: self.btn_notify.pack(side="right", padx=(10, 0))

        # Filter Logic
        query = self.search_text.get().lower()
        visible = []
        for m in movements:
            if not self.show_annulled and m['active'] == 0: continue
            if self.filter_type == "Deudas" and m['type'] not in ["DEUDA", "RECARGO", "NOTA_DEBITO"]: continue
            if self.filter_type == "Pagos" and m['type'] not in ["PAGO", "AJUSTE_FAVOR", "NOTA_CREDITO"]: continue
            if query and query not in m['description'].lower(): continue
            visible.append(m)
            
        self.lbl_mov_title.configure(text=f"Movimientos ({len(visible)})")
        self.render_rows(visible)

    def render_rows(self, movements):
        for w in self.scroll.winfo_children(): w.destroy()
        if not movements:
            self.render_empty()
            return
    
        for i, m in enumerate(movements):
            self.render_row(m, i % 2 == 0)

    def render_empty(self):
        f = ctk.CTkFrame(self.scroll, fg_color="transparent")
        f.pack(fill="x", pady=40)
        ctk.CTkLabel(f, text="No se encontraron movimientos", font=("Segoe UI", 13), text_color=COLOR_TEXT_SEC).pack()

    def render_row(self, m, is_even):
        # Fixed height row
        bg = COLOR_SURFACE if is_even else "#1A2332"
        if m['active'] == 0: bg = "#080C14"
    
        row = ctk.CTkFrame(self.scroll, fg_color=bg, height=36, corner_radius=0)
        row.pack(fill="x", pady=0)
        row.grid_propagate(False) # Fixed height!
    
        row.grid_columnconfigure(2, weight=1)
    
        # 1. Date
        # Convert date to nicer format if possible, otherwise slice str
        d_str = str(m['date_time'])
        d_short = d_str[8:10] + "/" + d_str[5:7] + " " + d_str[11:16]
        ctk.CTkLabel(row, text=d_short, width=80, font=("Segoe UI", 10), 
                     text_color=COLOR_TEXT_SEC, anchor="w").grid(row=0, column=0, padx=(10,5), pady=0, sticky="w")
    
        # 2. Chip
        f_chip = ctk.CTkFrame(row, width=65, height=28, fg_color="transparent")
        f_chip.grid(row=0, column=1, padx=(0,5), pady=0, sticky="w")
        chip = TypeChip(f_chip, m['type'])
        chip.place(relx=0, rely=0.5, anchor="w")
    
        # 3. Desc
        desc = m['description'][:50] + "..." if len(m['description']) > 50 else m['description']
        if m.get('payment_method'): desc += f" ({m['payment_method'][:10]})"
        if m['active'] == 0: desc = "[ANULADO] " + desc
        ctk.CTkLabel(row, text=desc, font=("Segoe UI", 11), text_color=COLOR_TEXT_MAIN, anchor="w").grid(row=0, column=2, padx=(0,10), pady=0, sticky="w")
    
        # 4. Amount
        net = m['debit'] - m['credit']
        col = COLOR_DANGER if net > 0 else COLOR_SUCCESS
        # If paying debt (negative net usually means debt? No. Mov: Debit=Debt, Credit=Pay. Net=Debit-Credit. Positive=Balance Increased(Debt), Negative=Balance Decreased(Pay)) of course.
        # But wait, visually we might want to see payments as negative balance? Or just Green?
        # Standard: +1000 (Debt), -1000 (Pay).
        # Adjust logic if needed. For now: +Red, -Green.
        lbl_amt = ctk.CTkLabel(row, text=f"{net:+,.0f}", width=90, font=("Segoe UI", 12, "bold"), 
                               text_color=col, anchor="e")
        lbl_amt.grid(row=0, column=3, padx=15, pady=0, sticky="e")
    
        # Hover
        if m['active']:
            def enter(e=None): row.configure(fg_color=COLOR_SURFACE_HOVER)
            def leave(e=None): row.configure(fg_color=bg)
            row.bind("<Enter>", enter)
            row.bind("<Leave>", leave)
            row.bind("<Button-1>", lambda e: self.on_row_click(m))

    def on_row_click(self, movement):
        # Stub for modal detail
        print(f"Row click: {movement['id']}")

    def add_debt(self):
        allowed, reason = self.accounting.can_sell(self.client_id, 0)
        if not allowed: return
        from app.ui.transaction_dialog import TransactionDialog
        TransactionDialog(self, "Nueva Deuda", True, self._save_debt)
        
    def add_payment(self):
        from app.ui.transaction_dialog import TransactionDialog
        TransactionDialog(self, "Registrar Pago", False, self._save_pay)
        
    def _save_debt(self, amount, desc, pay_method=None):
        self.accounting.register_movement(self.client_id, "DEUDA", amount, desc)
        self.refresh_movements()
        
    def _save_pay(self, amount, desc, pay_method="Efectivo"):
        method = pay_method if pay_method else "Efectivo"
        prev_balance = self.accounting.get_client_status(self.client_id)['balance']
        movement_id = self.accounting.register_movement(self.client_id, "PAGO", amount, desc, payment_method=method)
        new_balance = self.accounting.get_client_status(self.client_id)['balance']
        self.refresh_movements()

        client = self.client_repo.get_by_id(self.client_id)
        from app.ui.receipt_dialog import ReceiptDialog
        ReceiptDialog(
            self,
            client_name=client['name'],
            client_phone=client.get('phone', ''),
            amount=amount,
            payment_method=method,
            prev_balance=prev_balance,
            new_balance=new_balance,
            description=desc,
            movement_id=movement_id,
        )
