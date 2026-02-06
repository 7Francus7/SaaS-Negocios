"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Search, Filter, UploadCloud, Download } from "lucide-react";
import { getProducts, exportProductsToCSV } from "@/app/actions/products";
import { CreateProductModal } from "@/components/products/create-product-modal";
import { BulkImportModal } from "@/components/products/bulk-import-modal";
import { formatCurrency } from "@/lib/utils";

// Minimal button UI
function Button({ children, onClick, variant = "primary" }: any) {
       const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
       const styles = {
              primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
              secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
       };
       return <button onClick={onClick} className={`${base} ${styles[variant as keyof typeof styles]}`}>{children}</button>;
}

export default function ProductsPage() {
       const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
       const [loading, setLoading] = useState(true);
       const [isModalOpen, setIsModalOpen] = useState(false);
       const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

       const fetchProducts = useCallback(async () => {
              setLoading(true);
              try {
                     const data = await getProducts();
                     setProducts(data);
              } catch (e) {
                     console.error(e);
              } finally {
                     setLoading(false);
              }
       }, []);

       useEffect(() => {
              fetchProducts();
       }, [fetchProducts]);

       const handleExport = async () => {
              const csv = await exportProductsToCSV();
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.setAttribute('hidden', '');
              a.setAttribute('href', url);
              a.setAttribute('download', 'productos.csv');
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
       };

       return (
              <div className="space-y-6">
                     <CreateProductModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            onSuccess={fetchProducts}
                     />

                     <BulkImportModal
                            isOpen={isBulkModalOpen}
                            onClose={() => setIsBulkModalOpen(false)}
                            onSuccess={fetchProducts}
                     />

                     <div className="flex items-center justify-between">
                            <div>
                                   <h1 className="text-2xl font-bold tracking-tight text-gray-900">Inventario</h1>
                                   <p className="text-sm text-gray-500 mt-1">Gestiona tus productos y stock.</p>
                            </div>
                            <div className="flex gap-2">
                                   <Button variant="secondary" onClick={handleExport}>
                                          <Download className="h-4 w-4 mr-2" />
                                          Exportar
                                   </Button>
                                   <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)}>
                                          <UploadCloud className="h-4 w-4 mr-2" />
                                          Importar
                                   </Button>
                                   <Button onClick={() => setIsModalOpen(true)}>
                                          <Plus className="h-4 w-4 mr-2" />
                                          Nuevo Producto
                                   </Button>
                            </div>
                     </div>

                     {/* Filters */}
                     <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <div className="relative flex-1">
                                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                   <input
                                          type="text"
                                          placeholder="Buscar por nombre o código..."
                                          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   />
                            </div>
                            <Button variant="secondary">
                                   <Filter className="h-4 w-4 mr-2" />
                                   Filtros
                            </Button>
                     </div>

                     {/* Table */}
                     <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                   <thead className="bg-gray-50">
                                          <tr>
                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU / Barras</th>
                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                                                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                                 <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                          </tr>
                                   </thead>
                                   <tbody className="bg-white divide-y divide-gray-200">
                                          {loading ? (
                                                 <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Cargando inventario...</td></tr>
                                          ) : products.length === 0 ? (
                                                 <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No hay productos registrados.</td></tr>
                                          ) : (
                                                 products.map((variant: any) => (
                                                        <tr key={variant.id} className="hover:bg-gray-50 transition-colors">
                                                               <td className="px-6 py-4 whitespace-nowrap">
                                                                      <div className="text-sm font-medium text-gray-900">{variant.product.name}</div>
                                                                      <div className="text-sm text-gray-500">{variant.variantName}</div>
                                                               </td>
                                                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                      {variant.barcode || "-"}
                                                               </td>
                                                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                                                                             {variant.product.category?.name || "General"}
                                                                      </span>
                                                               </td>
                                                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                                      {formatCurrency(variant.costPrice)}
                                                               </td>
                                                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                                      {formatCurrency(variant.salePrice)}
                                                               </td>
                                                               <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                 ${variant.stockQuantity <= variant.minStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                                             {variant.stockQuantity}
                                                                      </span>
                                                               </td>
                                                               <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                      <a href="#" className="text-blue-600 hover:text-blue-900">Editar</a>
                                                               </td>
                                                        </tr>
                                                 ))
                                          )}
                                   </tbody>
                            </table>
                     </div>
              </div>
       );
}
