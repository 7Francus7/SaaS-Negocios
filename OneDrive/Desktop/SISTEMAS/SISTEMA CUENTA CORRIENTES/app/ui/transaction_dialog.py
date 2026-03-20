import customtkinter as ctk
import json
from app.ui.styles import *


class ProductRow(ctk.CTkFrame):
    def __init__(self, master, on_change, on_delete, **kwargs):
        super().__init__(master, fg_color="transparent", **kwargs)
        self.on_change = on_change

        self.grid_columnconfigure(0, weight=3)
        self.grid_columnconfigure(2, weight=2)

        self.name_var = ctk.StringVar()
        self.qty_var = ctk.StringVar(value="1")
        self.price_var = ctk.StringVar()

        self.name_var.trace("w", lambda *a: self.on_change())
        self.qty_var.trace("w", lambda *a: self.on_change())
        self.price_var.trace("w", lambda *a: self.on_change())

        self.ent_name = ctk.CTkEntry(
            self, textvariable=self.name_var, placeholder_text="Producto",
            fg_color=COLOR_SURFACE, border_color=COLOR_BORDER,
            text_color=COLOR_TEXT_MAIN, height=28
        )
        self.ent_name.grid(row=0, column=0, padx=(0, 4), sticky="ew")

        self.ent_qty = ctk.CTkEntry(
            self, textvariable=self.qty_var, width=48, justify="center",
            fg_color=COLOR_SURFACE, border_color=COLOR_BORDER,
            text_color=COLOR_TEXT_MAIN, height=28
        )
        self.ent_qty.grid(row=0, column=1, padx=4)

        self.ent_price = ctk.CTkEntry(
            self, textvariable=self.price_var, placeholder_text="$",
            fg_color=COLOR_SURFACE, border_color=COLOR_BORDER,
            text_color=COLOR_TEXT_MAIN, height=28, width=85
        )
        self.ent_price.grid(row=0, column=2, padx=4)

        self.lbl_subtotal = ctk.CTkLabel(
            self, text="$0", width=68, font=("Segoe UI", 11, "bold"),
            text_color=COLOR_TEXT_SEC, anchor="e"
        )
        self.lbl_subtotal.grid(row=0, column=3, padx=(4, 4))

        ctk.CTkButton(
            self, text="x", width=22, height=22,
            fg_color=COLOR_DANGER, hover_color=COLOR_DANGER_BG,
            text_color="white", font=("Segoe UI", 9, "bold"),
            command=lambda: on_delete(self)
        ).grid(row=0, column=4)

    def get_subtotal(self):
        try:
            return float(self.qty_var.get() or 0) * float(self.price_var.get() or 0)
        except ValueError:
            return 0

    def get_data(self):
        return {
            "name": self.name_var.get().strip(),
            "qty": self._safe_float(self.qty_var.get(), 1),
            "price": self._safe_float(self.price_var.get(), 0),
        }

    def _safe_float(self, val, default):
        try:
            return float(val)
        except ValueError:
            return default

    def update_subtotal(self):
        st = self.get_subtotal()
        self.lbl_subtotal.configure(text=f"${st:,.0f}")


class TransactionDialog(ctk.CTkToplevel):
    def __init__(self, parent, title, is_debit, callback):
        super().__init__(parent)
        self.callback = callback
        self.is_debit = is_debit
        self.product_rows = []

        self.title(title)
        self.geometry("490x570" if is_debit else "380x320")
        self.resizable(False, False)

        self.transient(parent)
        self.grab_set()
        self.lift()
        self.after(10, self.center_window)
        self.configure(fg_color=COLOR_BG)

        main = ctk.CTkFrame(self, fg_color="transparent")
        main.pack(expand=True, fill="both", padx=24, pady=20)

        ctk.CTkLabel(main, text=title, font=("Segoe UI", 18, "bold"), text_color=COLOR_TEXT_MAIN).pack(pady=(0, 12))

        if is_debit:
            self._build_products_section(main)

        # Amount
        af = ctk.CTkFrame(main, fg_color="transparent")
        af.pack(fill="x", pady=(0, 10))
        ctk.CTkLabel(af, text="Monto ($)", font=FONT_BODY, text_color=COLOR_TEXT_SEC).pack(anchor="w")
        self.amount = ctk.CTkEntry(
            af, placeholder_text="0.00", justify="right", font=("Segoe UI", 18, "bold"),
            fg_color=COLOR_SURFACE, border_color=COLOR_BORDER, text_color=COLOR_TEXT_MAIN, height=36
        )
        self.amount.pack(fill="x", pady=(4, 0))
        self.amount.bind("<Return>", lambda e: self.save())
        self.amount.bind("<KeyRelease>", self.validate_amount)

        # Description
        df = ctk.CTkFrame(main, fg_color="transparent")
        df.pack(fill="x", pady=(0, 10))
        ctk.CTkLabel(df, text="Descripcion", font=FONT_BODY, text_color=COLOR_TEXT_SEC).pack(anchor="w")
        self.desc = ctk.CTkEntry(
            df, placeholder_text="Ej: Compra en efectivo", height=32,
            fg_color=COLOR_SURFACE, border_color=COLOR_BORDER, text_color=COLOR_TEXT_MAIN
        )
        self.desc.pack(fill="x", pady=(4, 0))

        # Payment method (payments only)
        self.payment_method = None
        if not is_debit:
            pf = ctk.CTkFrame(main, fg_color="transparent")
            pf.pack(fill="x", pady=(0, 16))
            ctk.CTkLabel(pf, text="Metodo", font=FONT_BODY, text_color=COLOR_TEXT_SEC).pack(anchor="w")
            self.payment_method = ctk.CTkComboBox(
                pf, height=32,
                values=["Efectivo", "Transferencia", "Tarjeta Debito", "Tarjeta Credito", "Cheque"],
                state="readonly",
                fg_color=COLOR_SURFACE, border_color=COLOR_BORDER, text_color=COLOR_TEXT_MAIN,
                dropdown_fg_color=COLOR_SURFACE, dropdown_hover_color=COLOR_SURFACE_HOVER
            )
            self.payment_method.pack(fill="x", pady=(4, 0))
            self.payment_method.set("Efectivo")

        # Buttons
        bf = ctk.CTkFrame(main, fg_color="transparent")
        bf.pack(fill="x", pady=(8, 0))

        ctk.CTkButton(
            bf, text="Cancelar", height=36,
            fg_color=COLOR_SURFACE, hover_color=COLOR_SURFACE_HOVER,
            text_color=COLOR_TEXT_SEC, command=self.destroy
        ).pack(side="left", fill="x", expand=True, padx=(0, 8))

        btn_text = "Confirmar Deuda" if is_debit else "Confirmar Pago"
        btn_color = COLOR_DANGER if is_debit else COLOR_SUCCESS
        btn_hover = COLOR_DANGER_BG if is_debit else COLOR_SUCCESS_BG

        self.btn_confirm = ctk.CTkButton(
            bf, text=btn_text, height=36,
            fg_color=btn_color, hover_color=btn_hover,
            text_color="white", font=("Segoe UI", 12, "bold"),
            command=self.save
        )
        self.btn_confirm.pack(side="right", fill="x", expand=True)

        self.after(100, self.amount.focus)
        self.bind("<Escape>", lambda e: self.destroy())

    def _build_products_section(self, parent):
        # Header
        ph = ctk.CTkFrame(parent, fg_color="transparent")
        ph.pack(fill="x", pady=(0, 4))
        ctk.CTkLabel(ph, text="Productos", font=("Segoe UI", 13, "bold"), text_color=COLOR_TEXT_MAIN).pack(side="left")
        ctk.CTkButton(
            ph, text="+ Agregar", width=80, height=24,
            fg_color=COLOR_PRIMARY, hover_color=COLOR_PRIMARY_HOVER,
            text_color="white", font=("Segoe UI", 10, "bold"),
            command=self.add_product_row
        ).pack(side="right")

        # Column headers
        ch = ctk.CTkFrame(parent, fg_color="transparent")
        ch.pack(fill="x", padx=2, pady=(0, 2))
        ch.grid_columnconfigure(0, weight=3)
        ch.grid_columnconfigure(2, weight=2)
        ctk.CTkLabel(ch, text="PRODUCTO", font=("Segoe UI", 9, "bold"), text_color=COLOR_TEXT_SEC, anchor="w").grid(row=0, column=0, padx=(0, 4), sticky="w")
        ctk.CTkLabel(ch, text="CANT", font=("Segoe UI", 9, "bold"), text_color=COLOR_TEXT_SEC, anchor="center", width=48).grid(row=0, column=1, padx=4)
        ctk.CTkLabel(ch, text="P.UNIT", font=("Segoe UI", 9, "bold"), text_color=COLOR_TEXT_SEC, anchor="w", width=85).grid(row=0, column=2, padx=4)
        ctk.CTkLabel(ch, text="SUBTOT.", font=("Segoe UI", 9, "bold"), text_color=COLOR_TEXT_SEC, anchor="e", width=68).grid(row=0, column=3, padx=(4, 30))

        # Scrollable rows
        self.products_frame = ctk.CTkScrollableFrame(parent, fg_color=COLOR_SURFACE, corner_radius=6, height=130)
        self.products_frame.pack(fill="x")

        # Total
        tr = ctk.CTkFrame(parent, fg_color="transparent")
        tr.pack(fill="x", pady=(4, 8))
        ctk.CTkFrame(tr, height=1, fg_color=COLOR_BORDER).pack(fill="x", pady=(0, 4))
        tot_row = ctk.CTkFrame(tr, fg_color="transparent")
        tot_row.pack(fill="x")
        ctk.CTkLabel(tot_row, text="TOTAL:", font=("Segoe UI", 11, "bold"), text_color=COLOR_TEXT_SEC).pack(side="left")
        self.lbl_total = ctk.CTkLabel(tot_row, text="$0", font=("Segoe UI", 13, "bold"), text_color=COLOR_PRIMARY)
        self.lbl_total.pack(side="right")

        self.add_product_row()

    def add_product_row(self):
        row = ProductRow(self.products_frame, on_change=self.recalculate_total, on_delete=self._remove_row)
        row.pack(fill="x", pady=2, padx=4)
        self.product_rows.append(row)
        self.recalculate_total()

    def _remove_row(self, row):
        if row in self.product_rows:
            self.product_rows.remove(row)
            row.destroy()
            self.recalculate_total()

    def recalculate_total(self):
        total = 0
        for r in self.product_rows:
            r.update_subtotal()
            total += r.get_subtotal()
        self.lbl_total.configure(text=f"${total:,.0f}")
        if total > 0:
            self.amount.delete(0, "end")
            self.amount.insert(0, f"{total:.2f}")

    def _get_products_json(self):
        products = [r.get_data() for r in self.product_rows if r.get_data()["name"] and r.get_data()["price"] > 0]
        return json.dumps(products, ensure_ascii=False) if products else None

    def center_window(self):
        self.update_idletasks()
        w, h = self.winfo_width(), self.winfo_height()
        x = (self.winfo_screenwidth() // 2) - (w // 2)
        y = (self.winfo_screenheight() // 2) - (h // 2)
        self.geometry(f"+{x}+{y}")

    def validate_amount(self, event=None):
        try:
            val = self.amount.get()
            if not val:
                self.amount.configure(border_color=COLOR_BORDER)
                return False
            float(val)
            self.amount.configure(border_color=COLOR_BORDER)
            return True
        except ValueError:
            self.amount.configure(border_color=COLOR_DANGER)
            return False

    def save(self):
        if not self.validate_amount():
            return
        try:
            val = self.amount.get()
            if not val:
                return
            amt = float(val)
            if amt <= 0:
                self.amount.configure(border_color=COLOR_DANGER)
                return

            desc = self.desc.get().strip() or ("Deuda Generada" if self.is_debit else "Pago Recibido")
            pay_method = self.payment_method.get() if self.payment_method else None
            products_json = self._get_products_json() if self.is_debit else None

            self.callback(amt, desc, pay_method, products_json)
            self.destroy()
        except ValueError:
            pass
