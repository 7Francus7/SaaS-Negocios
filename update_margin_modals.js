const fs = require('fs');
const path = require('path');

const filesToUpdate = [
       'c:/Users/dello/OneDrive/Desktop/SISTEMAS/SAAS NEGOCIOS/components/products/create-product-modal.tsx',
       'c:/Users/dello/OneDrive/Desktop/SISTEMAS/SAAS NEGOCIOS/components/products/edit-product-modal.tsx'
];

for (const file of filesToUpdate) {
       let content = fs.readFileSync(file, 'utf8');

       // Add marginPercentage to formData
       content = content.replace(
              'salePrice: "",',
              'salePrice: "",\n              marginPercentage: "",'
       );
       content = content.replace(
              'salePrice: String(variant.salePrice || 0),',
              'salePrice: String(variant.salePrice || 0),\n                     marginPercentage: "",'
       );

       // Change grid from grid-cols-2 to grid-cols-3 for prices
       content = content.replace(
              '<div className="grid grid-cols-2 gap-4">\n                                          <div>\n                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Precio Costo</label>',
              '<div className="grid grid-cols-3 gap-4">\n                                          <div>\n                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Costo</label>'
       );
       // In edit-product-modal it might be slightly different:
       content = content.replace(
              '<div className="grid grid-cols-2 gap-4">\r\n                                          <div>\r\n                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Precio Costo</label>',
              '<div className="grid grid-cols-3 gap-4">\r\n                                          <div>\r\n                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Precio Costo</label>'
       );

       // Add margin input after cost
       const marginHtml = `                                          <div>
                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Ganancia %</label>
                                                 <div className="relative">
                                                        <span className="absolute left-3 top-2 text-gray-500">%</span>
                                                        <input
                                                               name="marginPercentage"
                                                               type="number"
                                                               step="0.01"
                                                               className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                               placeholder="0"
                                                               value={formData.marginPercentage}
                                                               onChange={handleChange}
                                                        />
                                                 </div>
                                          </div>`;


       // We need to inject this between costPrice block and salePrice block
       const costPriceEnd = 'onChange={handleChange}\n                                                        />\n                                                 </div>\n                                          </div>';
       const costPriceEndCRLF = 'onChange={handleChange}\r\n                                                        />\r\n                                                 </div>\r\n                                          </div>';

       // To be safe, we replace the label "Precio Venta" to identify where to put it
       content = content.replace(
              '<div>\n                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>',
              `${marginHtml}\n                                          <div>\n                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Precio Final</label>`
       );
       content = content.replace(
              '<div>\r\n                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>',
              `${marginHtml}\r\n                                          <div>\r\n                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Precio Final</label>`
       );

       // Replace handleChange logic
       const oldHandleChange = `const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
              setFormData({ ...formData, [e.target.name]: value });
       };`;
       const oldHandleChangeCRLF = `const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {\r\n              const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;\r\n              setFormData({ ...formData, [e.target.name]: value });\r\n       };`;

       const newHandleChange = `const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
              const { name } = e.target;
              
              if (name === "costPrice" || name === "marginPercentage") {
                     const newCost = name === "costPrice" ? value : formData.costPrice;
                     const newMargin = name === "marginPercentage" ? value : formData.marginPercentage;
                     
                     let newSalePrice = formData.salePrice;
                     if (newCost && newMargin) {
                            const costNum = Number(newCost);
                            const marginNum = Number(newMargin);
                            if (!isNaN(costNum) && !isNaN(marginNum)) {
                                   newSalePrice = String(Math.ceil(costNum + (costNum * marginNum / 100)));
                            }
                     }
                     setFormData({ ...formData, [name]: value, salePrice: newSalePrice });
              } else if (name === "salePrice") {
                     setFormData({ ...formData, salePrice: String(value), marginPercentage: "" });
              } else {
                     setFormData({ ...formData, [name]: value });
              }
       };`;

       if (content.includes(oldHandleChange)) {
              content = content.replace(oldHandleChange, newHandleChange);
       } else if (content.includes(oldHandleChangeCRLF)) {
              content = content.replace(oldHandleChangeCRLF, newHandleChange);
       }

       fs.writeFileSync(file, content);
       console.log(`Updated ${path.basename(file)}`);
}
