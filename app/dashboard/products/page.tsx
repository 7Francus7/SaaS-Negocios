"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Plus, Search, Filter, UploadCloud, Download, Trash2, Pencil, Tag, FolderPlus, X, PackagePlus, Minus, TrendingUp, Star } from "lucide-react";
import { getProducts, exportProductsToCSV, deleteProduct, getCategories, createCategory, updateCategory, deleteCategory, adjustStock, bulkUpdatePrices, toggleQuickAccess, getInventoryValue } from "@/app/actions/products";
import { CreateProductModal } from "@/components/products/create-product-modal";
import { EditProductModal } from "@/components/products/edit-product-modal";
import { BulkImportModal } from "@/components/products/bulk-import-modal";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, cn } from "@/lib/utils";

// Minimal button UI
function Button({ children, onClick, variant = "primary", disabled }: any) {
       const base = "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50";
       const styles = {
              primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
              secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
       };
       return <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant as keyof typeof styles]}`}>{children}</button>;
}

interface Category {
       id: number;
       name: string;
}

export default function ProductsPage() {
       const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
       const [loading, setLoading] = useState(true);
       const [inventoryValue, setInventoryValue] = useState<number>(0);
       const [isModalOpen, setIsModalOpen] = useState(false);
       const [isEditModalOpen, setIsEditModalOpen] = useState(false);
       const [editingVariant, setEditingVariant] = useState<any>(null);
       const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
       const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
       const [searchQuery, setSearchQuery] = useState("");
       const [filterCategory, setFilterCategory] = useState<string>("");
       const [filterStock, setFilterStock] = useState<string>("");

       // Categories
       const [categories, setCategories] = useState<Category[]>([]);
       const [newCategoryName, setNewCategoryName] = useState("");
       const [editingCategory, setEditingCategory] = useState<Category | null>(null);
       const [editCategoryName, setEditCategoryName] = useState("");

       // Stock adjustment
       const [isStockModalOpen, setIsStockModalOpen] = useState(false);
       const [stockVariant, setStockVariant] = useState<any>(null);
       const [stockDelta, setStockDelta] = useState("");
       const [stockReason, setStockReason] = useState("COMPRA");

       // Bulk Price Update
       const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
       const [bulkPricePercentage, setBulkPricePercentage] = useState("");
       const [bulkPriceCategoryId, setBulkPriceCategoryId] = useState<string>("all");
       const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

       const fetchProducts = useCallback(async () => {
              setLoading(true);
              try {
                     const [data, value] = await Promise.all([getProducts(), getInventoryValue()]);
                     setProducts(data);
                     setInventoryValue(value);
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

       const openStockModal = (variant: any) => {
              setStockVariant(variant);
              setStockDelta("");
              setStockReason("COMPRA");
              setIsStockModalOpen(true);
       };

       const handleAdjustStock = async () => {
              if (!stockVariant || !stockDelta) return;
              try {
                     await adjustStock(stockVariant.id, Number(stockDelta), stockReason);
                     setIsStockModalOpen(false);
                     setStockVariant(null);
                     fetchProducts();
              } catch (e: any) {
                     alert(e.message);
              }
       };

       const handleBulkUpdatePrices = async () => {
              if (!bulkPricePercentage || isNaN(Number(bulkPricePercentage))) return;
              if (!confirm(`¿Estás seguro de actualizar los precios un ${bulkPricePercentage}%? Esta acción no se puede deshacer de forma automática.`)) return;

              setIsUpdatingPrices(true);
              try {
                     const catId = bulkPriceCategoryId === "all" ? undefined : (bulkPriceCategoryId === "none" ? null : Number(bulkPriceCategoryId));
                     await bulkUpdatePrices({ categoryId: catId, percentage: Number(bulkPricePercentage) });
                     setIsBulkPriceModalOpen(false);
                     setBulkPricePercentage("");
                     fetchProducts();
                     alert("Precios actualizados correctamente");
              } catch (error: any) {
                     alert(error.message || "Error al actualizar precios");
              } finally {
                     setIsUpdatingPrices(false);
              }
       };

       const filtered = useMemo(() => products.filter((v: any) => {
              const matchesSearch = searchQuery === "" ||
                     v.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     v.variantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     (v.barcode && v.barcode.includes(searchQuery)) ||
                     (v.barcodes && v.barcodes.some((bc: string) => bc.includes(searchQuery)));
              const matchesCategory = filterCategory === "" ||
                     (filterCategory === "none" ? !v.product.categoryId : v.product.categoryId?.toString() === filterCategory);
              const matchesStock = filterStock === "" ||
                     (filterStock === "sin_stock" ? v.stockQuantity <= 0 : true);
              return matchesSearch && matchesCategory && matchesStock;
       }), [products, searchQuery, filterCategory, filterStock]);

       const lowStockCount = useMemo(
              () => filtered.filter((v: any) => v.stockQuantity <= v.minStock).length,
              [filtered]
       );

       return (
              <div className="space-y-5 lg:space-y-6">
                     {isEditModalOpen && (
                            <EditProductModal
                                   isOpen={isEditModalOpen}
                                   onClose={() => { setIsEditModalOpen(false); setEditingVariant(null); }}
                                   onSuccess={fetchProducts}
                                   variant={editingVariant}
                                   categories={categories}
                            />
                     )}
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

                     {/* Header */}
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                   <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900">Inventario</h1>
                                   <p className="text-sm text-gray-500 mt-1">Gestiona tus productos y stock.</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                   <Button variant="secondary" onClick={() => setIsBulkPriceModalOpen(true)}>
                                          <TrendingUp className="h-4 w-4 mr-1" />
                                          <span className="hidden sm:inline">Precios</span>
                                   </Button>
                                   <Button variant="secondary" onClick={() => setIsCategoryModalOpen(true)}>
                                          <Tag className="h-4 w-4 mr-1" />
                                          <span className="hidden sm:inline">Categorías</span>
                                          <span className="sm:hidden">Cat.</span>
                                   </Button>
                                   <Button variant="secondary" onClick={handleExport}>
                                          <Download className="h-4 w-4 sm:mr-1" />
                                          <span className="hidden sm:inline">Exportar</span>
                                   </Button>
                                   <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)}>
                                          <UploadCloud className="h-4 w-4 sm:mr-1" />
                                          <span className="hidden sm:inline">Importar</span>
                                   </Button>
                                   <Button onClick={() => setIsModalOpen(true)}>
                                          <Plus className="h-4 w-4 mr-1" />
                                          <span className="hidden sm:inline">Nuevo </span>Producto
                                   </Button>
                            </div>
                     </div>

                     {/* Filters */}
                     <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <div className="relative flex-1">
                                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                   <input
                                          type="text"
                                          placeholder="Buscar por nombre o código..."
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
                            <select
                                   value={filterStock}
                                   onChange={e => setFilterStock(e.target.value)}
                                   className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                   <option value="">Todo el stock</option>
                                   <option value="sin_stock">Sin stock (0)</option>
                            </select>
                     </div>

                     {/* Summary */}
                     {!loading && (
                            <div className="flex gap-3 flex-wrap">
                                   <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 text-sm">
                                          <span className="text-blue-400 font-bold text-[10px] uppercase">Productos: </span>
                                          <span className="font-black text-blue-700">{filtered.length}</span>
                                   </div>
                                   <div className="bg-amber-50 px-4 py-2 rounded-lg border border-amber-100 text-sm">
                                          <span className="text-amber-400 font-bold text-[10px] uppercase">Stock Bajo: </span>
                                          <span className="font-black text-amber-700">
                                                 {lowStockCount}
                                          </span>
                                   </div>
                                   <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 text-sm">
                                          <span className="text-emerald-400 font-bold text-[10px] uppercase">Valor en Mercadería: </span>
                                          <span className="font-black text-emerald-700">
                                                 {formatCurrency(inventoryValue)}
                                          </span>
                                   </div>
                            </div>
                     )}

                     {/* Table */}
                     <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                   <table className="min-w-full">
                                          <thead>
                                                 <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Producto</th>
                                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">Código</th>
                                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Categoría</th>
                                                        <th className="px-5 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">Costo</th>
                                                        <th className="px-5 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest">Precio</th>
                                                        <th className="px-5 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">Stock</th>
                                                        <th className="px-5 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest">Acciones</th>
                                                 </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100">
                                                 {loading ? (
                                                        <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400 text-sm">Cargando inventario...</td></tr>
                                                 ) : filtered.length === 0 ? (
                                                        <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400 text-sm">
                                                               {searchQuery ? "No se encontraron productos." : "No hay productos registrados."}
                                                        </td></tr>
                                                 ) : (
                                                        filtered.map((variant: any) => {
                                                               const noTracking = variant.trackStock === false;
                                                               const isOutOfStock = !noTracking && variant.stockQuantity <= 0;
                                                               const isLowStock = !noTracking && !isOutOfStock && variant.stockQuantity <= variant.minStock;
                                                               return (
                                                               <tr key={variant.id} className={`group transition-colors hover:bg-blue-50/30 ${isOutOfStock ? 'bg-red-50/40' : ''}`}>
                                                                      <td className="px-5 py-3">
                                                                             <div className="flex items-center gap-2.5">
                                                                                    {isOutOfStock && <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
                                                                                    {isLowStock && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                                                                                    {!isOutOfStock && !isLowStock && <span className="w-1.5 h-1.5 rounded-full bg-transparent shrink-0" />}
                                                                                    <div>
                                                                                           <div className="text-sm font-semibold text-gray-900 leading-tight">{variant.product.name}</div>
                                                                                           <div className="text-[11px] text-gray-400 mt-0.5 font-medium">{variant.variantName}</div>
                                                                                    </div>
                                                                             </div>
                                                                      </td>
                                                                      <td className="px-5 py-3 hidden md:table-cell">
                                                                             {variant.barcode
                                                                                    ? <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md tracking-wider">{variant.barcode}</span>
                                                                                    : <span className="text-gray-300 text-xs">—</span>
                                                                             }
                                                                      </td>
                                                                      <td className="px-5 py-3 hidden sm:table-cell">
                                                                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                                                    {variant.product.category?.name || "General"}
                                                                             </span>
                                                                      </td>
                                                                      <td className="px-5 py-3 text-right hidden lg:table-cell">
                                                                             <span className="text-xs text-gray-400 font-medium">{formatCurrency(variant.costPrice)}</span>
                                                                      </td>
                                                                      <td className="px-5 py-3 text-right">
                                                                             <span className="text-sm font-bold text-gray-900">{formatCurrency(variant.salePrice)}</span>
                                                                      </td>
                                                                      <td className="px-5 py-3 text-center">
                                                                             {noTracking ? (
                                                                                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg text-xs font-bold border bg-gray-100 text-gray-400 border-gray-200">
                                                                                           —
                                                                                    </span>
                                                                             ) : (
                                                                                    <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg text-xs font-bold border ${
                                                                                           isOutOfStock
                                                                                                  ? 'bg-red-100 text-red-700 border-red-200'
                                                                                                  : isLowStock
                                                                                                         ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                                                                         : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                                                    }`}>
                                                                                           {variant.stockQuantity}
                                                                                    </span>
                                                                             )}
                                                                      </td>
                                                                      <td className="px-5 py-3">
                                                                             <div className="flex items-center justify-end gap-1">
                                                                                    <button
                                                                                           onClick={async () => {
                                                                                                  try {
                                                                                                         await toggleQuickAccess(variant.id);
                                                                                                         fetchProducts();
                                                                                                  } catch (e: any) {
                                                                                                         alert(e.message);
                                                                                                  }
                                                                                           }}
                                                                                           className={`p-1.5 rounded-lg transition-colors ${(variant as any).isQuickAccess ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50'}`}
                                                                                           title={(variant as any).isQuickAccess ? 'Quitar de Acceso Rápido' : 'Marcar como Acceso Rápido'}
                                                                                    >
                                                                                           <Star className={`h-3.5 w-3.5 ${(variant as any).isQuickAccess ? 'fill-amber-400' : ''}`} />
                                                                                    </button>
                                                                                    <button
                                                                                           onClick={() => openStockModal(variant)}
                                                                                           className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                                                           title="Ajustar stock"
                                                                                    >
                                                                                           <PackagePlus className="h-3.5 w-3.5" />
                                                                                    </button>
                                                                                    <button
                                                                                           onClick={() => { setEditingVariant(variant); setIsEditModalOpen(true); }}
                                                                                           className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                                                                                           title="Editar producto"
                                                                                    >
                                                                                           <Pencil className="h-3.5 w-3.5" />
                                                                                    </button>
                                                                                    <button
                                                                                           onClick={() => handleDeleteProduct(variant.product.id, variant.product.name)}
                                                                                           className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                                                                                           title="Eliminar producto"
                                                                                    >
                                                                                           <Trash2 className="h-3.5 w-3.5" />
                                                                                    </button>
                                                                             </div>
                                                                      </td>
                                                               </tr>
                                                               );
                                                        })
                                                 )}
                                          </tbody>
                                   </table>
                            </div>
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
                                                                      <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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

                     {/* Stock Adjustment Modal */}
                     <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title="AJUSTAR STOCK">
                            {stockVariant && (
                                   <div className="space-y-6">
                                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                 <p className="text-lg font-black text-gray-900 leading-tight">{stockVariant.product?.name || stockVariant.productName}</p>
                                                 <p className="text-sm text-gray-500">{stockVariant.variantName}</p>
                                                 <div className="mt-3 flex items-center gap-3">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Actual:</span>
                                                        <span className={cn(
                                                               "text-2xl font-black",
                                                               stockVariant.stockQuantity <= stockVariant.minStock ? "text-red-600" : "text-emerald-600"
                                                        )}>
                                                               {stockVariant.stockQuantity}
                                                        </span>
                                                 </div>
                                          </div>

                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                                        Cantidad (+/-)
                                                 </label>
                                                 <div className="flex items-center gap-2">
                                                        <button
                                                               onClick={() => setStockDelta(String(Number(stockDelta || 0) - 1))}
                                                               className="w-12 h-14 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all"
                                                        >
                                                               <Minus className="h-6 w-6" />
                                                        </button>
                                                        <input
                                                               type="number"
                                                               value={stockDelta}
                                                               onChange={e => setStockDelta(e.target.value)}
                                                               className="flex-1 w-full border-2 border-gray-100 p-4 rounded-xl font-black text-3xl text-center text-gray-900 outline-none focus:border-blue-500 transition-all min-w-0"
                                                               placeholder="0"
                                                               autoFocus
                                                        />
                                                        <button
                                                               onClick={() => setStockDelta(String(Number(stockDelta || 0) + 1))}
                                                               className="w-12 h-14 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all"
                                                        >
                                                               <Plus className="h-6 w-6" />
                                                        </button>
                                                 </div>
                                                 {stockDelta && Number(stockDelta) !== 0 && (
                                                        <p className="text-center mt-2 text-sm font-bold">
                                                               Nuevo stock esperado: <span className="text-blue-600">{stockVariant.stockQuantity + Number(stockDelta)}</span>
                                                        </p>
                                                 )}
                                          </div>

                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Motivo del Ajuste</label>
                                                 <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                               { value: "COMPRA", label: "📦 Compra" },
                                                               { value: "MERMA", label: "🗑️ Merma" },
                                                               { value: "MANUAL", label: "✏️ Ajuste Manual" },
                                                               { value: "VENCIMIENTO", label: "🗓️ Vencimiento" },
                                                               { value: "ROBO", label: "🚨 Robo / Pérdida" },
                                                               { value: "DEVOLUCION", label: "🔄 Devolución" },
                                                        ].map(r => (
                                                               <button
                                                                      key={r.value}
                                                                      onClick={() => setStockReason(r.value)}
                                                                      className={cn(
                                                                             "p-3 rounded-xl text-[10px] font-black tracking-tight uppercase border-2 transition-all text-left",
                                                                             stockReason === r.value
                                                                                    ? `border-blue-500 bg-blue-50 text-blue-700`
                                                                                    : "border-gray-50 text-gray-400 hover:border-gray-200"
                                                                      )}
                                                               >
                                                                      {r.label}
                                                               </button>
                                                        ))}
                                                 </div>
                                          </div>

                                          <div className="pt-2">
                                                 <button
                                                        onClick={handleAdjustStock}
                                                        disabled={!stockDelta || Number(stockDelta) === 0}
                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 transition-all uppercase tracking-tight disabled:opacity-50 flex items-center justify-center gap-2"
                                                 >
                                                        <PackagePlus className="h-5 w-5" />
                                                        Confirmar Ajuste
                                                 </button>
                                          </div>
                                   </div>
                            )}
                     </Modal>

                     {/* Bulk Price Update Modal */}
                     <Modal isOpen={isBulkPriceModalOpen} onClose={() => setIsBulkPriceModalOpen(false)} title="ACTUALIZAR PRECIOS EN MASA">
                            <div className="space-y-4">
                                   <p className="text-sm text-gray-500">
                                          Aumenta o descuenta los precios de venta por un porcentaje.
                                   </p>
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                          <select
                                                 value={bulkPriceCategoryId}
                                                 onChange={e => setBulkPriceCategoryId(e.target.value)}
                                                 className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                          >
                                                 <option value="all">Todas las categorías (Todo el inventario)</option>
                                                 <option value="none">Sin categoría</option>
                                                 {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                                                 ))}
                                          </select>
                                   </div>
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje (+ aumento / - descuento)</label>
                                          <div className="relative">
                                                 <input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="Ej: 15 para aumentar un 15%"
                                                        value={bulkPricePercentage}
                                                        onChange={e => setBulkPricePercentage(e.target.value)}
                                                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                 />
                                                 <span className="absolute right-3 top-2 text-gray-500 font-bold">%</span>
                                          </div>
                                          <p className="text-xs text-gray-400 mt-1">Ej: 10 aumenta 10%, -5 descuenta 5%.</p>
                                   </div>
                                   <div className="pt-4 flex justify-end gap-2">
                                          <Button variant="secondary" onClick={() => setIsBulkPriceModalOpen(false)}>Cancelar</Button>
                                          <Button
                                                 onClick={handleBulkUpdatePrices}
                                                 disabled={isUpdatingPrices || !bulkPricePercentage}
                                          >
                                                 {isUpdatingPrices ? 'Actualizando...' : 'Aplicar Actualización'}
                                          </Button>
                                   </div>
                            </div>
                     </Modal>
              </div>
       );
}
