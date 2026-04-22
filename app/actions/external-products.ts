"use server";

export async function searchProductByBarcode(barcode: string) {
       if (!barcode || barcode.length < 8) return null;

       try {
              const response = await fetch(`https://world.openfoodfacts.net/api/v2/product/${barcode}`, {
                     headers: {
                            "User-Agent": "DespensaSaaS/1.0 (Integration Test)",
                     },
              });

              if (!response.ok) return null;

              const data = await response.json();
              if (data.status !== 1) return null;

              const product = data.product;

              // Extract useful fields
              const name = product.product_name_es || product.product_name || "";
              const brand = product.brands || "";
              const quantity = product.quantity || "";

              // Construct a nice name
              let fullName = name;
              if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
                     fullName = `${brand} ${name}`;
              }

              return {
                     name: fullName,
                     variantName: quantity || "Unidad",
                     barcode: barcode,
                     image: product.image_url || null
              };

       } catch (error) {
              console.error("Error fetching product from OpenFoodFacts:", error);
              return null;
       }
}
