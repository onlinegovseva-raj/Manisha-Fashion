import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  FileSpreadsheet, 
  AlertCircle,
  Layers,
  FolderPlus
} from 'lucide-react';
import { Product, StaffUser, ProductCategory } from '../../types';
import { storage } from '../../services/storage';
import { ProductEditModal } from './ProductEditModal';

interface ProductManagementViewProps {
  products: Product[];
  currentUser: StaffUser;
  onRefresh: () => void;
  onOpenAIStudioWithImage?: (imageUrl: string) => void;
}

export const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  products,
  currentUser,
  onRefresh,
  onOpenAIStudioWithImage,
}) => {
  const permissions = storage.getUserPermissions(currentUser.role);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [csvNotice, setCsvNotice] = useState<string | null>(null);

  // Dynamic Categories Management
  const [categoriesList, setCategoriesList] = useState<string[]>(() => storage.getCategories());
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [catModalError, setCatModalError] = useState<string | null>(null);
  const [catModalSuccess, setCatModalSuccess] = useState<string | null>(null);

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCatModalError(null);
    setCatModalSuccess(null);
    if (!newCatInput.trim()) return;

    const res = storage.addCategory(newCatInput.trim());
    if (res.success) {
      setCategoriesList(res.categories);
      setCatModalSuccess(`Category "${newCatInput.trim()}" added successfully!`);
      setNewCatInput('');
      onRefresh();
    } else {
      setCatModalError(res.error || 'Failed to add category');
    }
  };

  const handleDeleteCategory = (catName: string) => {
    const prodsInCat = products.filter((p) => p.category.toLowerCase() === catName.toLowerCase());
    if (prodsInCat.length > 0) {
      if (!confirm(`Warning: Category "${catName}" has ${prodsInCat.length} products assigned. Delete category anyway?`)) {
        return;
      }
    }
    const res = storage.deleteCategory(catName);
    if (res.success) {
      setCategoriesList(res.categories);
      if (selectedCategory === catName) setSelectedCategory('ALL');
      setCatModalSuccess(`Category "${catName}" removed.`);
      onRefresh();
    } else {
      setCatModalError(res.error || 'Cannot delete category');
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCreateNew = () => {
    setSelectedProductForEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (p: Product) => {
    setSelectedProductForEdit(p);
    setIsModalOpen(true);
  };

  const handleDelete = (p: Product) => {
    if (!permissions.can_edit_products) return;
    if (confirm(`Are you sure you want to remove "${p.name}"? This will queue an offline deletion.`)) {
      storage.deleteProduct(p.id);
      onRefresh();
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Name',
      'Category',
      'SellingPrice',
      'PurchaseCost',
      'DiscountType',
      'DiscountValue',
      'Fabric',
      'Fit',
      'TotalStock',
      'IsPublished',
      'Tags',
    ];

    const rows = products.map((p) => {
      const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
      return [
        `"${p.sku}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        p.selling_price,
        permissions.can_view_cost_price ? p.purchase_cost : 'RESTRICTED',
        p.discount_type,
        p.discount_value,
        `"${p.fabric}"`,
        `"${p.fit}"`,
        totalStock,
        p.is_published ? 'YES' : 'NO',
        `"${p.tags.join(';')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Manisha_Fashion_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sample CSV Template Download
  const handleDownloadTemplate = () => {
    const template = `SKU,Name,Category,SellingPrice,PurchaseCost,DiscountType,DiscountValue,Fabric,Fit,Size,Color,Stock
MF-EX-001,Signature Linen Shirt,Linen Collection,1799,750,PERCENTAGE,10,Pure Linen,Regular Fit,40 (M),Sage Green,20
MF-EX-002,Executive Oxford Shirt,Formal Shirts,1499,620,FLAT,150,100% Cotton,Slim Fit,42 (L),Sky Blue,15`;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Manisha_Fashion_Product_Import_Template.csv';
    a.click();
  };

  // Handle CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setCsvNotice('Invalid CSV file: missing data rows.');
          return;
        }

        let importedCount = 0;
        // Parse CSV
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 5) {
            const sku = cols[0];
            const name = cols[1];
            const category = (cols[2] as ProductCategory) || 'Formal Shirts';
            const sellingPrice = parseFloat(cols[3]) || 999;
            const purchaseCost = parseFloat(cols[4]) || 450;

            const newProd: Product = {
              id: `prod_csv_${Date.now()}_${i}`,
              sku,
              name,
              category,
              description: 'Imported via CSV bulk tool.',
              fabric: cols[7] || '100% Cotton',
              fit: 'Regular Fit',
              selling_price: sellingPrice,
              purchase_cost: purchaseCost,
              discount_type: 'NONE',
              discount_value: 0,
              images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf'],
              variants: [
                {
                  id: `var_csv_${Date.now()}_${i}`,
                  sku: `${sku}-40`,
                  size: cols[9] || '40 (M)',
                  color: cols[10] || 'Standard',
                  stock: parseInt(cols[11]) || 15,
                },
              ],
              is_published: true,
              tags: ['Bulk Import'],
              version: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            storage.saveProduct(newProd, currentUser);
            importedCount++;
          }
        }

        setCsvNotice(`Successfully imported ${importedCount} products from CSV.`);
        onRefresh();
      } catch (err: any) {
        setCsvNotice(`CSV import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Product & Apparel Catalogue</h2>
          <p className="text-xs text-stone-500">
            {products.length} registered styles · Multi-variant SKU management with audit log
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="px-2.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded font-medium flex items-center gap-1"
            title="Download CSV sample format"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Template</span>
          </button>

          <label className="px-2.5 py-1.5 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 rounded font-medium cursor-pointer flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 rounded font-medium flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Manage Categories Button */}
          <button
            onClick={() => {
              setCatModalError(null);
              setCatModalSuccess(null);
              setIsCategoryModalOpen(true);
            }}
            className="px-2.5 py-1.5 text-xs text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded font-bold flex items-center gap-1.5 transition-colors"
            title="Manage product categories (Add Jewellery, Bangles, Purses, etc.)"
          >
            <Layers className="w-3.5 h-3.5 text-amber-700" />
            <span>Categories ({categoriesList.length})</span>
          </button>

          {permissions.can_edit_products && (
            <button
              onClick={handleCreateNew}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {csvNotice && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-xs flex items-center justify-between">
          <span>{csvNotice}</span>
          <button onClick={() => setCsvNotice(null)} className="text-amber-800 hover:text-amber-950 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-stone-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SKU, product name, fabric, or tags..."
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-stone-300 rounded-md py-1.5 px-2.5 bg-white focus:outline-none font-medium text-stone-800"
          >
            <option value="ALL">All Categories ({products.length})</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({products.filter((p) => p.category === cat).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Product / Fabric</th>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3 text-right">Selling Price</th>
                {permissions.can_view_cost_price && <th className="px-3 py-3 text-right">Purchase Cost</th>}
                <th className="px-3 py-3 text-center">Variants & Sizes</th>
                <th className="px-3 py-3 text-center">Total Stock</th>
                <th className="px-3 py-3 text-center">Store Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-stone-400">
                    No products found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                  const effectivePrice = storage.calculateEffectivePrice(p);

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf'}
                            alt={p.name}
                            className="w-10 h-10 rounded object-cover border border-stone-200 shrink-0 bg-stone-100"
                          />
                          <div>
                            <span className="font-semibold text-stone-900 block">{p.name}</span>
                            <span className="text-[11px] text-stone-500">
                              {p.fabric} · {p.fit}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 font-mono font-medium text-stone-700">{p.sku}</td>

                      <td className="px-3 py-3 text-stone-600">{p.category}</td>

                      <td className="px-3 py-3 text-right">
                        <div>
                          <span className="font-bold text-stone-900">₹{effectivePrice}</span>
                          {effectivePrice < p.selling_price && (
                            <span className="text-[10px] text-stone-400 line-through block">
                              ₹{p.selling_price}
                            </span>
                          )}
                        </div>
                      </td>

                      {permissions.can_view_cost_price && (
                        <td className="px-3 py-3 text-right text-stone-600 font-mono">
                          ₹{p.purchase_cost}
                        </td>
                      )}

                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-wrap gap-1 justify-center max-w-xs">
                          {p.variants.map((v) => (
                            <span
                              key={v.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                v.stock === 0
                                  ? 'bg-rose-100 text-rose-700'
                                  : v.stock <= 5
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                              title={`${v.size} (${v.color}): ${v.stock} in stock`}
                            >
                              {v.size.split(' ')[0]}:{v.stock}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            totalStock === 0
                              ? 'bg-rose-50 text-rose-700'
                              : totalStock <= 15
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {totalStock} pcs
                        </span>
                      </td>

                      <td className="px-3 py-3 text-center">
                        {p.is_published ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <Check className="w-3.5 h-3.5" /> Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400">
                            <X className="w-3.5 h-3.5" /> Draft
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onOpenAIStudioWithImage && (
                            <button
                              onClick={() => onOpenAIStudioWithImage(p.images[0])}
                              className="p-1 text-stone-500 hover:text-amber-700 rounded hover:bg-stone-100"
                              title="Enhance in AI Image Studio"
                            >
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-semibold">
                                AI
                              </span>
                            </button>
                          )}

                          {permissions.can_edit_products && (
                            <>
                              <button
                                onClick={() => handleEdit(p)}
                                className="p-1 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-100"
                                title="Edit Product"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(p)}
                                className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
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

      {/* Product Edit / Add Modal */}
      {isModalOpen && (
        <ProductEditModal
          product={selectedProductForEdit}
          currentUser={currentUser}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={() => onRefresh()}
        />
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-base text-stone-900 font-serif">
                  Manage Product Categories
                </h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Add new retail categories like <strong>Fashion Jewellery</strong>, <strong>Bangles & Kada</strong>, <strong>Ladies Purses</strong>, or custom clothing lines.
            </p>

            {catModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{catModalError}</span>
              </div>
            )}

            {catModalSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{catModalSuccess}</span>
              </div>
            )}

            {/* Add New Category Form */}
            <form onSubmit={handleAddCategorySubmit} className="flex gap-2">
              <input
                type="text"
                required
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                placeholder="Enter new category name (e.g. Ledius Purse, Bengels, Nekles)..."
                className="flex-1 text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shrink-0 shadow-xs transition-colors"
              >
                + Add Category
              </button>
            </form>

            {/* List of Current Categories */}
            <div className="border border-stone-200 rounded-lg divide-y divide-stone-100 max-h-60 overflow-y-auto">
              {categoriesList.map((cat) => {
                const count = products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
                return (
                  <div key={cat} className="p-3 flex items-center justify-between hover:bg-stone-50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">{cat}</span>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-mono">
                        {count} item{count !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
