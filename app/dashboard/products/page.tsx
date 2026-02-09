"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Search, Filter, UploadCloud, Download, Trash2, Pencil, Tag, FolderPlus, X } from "lucide-react";
import { getProducts, exportProductsToCSV, deleteProduct, getCategories, createCategory, updateCategory, deleteCategory } from "@/app/actions/products";
import { CreateProductModal } from "@/components/products/create-product-modal";
import { BulkImportModal } from "@/components/products/bulk-import-modal";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, cn } from "@/lib/utils";

// Minimal button UI
function Button({ children, onClick, variant = "primary" }: any) {
       const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
       const styles = {
              primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
              secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
       };
       return <button onClick={onClick} className={`${base} ${styles[variant as keyof typeof styles]}`}>{children}</button>;
}

interface Category {
       id: number;
       name: string;
}

export default function ProductsPage() {
       const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
       const [loading, setLoading] = useState(true);
       const [isModalOpen, setIsModalOpen] = useState(false);
       const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
       const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
       const [searchQuery, setSearchQuery] = useState("");
       const [filterCategory, setFilterCategory] = useState<string>("");

       // Categories
       const [categories, setCategories] = useState<Category[]>([]);
       const [newCategoryName, setNewCategoryName] = useState("");
       const [editingCategory, setEditingCategory] = useState<Category | null>(null);
       const [editCategoryName, setEditCategoryName] = useState("");

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

       const fetchCategories = useCallback(async () => {
              try {
                     const data = await getCategories();
                     setCategories(data);
              } catch (e) {
                     console.error(e);
              }
       }, []);

       useEffect(() => {
              fetchProducts();
              fetchCategories();
       }, [fetchProducts, fetchCategories]);

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

       const handleDeleteProduct = async (productId: number, productName: string) => {
              if (!confirm(`¿Eliminar "${productName}" y todas sus variantes?`)) return;
              try {
                     await deleteProduct(productId);
                     fetchProducts();
              } catch (e: any) {
                     alert(e.message);
              }
       };

       const handleCreateCategory = async () => {
              if (!newCategoryName.trim()) return;
              try {
                     await createCategory(newCategoryName.trim());
                     setNewCategoryName("");
                     fetchCategories();
                     fetchProducts();
              } catch (e: any) {
                     alert(e.message);
              }
       };

       const handleUpdateCategory = async () => {
              if (!editingCategory || !editCategoryName.trim()) return;
              try {
                     await updateCategory(editingCategory.id, editCategoryName.trim());
                     setEditingCategory(null);
                     setEditCategoryName("");
                     fetchCategories();
                     fetchProducts();
              } catch (e: any) {
                     alert(e.message);
              }
       };

       const handleDeleteCategory = async (id: number, name: string) => {
              if (!confirm(`¿Eliminar la categoría "${name}"? Los productos serán movidos a "General".`)) return;
              try {
                     await deleteCategory(id);
                     fetchCategories();
                     fetchProducts();
              } catch (e: any) {
                     alert(e.message);
              }
       };

       // Filter products
       const filtered = products.filter((v: any) => {
              const matchesSearch = searchQuery === "" ||
                     v.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     v.variantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     (v.barcode && v.barcode.includes(searchQuery));
              const matchesCategory = filterCategory === "" ||
                     (filterCategory === "none" ? !v.product.categoryId : v.product.categoryId?.toString() === filterCategory);
              return matchesSearch && matchesCategory;
       });

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
                                   <Button variant="secondary" onClick={() => setIsCategoryModalOpen(true)}>
                                          <Tag className="h-4 w-4 mr-2" />
                                          Categorías
                                   </Button>
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
                                          placeholder="Buscar por nombre o código de barras..."
                                          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          value={searchQuery}
                                          onChange={e => setSearchQuery(e.target.value)}
                                   />
                            </div>
                            <select
                                   value={filterCategory}
                                   onChange={e => setFilterCategory(e.target.value)}
                                   className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                   <option value="">Todas las categorías</option>
                                   <option value="none">Sin categoría</option>
                                   {categories.map(cat => (
                                          <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                                   ))}
                            </select>
                     </div>

                     {/* Summary */}
                     {!loading && (
                            <div className="flex gap-4">
                                   <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 text-sm">
                                          <span className="text-blue-400 font-bold text-[10px] uppercase">Productos:</span>{" "}
                                          <span className="font-black text-blue-700">{filtered.length}</span>
                                   </div>
                                   <div className="bg-amber-50 px-4 py-2 rounded-lg border border-amber-100 text-sm">
                                          <span className="text-amber-400 font-bold text-[10px] uppercase">Stock Bajo:</span>{" "}
                                          <span className="font-black text-amber-700">
                                                 {filtered.filter((v: any) => v.stockQuantity <= v.minStock).length}
                                          </span>
                                   </div>
                            </div>
                     )}

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
                                          ) : filtered.length === 0 ? (
                                                 <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                        {searchQuery ? "No se encontraron productos." : "No hay productos registrados."}
                                                 </td></tr>
                                          ) : (
                                                 filtered.map((variant: any) => (
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
                                                                      <button
                                                                             onClick={() => handleDeleteProduct(variant.product.id, variant.product.name)}
                                                                             className="text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                                                                             title="Eliminar producto"
                                                                      >
                                                                             <Trash2 className="h-3.5 w-3.5" />
                                                                             <span className="text-xs">Eliminar</span>
                                                                      </button>
                                                               </td>
                                                        </tr>
                                                 ))
                                          )}
                                   </tbody>
                            </table>
                     </div>

                     {/* Category Management Modal */}
                     <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="GESTIONAR CATEGORÍAS">
                            <div className="space-y-6">
                                   {/* Create category */}
                                   <div className="flex gap-2">
                                          <input
                                                 className="flex-1 bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                                 placeholder="Nueva categoría..."
                                                 value={newCategoryName}
                                                 onChange={e => setNewCategoryName(e.target.value)}
                                                 onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                                          />
                                          <button
                                                 onClick={handleCreateCategory}
                                                 className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                                          >
                                                 <FolderPlus className="h-4 w-4" />
                                                 Crear
                                          </button>
                                   </div>

                                   {/* Category list */}
                                   <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                          {categories.length === 0 ? (
                                                 <p className="text-center text-gray-400 py-6 text-sm">No hay categorías creadas.</p>
                                          ) : categories.map(cat => (
                                                 <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                                                        {editingCategory?.id === cat.id ? (
                                                               <div className="flex-1 flex gap-2">
                                                                      <input
                                                                             className="flex-1 bg-white border border-blue-200 p-2 rounded-lg text-sm font-bold outline-none"
                                                                             value={editCategoryName}
                                                                             onChange={e => setEditCategoryName(e.target.value)}
                                                                             onKeyDown={e => e.key === 'Enter' && handleUpdateCategory()}
                                                                             autoFocus
                                                                      />
                                                                      <button onClick={handleUpdateCategory} className="text-blue-600 hover:text-blue-800 text-xs font-bold">Guardar</button>
                                                                      <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:text-gray-600">
                                                                             <X className="h-4 w-4" />
                                                                      </button>
                                                               </div>
                                                        ) : (
                                                               <>
                                                                      <span className="font-bold text-gray-700 text-sm">{cat.name}</span>
                                                                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                             <button
                                                                                    onClick={() => { setEditingCategory(cat); setEditCategoryName(cat.name); }}
                                                                                    className="text-blue-500 hover:text-blue-700"
                                                                                    title="Editar"
                                                                             >
                                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                             </button>
                                                                             <button
                                                                                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                                                    className="text-red-500 hover:text-red-700"
                                                                                    title="Eliminar"
                                                                             >
                                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                             </button>
                                                                      </div>
                                                               </>
                                                        )}
                                                 </div>
                                          ))}
                                   </div>

                                   <button
                                          onClick={() => setIsCategoryModalOpen(false)}
                                          className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors uppercase"
                                   >
                                          Cerrar
                                   </button>
                            </div>
                     </Modal>
              </div>
       );
}
