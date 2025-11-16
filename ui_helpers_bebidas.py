"""
ui_helpers_bebidas.py - Sistema BEBIDAS TEALDI
Utilidades UI - Tkinter Puro
"""

from tkinter import ttk
import tkinter as tk


class Tema:
    """Configuración de colores y estilos"""

    # Paleta de colores
    PRIMARY = "#2196F3"
    PRIMARY_DARK = "#1976D2"
    PRIMARY_LIGHT = "#BBDEFB"

    SUCCESS = "#4CAF50"
    SUCCESS_HOVER = "#45A049"
    SUCCESS_LIGHT = "#A5D6A7"

    WARNING = "#FF9800"
    WARNING_HOVER = "#F57C00"
    WARNING_LIGHT = "#FFB74D"

    DANGER = "#F44336"
    DANGER_HOVER = "#D32F2F"
    DANGER_LIGHT = "#EF5350"

    INFO = "#9C27B0"
    INFO_HOVER = "#7B1FA2"
    INFO_LIGHT = "#CE93D8"

    SECONDARY = "#607D8B"
    SECONDARY_HOVER = "#546E7A"
    SECONDARY_LIGHT = "#90A4AE"

    # Colores de fondo
    BG_MAIN = "#F5F5F5"
    BG_CARD = "#FFFFFF"
    BG_HEADER = "#1976D2"

    # Textos
    TEXT_PRIMARY = "#212121"
    TEXT_SECONDARY = "#757575"
    TEXT_LIGHT = "#FFFFFF"
    TEXT_DISABLED = "#B0BEC5"

    # Tabla
    TABLE_ROW_EVEN = "#FFFFFF"
    TABLE_ROW_ODD = "#FAFAFA"
    TABLE_HEADER = "#2196F3"
    TABLE_SELECTED = "#E3F2FD"

    # Otros
    BORDER = "#E0E0E0"
    SHADOW = "#90A4AE"

    # Fuentes
    FONT_FAMILY = "Segoe UI"
    FONT_SIZE_TITLE = 20
    FONT_SIZE_SUBTITLE = 13
    FONT_SIZE_NORMAL = 10
    FONT_SIZE_SMALL = 9


class EstiloManager:
    """Gestor de estilos"""

    @staticmethod
    def configurar_estilos() -> None:
        style = ttk.Style()
        style.theme_use("clam")

        # TREEVIEW
        style.configure(
            "Modern.Treeview",
            background=Tema.BG_CARD,
            foreground=Tema.TEXT_PRIMARY,
            fieldbackground=Tema.BG_CARD,
            borderwidth=0,
            font=(Tema.FONT_FAMILY, Tema.FONT_SIZE_NORMAL),
            rowheight=32,
        )

        style.configure(
            "Modern.Treeview.Heading",
            background=Tema.TABLE_HEADER,
            foreground=Tema.TEXT_LIGHT,
            borderwidth=0,
            relief="flat",
            font=(Tema.FONT_FAMILY, Tema.FONT_SIZE_NORMAL, "bold"),
            padding=8,
        )

        style.map(
            "Modern.Treeview",
            background=[("selected", Tema.TABLE_SELECTED)],
            foreground=[("selected", Tema.TEXT_PRIMARY)],
        )


class WidgetFactory:
    """Fábrica de widgets"""

    @staticmethod
    def crear_label(parent, texto: str, tipo: str = "normal") -> tk.Label:
        estilos = {
            "titulo": (Tema.FONT_SIZE_TITLE, "bold", Tema.TEXT_PRIMARY),
            "subtitulo": (Tema.FONT_SIZE_SUBTITLE, "bold", Tema.TEXT_PRIMARY),
            "normal": (Tema.FONT_SIZE_NORMAL, "normal", Tema.TEXT_SECONDARY),
            "small": (Tema.FONT_SIZE_SMALL, "normal", Tema.TEXT_SECONDARY),
            "destacado": (Tema.FONT_SIZE_NORMAL, "bold", Tema.PRIMARY),
        }

        size, weight, color = estilos.get(tipo, estilos["normal"])

        return tk.Label(
            parent,
            text=texto,
            font=(Tema.FONT_FAMILY, size, weight),
            bg=Tema.BG_CARD,
            fg=color,
            anchor=tk.W,
        )

    @staticmethod
    def crear_entry(parent, variable, width: int = 20, **kwargs) -> tk.Frame:
        """
        Devuelve un frame contenedor con un Entry para mantener coherencia visual.
        """
        frame = tk.Frame(parent, bg=Tema.BG_CARD)
        entry = tk.Entry(
            frame,
            textvariable=variable,
            font=(Tema.FONT_FAMILY, Tema.FONT_SIZE_NORMAL),
            width=width,
            relief=tk.SOLID,
            bd=1,
            highlightthickness=1,
            highlightcolor=Tema.PRIMARY,
            highlightbackground=Tema.BORDER,
            **kwargs,
        )
        entry.pack(fill=tk.X, expand=True, padx=2, pady=2)
        return frame

    @staticmethod
    def crear_boton(parent, texto: str, comando, tipo: str = "primary", width: int = 15) -> tk.Button:
        colores = {
            "primary": (Tema.PRIMARY, Tema.PRIMARY_DARK, Tema.TEXT_LIGHT),
            "success": (Tema.SUCCESS, Tema.SUCCESS_HOVER, Tema.TEXT_LIGHT),
            "danger": (Tema.DANGER, Tema.DANGER_HOVER, Tema.TEXT_LIGHT),
            "warning": (Tema.WARNING, Tema.WARNING_HOVER, Tema.TEXT_LIGHT),
            "info": (Tema.INFO, Tema.INFO_HOVER, Tema.TEXT_LIGHT),
            "secondary": (Tema.SECONDARY, Tema.SECONDARY_HOVER, Tema.TEXT_LIGHT),
        }

        bg, hover_bg, fg = colores.get(tipo, colores["primary"])

        btn = tk.Button(
            parent,
            text=texto,
            command=comando,
            font=(Tema.FONT_FAMILY, Tema.FONT_SIZE_NORMAL, "bold"),
            bg=bg,
            fg=fg,
            activebackground=hover_bg,
            activeforeground=fg,
            relief=tk.FLAT,
            cursor="hand2",
            width=width,
            height=2,
            bd=0,
        )

        def on_enter(_event):
            btn.config(background=hover_bg)

        def on_leave(_event):
            btn.config(background=bg)

        btn.bind("<Enter>", on_enter)
        btn.bind("<Leave>", on_leave)

        return btn

    @staticmethod
    def crear_frame_card(parent, **kwargs):
        """
        Crea un "card" con sombra y devuelve (shadow, card)
        para usar con grid/pack en el contenedor padre.
        """
        shadow = tk.Frame(parent, bg=Tema.SHADOW)
        card = tk.Frame(
            shadow,
            bg=Tema.BG_CARD,
            relief=tk.SOLID,
            bd=1,
            **kwargs,
        )
        card.pack(fill=tk.BOTH, expand=True, padx=2, pady=2)
        return shadow, card


def centrar_ventana(ventana: tk.Tk, ancho: int, alto: int) -> None:
    """Centra una ventana en la pantalla."""
    ventana.update_idletasks()
    sw = ventana.winfo_screenwidth()
    sh = ventana.winfo_screenheight()
    x = (sw - ancho) // 2
    y = (sh - alto) // 2
    ventana.geometry(f"{ancho}x{alto}+{x}+{y}")


def formatear_precio(valor) -> str:
    """Formatea un número como precio."""
    try:
        return f"${float(valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except Exception:
        return "$0,00"


def formatear_numero(valor) -> str:
    """Formatea un número con separador de miles."""
    try:
        return f"{int(valor):,}".replace(",", ".")
    except Exception:
        return "0"


def crear_titulo_seccion(parent, texto: str, icono: str = "") -> tk.Frame:
    """Crea un título de sección con línea de color."""
    frame = tk.Frame(parent, bg=Tema.BG_CARD)
    label = tk.Label(
        frame,
        text=f"{icono} {texto}" if icono else texto,
        font=(Tema.FONT_FAMILY, Tema.FONT_SIZE_SUBTITLE, "bold"),
        bg=Tema.BG_CARD,
        fg=Tema.PRIMARY,
        anchor=tk.W,
    )
    label.pack(padx=15, pady=(10, 5), fill=tk.X)

    linea = tk.Frame(frame, bg=Tema.PRIMARY, height=3)
    linea.pack(fill=tk.X, padx=15)

    return frame
