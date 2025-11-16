"""
ventas_bebidas.py - VERSIÓN FINAL CON IMPRESIÓN DIRECTA

Sistema de Ventas - BEBIDAS TEALDI
Responsive + Impresión directa en impresora predeterminada
"""

import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
from typing import List, Dict
import tempfile
import os

from database_bebidas import db
from ui_helpers_bebidas import (
    Tema,
    WidgetFactory,
    centrar_ventana,
    formatear_precio,
    formatear_numero,
    crear_titulo_seccion,
)

# Imports para impresión (instalar con: pip install pywin32)
try:
    import win32print
    import win32api
    IMPRESION_DISPONIBLE = True
except ImportError:
    IMPRESION_DISPONIBLE = False


class VentanaVentasTealdi:
    """Punto de venta BEBIDAS TEALDI - Versión Final Optimizada"""

    def __init__(self, sistema_principal):
        self.sistema = sistema_principal
        self.ventana = tk.Toplevel(self.sistema.root)
        self.ventana.title("🥤 Punto de Venta - BEBIDAS TEALDI")
        
        # CRÍTICO: Actualizar antes de medir
        self.ventana.update_idletasks()
        
        # Detectar tamaño de pantalla
        screen_h = self.ventana.winfo_screenheight()
        self.es_pantalla_pequena = screen_h < 800

        # Ajustar tamaño según pantalla
        if self.es_pantalla_pequena:
            ancho, alto = 1366, 768
        else:
            ancho, alto = 1400, 800

        centrar_ventana(self.ventana, ancho, alto)
        self.ventana.configure(bg=Tema.BG_MAIN)
        self.ventana.minsize(1200, 650)

        # Maximizar SIEMPRE
        try:
            self.ventana.state("zoomed")
        except Exception:
            pass
        
        # Segunda actualización después de maximizar
        self.ventana.update_idletasks()

        self.carrito: List[Dict] = []
        self.busqueda_var = tk.StringVar()
        self.codigo_scanner_var = tk.StringVar()
        self.cliente_var = tk.StringVar()
        self.metodo_pago_var = tk.StringVar(value="Efectivo")

        self.crear_interfaz()
        self.cargar_productos()

        self.ventana.after(100, lambda: self.scanner_entry.focus())

    def crear_interfaz(self):
        pad = 12 if not self.es_pantalla_pequena else 8

        # Header
        header_height = 60 if self.es_pantalla_pequena else 70
        header_shadow = tk.Frame(self.ventana, bg=Tema.SHADOW, height=header_height)
        header_shadow.pack(fill=tk.X)
        header_shadow.pack_propagate(False)

        header_frame = tk.Frame(header_shadow, bg=Tema.PRIMARY)
        header_frame.pack(fill=tk.BOTH, expand=True, padx=2, pady=2)

        left_frame = tk.Frame(header_frame, bg=Tema.PRIMARY)
        left_frame.pack(side=tk.LEFT, padx=20 if not self.es_pantalla_pequena else 15, 
                       pady=12 if not self.es_pantalla_pequena else 10)

        emoji_size = 24 if self.es_pantalla_pequena else 28
        tk.Label(
            left_frame,
            text="🥤",
            font=("Segoe UI Emoji", emoji_size),
            bg=Tema.PRIMARY,
            fg=Tema.TEXT_LIGHT,
        ).pack(side=tk.LEFT, padx=(0, 12 if not self.es_pantalla_pequena else 10))

        title_size = 18 if self.es_pantalla_pequena else 22
        tk.Label(
            left_frame,
            text="PUNTO DE VENTA - BEBIDAS TEALDI",
            font=(Tema.FONT_FAMILY, title_size, "bold"),
            bg=Tema.PRIMARY,
            fg=Tema.TEXT_LIGHT,
        ).pack(side=tk.LEFT)

        self.hora_label = tk.Label(
            header_frame,
            text=datetime.now().strftime("%d/%m/%Y %H:%M"),
            font=(Tema.FONT_FAMILY, 12 if self.es_pantalla_pequena else 14),
            bg=Tema.PRIMARY,
            fg=Tema.TEXT_LIGHT,
        )
        self.hora_label.pack(side=tk.RIGHT, padx=20 if not self.es_pantalla_pequena else 15, 
                            pady=12 if not self.es_pantalla_pequena else 10)
        self.actualizar_hora()

        # Main container
        main_container = tk.Frame(self.ventana, bg=Tema.BG_MAIN)
        main_container.pack(fill=tk.BOTH, expand=True, padx=pad, pady=pad)

        self.crear_panel_productos(main_container)
        self.crear_panel_carrito(main_container)

        main_container.columnconfigure(1, weight=1)
        main_container.rowconfigure(0, weight=1)

    def crear_panel_productos(self, parent):
        """Panel de productos"""
        shadow, productos_frame = WidgetFactory.crear_frame_card(parent)
        shadow.grid(row=0, column=0, sticky="nsew", padx=(0, 10 if not self.es_pantalla_pequena else 8))

        pad_x = 15 if not self.es_pantalla_pequena else 12
        pad_y = 12 if not self.es_pantalla_pequena else 10
        title_size = 13 if self.es_pantalla_pequena else 15

        titulo_frame = tk.Frame(productos_frame, bg=Tema.BG_CARD)
        titulo_frame.pack(fill=tk.X, padx=pad_x, pady=(pad_y, pad_y - 3))

        tk.Label(
            titulo_frame,
            text="🥤 Productos Disponibles",
            font=(Tema.FONT_FAMILY, title_size, "bold"),
            bg=Tema.BG_CARD,
            fg=Tema.PRIMARY,
            anchor=tk.W,
        ).pack(side=tk.LEFT, padx=5)

        linea = tk.Frame(titulo_frame, bg=Tema.PRIMARY, height=2)
        linea.pack(fill=tk.X, padx=5)

        # Campo de escaneo
        scanner_frame = tk.Frame(productos_frame, bg=Tema.SUCCESS, relief=tk.SOLID, bd=2 if self.es_pantalla_pequena else 3)
        scanner_frame.pack(fill=tk.X, pady=(0, 10 if not self.es_pantalla_pequena else 8), padx=pad_x)

        tk.Label(
            scanner_frame,
            text="📡 ESCANEAR:",
            font=(Tema.FONT_FAMILY, 11 if self.es_pantalla_pequena else 13, "bold"),
            bg=Tema.SUCCESS,
            fg=Tema.TEXT_LIGHT,
        ).pack(side=tk.LEFT, padx=12 if not self.es_pantalla_pequena else 10, pady=10 if not self.es_pantalla_pequena else 8)

        scanner_entry_container = tk.Frame(scanner_frame, bg=Tema.TEXT_LIGHT)
        scanner_entry_container.pack(side=tk.LEFT, padx=(0, 12 if not self.es_pantalla_pequena else 10), 
                                     pady=6 if self.es_pantalla_pequena else 8, fill=tk.X, expand=True)

        self.scanner_entry = tk.Entry(
            scanner_entry_container,
            textvariable=self.codigo_scanner_var,
            font=(Tema.FONT_FAMILY, 10 if self.es_pantalla_pequena else Tema.FONT_SIZE_NORMAL),
            relief=tk.FLAT,
            bd=0,
        )
        self.scanner_entry.pack(padx=8 if self.es_pantalla_pequena else 10, 
                               pady=8 if self.es_pantalla_pequena else 10, fill=tk.X)
        self.scanner_entry.bind("<Return>", lambda e: self.procesar_codigo_escaneado())

        self.indicador = tk.Label(
            scanner_frame,
            text="⚪",
            font=(Tema.FONT_FAMILY, 16 if self.es_pantalla_pequena else 18),
            bg=Tema.SUCCESS,
            fg=Tema.TEXT_LIGHT,
        )
        self.indicador.pack(side=tk.LEFT, padx=12 if not self.es_pantalla_pequena else 10)

        # Búsqueda
        search_frame = tk.Frame(productos_frame, bg=Tema.BG_CARD)
        search_frame.pack(fill=tk.X, pady=(0, 10 if not self.es_pantalla_pequena else 8), padx=pad_x)

        tk.Label(
            search_frame,
            text="🔍",
            font=(Tema.FONT_FAMILY, 12 if self.es_pantalla_pequena else 14),
            bg=Tema.BG_CARD,
        ).pack(side=tk.LEFT, padx=(0, 8))

        busqueda_entry_frame = WidgetFactory.crear_entry(search_frame, self.busqueda_var, width=24 if self.es_pantalla_pequena else 28)
        busqueda_entry_frame.pack(side=tk.LEFT, padx=(0, 8))

        for widget in busqueda_entry_frame.winfo_children():
            if isinstance(widget, tk.Entry):
                widget.bind("<KeyRelease-Return>", lambda e: self.buscar_producto())

        WidgetFactory.crear_boton(search_frame, "Buscar", lambda: self.buscar_producto(), "info", width=8).pack(side=tk.LEFT, padx=3)

        # Tabla productos
        tree_container = tk.Frame(productos_frame, bg=Tema.SHADOW)
        tree_container.pack(fill=tk.BOTH, expand=True, padx=pad_x)

        tree_inner = tk.Frame(tree_container, bg=Tema.BG_CARD)
        tree_inner.pack(padx=2, pady=2, fill=tk.BOTH, expand=True)

        scrollbar = ttk.Scrollbar(tree_inner, orient=tk.VERTICAL)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        tree_height = 12 if self.es_pantalla_pequena else 14

        self.tree_productos = ttk.Treeview(
            tree_inner,
            columns=("codigo", "nombre", "tamaño", "marca", "stock", "precio"),
            show="headings",
            yscrollcommand=scrollbar.set,
            height=tree_height,
            style="Modern.Treeview",
        )

        self.tree_productos.heading("codigo", text="Código")
        self.tree_productos.heading("nombre", text="Nombre")
        self.tree_productos.heading("tamaño", text="Tamaño")
        self.tree_productos.heading("marca", text="Marca")
        self.tree_productos.heading("stock", text="Stock")
        self.tree_productos.heading("precio", text="Precio")

        col_factor = 0.9 if self.es_pantalla_pequena else 1.0
        self.tree_productos.column("codigo", width=int(70 * col_factor), anchor=tk.CENTER)
        self.tree_productos.column("nombre", width=int(150 * col_factor))
        self.tree_productos.column("tamaño", width=int(70 * col_factor), anchor=tk.CENTER)
        self.tree_productos.column("marca", width=int(90 * col_factor))
        self.tree_productos.column("stock", width=int(50 * col_factor), anchor=tk.CENTER)
        self.tree_productos.column("precio", width=int(75 * col_factor), anchor=tk.CENTER)

        self.tree_productos.pack(fill=tk.BOTH, expand=True, padx=6, pady=6)
        scrollbar.config(command=self.tree_productos.yview)

        btn_width = 28 if self.es_pantalla_pequena else 34
        WidgetFactory.crear_boton(
            productos_frame, "➕ AGREGAR AL CARRITO", self.agregar_al_carrito, "success", width=btn_width
        ).pack(pady=(10 if not self.es_pantalla_pequena else 8, pad_y), padx=pad_x)

        self.tree_productos.bind("<Double-Button-1>", lambda e: self.agregar_al_carrito())

    def crear_panel_carrito(self, parent):
        """Panel de carrito OPTIMIZADO - tabla grande, pago compacto"""
        shadow, carrito_container = WidgetFactory.crear_frame_card(parent)
        shadow.grid(row=0, column=1, sticky="nsew")

        pad_x = 15 if not self.es_pantalla_pequena else 12
        pad_y = 12 if not self.es_pantalla_pequena else 10
        title_size = 13 if self.es_pantalla_pequena else 15

        titulo_frame = tk.Frame(carrito_container, bg=Tema.BG_CARD)
        titulo_frame.pack(fill=tk.X, padx=pad_x, pady=(pad_y, pad_y - 3))

        tk.Label(
            titulo_frame,
            text="🛒 Carrito de Compra",
            font=(Tema.FONT_FAMILY, title_size, "bold"),
            bg=Tema.BG_CARD,
            fg=Tema.PRIMARY,
            anchor=tk.W,
        ).pack(side=tk.LEFT, padx=5)

        linea = tk.Frame(titulo_frame, bg=Tema.PRIMARY, height=2)
        linea.pack(fill=tk.X, padx=5)

        # TABLA CARRITO - EXPAND TRUE para ocupar todo el espacio
        tree_container = tk.Frame(carrito_container, bg=Tema.SHADOW)
        tree_container.pack(fill=tk.BOTH, expand=True, padx=pad_x, pady=(0, 8))

        tree_inner = tk.Frame(tree_container, bg=Tema.BG_CARD)
        tree_inner.pack(padx=2, pady=2, fill=tk.BOTH, expand=True)

        scrollbar = ttk.Scrollbar(tree_inner, orient=tk.VERTICAL)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # Sin height fijo - se expande naturalmente
        self.tree_carrito = ttk.Treeview(
            tree_inner,
            columns=("nombre", "tamaño", "cantidad", "precio", "subtotal"),
            show="headings",
            yscrollcommand=scrollbar.set,
            style="Modern.Treeview",
        )

        self.tree_carrito.heading("nombre", text="Producto")
        self.tree_carrito.heading("tamaño", text="Tamaño")
        self.tree_carrito.heading("cantidad", text="Cant.")
        self.tree_carrito.heading("precio", text="Precio")
        self.tree_carrito.heading("subtotal", text="Subtotal")

        col_factor = 0.9 if self.es_pantalla_pequena else 1.0
        self.tree_carrito.column("nombre", width=int(200 * col_factor))
        self.tree_carrito.column("tamaño", width=int(80 * col_factor), anchor=tk.CENTER)
        self.tree_carrito.column("cantidad", width=int(60 * col_factor), anchor=tk.CENTER)
        self.tree_carrito.column("precio", width=int(90 * col_factor), anchor=tk.CENTER)
        self.tree_carrito.column("subtotal", width=int(100 * col_factor), anchor=tk.CENTER)

        # CLAVE: expand=True para llenar espacio vertical
        self.tree_carrito.pack(fill=tk.BOTH, expand=True, padx=6, pady=6)
        scrollbar.config(command=self.tree_carrito.yview)

        # Botones carrito
        btn_frame = tk.Frame(carrito_container, bg=Tema.BG_CARD)
        btn_frame.pack(fill=tk.X, pady=(0, 6), padx=pad_x)

        btn_width = 12 if self.es_pantalla_pequena else 14
        WidgetFactory.crear_boton(btn_frame, "➖ Quitar Item", self.quitar_del_carrito, "danger", width=btn_width).pack(side=tk.LEFT, padx=4)
        WidgetFactory.crear_boton(btn_frame, "🗑️ Vaciar Todo", self.vaciar_carrito, "warning", width=btn_width).pack(side=tk.LEFT, padx=4)

        # Panel de pago COMPACTO
        self.crear_panel_pago(carrito_container)

    def crear_panel_pago(self, parent):
        """Panel de pago ULTRA COMPACTO - solo espacio necesario"""
        pad_x = 15 if not self.es_pantalla_pequena else 12

        # Sin expand - solo fill X
        pago_shadow = tk.Frame(parent, bg=Tema.SHADOW)
        pago_shadow.pack(fill=tk.X, padx=pad_x, pady=(0, 10))

        pago_frame = tk.Frame(pago_shadow, bg=Tema.BG_CARD)
        pago_frame.pack(padx=2, pady=2, fill=tk.X)

        # Cliente
        cliente_row = tk.Frame(pago_frame, bg=Tema.BG_CARD)
        cliente_row.pack(fill=tk.X, pady=5, padx=pad_x)

        tk.Label(
            cliente_row,
            text="👤 Cliente:",
            font=(Tema.FONT_FAMILY, 10 if self.es_pantalla_pequena else 11),
            bg=Tema.BG_CARD,
            fg=Tema.TEXT_PRIMARY,
        ).pack(side=tk.LEFT, padx=(0, 10))

        WidgetFactory.crear_entry(cliente_row, self.cliente_var, width=28 if self.es_pantalla_pequena else 32).pack(side=tk.LEFT, fill=tk.X, expand=True)

        # Pago
        pago_row = tk.Frame(pago_frame, bg=Tema.BG_CARD)
        pago_row.pack(fill=tk.X, pady=5, padx=pad_x)

        tk.Label(
            pago_row,
            text="💳 Pago:",
            font=(Tema.FONT_FAMILY, 10 if self.es_pantalla_pequena else 11),
            bg=Tema.BG_CARD,
            fg=Tema.TEXT_PRIMARY,
        ).pack(side=tk.LEFT, padx=(0, 10))

        pago_combo_frame = tk.Frame(pago_row, bg=Tema.SHADOW)
        pago_combo_frame.pack(side=tk.LEFT, fill=tk.X, expand=True)

        pago_combo_inner = tk.Frame(pago_combo_frame, bg=Tema.BG_CARD)
        pago_combo_inner.pack(padx=1, pady=1, fill=tk.BOTH)

        metodos = ["Efectivo", "Tarjeta Débito", "Tarjeta Crédito", "Transferencia", "Otro"]
        pago_combo = ttk.Combobox(
            pago_combo_inner,
            textvariable=self.metodo_pago_var,
            values=metodos,
            font=(Tema.FONT_FAMILY, 10 if self.es_pantalla_pequena else 11),
            state="readonly",
        )
        pago_combo.pack(padx=6, pady=4, fill=tk.X)

        # Total
        total_shadow = tk.Frame(pago_frame, bg=Tema.SHADOW)
        total_shadow.pack(fill=tk.X, pady=(8, 6), padx=pad_x)

        total_frame = tk.Frame(total_shadow, bg=Tema.PRIMARY)
        total_frame.pack(padx=2, pady=2, fill=tk.BOTH)

        tk.Label(
            total_frame,
            text="TOTAL A PAGAR:",
            font=(Tema.FONT_FAMILY, 12 if self.es_pantalla_pequena else 14, "bold"),
            bg=Tema.PRIMARY,
            fg=Tema.TEXT_LIGHT,
        ).pack(side=tk.LEFT, padx=15, pady=10)

        self.total_label = tk.Label(
            total_frame,
            text="$0,00",
            font=(Tema.FONT_FAMILY, 20 if self.es_pantalla_pequena else 24, "bold"),
            bg=Tema.PRIMARY,
            fg=Tema.TEXT_LIGHT,
        )
        self.total_label.pack(side=tk.RIGHT, padx=15, pady=10)

        # Botones
        btn_final_frame = tk.Frame(pago_frame, bg=Tema.BG_CARD)
        btn_final_frame.pack(fill=tk.X, pady=(6, 8), padx=pad_x)

        btn_width_main = 20 if self.es_pantalla_pequena else 24
        btn_width_cancel = 14 if self.es_pantalla_pequena else 16

        WidgetFactory.crear_boton(btn_final_frame, "✅ FINALIZAR VENTA", self.finalizar_venta, "success", width=btn_width_main).pack(side=tk.LEFT, padx=4, fill=tk.X, expand=True)
        WidgetFactory.crear_boton(btn_final_frame, "❌ Cancelar", self.ventana.destroy, "danger", width=btn_width_cancel).pack(side=tk.RIGHT, padx=4)

    # ============ LÓGICA ============

    def actualizar_hora(self):
        self.hora_label.config(text=datetime.now().strftime("%d/%m/%Y %H:%M:%S"))
        self.ventana.after(1000, self.actualizar_hora)

    def cargar_productos(self):
        self.tree_productos.delete(*self.tree_productos.get_children())
        productos = db.obtener_todos()
        for codigo, nombre, categoria, tamaño, marca, cantidad, precio in productos:
            if cantidad > 0:
                self.tree_productos.insert("", tk.END, values=(codigo, nombre, tamaño, marca, cantidad, formatear_precio(precio)))

    def buscar_producto(self):
        termino = self.busqueda_var.get().strip()
        self.tree_productos.delete(*self.tree_productos.get_children())
        productos = db.buscar(termino) if termino else db.obtener_todos()
        for codigo, nombre, categoria, tamaño, marca, cantidad, precio in productos:
            if cantidad > 0:
                self.tree_productos.insert("", tk.END, values=(codigo, nombre, tamaño, marca, cantidad, formatear_precio(precio)))

    def procesar_codigo_escaneado(self):
        codigo = self.codigo_scanner_var.get().strip()
        if not codigo:
            return
        producto = db.obtener_articulo(codigo)
        if producto:
            cod, nombre, cat, tam, marca, cant, precio = producto
            if cant > 0:
                cantidad = self.pedir_cantidad_rapida(nombre, cant)
                if cantidad and cantidad > 0:
                    if cantidad <= cant:
                        self.carrito.append({"codigo": cod, "nombre": nombre, "tamaño": tam, "marca": marca, "cantidad": cantidad, "precio": precio, "subtotal": cantidad * precio})
                        self.actualizar_carrito()
                        self.indicador.config(text="✅", fg="#FFFFFF")
                        self.ventana.after(1000, lambda: self.indicador.config(text="⚪", fg=Tema.TEXT_LIGHT))
                        self.ventana.bell()
                    else:
                        messagebox.showerror("Stock Insuficiente - Tealdi", f"Stock disponible: {cant}", parent=self.ventana)
                        self.indicador.config(text="❌", fg="#FFFFFF")
            else:
                messagebox.showwarning("Sin Stock - Tealdi", f"{nombre} sin stock", parent=self.ventana)
                self.indicador.config(text="⚠️", fg="#FFFFFF")
        else:
            messagebox.showwarning("No Encontrado - Tealdi", f"Código no existe: {codigo}", parent=self.ventana)
            self.indicador.config(text="❌", fg="#FFFFFF")
        self.codigo_scanner_var.set("")
        self.scanner_entry.focus()

    def pedir_cantidad_rapida(self, nombre_producto, stock):
        dialog = tk.Toplevel(self.ventana)
        dialog.title("Cantidad - Tealdi")
        dialog.configure(bg=Tema.BG_CARD)
        dialog.transient(self.ventana)
        dialog.grab_set()
        centrar_ventana(dialog, 360 if self.es_pantalla_pequena else 380, 160 if self.es_pantalla_pequena else 180)

        cantidad_var = tk.StringVar(value="1")
        resultado = {"valor": None}

        tk.Label(dialog, text=f"🥤 {nombre_producto}", font=(Tema.FONT_FAMILY, 12 if self.es_pantalla_pequena else 13, "bold"), bg=Tema.BG_CARD, fg=Tema.PRIMARY).pack(pady=10)
        tk.Label(dialog, text=f"Stock disponible: {stock}", font=(Tema.FONT_FAMILY, 9 if self.es_pantalla_pequena else 10), bg=Tema.BG_CARD, fg=Tema.TEXT_SECONDARY).pack(pady=4)
        tk.Label(dialog, text="Cantidad:", font=(Tema.FONT_FAMILY, 10 if self.es_pantalla_pequena else 11, "bold"), bg=Tema.BG_CARD, fg=Tema.TEXT_PRIMARY).pack(pady=6)

        cantidad_entry_frame = WidgetFactory.crear_entry(dialog, cantidad_var, width=14 if self.es_pantalla_pequena else 15)
        cantidad_entry_frame.pack(pady=6)

        cantidad_entry = None
        for widget in cantidad_entry_frame.winfo_children():
            if isinstance(widget, tk.Entry):
                cantidad_entry = widget
                break

        if cantidad_entry:
            cantidad_entry.focus()
            cantidad_entry.select_range(0, tk.END)

        def aceptar():
            try:
                cant = int(cantidad_var.get())
                if cant > 0:
                    resultado["valor"] = cant
                    dialog.destroy()
                else:
                    dialog.bell()
            except ValueError:
                dialog.bell()

        btn_frame = tk.Frame(dialog, bg=Tema.BG_CARD)
        btn_frame.pack(pady=12)
        WidgetFactory.crear_boton(btn_frame, "✅ OK", aceptar, "success", width=10).pack(side=tk.LEFT, padx=4)
        WidgetFactory.crear_boton(btn_frame, "❌ Cancelar", dialog.destroy, "danger", width=10).pack(side=tk.LEFT, padx=4)

        if cantidad_entry:
            cantidad_entry.bind("<Return>", lambda e: aceptar())
        dialog.bind("<Escape>", lambda e: dialog.destroy())
        dialog.wait_window()
        return resultado["valor"]

    def agregar_al_carrito(self):
        seleccion = self.tree_productos.selection()
        if not seleccion:
            messagebox.showwarning("Advertencia - Tealdi", "Seleccione un producto", parent=self.ventana)
            return
        item = self.tree_productos.item(seleccion[0])
        valores = item["values"]
        codigo, nombre, tamaño, marca, stock_str, precio_str = valores
        stock = int(str(stock_str).replace(".", ""))
        cantidad = self.pedir_cantidad(nombre, stock)
        if cantidad is None or cantidad <= 0:
            return
        if cantidad > stock:
            messagebox.showerror("Error - Tealdi", f"Stock insuficiente (stock: {stock})", parent=self.ventana)
            return
        precio = float(str(precio_str).replace("$", "").replace(".", "").replace(",", "."))
        self.carrito.append({"codigo": codigo, "nombre": nombre, "tamaño": tamaño, "marca": marca, "cantidad": cantidad, "precio": precio, "subtotal": cantidad * precio})
        self.actualizar_carrito()

    def pedir_cantidad(self, nombre_producto, stock):
        dialog = tk.Toplevel(self.ventana)
        dialog.title("Cantidad - Tealdi")
        dialog.configure(bg=Tema.BG_CARD)
        dialog.transient(self.ventana)
        dialog.grab_set()
        centrar_ventana(dialog, 380 if self.es_pantalla_pequena else 400, 180 if self.es_pantalla_pequena else 200)

        cantidad_var = tk.StringVar(value="1")
        resultado = {"valor": None}

        tk.Label(dialog, text=f"Producto: {nombre_producto}", font=(Tema.FONT_FAMILY, 11 if self.es_pantalla_pequena else 12, "bold"), bg=Tema.BG_CARD, fg=Tema.PRIMARY).pack(pady=10)
        tk.Label(dialog, text=f"Stock: {stock}", font=(Tema.FONT_FAMILY, 10 if self.es_pantalla_pequena else 11), bg=Tema.BG_CARD, fg=Tema.TEXT_SECONDARY).pack(pady=6)
        tk.Label(dialog, text="Cantidad:", font=(Tema.FONT_FAMILY, 10 if self.es_pantalla_pequena else 11, "bold"), bg=Tema.BG_CARD, fg=Tema.TEXT_PRIMARY).pack(pady=6)

        cantidad_entry_frame = WidgetFactory.crear_entry(dialog, cantidad_var, width=16 if self.es_pantalla_pequena else 18)
        cantidad_entry_frame.pack(pady=6)

        cantidad_entry = None
        for widget in cantidad_entry_frame.winfo_children():
            if isinstance(widget, tk.Entry):
                cantidad_entry = widget
                break

        if cantidad_entry:
            cantidad_entry.focus()
            cantidad_entry.select_range(0, tk.END)

        def aceptar():
            try:
                cant = int(cantidad_var.get())
                if cant > 0:
                    resultado["valor"] = cant
                    dialog.destroy()
                else:
                    messagebox.showerror("Error - Tealdi", "La cantidad debe ser mayor a cero", parent=dialog)
            except ValueError:
                messagebox.showerror("Error - Tealdi", "Número inválido", parent=dialog)

        btn_frame = tk.Frame(dialog, bg=Tema.BG_CARD)
        btn_frame.pack(pady=14)
        WidgetFactory.crear_boton(btn_frame, "✅ OK", aceptar, "success", width=12 if self.es_pantalla_pequena else 14).pack(side=tk.LEFT, padx=4)
        WidgetFactory.crear_boton(btn_frame, "❌ Cancelar", dialog.destroy, "danger", width=12 if self.es_pantalla_pequena else 14).pack(side=tk.LEFT, padx=4)

        if cantidad_entry:
            cantidad_entry.bind("<Return>", lambda e: aceptar())
        dialog.bind("<Escape>", lambda e: dialog.destroy())
        dialog.wait_window()
        return resultado["valor"]

    def actualizar_carrito(self):
        self.tree_carrito.delete(*self.tree_carrito.get_children())
        total = 0.0
        for item in self.carrito:
            self.tree_carrito.insert("", tk.END, values=(item["nombre"], item["tamaño"], item["cantidad"], formatear_precio(item["precio"]), formatear_precio(item["subtotal"])))
            total += item["subtotal"]
        self.total_label.config(text=formatear_precio(total))
        self.scanner_entry.focus()

    def quitar_del_carrito(self):
        seleccion = self.tree_carrito.selection()
        if not seleccion:
            messagebox.showwarning("Advertencia - Tealdi", "Seleccione un ítem", parent=self.ventana)
            return
        index = self.tree_carrito.index(seleccion[0])
        del self.carrito[index]
        self.actualizar_carrito()

    def vaciar_carrito(self):
        if not self.carrito:
            return
        if messagebox.askyesno("Confirmar - Tealdi", "¿Vaciar carrito?", parent=self.ventana):
            self.carrito = []
            self.actualizar_carrito()

    def finalizar_venta(self):
        """ACTUALIZADO: con opción de impresión directa"""
        if not self.carrito:
            messagebox.showwarning("Advertencia - Tealdi", "Carrito vacío", parent=self.ventana)
            return
        total = sum(item["subtotal"] for item in self.carrito)
        try:
            venta_id = db.registrar_venta(self.carrito, self.metodo_pago_var.get(), self.cliente_var.get(), total)
            
            # Mostrar confirmación con opción de imprimir
            mensaje = f"✅ Venta {venta_id} realizada exitosamente\n\nTotal: {formatear_precio(total)}\nMétodo: {self.metodo_pago_var.get()}\n\n¿Desea imprimir el ticket?"
            
            if messagebox.askyesno("Venta Realizada - Tealdi", mensaje, parent=self.ventana):
                self.imprimir_ticket_directo(venta_id)
            
            # Limpiar carrito
            self.carrito = []
            self.actualizar_carrito()
            self.cliente_var.set("")
            self.cargar_productos()
            self.scanner_entry.focus()
            
            # Actualizar inventario en main
            try:
                if hasattr(self, "sistema"):
                    self.sistema.actualizar_tabla()
                    self.sistema.actualizar_estadisticas()
            except Exception:
                pass
        except ValueError as e:
            messagebox.showerror("Error - Tealdi", str(e), parent=self.ventana)
        except Exception as e:
            messagebox.showerror("Error - Tealdi", f"Error al procesar venta:\n{str(e)}", parent=self.ventana)

    def imprimir_ticket_directo(self, venta_id: int):
        """NUEVO: Imprime el ticket directamente en la impresora predeterminada"""
        if not IMPRESION_DISPONIBLE:
            messagebox.showerror("Error - Tealdi", "Módulo de impresión no disponible.\nInstale pywin32: pip install pywin32", parent=self.ventana)
            return
        
        venta = db.obtener_venta(venta_id)
        if not venta:
            messagebox.showerror("Error - Tealdi", "No se pudo recuperar la venta para imprimir.", parent=self.ventana)
            return
        
        ticket_texto = self.generar_ticket_texto(venta)
        
        try:
            # Crear archivo temporal
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt', encoding='utf-8') as f:
                f.write(ticket_texto)
                temp_file = f.name
            
            # Obtener impresora predeterminada
            impresora = win32print.GetDefaultPrinter()
            
            # Imprimir archivo
            win32api.ShellExecute(
                0,
                "print",
                temp_file,
                f'/d:"{impresora}"',
                ".",
                0
            )
            
            messagebox.showinfo("Impresión - Tealdi", f"Ticket enviado a impresora:\n{impresora}", parent=self.ventana)
            
            # Eliminar archivo temporal después de un delay
            self.ventana.after(5000, lambda: os.unlink(temp_file) if os.path.exists(temp_file) else None)
            
        except Exception as e:
            messagebox.showerror("Error de Impresión - Tealdi", f"No se pudo imprimir:\n{str(e)}\n\nVerifique que haya una impresora configurada.", parent=self.ventana)

    def generar_ticket_texto(self, venta: Dict) -> str:
        """Genera el texto del ticket"""
        linea = "-" * 50
        fecha_hora = datetime.strptime(venta["fecha"], "%Y-%m-%d %H:%M:%S")
        ticket = f"{linea}\n      BEBIDAS TEALDI\n   Sistema de Ventas Premium\n{linea}\n"
        ticket += f"Ticket N°: {venta['id']}\nFecha: {fecha_hora.strftime('%d/%m/%Y')}\nHora:  {fecha_hora.strftime('%H:%M:%S')}\n"
        ticket += f"Cliente: {venta['cliente'] or 'Público General'}\nMétodo: {venta['metodo_pago']}\n{linea}\nDETALLE DE COMPRA\n{linea}\n"
        for item in venta["items"]:
            ticket += f"{item['nombre']} - {item['marca']}\n  {item['tamaño']}  {item['cantidad']} x {formatear_precio(item['precio'])}  = {formatear_precio(item['subtotal'])}\n"
        ticket += f"{linea}\nTotal ítems: {len(venta['items'])}\nTOTAL: {formatear_precio(venta['total'])}\n{linea}\nGracias por su compra!\nBEBIDAS TEALDI\n{linea}\n"
        return ticket


def abrir_ventana_ventas_bebidas(sistema_principal):
    """Función para abrir la ventana de ventas desde el main"""
    VentanaVentasTealdi(sistema_principal)


if __name__ == "__main__":
    # Para testing standalone
    root = tk.Tk()
    root.withdraw()
    class FakeSistema:
        def __init__(self, root_):
            self.root = root_
        def actualizar_tabla(self):
            pass
        def actualizar_estadisticas(self):
            pass
    VentanaVentasTealdi(FakeSistema(root))
    root.mainloop()
