import customtkinter as ctk
from datetime import datetime
from tkinter import filedialog, messagebox
from app.ui.styles import *


class ReceiptDialog(ctk.CTkToplevel):
    def __init__(self, parent, client_name, client_phone, amount,
                 payment_method, prev_balance, new_balance, description, movement_id):
        super().__init__(parent)

        self.title("Comprobante de Pago")
        self.geometry("420x600")
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
        self._data = dict(
            movement_id=movement_id, now=now, client_name=client_name,
            client_phone=client_phone or "—", amount=amount,
            payment_method=payment_method, description=description,
            prev_balance=prev_balance, new_balance=new_balance,
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

        # --- Export buttons (PDF / JPG) ---
        export_frame = ctk.CTkFrame(main, fg_color="transparent")
        export_frame.pack(fill="x", pady=(10, 0))

        ctk.CTkButton(export_frame, text="⬇  PDF", height=42,
                      fg_color="#E11D48", hover_color="#BE123C",
                      text_color="white", font=("Segoe UI", 13, "bold"),
                      corner_radius=CORNER_RADIUS,
                      command=self._export_pdf).pack(side="left", fill="x", expand=True, padx=(0, 6))

        ctk.CTkButton(export_frame, text="⬇  IMAGEN JPG", height=42,
                      fg_color="#7C3AED", hover_color="#6D28D9",
                      text_color="white", font=("Segoe UI", 13, "bold"),
                      corner_radius=CORNER_RADIUS,
                      command=self._export_jpg).pack(side="right", fill="x", expand=True)

        # --- Copy / Close buttons ---
        btn_frame = ctk.CTkFrame(main, fg_color="transparent")
        btn_frame.pack(fill="x", pady=(8, 0))

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

    # ------------------------------------------------------------------
    # PDF export
    # ------------------------------------------------------------------
    def _export_pdf(self):
        d = self._data
        default_name = f"comprobante_{d['movement_id']:05d}.pdf"
        path = filedialog.asksaveasfilename(
            parent=self, defaultextension=".pdf",
            filetypes=[("PDF", "*.pdf")],
            initialfile=default_name,
        )
        if not path:
            return
        try:
            from fpdf import FPDF

            pdf = FPDF(format="A5")
            pdf.add_page()
            pdf.set_margins(15, 15, 15)
            pdf.set_auto_page_break(False)

            # Header background
            pdf.set_fill_color(30, 41, 59)
            pdf.rect(0, 0, 148, 35, "F")

            # Title
            pdf.set_font("Helvetica", "B", 14)
            pdf.set_text_color(16, 185, 129)
            pdf.cell(0, 8, "COMPROBANTE DE PAGO", align="C", new_x="LMARGIN", new_y="NEXT")

            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(148, 163, 184)
            pdf.cell(0, 5, f"Recibo N.o {d['movement_id']:05d}", align="C", new_x="LMARGIN", new_y="NEXT")
            pdf.cell(0, 5, d['now'].strftime("%d/%m/%Y  %H:%M"), align="C", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(6)

            def draw_section(title, rows):
                pdf.set_font("Helvetica", "B", 8)
                pdf.set_text_color(148, 163, 184)
                pdf.cell(0, 5, title, new_x="LMARGIN", new_y="NEXT")
                pdf.set_draw_color(71, 85, 105)
                pdf.line(15, pdf.get_y(), 133, pdf.get_y())
                pdf.ln(2)
                for row in rows:
                    label, value = row[0], row[1]
                    bold = len(row) > 2 and row[2]
                    pdf.set_font("Helvetica", "", 10)
                    pdf.set_text_color(203, 213, 225)
                    pdf.cell(55, 7, label)
                    pdf.set_font("Helvetica", "B" if bold else "", 10 if not bold else 14)
                    color = row[3] if len(row) > 3 else (248, 250, 252)
                    pdf.set_text_color(*color)
                    pdf.cell(0, 7, value, align="R", new_x="LMARGIN", new_y="NEXT")
                pdf.ln(4)

            draw_section("CLIENTE", [
                ("Nombre", d['client_name']),
                ("Telefono", d['client_phone']),
            ])

            draw_section("DETALLE DEL PAGO", [
                ("Descripcion", d['description']),
                ("Metodo", d['payment_method']),
                ("Monto abonado", f"${d['amount']:,.2f}", True, (16, 185, 129)),
            ])

            new_color = (16, 185, 129) if d['new_balance'] <= 0 else (234, 179, 8)
            new_label = f"${d['new_balance']:,.2f}" + (" (Saldado)" if d['new_balance'] <= 0 else "")
            draw_section("SALDOS", [
                ("Saldo anterior", f"${d['prev_balance']:,.2f}"),
                ("Saldo actual", new_label, False, new_color),
            ])

            pdf.set_font("Helvetica", "I", 9)
            pdf.set_text_color(148, 163, 184)
            pdf.cell(0, 6, "Gracias por su pago!", align="C", new_x="LMARGIN", new_y="NEXT")

            pdf.output(path)
            messagebox.showinfo("PDF exportado", f"Guardado en:\n{path}", parent=self)
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo generar el PDF:\n{e}", parent=self)

    # ------------------------------------------------------------------
    # JPG export
    # ------------------------------------------------------------------
    def _export_jpg(self):
        d = self._data
        default_name = f"comprobante_{d['movement_id']:05d}.jpg"
        path = filedialog.asksaveasfilename(
            parent=self, defaultextension=".jpg",
            filetypes=[("JPEG", "*.jpg")],
            initialfile=default_name,
        )
        if not path:
            return
        try:
            from PIL import Image, ImageDraw, ImageFont

            W, PAD = 520, 30

            # Load fonts (Segoe UI on Windows; fallback to default)
            try:
                fnt = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 15)
                fnt_b = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 15)
                fnt_sm = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 12)
                fnt_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 18)
                fnt_amount = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 24)
            except Exception:
                fnt = fnt_b = fnt_sm = fnt_title = fnt_amount = ImageFont.load_default()

            # First pass: calculate total height
            C_BG = (15, 23, 42)
            C_SURFACE = (30, 41, 59)
            C_BORDER = (71, 85, 105)
            C_SUCCESS = (16, 185, 129)
            C_WARNING = (234, 179, 8)
            C_TEXT = (248, 250, 252)
            C_SEC = (203, 213, 225)
            C_LABEL = (148, 163, 184)

            new_color = C_SUCCESS if d['new_balance'] <= 0 else C_WARNING
            new_label = f"${d['new_balance']:,.2f}" + (" Saldado" if d['new_balance'] <= 0 else "")

            sections = [
                ("CLIENTE", [
                    ("Nombre", d['client_name'], C_TEXT, fnt_b),
                    ("Telefono", d['client_phone'], C_TEXT, fnt),
                ]),
                ("DETALLE DEL PAGO", [
                    ("Descripcion", d['description'], C_TEXT, fnt),
                    ("Metodo", d['payment_method'], C_TEXT, fnt),
                    ("Monto abonado", f"${d['amount']:,.2f}", C_SUCCESS, fnt_amount),
                ]),
                ("SALDOS", [
                    ("Saldo anterior", f"${d['prev_balance']:,.2f}", C_TEXT, fnt),
                    ("Saldo actual", new_label, new_color, fnt_b),
                ]),
            ]

            ROW_H = 30
            SECTION_TITLE_H = 32
            SECTION_PAD = 10
            header_h = 90

            total_h = header_h + 10
            for _, rows in sections:
                total_h += SECTION_TITLE_H + len(rows) * ROW_H + SECTION_PAD + 8
            total_h += 40  # footer

            img = Image.new("RGB", (W, total_h), C_BG)
            draw = ImageDraw.Draw(img)

            # Header
            draw.rectangle([0, 0, W, header_h], fill=C_SURFACE)
            # Title centered
            bb = draw.textbbox((0, 0), "COMPROBANTE DE PAGO", font=fnt_title)
            tw = bb[2] - bb[0]
            draw.text(((W - tw) // 2, 15), "COMPROBANTE DE PAGO", font=fnt_title, fill=C_SUCCESS)
            txt2 = f"Recibo N.o {d['movement_id']:05d}"
            bb2 = draw.textbbox((0, 0), txt2, font=fnt_sm)
            draw.text(((W - (bb2[2] - bb2[0])) // 2, 42), txt2, font=fnt_sm, fill=C_LABEL)
            txt3 = d['now'].strftime("%d/%m/%Y  %H:%M")
            bb3 = draw.textbbox((0, 0), txt3, font=fnt_sm)
            draw.text(((W - (bb3[2] - bb3[0])) // 2, 62), txt3, font=fnt_sm, fill=C_LABEL)

            y = header_h + 10

            for sec_title, rows in sections:
                sec_h = SECTION_TITLE_H + len(rows) * ROW_H + SECTION_PAD
                draw.rectangle([PAD, y, W - PAD, y + sec_h], fill=C_SURFACE, outline=C_BORDER)
                draw.text((PAD + 10, y + 8), sec_title, font=fnt_sm, fill=C_LABEL)
                draw.line([(PAD + 10, y + SECTION_TITLE_H - 2), (W - PAD - 10, y + SECTION_TITLE_H - 2)],
                          fill=C_BORDER, width=1)
                row_y = y + SECTION_TITLE_H + 2
                for label, value, v_color, v_font in rows:
                    draw.text((PAD + 10, row_y), label, font=fnt, fill=C_SEC)
                    vbb = draw.textbbox((0, 0), value, font=v_font)
                    vw = vbb[2] - vbb[0]
                    draw.text((W - PAD - 10 - vw, row_y), value, font=v_font, fill=v_color)
                    row_y += ROW_H
                y += sec_h + 8

            # Footer
            footer = "Gracias por su pago!"
            fbb = draw.textbbox((0, 0), footer, font=fnt_sm)
            draw.text(((W - (fbb[2] - fbb[0])) // 2, y + 10), footer, font=fnt_sm, fill=C_LABEL)

            img.save(path, "JPEG", quality=95)
            messagebox.showinfo("Imagen exportada", f"Guardada en:\n{path}", parent=self)
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo generar la imagen:\n{e}", parent=self)

    def center_window(self):
        self.update_idletasks()
        w, h = self.winfo_width(), self.winfo_height()
        x = (self.winfo_screenwidth() // 2) - (w // 2)
        y = (self.winfo_screenheight() // 2) - (h // 2)
        self.geometry(f"+{x}+{y}")
