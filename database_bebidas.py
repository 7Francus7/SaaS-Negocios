# database_bebidas.py
# Módulo de acceso a datos para BEBIDAS TEALDI

import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = "bebidas.db"
LOW_STOCK_THRESHOLD = 5  # umbral para "poco stock"


def abrir_conexion() -> sqlite3.Connection:
    """Abre una conexión a la base de datos."""
    return sqlite3.connect(DB_PATH)


def crear_tablas() -> None:
    """Crea las tablas necesarias si no existen."""
    conn = abrir_conexion()
    cur = conn.cursor()

    # Productos con código propio
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS productos (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo   TEXT UNIQUE NOT NULL,
            nombre   TEXT NOT NULL,
            categoria TEXT NOT NULL,
            tamano   TEXT NOT NULL,
            marca    TEXT NOT NULL,
            precio   REAL NOT NULL,
            stock    INTEGER NOT NULL
        )
        """
    )

    # Ventas (con cliente y método de pago)
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS ventas (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha       TEXT NOT NULL,
            cliente     TEXT,
            metodo_pago TEXT,
            total       REAL NOT NULL
        )
        """
    )

    # Detalle de ventas
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS detalle_ventas (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            venta_id    INTEGER NOT NULL,
            producto_id INTEGER NOT NULL,
            cantidad    INTEGER NOT NULL,
            subtotal    REAL NOT NULL,
            FOREIGN KEY (venta_id) REFERENCES ventas(id),
            FOREIGN KEY (producto_id) REFERENCES productos(id)
        )
        """
    )

    conn.commit()
    conn.close()


class DB:
    """Fachada de base de datos usada por todo el sistema."""

    # ---------- PRODUCTOS ----------

    def agregar_articulo(
        self,
        codigo: str,
        nombre: str,
        categoria: str,
        tamano: str,
        marca: str,
        stock: int,
        precio: float,
    ) -> None:
        conn = abrir_conexion()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO productos (codigo, nombre, categoria, tamano, marca, stock, precio)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (codigo, nombre, categoria, tamano, marca, stock, precio),
        )
        conn.commit()
        conn.close()

    def actualizar_articulo(
        self,
        codigo_original: str,
        codigo: str,
        nombre: str,
        categoria: str,
        tamano: str,
        marca: str,
        stock: int,
        precio: float,
    ) -> None:
        """
        Actualiza un producto identificado por su código original (por si el código cambia).
        """
        conn = abrir_conexion()
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE productos
            SET codigo = ?, nombre = ?, categoria = ?, tamano = ?, marca = ?, stock = ?, precio = ?
            WHERE codigo = ?
            """,
            (codigo, nombre, categoria, tamano, marca, stock, precio, codigo_original),
        )
        conn.commit()
        conn.close()

    def eliminar_articulo(self, codigo: str) -> None:
        conn = abrir_conexion()
        cur = conn.cursor()
        cur.execute("DELETE FROM productos WHERE codigo = ?", (codigo,))
        conn.commit()
        conn.close()

    def obtener_articulo(self, codigo: str) -> Optional[tuple]:
        """
        Devuelve un producto por código en el formato:
        (codigo, nombre, categoria, tamano, marca, stock, precio)
        """
        conn = abrir_conexion()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT codigo, nombre, categoria, tamano, marca, stock, precio
            FROM productos
            WHERE codigo = ?
            """,
            (codigo,),
        )
        row = cur.fetchone()
        conn.close()
        return row

    def obtener_todos(self) -> List[tuple]:
        """
        Devuelve todos los productos.
        Formato: (codigo, nombre, categoria, tamano, marca, stock, precio)
        """
        conn = abrir_conexion()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT codigo, nombre, categoria, tamano, marca, stock, precio
            FROM productos
            ORDER BY nombre
            """
        )
        rows = cur.fetchall()
        conn.close()
        return rows

    def buscar(self, termino: str) -> List[tuple]:
        """
        Búsqueda simple por código, nombre, marca o categoría.
        """
        termino = f"%{termino}%"
        conn = abrir_conexion()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT codigo, nombre, categoria, tamano, marca, stock, precio
            FROM productos
            WHERE codigo   LIKE ?
               OR nombre   LIKE ?
               OR marca    LIKE ?
               OR categoria LIKE ?
            ORDER BY nombre
            """,
            (termino, termino, termino, termino),
        )
        rows = cur.fetchall()
        conn.close()
        return rows

    def obtener_resumen(self) -> Dict[str, Any]:
        """
        Devuelve estadísticas básicas para el panel de resumen.
        Incluye cantidad de productos con stock bajo.
        """
        conn = abrir_conexion()
        cur = conn.cursor()

        cur.execute(
            "SELECT COUNT(*), COALESCE(SUM(stock), 0), COALESCE(SUM(stock * precio), 0) FROM productos"
        )
        total_productos, total_stock, valor_total = cur.fetchone()

        cur.execute("SELECT COUNT(*) FROM productos WHERE stock <= 0")
        sin_stock = cur.fetchone()[0]

        cur.execute(
            "SELECT COUNT(*) FROM productos WHERE stock > 0 AND stock <= ?",
            (LOW_STOCK_THRESHOLD,),
        )
        bajo_stock = cur.fetchone()[0]

        conn.close()

        return {
            "total_productos": total_productos or 0,
            "total_stock": total_stock or 0,
            "valor_total": float(valor_total or 0.0),
            "sin_stock": sin_stock or 0,
            "bajo_stock": bajo_stock or 0,
        }

    def obtener_bajo_stock(self, umbral: int = LOW_STOCK_THRESHOLD) -> List[tuple]:
        """
        Devuelve lista de productos con stock > 0 y <= umbral.
        Formato: (codigo, nombre, stock)
        """
        conn = abrir_conexion()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT codigo, nombre, stock
            FROM productos
            WHERE stock > 0 AND stock <= ?
            ORDER BY stock ASC, nombre
            """,
            (umbral,),
        )
        rows = cur.fetchall()
        conn.close()
        return rows

    # ---------- VENTAS ----------

    def registrar_venta(
        self,
        carrito: List[Dict[str, Any]],
        metodo_pago: str,
        cliente: str,
        total: float,
    ) -> int:
        """
        Registra una venta completa a partir del carrito del POS.
        Descuenta el stock de la tabla productos.
        """
        conn = abrir_conexion()
        cur = conn.cursor()

        fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Insertar cabecera de venta
        cur.execute(
            """
            INSERT INTO ventas (fecha, cliente, metodo_pago, total)
            VALUES (?, ?, ?, ?)
            """,
            (fecha, cliente or "", metodo_pago or "", float(total)),
        )
        venta_id = cur.lastrowid

        # Insertar detalle y actualizar stock
        for item in carrito:
            codigo = item["codigo"]
            cantidad = int(item["cantidad"])

            # Obtener producto por código
            cur.execute(
                "SELECT id, stock, precio FROM productos WHERE codigo = ?",
                (codigo,),
            )
            prod = cur.fetchone()
            if not prod:
                raise ValueError(f"Producto no encontrado en base de datos: {codigo}")

            producto_id, stock_actual, precio_db = prod

            if cantidad > stock_actual:
                raise ValueError(f"Stock insuficiente para {codigo} (stock actual: {stock_actual})")

            subtotal = float(cantidad * float(precio_db))

            cur.execute(
                """
                INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, subtotal)
                VALUES (?, ?, ?, ?)
                """,
                (venta_id, producto_id, cantidad, subtotal),
            )

            cur.execute(
                "UPDATE productos SET stock = stock - ? WHERE id = ?",
                (cantidad, producto_id),
            )

        conn.commit()
        conn.close()
        return venta_id

    def obtener_venta(self, venta_id: int) -> Optional[Dict[str, Any]]:
        """
        Devuelve una venta completa lista para generar ticket.
        """
        conn = abrir_conexion()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT id, fecha, cliente, metodo_pago, total
            FROM ventas
            WHERE id = ?
            """,
            (venta_id,),
        )
        cabecera = cur.fetchone()
        if not cabecera:
            conn.close()
            return None

        venta = {
            "id": cabecera[0],
            "fecha": cabecera[1],
            "cliente": cabecera[2] or "",
            "metodo_pago": cabecera[3] or "",
            "total": float(cabecera[4]),
            "items": [],
        }

        cur.execute(
            """
            SELECT
                p.codigo,
                p.nombre,
                p.categoria,
                p.tamano,
                p.marca,
                d.cantidad,
                p.precio,
                d.subtotal
            FROM detalle_ventas d
            JOIN productos p ON p.id = d.producto_id
            WHERE d.venta_id = ?
            """,
            (venta_id,),
        )

        for row in cur.fetchall():
            venta["items"].append(
                {
                    "codigo": row[0],
                    "nombre": row[1],
                    "categoria": row[2],
                    "tamaño": row[3],
                    "marca": row[4],
                    "cantidad": int(row[5]),
                    "precio": float(row[6]),
                    "subtotal": float(row[7]),
                }
            )

        conn.close()
        return venta


# Instancia global usada por el resto del sistema
db = DB()

# Crear tablas al importar el módulo
crear_tablas()
