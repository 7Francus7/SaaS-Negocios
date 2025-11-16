"""
validaciones_bebidas.py

Validación de datos para BEBIDAS TEALDI
Categoría PROMO con validaciones especiales (código y marca opcionales)
"""


class ValidadorBebidas:
    """Validador de datos para el sistema BEBIDAS TEALDI"""

    # Categorías actualizadas
    CATEGORIAS_VALIDAS = [
        "Gaseosa",
        "Energizante",
        "Vino",
        "Licor",
        "Cerveza",
        "Aperitivo",
        "PROMO",
        "Otros"
    ]

    TAMAÑOS_VALIDOS = [
        "237ml", "250ml", "354ml", "473ml", "500ml", "600ml", "750ml",
        "1L", "1.5L", "2L", "2.25L", "3L", "Pack x2", "Pack x4", "Pack x6",
        "Pack x12", "Pack x24", "Caja x6", "Caja x12", "Caja x24", "Otro"
    ]

    @staticmethod
    def validar_codigo(codigo: str, categoria: str) -> tuple[bool, str]:
        """
        Valida el código de barras.
        Para categoría PROMO, el código es OPCIONAL.
        Para otras categorías, es OBLIGATORIO.
        """
        codigo = codigo.strip()
        
        # Si es PROMO, el código es opcional
        if categoria == "PROMO":
            if not codigo:
                return True, ""  # Válido sin código
            # Si tiene código, debe ser válido
            if len(codigo) < 3:
                return False, "El código debe tener al menos 3 caracteres"
            return True, ""
        
        # Para otras categorías, código obligatorio
        if not codigo:
            return False, "El código es obligatorio"
        
        if len(codigo) < 3:
            return False, "El código debe tener al menos 3 caracteres"
        
        return True, ""

    @staticmethod
    def validar_nombre(nombre: str) -> tuple[bool, str]:
        """Valida el nombre del producto"""
        nombre = nombre.strip()
        if not nombre:
            return False, "El nombre es obligatorio"
        if len(nombre) < 2:
            return False, "El nombre debe tener al menos 2 caracteres"
        if len(nombre) > 100:
            return False, "El nombre es demasiado largo (máximo 100 caracteres)"
        return True, ""

    @staticmethod
    def validar_categoria(categoria: str) -> tuple[bool, str]:
        """Valida la categoría"""
        if not categoria:
            return False, "Debe seleccionar una categoría"
        if categoria not in ValidadorBebidas.CATEGORIAS_VALIDAS:
            return False, f"Categoría inválida. Debe ser una de: {', '.join(ValidadorBebidas.CATEGORIAS_VALIDAS)}"
        return True, ""

    @staticmethod
    def validar_tamano(tamano: str) -> tuple[bool, str]:
        """Valida el tamaño"""
        tamano = tamano.strip()
        if not tamano:
            return False, "El tamaño es obligatorio"
        if len(tamano) > 50:
            return False, "El tamaño es demasiado largo"
        return True, ""

    @staticmethod
    def validar_marca(marca: str, categoria: str) -> tuple[bool, str]:
        """
        Valida la marca.
        Para PROMO es OPCIONAL, para otras categorías es OBLIGATORIA.
        """
        marca = marca.strip()
        
        # Si es PROMO, la marca es opcional
        if categoria == "PROMO":
            if not marca:
                return True, ""  # Válido sin marca
            # Si tiene marca, validar longitud
            if len(marca) > 50:
                return False, "La marca es demasiado larga"
            return True, ""
        
        # Para otras categorías, marca obligatoria
        if not marca:
            return False, "La marca es obligatoria"
        if len(marca) < 2:
            return False, "La marca debe tener al menos 2 caracteres"
        if len(marca) > 50:
            return False, "La marca es demasiado larga"
        return True, ""

    @staticmethod
    def validar_cantidad(cantidad_str: str) -> tuple[bool, str, int | None]:
        """Valida la cantidad (stock)"""
        cantidad_str = cantidad_str.strip()
        if not cantidad_str:
            return False, "La cantidad es obligatoria", None
        
        try:
            cantidad = int(cantidad_str)
        except ValueError:
            return False, "La cantidad debe ser un número entero", None
        
        if cantidad < 0:
            return False, "La cantidad no puede ser negativa", None
        
        if cantidad > 999999:
            return False, "La cantidad es demasiado grande", None
        
        return True, "", cantidad

    @staticmethod
    def validar_precio(precio_str: str) -> tuple[bool, str, float | None]:
        """Valida el precio"""
        precio_str = precio_str.strip().replace(",", ".")
        
        if not precio_str:
            return False, "El precio es obligatorio", None
        
        try:
            precio = float(precio_str)
        except ValueError:
            return False, "El precio debe ser un número válido", None
        
        if precio < 0:
            return False, "El precio no puede ser negativo", None
        
        if precio > 9999999:
            return False, "El precio es demasiado alto", None
        
        return True, "", round(precio, 2)

    @staticmethod
    def validar_todos(codigo: str, nombre: str, categoria: str, tamano: str, 
                     marca: str, cantidad_str: str, precio_str: str) -> tuple[bool, str, dict | None]:
        """
        Valida todos los campos del formulario.
        Para PROMO: código y marca opcionales.
        Retorna: (es_valido, mensaje_error, datos_validados)
        """
        
        # Validar categoría primero (para saber si código/marca son opcionales)
        valido, mensaje = ValidadorBebidas.validar_categoria(categoria)
        if not valido:
            return False, mensaje, None
        
        # Validar código (opcional para PROMO)
        valido, mensaje = ValidadorBebidas.validar_codigo(codigo, categoria)
        if not valido:
            return False, mensaje, None
        
        # Validar nombre
        valido, mensaje = ValidadorBebidas.validar_nombre(nombre)
        if not valido:
            return False, mensaje, None
        
        # Validar tamaño
        valido, mensaje = ValidadorBebidas.validar_tamano(tamano)
        if not valido:
            return False, mensaje, None
        
        # Validar marca (opcional para PROMO)
        valido, mensaje = ValidadorBebidas.validar_marca(marca, categoria)
        if not valido:
            return False, mensaje, None
        
        # Validar cantidad
        valido, mensaje, cantidad = ValidadorBebidas.validar_cantidad(cantidad_str)
        if not valido:
            return False, mensaje, None
        
        # Validar precio
        valido, mensaje, precio = ValidadorBebidas.validar_precio(precio_str)
        if not valido:
            return False, mensaje, None
        
        # Si es PROMO sin código, generar uno automático
        codigo_final = codigo.strip()
        if categoria == "PROMO" and not codigo_final:
            import time
            codigo_final = f"PROMO-{int(time.time() * 1000) % 1000000}"
        
        # Si es PROMO sin marca, usar valor por defecto
        marca_final = marca.strip()
        if categoria == "PROMO" and not marca_final:
            marca_final = "Combo Tealdi"
        
        datos_validados = {
            "codigo": codigo_final,
            "nombre": nombre.strip(),
            "categoria": categoria,
            "tamaño": tamano.strip(),
            "marca": marca_final,
            "cantidad": cantidad,
            "precio": precio
        }
        
        return True, "", datos_validados
