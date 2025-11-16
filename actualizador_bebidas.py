"""
actualizador_bebidas.py

Sistema de Auto-Actualización para BEBIDAS TEALDI
Verifica actualizaciones en GitHub y las instala automáticamente
"""

import tkinter as tk
from tkinter import ttk, messagebox
import requests
import json
import os
import sys
import shutil
import subprocess
from pathlib import Path
from datetime import datetime
import threading
from typing import Dict, Optional


class ActualizadorTealdi:
    """Sistema de actualización automática desde GitHub"""

    # CONFIGURACIÓN - Cambia estos valores según tu repo
    GITHUB_USER = "7Francus7"  # ← Cambiar por tu usuario
    GITHUB_REPO = "BEBIDAS-TEALDI"     # ← Cambiar por tu repo
    VERSION_ACTUAL = "4.0.0"           # ← Versión actual del programa

    # URLs de GitHub
    API_RELEASES = f"https://api.github.com/repos/{GITHUB_USER}/{GITHUB_REPO}/releases/latest"

    # Archivos que se actualizan (no incluir la base de datos)
    ARCHIVOS_ACTUALIZAR = [
        "main_bebidas_tealdi.py",
        "ventas_bebidas.py",
        "reportes_bebidas.py",
        "validaciones_bebidas.py",
        "ui_helpers_bebidas.py",
        "actualizador_bebidas.py"
    ]

    def __init__(self, parent_window=None):
        self.parent = parent_window
        self.nueva_version = None
        self.url_descarga = None
        self.changelog = None
        self.ventana_progreso = None

    def verificar_actualizacion(self, mostrar_si_actualizado=False) -> bool:
        """
        Verifica si hay una nueva versión disponible.
        Retorna True si hay actualización, False si no.
        """
        try:
            response = requests.get(self.API_RELEASES, timeout=5)

            if response.status_code == 200:
                data = response.json()
                self.nueva_version = data["tag_name"].replace("v", "")
                self.changelog = data["body"]
                self.url_descarga = data["zipball_url"]

                # Comparar versiones
                if self._comparar_versiones(self.VERSION_ACTUAL, self.nueva_version) < 0:
                    return True
                elif mostrar_si_actualizado:
                    messagebox.showinfo(
                        "Actualización - Tealdi",
                        f"Tu versión ({self.VERSION_ACTUAL}) está actualizada.\n\nNo hay nuevas versiones disponibles.",
                        parent=self.parent
                    )
                return False
            else:
                if mostrar_si_actualizado:
                    messagebox.showwarning(
                        "Actualización - Tealdi",
                        "No se pudo conectar al servidor de actualizaciones.",
                        parent=self.parent
                    )
                return False

        except requests.exceptions.RequestException:
            # Sin conexión a internet o error de red
            if mostrar_si_actualizado:
                messagebox.showwarning(
                    "Sin conexión - Tealdi",
                    "No hay conexión a internet.\nNo se puede verificar actualizaciones.",
                    parent=self.parent
                )
            return False
        except Exception as e:
            if mostrar_si_actualizado:
                messagebox.showerror(
                    "Error - Tealdi",
                    f"Error al verificar actualizaciones:\n{str(e)}",
                    parent=self.parent
                )
            return False

    def _comparar_versiones(self, v1: str, v2: str) -> int:
        """
        Compara dos versiones en formato X.Y.Z
        Retorna: -1 si v1 < v2, 0 si v1 == v2, 1 si v1 > v2
        """
        partes1 = [int(x) for x in v1.split(".")]
        partes2 = [int(x) for x in v2.split(".")]

        for i in range(max(len(partes1), len(partes2))):
            num1 = partes1[i] if i < len(partes1) else 0
            num2 = partes2[i] if i < len(partes2) else 0

            if num1 < num2:
                return -1
            elif num1 > num2:
                return 1

        return 0

    def mostrar_dialogo_actualizacion(self) -> bool:
        """
        Muestra diálogo preguntando si desea actualizar.
        Retorna True si el usuario acepta, False si no.
        """
        if not self.nueva_version:
            return False

        # Crear ventana de diálogo personalizada
        dialogo = tk.Toplevel(self.parent)
        dialogo.title("🔄 Actualización Disponible - Tealdi")
        dialogo.geometry("500x400")
        dialogo.resizable(False, False)
        dialogo.configure(bg="#FFFFFF")
        dialogo.transient(self.parent)
        dialogo.grab_set()

        # Centrar ventana
        dialogo.update_idletasks()
        x = (dialogo.winfo_screenwidth() // 2) - (500 // 2)
        y = (dialogo.winfo_screenheight() // 2) - (400 // 2)
        dialogo.geometry(f"500x400+{x}+{y}")

        resultado = {"aceptado": False}

        # Header
        header_frame = tk.Frame(dialogo, bg="#007BFF", height=80)
        header_frame.pack(fill=tk.X)
        header_frame.pack_propagate(False)

        tk.Label(
            header_frame,
            text="🔄 Nueva Versión Disponible",
            font=("Segoe UI", 16, "bold"),
            bg="#007BFF",
            fg="white"
        ).pack(pady=20)

        # Body
        body_frame = tk.Frame(dialogo, bg="white")
        body_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)

        # Versiones
        version_frame = tk.Frame(body_frame, bg="white")
        version_frame.pack(fill=tk.X, pady=(0, 15))

        tk.Label(
            version_frame,
            text=f"Versión actual: {self.VERSION_ACTUAL}",
            font=("Segoe UI", 10),
            bg="white",
            fg="#666666"
        ).pack(anchor="w")

        tk.Label(
            version_frame,
            text=f"Nueva versión: {self.nueva_version}",
            font=("Segoe UI", 12, "bold"),
            bg="white",
            fg="#28A745"
        ).pack(anchor="w", pady=(5, 0))

        # Separador
        tk.Frame(body_frame, bg="#E0E0E0", height=1).pack(fill=tk.X, pady=10)

        # Changelog
        tk.Label(
            body_frame,
            text="📋 Novedades:",
            font=("Segoe UI", 11, "bold"),
            bg="white",
            fg="#333333"
        ).pack(anchor="w", pady=(5, 5))

        # Área de texto con scroll
        changelog_frame = tk.Frame(body_frame, bg="white")
        changelog_frame.pack(fill=tk.BOTH, expand=True)

        scrollbar = tk.Scrollbar(changelog_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        changelog_text = tk.Text(
            changelog_frame,
            font=("Segoe UI", 9),
            wrap=tk.WORD,
            bg="#F8F9FA",
            fg="#333333",
            yscrollcommand=scrollbar.set,
            relief=tk.FLAT,
            padx=10,
            pady=10
        )
        changelog_text.pack(fill=tk.BOTH, expand=True)
        scrollbar.config(command=changelog_text.yview)

        # Insertar changelog
        changelog_text.insert("1.0", self.changelog or "• Mejoras de rendimiento\n• Corrección de errores")
        changelog_text.config(state=tk.DISABLED)

        # Footer con botones
        footer_frame = tk.Frame(dialogo, bg="white")
        footer_frame.pack(fill=tk.X, padx=20, pady=(0, 20))

        def aceptar():
            resultado["aceptado"] = True
            dialogo.destroy()

        def cancelar():
            resultado["aceptado"] = False
            dialogo.destroy()

        btn_actualizar = tk.Button(
            footer_frame,
            text="✅ Actualizar Ahora",
            font=("Segoe UI", 10, "bold"),
            bg="#28A745",
            fg="white",
            activebackground="#218838",
            activeforeground="white",
            relief=tk.FLAT,
            cursor="hand2",
            command=aceptar,
            padx=20,
            pady=10
        )
        btn_actualizar.pack(side=tk.LEFT, padx=(0, 10))

        btn_cancelar = tk.Button(
            footer_frame,
            text="❌ Ahora No",
            font=("Segoe UI", 10),
            bg="#6C757D",
            fg="white",
            activebackground="#5A6268",
            activeforeground="white",
            relief=tk.FLAT,
            cursor="hand2",
            command=cancelar,
            padx=20,
            pady=10
        )
        btn_cancelar.pack(side=tk.LEFT)

        dialogo.wait_window()
        return resultado["aceptado"]

    def descargar_e_instalar(self):
        """Descarga e instala la actualización con barra de progreso"""
        # Crear ventana de progreso
        self._crear_ventana_progreso()

        # Ejecutar descarga en thread separado
        thread = threading.Thread(target=self._proceso_actualizacion, daemon=True)
        thread.start()

    def _crear_ventana_progreso(self):
        """Crea la ventana de progreso de actualización"""
        self.ventana_progreso = tk.Toplevel(self.parent)
        self.ventana_progreso.title("Actualizando - Tealdi")
        self.ventana_progreso.geometry("450x200")
        self.ventana_progreso.resizable(False, False)
        self.ventana_progreso.configure(bg="white")
        self.ventana_progreso.transient(self.parent)
        self.ventana_progreso.grab_set()

        # Centrar
        self.ventana_progreso.update_idletasks()
        x = (self.ventana_progreso.winfo_screenwidth() // 2) - (450 // 2)
        y = (self.ventana_progreso.winfo_screenheight() // 2) - (200 // 2)
        self.ventana_progreso.geometry(f"450x200+{x}+{y}")

        # Contenido
        main_frame = tk.Frame(self.ventana_progreso, bg="white")
        main_frame.pack(fill=tk.BOTH, expand=True, padx=30, pady=30)

        tk.Label(
            main_frame,
            text="🔄 Actualizando BEBIDAS TEALDI",
            font=("Segoe UI", 14, "bold"),
            bg="white",
            fg="#007BFF"
        ).pack(pady=(0, 20))

        self.progreso_label = tk.Label(
            main_frame,
            text="Descargando actualización...",
            font=("Segoe UI", 10),
            bg="white",
            fg="#666666"
        )
        self.progreso_label.pack(pady=(0, 15))

        self.progreso_bar = ttk.Progressbar(
            main_frame,
            mode="indeterminate",
            length=350
        )
        self.progreso_bar.pack()
        self.progreso_bar.start(10)

        tk.Label(
            main_frame,
            text="Por favor no cierres el programa...",
            font=("Segoe UI", 8),
            bg="white",
            fg="#999999"
        ).pack(pady=(15, 0))

    def _proceso_actualizacion(self):
        """Proceso completo de actualización (corre en thread separado)"""
        try:
            # 1. Crear carpeta de backup
            self._actualizar_progreso("Creando backup...")
            backup_dir = Path("backup_" + datetime.now().strftime("%Y%m%d_%H%M%S"))
            backup_dir.mkdir(exist_ok=True)

            # 2. Hacer backup de archivos actuales
            for archivo in self.ARCHIVOS_ACTUALIZAR:
                if os.path.exists(archivo):
                    shutil.copy2(archivo, backup_dir / archivo)

            # 3. Descargar nueva versión
            self._actualizar_progreso("Descargando nueva versión...")
            response = requests.get(self.url_descarga, stream=True)

            zip_path = "temp_update.zip"
            with open(zip_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            # 4. Extraer archivos
            self._actualizar_progreso("Instalando actualización...")
            import zipfile
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall("temp_update")

            # 5. Copiar archivos nuevos
            temp_dir = Path("temp_update")
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    if file in self.ARCHIVOS_ACTUALIZAR:
                        src = Path(root) / file
                        dst = Path(file)
                        shutil.copy2(src, dst)

            # 6. Limpiar archivos temporales
            self._actualizar_progreso("Finalizando...")
            os.remove(zip_path)
            shutil.rmtree(temp_dir)

            # 7. Actualización completada
            self._actualizar_progreso("¡Actualización completada!", finalizado=True)

        except Exception as e:
            # Error en la actualización - restaurar backup
            self._actualizar_progreso(f"Error: {str(e)}", error=True)

            # Restaurar backup
            if backup_dir.exists():
                for archivo in self.ARCHIVOS_ACTUALIZAR:
                    backup_file = backup_dir / archivo
                    if backup_file.exists():
                        shutil.copy2(backup_file, archivo)

    def _actualizar_progreso(self, mensaje: str, finalizado=False, error=False):
        """Actualiza el mensaje de progreso en la UI"""
        if self.ventana_progreso:
            self.progreso_label.config(text=mensaje)

            if finalizado:
                self.progreso_bar.stop()
                self.progreso_bar.config(mode="determinate", value=100)

                # Mostrar mensaje de éxito
                messagebox.showinfo(
                    "Actualización Exitosa - Tealdi",
                    f"¡Actualización a v{self.nueva_version} completada!\n\nEl programa se reiniciará ahora.",
                    parent=self.ventana_progreso
                )

                # Reiniciar programa
                self.ventana_progreso.destroy()
                self._reiniciar_programa()

            elif error:
                self.progreso_bar.stop()
                messagebox.showerror(
                    "Error de Actualización - Tealdi",
                    f"No se pudo completar la actualización:\n{mensaje}\n\nLos archivos anteriores han sido restaurados.",
                    parent=self.ventana_progreso
                )
                self.ventana_progreso.destroy()

    def _reiniciar_programa(self):
        """Reinicia el programa"""
        try:
            # Obtener el comando para reiniciar
            if getattr(sys, 'frozen', False):
                # Ejecutable compilado
                subprocess.Popen([sys.executable])
            else:
                # Script Python
                subprocess.Popen([sys.executable] + sys.argv)

            # Cerrar el programa actual
            if self.parent:
                self.parent.quit()
            else:
                sys.exit(0)
        except Exception:
            # Si falla el reinicio, simplemente cerrar
            if self.parent:
                self.parent.quit()
            else:
                sys.exit(0)


def verificar_actualizacion_al_inicio(parent_window=None):
    """
    Función helper para verificar actualizaciones al inicio del programa.
    Usar en el main del programa.
    """
    actualizador = ActualizadorTealdi(parent_window)

    if actualizador.verificar_actualizacion():
        if actualizador.mostrar_dialogo_actualizacion():
            actualizador.descargar_e_instalar()
            return True  # Actualización en proceso

    return False  # No hay actualización o usuario rechazó


def forzar_verificacion_actualizacion(parent_window=None):
    """
    Función para verificar actualizaciones manualmente desde el menú.
    Muestra mensaje incluso si está actualizado.
    """
    actualizador = ActualizadorTealdi(parent_window)

    if actualizador.verificar_actualizacion(mostrar_si_actualizado=True):
        if actualizador.mostrar_dialogo_actualizacion():
            actualizador.descargar_e_instalar()


# Testing standalone
if __name__ == "__main__":
    root = tk.Tk()
    root.withdraw()

    print("🔄 SISTEMA DE ACTUALIZACIÓN - BEBIDAS TEALDI")
    print("=" * 50)
    print(f"Versión actual: {ActualizadorTealdi.VERSION_ACTUAL}")
    print("Verificando actualizaciones...")

    verificar_actualizacion_al_inicio(root)

    root.mainloop()
