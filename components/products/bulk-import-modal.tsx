"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { bulkImportProducts, ImportProductRow } from "@/app/actions/bulk-import";
import { AlertCircle, CheckCircle, FileText, Loader2, UploadCloud } from "lucide-react";

interface BulkImportModalProps {
       isOpen: boolean;
       onClose: () => void;
       onSuccess: () => void;
}

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
       const [text, setText] = useState("");
       const [loading, setLoading] = useState(false);
       const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

       const handleImport = async () => {
              if (!text.trim()) return;
              setLoading(true);
              setResult(null);

              try {
                     // 1. Parse Text (Auto-detect Tab or Comma)
                     const rows = text.trim().split("\n");
                     const parsedData: ImportProductRow[] = [];

                     for (const rowStr of rows) {
                            // Skip empty
                            if (!rowStr.trim()) continue;

                            // Detect separator
                            const separator = rowStr.includes("\t") ? "\t" : ",";
                            const cols = rowStr.split(separator).map(c => c.trim());

                            // Expected Order: Name, Category, Cost, Price, Stock, Barcode, Variant?
                            // Let's stick to a simple standard: Name, Price, Stock, Cost (Optional), Barcode (Optional)
                            // Or mapping: Name | Category | Cost | Price | Stock | Barcode

                            // Simple validation
                            if (cols.length < 3) continue; // Minimum Name, Cost, Price

                            const name = cols[0];
                            const category = cols[1] || "General";
                            const cost = parseFloat(cols[2]?.replace("$", "") || "0");
                            const price = parseFloat(cols[3]?.replace("$", "") || "0");
                            const stock = parseInt(cols[4] || "0");
                            const barcode = cols[5] || undefined;

                            if (name) {
                                   parsedData.push({
                                          name,
                                          category,
                                          costPrice: isNaN(cost) ? 0 : cost,
                                          salePrice: isNaN(price) ? 0 : price,
                                          stock: isNaN(stock) ? 0 : stock,
                                          barcode: barcode === "-" ? undefined : barcode,
                                          variantName: "Unidad" // Default
                                   });
                            }
                     }

                     if (parsedData.length === 0) {
                            throw new Error("No se detectaron filas válidas. Revise el formato.");
                     }

                     // 2. Send to Server
                     const res = await bulkImportProducts(parsedData);
                     setResult(res);

                     if (res.success > 0) {
                            onSuccess();
                            setText("");
                     }

              } catch (e: any) {
                     setResult({ success: 0, errors: [e.message] });
              } finally {
                     setLoading(false);
              }
       };

       return (
              <Modal isOpen={isOpen} onClose={onClose} title="Importación Masiva">
                     <div className="space-y-4">
                            {!result ? (
                                   <>
                                          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 border border-blue-100">
                                                 <p className="font-bold flex items-center gap-2 mb-2">
                                                        <FileText className="h-4 w-4" />
                                                        Instrucciones
                                                 </p>
                                                 <p>Copie y pegue sus datos desde Excel o Google Sheets.</p>
                                                 <p className="mt-2 text-xs font-mono bg-white p-2 rounded border border-blue-200">
                                                        Nombre | Categoría | Costo | Precio Venta | Stock | Código Barras
                                                 </p>
                                                 <p className="mt-1 text-xs">El orden de las columnas es importante.</p>
                                          </div>

                                          <textarea
                                                 className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                 placeholder={`Coca Cola 1.5L\tGaseosas\t1200\t2500\t50\t779123456\nGalletitas Oreo\tAlmacén\t800\t1500\t20\t...`}
                                                 value={text}
                                                 onChange={(e) => setText(e.target.value)}
                                          />

                                          <div className="flex justify-end gap-3">
                                                 <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"> Cancelar </button>
                                                 <button
                                                        onClick={handleImport}
                                                        disabled={loading || !text.trim()}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                                 >
                                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                                                        Importar Productos
                                                 </button>
                                          </div>
                                   </>
                            ) : (
                                   <div className="space-y-6">
                                          <div className={`text-center p-6 rounded-xl border ${result.success > 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                                 {result.success > 0 ? (
                                                        <>
                                                               <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                                                               <h3 className="text-xl font-bold text-green-800">¡Importación Completada!</h3>
                                                               <p className="text-green-600">Se crearon {result.success} productos exitosamente.</p>
                                                        </>
                                                 ) : (
                                                        <>
                                                               <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-2" />
                                                               <h3 className="text-xl font-bold text-red-800">Hubo Problemas</h3>
                                                               <p className="text-red-600">No se pudo importar ningún producto.</p>
                                                        </>
                                                 )}
                                          </div>

                                          {result.errors.length > 0 && (
                                                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                                                        <p className="font-bold text-gray-700 text-sm mb-2">Reporte de Errores ({result.errors.length})</p>
                                                        <ul className="text-xs text-red-600 space-y-1 list-disc pl-4">
                                                               {result.errors.map((e, i) => (
                                                                      <li key={i}>{e}</li>
                                                               ))}
                                                        </ul>
                                                 </div>
                                          )}

                                          <div className="flex justify-center gap-3">
                                                 <button onClick={onClose} className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                                                        Cerrar
                                                 </button>
                                                 <button onClick={() => { setResult(null); setText(""); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                                        Importar Más
                                                 </button>
                                          </div>
                                   </div>
                            )}
                     </div>
              </Modal>
       );
}
