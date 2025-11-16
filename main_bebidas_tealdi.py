# -*- coding: utf-8 -*-

import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
from actualizador_bebidas import verificar_actualizacion_al_inicio, forzar_verificacion_actualizacion


from database_bebidas import db
from validaciones_bebidas import ValidadorBebidas
from ui_helpers_bebidas import (
    Tema,
    EstiloManager,
    WidgetFactory,
    centrar_ventana,
    formatear_precio,
    formatear_numero,
    crear_titulo_seccion,
)
from ventas_bebidas import abrir_ventana_ventas_bebidas
from reportes_bebidas import abrir_ventana_reportes_bebidas


class SistemaTealdi:
    """Sistema BEBIDAS TEALDI - Diseño Responsive (PC + Notebook)"""

    def __init__(self, root):
        self.root = root
        self.configurar_ventana()

        # Variables de formulario
        self.codigo_var = tk.StringVar()
        self.nombre_var = tk.StringVar()
        self.categoria_var = tk.StringVar()
        self.tamano_var = tk.StringVar()
        self.marca_var = tk.StringVar()
        self.cantidad_var = tk.StringVar()
        self.precio_var = tk.StringVar()
        self.busqueda_var = tk.StringVar()

        # Estado edición
        self.codigo_original = None
        self.modo_edicion = False

        # Configuración
        self.umbral_bajo_stock = 5
        self._ya_mostro_alerta_bajo_stock = False
        self.tree_productos = None

        # Detectar tamaño de pantalla para ajustar interfaz
        self.es_pantalla_pequena = self.root.winfo_screenheight() < 800

        EstiloManager.configurar_estilos()
        self.crear_interfaz()
        self.actualizar_tabla()
        self.actualizar_estadisticas()

    def configurar_ventana(self):
        self.root.title("🥤 Bebidas TEALDI v4.0 - Sistema Premium")

        # Detectar resolución y ajustar
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()

        if screen_h < 800:  # Notebook
            ancho, alto = min(screen_w - 100, 1366), min(screen_h - 100, 768)
        else:  # PC escritorio
            ancho, alto = min(screen_w - 100, 1500), min(screen_h - 100, 850)

        centrar_ventana(self.root, ancho, alto)
        self.root.configure(bg=Tema.BG_MAIN)
        self.root.minsize(1200, 650)

        try:
            self.root.state("zoomed")
        except Exception:
            pass

    def crear_interfaz(self):
        # Ajustar padding según tamaño de pantalla
        pad = 6 if self.es_pantalla_pequena else 10

        main_container = tk.Frame(self.root, bg=Tema.BG_MAIN)
        main_container.pack(fill=tk.BOTH, expand=True, padx=pad, pady=pad)

        self.crear_header(main_container)

        content_frame = tk.Frame(main_container, bg=Tema.BG_MAIN)
        content_frame.pack(fill=tk.BOTH, expand=True, pady=(pad, 0))

        self.crear_panel_formulario(content_frame)
        self.crear_panel_tabla(content_frame)
        self.crear_panel_estadisticas(main_container)

        content_frame.columnconfigure(1, weight=1)
        content_frame.rowconfigure(0, weight=1)

    def crear_header(self, parent):
        """Header adaptativo"""
        header_height = 55 if self.es_pantalla_pequena else 70
        font_size_title = 16 if self.es_pantalla_pequena else 24
        font_size_sub = 8 if self.es_pantalla_pequena else 10
        emoji_size = 20 if self.es_pantalla_pequena else 30

        header_shadow = tk.Frame(parent, bg=Tema.SHADOW, height=header_height)
        header_shadow.pack(fill=tk.X, pady=(0, 8))
        header_shadow.pack_propagate(False)

        header_frame = tk.Frame(header_shadow, bg=Tema.BG_HEADER)
        header_frame.pack(fill=tk.BOTH, expand=True, padx=2, pady=2)

        left_frame = tk.Frame(header_frame, bg=Tema.BG_HEADER)
        left_frame.pack(side=tk.LEFT, padx=15, pady=10)

        logo = tk.Label(
            left_frame,
            text="🥤",
            font=("Segoe UI Emoji", emoji_size),
            bg=Tema.BG_HEADER,
            fg=Tema.TEXT_LIGHT,
        )
        logo.pack(side=tk.LEFT, padx=(0, 12))

        text_frame = tk.Frame(left_frame, bg=Tema.BG_HEADER)
        text_frame.pack(side=tk.LEFT)

        titulo = tk.Label(
            text_frame,
            text="BEBIDAS TEALDI",
            font=(Tema.FONT_FAMILY, font_size_title, "bold"),
            bg=Tema.BG_HEADER,
            fg=Tema.TEXT_LIGHT,
        )
        titulo.pack(anchor=tk.W)

        subtitulo = tk.Label(
            text_frame,
            text="Sistema de Gestión Premium",
            font=(Tema.FONT_FAMILY, font_size_sub),
            bg=Tema.BG_HEADER,
            fg=Tema.PRIMARY_LIGHT,
        )
        subtitulo.pack(anchor=tk.W)

        right_frame = tk.Frame(header_frame, bg=Tema.BG_HEADER)
        right_frame.pack(side=tk.RIGHT, padx=15, pady=10)

        version_frame = tk.Frame(right_frame, bg=Tema.PRIMARY_DARK)
        version_frame.pack(side=tk.LEFT, padx=(0, 12))

        tk.Label(
            version_frame,
            text=" v4.0 ",
            font=(Tema.FONT_FAMILY, 7 if self.es_pantalla_pequena else 9, "bold"),
            bg=Tema.PRIMARY_DARK,
            fg=Tema.TEXT_LIGHT,
        ).pack(padx=6, pady=3)

        fecha = tk.Label(
            right_frame,
            text=f"📅 {datetime.now().strftime('%d/%m/%Y')}",
            font=(Tema.FONT_FAMILY, 9 if self.es_pantalla_pequena else 11),
            bg=Tema.BG_HEADER,
            fg=Tema.TEXT_LIGHT,
        )
        fecha.pack(side=tk.LEFT)

    def crear_panel_formulario(self, parent):
        """Panel formulario CON SCROLL y PROMO con código opcional"""
        shadow, form_container = WidgetFactory.crear_frame_card(parent)
        shadow.grid(row=0, column=0, sticky="nsew", padx=(0, 8))

        pad_x = 10 if self.es_pantalla_pequena else 15
        pad_y = 5 if self.es_pantalla_pequena else 8
        font_title = 10 if self.es_pantalla_pequena else 13

        titulo_frame = tk.Frame(form_container, bg=Tema.BG_CARD)
        titulo_frame.pack(fill=tk.X, padx=pad_x, pady=(pad_y, pad_y - 2))

        tk.Label(
            titulo_frame,
            text="🥤 Datos del Producto",
            font=(Tema.FONT_FAMILY, font_title, "bold"),
            bg=Tema.BG_CARD,
            fg=Tema.PRIMARY,
            anchor=tk.W,
        ).pack(side=tk.LEFT, padx=5)

        linea = tk.Frame(titulo_frame, bg=Tema.PRIMARY, height=2)
        linea.pack(fill=tk.X, padx=5)

        # Canvas con scroll
        canvas_frame = tk.Frame(form_container, bg=Tema.BG_CARD)
        canvas_frame.pack(fill=tk.BOTH, expand=True, padx=3, pady=(0, pad_y))

        scrollbar = tk.Scrollbar(canvas_frame, orient=tk.VERTICAL, bg=Tema.BG_CARD)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        canvas = tk.Canvas(
            canvas_frame,
            bg=Tema.BG_CARD,
            yscrollcommand=scrollbar.set,
            highlightthickness=0,
        )
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        scrollbar.config(command=canvas.yview)

        campos_frame = tk.Frame(canvas, bg=Tema.BG_CARD)
        canvas_window = canvas.create_window((0, 0), window=campos_frame, anchor="nw")

        def on_frame_configure(event):
            canvas.configure(scrollregion=canvas.bbox("all"))

        def on_canvas_configure(event):
            canvas.itemconfig(canvas_window, width=event.width)

        campos_frame.bind("<Configure>", on_frame_configure)
        canvas.bind("<Configure>", on_canvas_configure)

        def on_mousewheel(event):
            canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

        canvas.bind_all("<MouseWheel>", on_mousewheel)

        PAD_Y = 4 if self.es_pantalla_pequena else 8
        PAD_X_L = 10 if self.es_pantalla_pequena else 15
        PAD_X_R = 10 if self.es_pantalla_pequena else 15

        # Código - CON LABEL DINÁMICO PARA PROMO
        self.codigo_label = WidgetFactory.crear_label(campos_frame, "🔖 Código:", "normal")
        self.codigo_label.grid(row=0, column=0, sticky="w", pady=PAD_Y, padx=(PAD_X_L, 0))

        codigo_container = tk.Frame(campos_frame, bg=Tema.BG_CARD)
        codigo_container.grid(row=0, column=1, pady=PAD_Y, padx=(8, PAD_X_R), sticky="ew")

        self.codigo_entry_frame = WidgetFactory.crear_entry(codigo_container, self.codigo_var, width=25)
        self.codigo_entry_frame.pack(side=tk.LEFT, fill=tk.X, expand=True)

        self.codigo_entry = None
        for widget in self.codigo_entry_frame.winfo_children():
            if isinstance(widget, tk.Entry):
                self.codigo_entry = widget
                break

        if self.codigo_entry:
            self.codigo_entry.bind("<Return>", lambda e: self.procesar_codigo_escaneado())

        self.indicador_scanner = tk.Label(
            codigo_container,
            text="🔍",
            font=(Tema.FONT_FAMILY, 12 if self.es_pantalla_pequena else 14),
            bg=Tema.BG_CARD,
            fg=Tema.SUCCESS,
        )
        self.indicador_scanner.pack(side=tk.LEFT, padx=(8, 0))

        # Nombre
        WidgetFactory.crear_label(campos_frame, "🥤 Nombre:", "normal").grid(
            row=1, column=0, sticky="w", pady=PAD_Y, padx=(PAD_X_L, 0)
        )
        WidgetFactory.crear_entry(campos_frame, self.nombre_var, width=30).grid(
            row=1, column=1, pady=PAD_Y, padx=(8, PAD_X_R), sticky="ew"
        )

        # Categoría CON NUEVAS CATEGORÍAS
        WidgetFactory.crear_label(campos_frame, "📦 Categoría:", "normal").grid(
            row=2, column=0, sticky="w", pady=PAD_Y, padx=(PAD_X_L, 0)
        )

        cat_frame = tk.Frame(campos_frame, bg=Tema.SHADOW)
        cat_frame.grid(row=2, column=1, pady=PAD_Y, padx=(8, PAD_X_R), sticky="ew")

        cat_inner = tk.Frame(cat_frame, bg=Tema.BG_CARD)
        cat_inner.pack(padx=1, pady=1, fill=tk.BOTH, expand=True)

        self.categoria_combo = ttk.Combobox(
            cat_inner,
            textvariable=self.categoria_var,
            values=ValidadorBebidas.CATEGORIAS_VALIDAS,
            font=(Tema.FONT_FAMILY, 9 if self.es_pantalla_pequena else 10),
            state="readonly",
        )
        self.categoria_combo.pack(padx=4 if self.es_pantalla_pequena else 6, 
                            pady=4 if self.es_pantalla_pequena else 6, fill=tk.X)

        # EVENTO: cuando cambia categoría, actualizar label de código
        self.categoria_combo.bind("<<ComboboxSelected>>", self.on_categoria_changed)

        # Tamaño
        WidgetFactory.crear_label(campos_frame, "📏 Tamaño:", "normal").grid(
            row=3, column=0, sticky="w", pady=PAD_Y, padx=(PAD_X_L, 0)
        )

        tam_frame = tk.Frame(campos_frame, bg=Tema.SHADOW)
        tam_frame.grid(row=3, column=1, pady=PAD_Y, padx=(8, PAD_X_R), sticky="ew")

        tam_inner = tk.Frame(tam_frame, bg=Tema.BG_CARD)
        tam_inner.pack(padx=1, pady=1, fill=tk.BOTH, expand=True)

        tamano_combo = ttk.Combobox(
            tam_inner,
            textvariable=self.tamano_var,
            values=ValidadorBebidas.TAMAÑOS_VALIDOS,
            font=(Tema.FONT_FAMILY, 9 if self.es_pantalla_pequena else 10),
        )
        tamano_combo.pack(padx=4 if self.es_pantalla_pequena else 6,
                         pady=4 if self.es_pantalla_pequena else 6, fill=tk.X)

        # Marca - CON LABEL DINÁMICO PARA PROMO
        self.marca_label = WidgetFactory.crear_label(campos_frame, "🏷️ Marca:", "normal")
        self.marca_label.grid(
            row=4, column=0, sticky="w", pady=PAD_Y, padx=(PAD_X_L, 0)
        )
        WidgetFactory.crear_entry(campos_frame, self.marca_var, width=30).grid(
            row=4, column=1, pady=PAD_Y, padx=(8, PAD_X_R), sticky="ew"
        )

        # Stock
        WidgetFactory.crear_label(campos_frame, "📦 Stock:", "normal").grid(
            row=5, column=0, sticky="w", pady=PAD_Y, padx=(PAD_X_L, 0)
        )
        WidgetFactory.crear_entry(campos_frame, self.cantidad_var, width=30).grid(
            row=5, column=1, pady=PAD_Y, padx=(8, PAD_X_R), sticky="ew"
        )

        # Precio
        WidgetFactory.crear_label(campos_frame, "💸 Precio:", "normal").grid(
            row=6, column=0, sticky="w", pady=PAD_Y, padx=(PAD_X_L, 0)
        )

        precio_frame = tk.Frame(campos_frame, bg=Tema.BG_CARD)
        precio_frame.grid(row=6, column=1, pady=PAD_Y, padx=(8, PAD_X_R), sticky="ew")

        tk.Label(
            precio_frame,
            text="$",
            font=(Tema.FONT_FAMILY, 10, "bold"),
            bg=Tema.BG_CARD,
            fg=Tema.PRIMARY,
        ).pack(side=tk.LEFT, padx=(0, 5))

        WidgetFactory.crear_entry(precio_frame, self.precio_var, width=25).pack(
            side=tk.LEFT, fill=tk.X, expand=True
        )

        # Separador
        sep = tk.Frame(campos_frame, height=2 if self.es_pantalla_pequena else 2, bg=Tema.PRIMARY_LIGHT)
        sep.grid(row=7, column=0, columnspan=2, sticky="ew", pady=PAD_Y, padx=PAD_X_L)

        # Botones CRUD
        btn_frame = tk.Frame(campos_frame, bg=Tema.BG_CARD)
        btn_frame.grid(row=8, column=0, columnspan=2, pady=4 if self.es_pantalla_pequena else 6)

        btn_width = 12 if self.es_pantalla_pequena else 14

        self.btn_agregar = WidgetFactory.crear_boton(
            btn_frame, "➕ AGREGAR", self.agregar_producto, "success", width=btn_width
        )
        self.btn_agregar.grid(row=0, column=0, padx=3, pady=2 if self.es_pantalla_pequena else 3)

        self.btn_actualizar = WidgetFactory.crear_boton(
            btn_frame, "✅ ACTUALIZAR", self.actualizar_producto, "primary", width=btn_width
        )
        self.btn_actualizar.grid(row=0, column=1, padx=3, pady=2 if self.es_pantalla_pequena else 3)
        self.btn_actualizar.config(state=tk.DISABLED)

        self.btn_eliminar = WidgetFactory.crear_boton(
            btn_frame, "🗑️ ELIMINAR", self.eliminar_producto, "danger", width=btn_width
        )
        self.btn_eliminar.grid(row=1, column=0, padx=3, pady=2 if self.es_pantalla_pequena else 3)
        self.btn_eliminar.config(state=tk.DISABLED)

        self.btn_limpiar = WidgetFactory.crear_boton(
            btn_frame, "🔄 LIMPIAR", self.limpiar_formulario, "warning", width=btn_width
        )
        self.btn_limpiar.grid(row=1, column=1, padx=3, pady=2 if self.es_pantalla_pequena else 3)

        # Separador
        sep2 = tk.Frame(campos_frame, height=2 if self.es_pantalla_pequena else 2, bg=Tema.SUCCESS_LIGHT)
        sep2.grid(row=9, column=0, columnspan=2, sticky="ew", pady=PAD_Y, padx=PAD_X_L)

        # Módulo REPORTES
        reportes_label = tk.Label(
            campos_frame,
            text="📊 REPORTES Y ANÁLISIS",
            font=(Tema.FONT_FAMILY, 10 if self.es_pantalla_pequena else 11, "bold"),
            bg=Tema.BG_CARD,
            fg=Tema.INFO,
        )
        reportes_label.grid(row=10, column=0, columnspan=2, pady=(3, 3))

        WidgetFactory.crear_boton(
            campos_frame,
            "📊 VER REPORTES",
            self.abrir_reportes,
            "info",
            width=28 if self.es_pantalla_pequena else 32,
        ).grid(row=11, column=0, columnspan=2, pady=(0, 8))

        # Separador
        sep3 = tk.Frame(campos_frame, height=2 if self.es_pantalla_pequena else 2, bg=Tema.PRIMARY_LIGHT)
        sep3.grid(row=12, column=0, columnspan=2, sticky="ew", pady=PAD_Y, padx=PAD_X_L)

        # Módulo ventas
        ventas_label = tk.Label(
            campos_frame,
            text="🧾 PUNTO DE VENTA",
            font=(Tema.FONT_FAMILY, 10 if self.es_pantalla_pequena else 11, "bold"),
            bg=Tema.BG_CARD,
            fg=Tema.SUCCESS,
        )
        ventas_label.grid(row=13, column=0, columnspan=2, pady=(3, 3))

        WidgetFactory.crear_boton(
            campos_frame,
            "🧾 ABRIR VENTAS",
            self.abrir_ventas,
            "success",
            width=28 if self.es_pantalla_pequena else 32,
        ).grid(row=14, column=0, columnspan=2, pady=(0, PAD_X_L))

        campos_frame.columnconfigure(1, weight=1)

    def on_categoria_changed(self, event=None):
        """Cambiar labels según categoría seleccionada"""
        categoria = self.categoria_var.get()

        if categoria == "PROMO":
            # Para PROMO: código y marca opcionales
            self.codigo_label.config(text="🔖 Código: (Opcional)", fg=Tema.SUCCESS)
            if hasattr(self, 'marca_label'):
                self.marca_label.config(text="🏷️ Marca: (Opcional)", fg=Tema.SUCCESS)
        else:
            # Para otras categorías: todos obligatorios
            self.codigo_label.config(text="🔖 Código:", fg=Tema.TEXT_PRIMARY)
            if hasattr(self, 'marca_label'):
                self.marca_label.config(text="🏷️ Marca:", fg=Tema.TEXT_PRIMARY)

    def crear_panel_tabla(self, parent):
        """Panel de tabla adaptativo"""
        shadow, tabla_container = WidgetFactory.crear_frame_card(parent)
        shadow.grid(row=0, column=1, sticky="nsew")

        pad_x = 10 if self.es_pantalla_pequena else 15
        pad_y = 5 if self.es_pantalla_pequena else 8
        font_title = 10 if self.es_pantalla_pequena else 13

        # Título
        titulo_frame = tk.Frame(tabla_container, bg=Tema.BG_CARD)
        titulo_frame.pack(fill=tk.X, padx=pad_x, pady=(pad_y, pad_y - 2))

        tk.Label(
            titulo_frame,
            text="📋 Inventario de Productos",
            font=(Tema.FONT_FAMILY, font_title, "bold"),
            bg=Tema.BG_CARD,
            fg=Tema.PRIMARY,
            anchor=tk.W,
        ).pack(side=tk.LEFT, padx=5)

        linea = tk.Frame(titulo_frame, bg=Tema.PRIMARY, height=2)
        linea.pack(fill=tk.X, padx=5)

        # Búsqueda
        search_frame = tk.Frame(tabla_container, bg=Tema.BG_CARD)
        search_frame.pack(fill=tk.X, padx=pad_x, pady=(3, pad_y))

        tk.Label(
            search_frame,
            text="🔍",
            font=(Tema.FONT_FAMILY, 11 if self.es_pantalla_pequena else 13),
            bg=Tema.BG_CARD,
        ).pack(side=tk.LEFT, padx=(0, 6))

        busq_entry_frame = WidgetFactory.crear_entry(search_frame, self.busqueda_var, width=25 if self.es_pantalla_pequena else 28)
        busq_entry_frame.pack(side=tk.LEFT, padx=(0, 6))

        busq_entry = None
        for widget in busq_entry_frame.winfo_children():
            if isinstance(widget, tk.Entry):
                busq_entry = widget
                break

        if busq_entry:
            busq_entry.bind("<KeyRelease-Return>", lambda e: self.actualizar_tabla())

        WidgetFactory.crear_boton(
            search_frame,
            "Buscar",
            self.actualizar_tabla,
            "info",
            width=9 if self.es_pantalla_pequena else 10,
        ).pack(side=tk.LEFT)

        # Tabla
        tree_container = tk.Frame(tabla_container, bg=Tema.SHADOW)
        tree_container.pack(fill=tk.BOTH, expand=True, padx=pad_x, pady=(0, pad_y))

        tree_inner = tk.Frame(tree_container, bg=Tema.BG_CARD)
        tree_inner.pack(padx=2, pady=2, fill=tk.BOTH, expand=True)

        scrollbar = ttk.Scrollbar(tree_inner, orient=tk.VERTICAL)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        tree_height = 14 if self.es_pantalla_pequena else 12

        self.tree_productos = ttk.Treeview(
            tree_inner,
            columns=("codigo", "nombre", "categoria", "tamaño", "marca", "stock", "precio"),
            show="headings",
            yscrollcommand=scrollbar.set,
            height=tree_height,
            style="Modern.Treeview",
        )

        self.tree_productos.heading("codigo", text="Código")
        self.tree_productos.heading("nombre", text="Nombre")
        self.tree_productos.heading("categoria", text="Categoría")
        self.tree_productos.heading("tamaño", text="Tamaño")
        self.tree_productos.heading("marca", text="Marca")
        self.tree_productos.heading("stock", text="Stock")
        self.tree_productos.heading("precio", text="Precio")

        col_w = 0.85 if self.es_pantalla_pequena else 1.0
        self.tree_productos.column("codigo", width=int(80 * col_w), anchor=tk.CENTER)
        self.tree_productos.column("nombre", width=int(200 * col_w))
        self.tree_productos.column("categoria", width=int(120 * col_w))
        self.tree_productos.column("tamaño", width=int(80 * col_w), anchor=tk.CENTER)
        self.tree_productos.column("marca", width=int(130 * col_w))
        self.tree_productos.column("stock", width=int(70 * col_w), anchor=tk.CENTER)
        self.tree_productos.column("precio", width=int(90 * col_w), anchor=tk.CENTER)

        self.tree_productos.pack(fill=tk.BOTH, expand=True, padx=6, pady=6)
        scrollbar.config(command=self.tree_productos.yview)

        self.tree_productos.bind("<<TreeviewSelect>>", self.on_seleccion_tabla)

    def crear_panel_estadisticas(self, parent):
        """Panel de estadísticas adaptativo"""
        shadow = tk.Frame(parent, bg=Tema.SHADOW)
        shadow.pack(fill=tk.X, pady=(8 if self.es_pantalla_pequena else 10, 0))

        stats_frame = tk.Frame(shadow, bg=Tema.BG_CARD)
        stats_frame.pack(fill=tk.X, padx=2, pady=2)

        pad_x = 10 if self.es_pantalla_pequena else 15
        pad_y = 5 if self.es_pantalla_pequena else 8
        font_title = 10 if self.es_pantalla_pequena else 12

        titulo = tk.Label(
            stats_frame,
            text="📊 Resumen de Inventario",
            font=(Tema.FONT_FAMILY, font_title, "bold"),
            bg=Tema.BG_CARD,
            fg=Tema.PRIMARY,
        )
        titulo.pack(anchor=tk.W, padx=pad_x, pady=(pad_y, 3))

        body = tk.Frame(stats_frame, bg=Tema.BG_CARD)
        body.pack(fill=tk.X, padx=pad_x, pady=(0, pad_y))

        font_label = 9 if self.es_pantalla_pequena else 10
        font_value = 10 if self.es_pantalla_pequena else 11

        tk.Label(
            body,
            text="Productos registrados:",
            font=(Tema.FONT_FAMILY, font_label),
            bg=Tema.BG_CARD,
            fg=Tema.TEXT_SECONDARY,
        ).grid(row=0, column=0, sticky="w")

        self.lbl_total_productos_valor = tk.Label(
            body,
            text="0",
            font=(Tema.FONT_FAMILY, font_value, "bold"),
            bg=Tema.BG_CARD,
            fg=Tema.TEXT_PRIMARY,
        )
        self.lbl_total_productos_valor.grid(row=0, column=1, sticky="w", padx=(6, 15))

        tk.Label(
            body,
            text="Unidades en stock:",
            font=(Tema.FONT_FAMILY, font_label),
            bg=Tema.BG_CARD,
            fg=Tema.TEXT_SECONDARY,
        ).grid(row=1, column=0, sticky="w")

        self.lbl_stock_total_valor = tk.Label(
            body,
            text="0",
            font=(Tema.FONT_FAMILY, font_value, "bold"),
            bg=Tema.BG_CARD,
            fg=Tema.TEXT_PRIMARY,
        )
        self.lbl_stock_total_valor.grid(row=1, column=1, sticky="w", padx=(6, 15))

        tk.Label(
            body,
            text="Valor estimado inventario:",
            font=(Tema.FONT_FAMILY, font_label),
            bg=Tema.BG_CARD,
            fg=Tema.TEXT_SECONDARY,
        ).grid(row=2, column=0, sticky="w")

        self.lbl_valor_inventario_valor = tk.Label(
            body,
            text="$0,00",
            font=(Tema.FONT_FAMILY, font_value, "bold"),
            bg=Tema.BG_CARD,
            fg=Tema.TEXT_PRIMARY,
        )
        self.lbl_valor_inventario_valor.grid(row=2, column=1, sticky="w", padx=(6, 15))

        tk.Label(
            body,
            text="Productos sin stock:",
            font=(Tema.FONT_FAMILY, font_label),
            bg=Tema.BG_CARD,
            fg=Tema.TEXT_SECONDARY,
        ).grid(row=0, column=2, sticky="w", padx=(30, 0))

        self.lbl_sin_stock_valor = tk.Label(
            body,
            text="0",
            font=(Tema.FONT_FAMILY, font_value, "bold"),
            bg=Tema.BG_CARD,
            fg=Tema.DANGER,
        )
        self.lbl_sin_stock_valor.grid(row=0, column=3, sticky="w", padx=(6, 0))

    # ============ LÓGICA ============

    def procesar_codigo_escaneado(self):
        codigo = self.codigo_var.get().strip()
        if not codigo:
            return

        producto = db.obtener_articulo(codigo)
        if producto:
            respuesta = messagebox.askyesno(
                "Producto Existente - Tealdi",
                f"El código ya existe:\n\nCódigo: {producto[0]}\nProducto: {producto[1]}\nMarca: {producto[4]}\n\n¿Deseas editarlo?",
                parent=self.root,
            )
            if respuesta:
                self.modo_edicion = True
                self.codigo_original = producto[0]
                self.codigo_var.set(producto[0])
                self.nombre_var.set(producto[1])
                self.categoria_var.set(producto[2])
                self.tamano_var.set(producto[3])
                self.marca_var.set(producto[4])
                self.cantidad_var.set(str(producto[5]))
                self.precio_var.set(str(producto[6]))
                self.btn_actualizar.config(state=tk.NORMAL)
                self.btn_eliminar.config(state=tk.NORMAL)
                self.btn_agregar.config(state=tk.DISABLED)
                self.parpadear_indicador("✔️", Tema.SUCCESS)
                self.on_categoria_changed()
        else:
            self.parpadear_indicador("✔️", Tema.SUCCESS)

    def parpadear_indicador(self, icono: str, color: str):
        self.indicador_scanner.config(text=icono, fg=color)
        self.root.after(1000, lambda: self.indicador_scanner.config(text="🔍", fg=Tema.SUCCESS))

    def actualizar_tabla(self):
        if not self.tree_productos:
            return
        termino = self.busqueda_var.get().strip()
        self.tree_productos.delete(*self.tree_productos.get_children())
        productos = db.buscar(termino) if termino else db.obtener_todos()
        for codigo, nombre, categoria, tamano, marca, stock, precio in productos:
            self.tree_productos.insert("", tk.END, values=(codigo, nombre, categoria, tamano, marca, stock, formatear_precio(precio)))

    def actualizar_estadisticas(self):
        resumen = db.obtener_resumen()
        self.lbl_total_productos_valor.config(text=formatear_numero(resumen["total_productos"]))
        self.lbl_stock_total_valor.config(text=formatear_numero(resumen["total_stock"]))
        self.lbl_valor_inventario_valor.config(text=formatear_precio(resumen["valor_total"]))
        self.lbl_sin_stock_valor.config(text=formatear_numero(resumen["sin_stock"]))

        bajo_stock = resumen.get("bajo_stock", 0)
        if bajo_stock > 0 and not self._ya_mostro_alerta_bajo_stock:
            productos_bajos = db.obtener_bajo_stock(self.umbral_bajo_stock)
            lista = "\n".join(f"- {codigo} | {nombre} (stock: {stock})" for codigo, nombre, stock in productos_bajos[:10])
            messagebox.showwarning("⚠️ Stock Bajo - Tealdi", f"Hay {bajo_stock} producto(s) con stock ≤ {self.umbral_bajo_stock}.\n\n{lista}", parent=self.root)
            self._ya_mostro_alerta_bajo_stock = True

    def on_seleccion_tabla(self, _event=None):
        seleccion = self.tree_productos.selection()
        if not seleccion:
            return
        item = self.tree_productos.item(seleccion[0])
        valores = item["values"]
        if not valores:
            return
        codigo, nombre, categoria, tamano, marca, stock, precio_txt = valores
        self.modo_edicion = True
        self.codigo_original = codigo
        self.codigo_var.set(codigo)
        self.nombre_var.set(nombre)
        self.categoria_var.set(categoria)
        self.tamano_var.set(tamano)
        self.marca_var.set(marca)
        self.cantidad_var.set(str(stock))
        self.precio_var.set(str(float(str(precio_txt).replace("$", "").replace(".", "").replace(",", "."))))
        self.btn_actualizar.config(state=tk.NORMAL)
        self.btn_eliminar.config(state=tk.NORMAL)
        self.btn_agregar.config(state=tk.DISABLED)
        self.on_categoria_changed()

    def agregar_producto(self):
        if self.modo_edicion and not messagebox.askyesno("Modo edición", "Estás en modo edición.\n\n¿Deseas igualmente agregar un nuevo producto?", parent=self.root):
            return
        valido, mensaje, datos = ValidadorBebidas.validar_todos(
            self.codigo_var.get(), self.nombre_var.get(), self.categoria_var.get(),
            self.tamano_var.get(), self.marca_var.get(), self.cantidad_var.get(), self.precio_var.get()
        )
        if not valido:
            messagebox.showerror("Validación - Tealdi", mensaje, parent=self.root)
            return
        try:
            db.agregar_articulo(datos["codigo"], datos["nombre"], datos["categoria"], datos["tamaño"], datos["marca"], datos["cantidad"], datos["precio"])
            messagebox.showinfo("Éxito - Tealdi", "Producto agregado correctamente.", parent=self.root)
            self.limpiar_formulario()
            self.actualizar_tabla()
            self.actualizar_estadisticas()
        except Exception as e:
            messagebox.showerror("Error - Tealdi", f"No se pudo agregar el producto:\n{str(e)}", parent=self.root)

    def actualizar_producto(self):
        if not self.modo_edicion or not self.codigo_original:
            messagebox.showwarning("Edición - Tealdi", "No hay un producto seleccionado para actualizar.", parent=self.root)
            return
        valido, mensaje, datos = ValidadorBebidas.validar_todos(
            self.codigo_var.get(), self.nombre_var.get(), self.categoria_var.get(),
            self.tamano_var.get(), self.marca_var.get(), self.cantidad_var.get(), self.precio_var.get()
        )
        if not valido:
            messagebox.showerror("Validación - Tealdi", mensaje, parent=self.root)
            return
        try:
            db.actualizar_articulo(self.codigo_original, datos["codigo"], datos["nombre"], datos["categoria"], datos["tamaño"], datos["marca"], datos["cantidad"], datos["precio"])
            messagebox.showinfo("Actualización - Tealdi", "Producto actualizado correctamente.", parent=self.root)
            self.limpiar_formulario()
            self.actualizar_tabla()
            self.actualizar_estadisticas()
        except Exception as e:
            messagebox.showerror("Error - Tealdi", f"No se pudo actualizar el producto:\n{str(e)}", parent=self.root)

    def eliminar_producto(self):
        if not self.modo_edicion or not self.codigo_original:
            messagebox.showwarning("Eliminar - Tealdi", "No hay un producto seleccionado para eliminar.", parent=self.root)
            return
        if not messagebox.askyesno("Confirmar - Tealdi", "¿Eliminar definitivamente este producto?", parent=self.root):
            return
        try:
            db.eliminar_articulo(self.codigo_original)
            messagebox.showinfo("Eliminado - Tealdi", "Producto eliminado correctamente.", parent=self.root)
            self.limpiar_formulario()
            self.actualizar_tabla()
            self.actualizar_estadisticas()
        except Exception as e:
            messagebox.showerror("Error - Tealdi", f"No se pudo eliminar el producto:\n{str(e)}", parent=self.root)

    def limpiar_formulario(self):
        self.codigo_var.set("")
        self.nombre_var.set("")
        self.categoria_var.set("")
        self.tamano_var.set("")
        self.marca_var.set("")
        self.cantidad_var.set("")
        self.precio_var.set("")
        self.modo_edicion = False
        self.codigo_original = None
        self.btn_actualizar.config(state=tk.DISABLED)
        self.btn_eliminar.config(state=tk.DISABLED)
        self.btn_agregar.config(state=tk.NORMAL)
        self.parpadear_indicador("🔍", Tema.SUCCESS)
        self.codigo_label.config(text="🔖 Código:", fg=Tema.TEXT_PRIMARY)
        if hasattr(self, 'marca_label'):
            self.marca_label.config(text="🏷️ Marca:", fg=Tema.TEXT_PRIMARY)

    def abrir_ventas(self):
        try:
            abrir_ventana_ventas_bebidas(self)
        except Exception as e:
            messagebox.showwarning("Ventas", f"No se pudo abrir la ventana de ventas:\n{str(e)}", parent=self.root)

    def abrir_reportes(self):
        try:
            abrir_ventana_reportes_bebidas(self)
        except Exception as e:
            messagebox.showwarning("Reportes", f"No se pudo abrir la ventana de reportes:\n{str(e)}", parent=self.root)


if __name__ == "__main__":
    root = tk.Tk()
    
    # VERIFICAR ACTUALIZACIONES AL INICIO
    if not verificar_actualizacion_al_inicio(root):
        # Si no hay actualización, ejecutar programa normal
        app = SistemaTealdi(root)
        root.mainloop()
    # Si hay actualización, el programa se reiniciará automáticamente
