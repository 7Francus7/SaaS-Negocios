import customtkinter as ctk
from datetime import datetime
from app.ui.styles import *


class ReceiptDialog(ctk.CTkToplevel):
    def __init__(self, parent, client_name, client_phone, amount,
                 payment_method, prev_balance, new_balance, description, movement_id):
        super().__init__(parent)

        self.title("Comprobante de Pago")
        self.geometry("420x540")
        self.resizable(False, False)
        self.configure(fg_color=COLOR_BG)

        self.transient(parent)
        self.grab_set()
        self.lift()
        self.after(10, self.center_window)

        now = datetime.now()
        self.receipt_text = self._build_text(
            movement_id, now, client_name, client_phone,
            amount, payment_method, description, prev_balance, new_balance
        )

        self._build_ui(client_name, client_phone, amount, payment_method,
                       description, prev_balance, new_balance, movement_id, now)

        self.bind("<Escape>", lambda e: self.destroy())

    def _build_ui(self, client_name, client_phone, amount, payment_method,
                  description, prev_balance, new_balance, movement_id, now):
        main = ctk.CTkFrame(self, fg_color="transparent")
        main.pack(fill="both", expand=True, padx=24, pady=20)

        # --- Header ---
        header = ctk.CTkFrame(main, fg_color=COLOR_SURFACE, corner_radius=CORNER_RADIUS)
        header.pack(fill="x", pady=(0, 12))

        ctk.CTkLabel(header, text="COMPROBANTE DE PAGO",
                     font=("Segoe UI", 16, "bold"), text_color=COLOR_SUCCESS).pack(pady=(14, 2))
        ctk.CTkLabel(header, text=f"Recibo N.° {movement_id:05d}",
                     font=("Segoe UI", 11), text_color=COLOR_TEXT_SEC).pack(pady=(0, 4))
        ctk.CTkLabel(header, text=now.strftime("%d/%m/%Y  %H:%M"),
                     font=("Segoe UI", 11), text_color=COLOR_TEXT_LABEL).pack(pady=(0, 14))

        # --- Client ---
        self._section(main, "CLIENTE", [
            ("Nombre", client_name),
            ("Teléfono", client_phone or "—"),
        ])

        # --- Payment ---
        self._section(main, "DETALLE DEL PAGO", [
            ("Descripción", description),
            ("Método", payment_method),
            ("Monto abonado", f"${amount:,.2f}"),
        ], amount_highlight=amount)

        # --- Balance ---
        new_color = COLOR_SUCCESS if new_balance <= 0 else COLOR_WARNING
        new_label = f"${new_balance:,.2f}" + (" ✓ Saldado" if new_balance <= 0 else "")

        self._section(main, "SALDOS", [
            ("Saldo anterior", f"${prev_balance:,.2f}"),
            ("Saldo actual", new_label, new_color),
        ])

        # --- Buttons ---
        btn_frame = ctk.CTkFrame(main, fg_color="transparent")
        btn_frame.pack(fill="x", pady=(10, 0))

        ctk.CTkButton(btn_frame, text="📋 Copiar texto", height=36,
                      fg_color=COLOR_SURFACE, hover_color=COLOR_SURFACE_HOVER,
                      text_color=COLOR_TEXT_SEC,
                      command=self._copy_to_clipboard).pack(side="left", fill="x", expand=True, padx=(0, 8))

        ctk.CTkButton(btn_frame, text="Cerrar", height=36,
                      fg_color=COLOR_PRIMARY, hover_color=COLOR_PRIMARY_HOVER,
                      text_color="white", font=("Segoe UI", 12, "bold"),
                      command=self.destroy).pack(side="right", fill="x", expand=True)

    def _section(self, parent, title, rows, amount_highlight=None):
        frame = ctk.CTkFrame(parent, fg_color=COLOR_SURFACE, corner_radius=CORNER_RADIUS)
        frame.pack(fill="x", pady=(0, 8))

        ctk.CTkLabel(frame, text=title, font=("Segoe UI", 10, "bold"),
                     text_color=COLOR_TEXT_LABEL).pack(anchor="w", padx=14, pady=(10, 4))

        ctk.CTkFrame(frame, height=1, fg_color=COLOR_BORDER).pack(fill="x", padx=14)

        for row in rows:
            label, value = row[0], row[1]
            value_color = row[2] if len(row) > 2 else COLOR_TEXT_MAIN

            # Amount gets bigger font
            val_font = ("Segoe UI", 12)
            if amount_highlight is not None and label == "Monto abonado":
                val_font = ("Segoe UI", 18, "bold")
                value_color = COLOR_SUCCESS

            r = ctk.CTkFrame(frame, fg_color="transparent")
            r.pack(fill="x", padx=14, pady=3)
            ctk.CTkLabel(r, text=label, font=("Segoe UI", 11),
                         text_color=COLOR_TEXT_SEC, anchor="w").pack(side="left")
            ctk.CTkLabel(r, text=value, font=val_font,
                         text_color=value_color, anchor="e").pack(side="right")

        ctk.CTkFrame(frame, height=0, fg_color="transparent").pack(pady=4)

    def _build_text(self, movement_id, now, client_name, client_phone,
                    amount, payment_method, description, prev_balance, new_balance):
        saldo_label = "SALDADO ✓" if new_balance <= 0 else f"${new_balance:,.2f}"
        lines = [
            "=" * 38,
            "     COMPROBANTE DE PAGO",
            f"     Recibo N.° {movement_id:05d}",
            "=" * 38,
            f"Fecha:    {now.strftime('%d/%m/%Y %H:%M')}",
            f"Cliente:  {client_name}",
            f"Tel.:     {client_phone or '—'}",
            "-" * 38,
            f"Concepto: {description}",
            f"Método:   {payment_method}",
            f"MONTO:    ${amount:,.2f}",
            "-" * 38,
            f"Saldo ant.: ${prev_balance:,.2f}",
            f"Saldo act.: {saldo_label}",
            "=" * 38,
            "       ¡Gracias por su pago!",
        ]
        return "\n".join(lines)

    def _copy_to_clipboard(self):
        self.clipboard_clear()
        self.clipboard_append(self.receipt_text)
        self.update()

    def center_window(self):
        self.update_idletasks()
        w, h = self.winfo_width(), self.winfo_height()
        x = (self.winfo_screenwidth() // 2) - (w // 2)
        y = (self.winfo_screenheight() // 2) - (h // 2)
        self.geometry(f"+{x}+{y}")
