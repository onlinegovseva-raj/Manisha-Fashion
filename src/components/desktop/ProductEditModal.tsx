import React, { useState } from 'react';
import { X, Plus, Trash2, Image, ShieldAlert, Sparkles } from 'lucide-react';
import { Product, ProductVariant, ProductCategory, StaffUser } from '../../types';
import { storage } from '../../services/storage';

interface ProductEditModalProps {
  product?: Product | null;
  currentUser: StaffUser;
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedProduct: Product) => void;
}

const CATEGORIES: ProductCategory[] = [
  'Formal Shirts',
  'Casual Shirts',
  'Linen Collection',
  'Festive Kurtas',
  'Printed Summer Shirts',
  'Cotton Trousers',
];

const DEFAULT_SIZES = ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'];

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  currentUser,
  isOpen,
  onClose,
  onSave,
}) => {
  const permissions = storage.getUserPermissions(currentUser.role);

  const [categoriesList, setCategoriesList] = useState<string[]>(() => storage.getCategories());
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState<boolean>(false);
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');

  const [sku, setSku] = useState(product?.sku || `MF-${Date.now().toString().slice(-6)}`);
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState<string>(
    product?.category || categoriesList[0] || 'Fashion Jewellery'
  );
  const [description, setDescription] = useState(product?.description || '');
  const [fabric, setFabric] = useState(product?.fabric || '100% Premium Cotton');
  const [fit, setFit] = useState<Product['fit']>(product?.fit || 'Regular Fit');
  const [sellingPrice, setSellingPrice] = useState<number>(product?.selling_price || 1299);
  const [purchaseCost, setPurchaseCost] = useState<number>(product?.purchase_cost || 550);
  const [discountType, setDiscountType] = useState<Product['discount_type']>(product?.discount_type || 'NONE');
  const [discountValue, setDiscountValue] = useState<number>(product?.discount_value || 0);
  const [isPublished, setIsPublished] = useState<boolean>(product?.is_published ?? true);
  const [tagsInput, setTagsInput] = useState<string>(product?.tags.join(', ') || 'Cotton, Shirts');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [images, setImages] = useState<string[]>(
    product?.images || [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    ]
  );

  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.variants || [
      { id: `var_${Date.now()}_1`, sku: `${sku}-38`, size: '38 (S)', color: 'White', stock: 12 },
      { id: `var_${Date.now()}_2`, sku: `${sku}-40`, size: '40 (M)', color: 'White', stock: 20 },
      { id: `var_${Date.now()}_3`, sku: `${sku}-42`, size: '42 (L)', color: 'White', stock: 15 },
      { id: `var_${Date.now()}_4`, sku: `${sku}-44`, size: '44 (XL)', color: 'White', stock: 8 },
    ]
  );

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddVariant = () => {
    const newVar: ProductVariant = {
      id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      sku: `${sku}-NEW`,
      size: '40 (M)',
      color: 'White',
      stock: 10,
    };
    setVariants([...variants, newVar]);
  };

  const handleUpdateVariant = (idx: number, field: keyof ProductVariant, val: any) => {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: val };
    setVariants(updated);
  };

  const handleRemoveVariant = (idx: number) => {
    if (variants.length <= 1) {
      setError('A product must contain at least one size variant.');
      return;
    }
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    setImages([...images, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (!sku.trim()) {
      setError('Product SKU is required.');
      return;
    }
    if (sellingPrice < 0) {
      setError('Selling price cannot be negative.');
      return;
    }

    // Negative stock guard on variants
    for (const v of variants) {
      if (v.stock < 0) {
        setError(`Variant stock for size ${v.size} cannot be negative.`);
        return;
      }
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const productPayload: Product = {
      id: product?.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sku: sku.trim(),
      name: name.trim(),
      category,
      description: description.trim(),
      fabric: fabric.trim(),
      fit,
      selling_price: Number(sellingPrice),
      purchase_cost: permissions.can_view_cost_price ? Number(purchaseCost) : (product?.purchase_cost || 0),
      discount_type: discountType,
      discount_value: Number(discountValue),
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf'],
      variants,
      is_published: isPublished,
      tags,
      version: product?.version || 1,
      created_at: product?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saveResult = storage.saveProduct(productPayload, currentUser);
    if (!saveResult.success) {
      setError(saveResult.message || 'Failed to save product.');
      return;
    }

    onSave(productPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="text-lg font-bold text-stone-900">
              {product ? `Edit Product: ${product.name}` : 'Add New Shirt / Clothing Item'}
            </h3>
            <p className="text-xs text-stone-500">
              Offline-ready inventory record with variant tracking & optimistic concurrency.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Oxford Blue Spread Collar Formal Shirt"
                className="w-full text-sm px-3 py-2 border border-stone-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Base SKU *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="MF-OFS-BLU"
                className="w-full text-sm font-mono px-3 py-2 border border-stone-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700 uppercase">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                  className="text-[11px] text-amber-700 hover:text-amber-900 font-bold"
                >
                  {isAddingCustomCategory ? 'Cancel' : '+ New Category'}
                </button>
              </div>

              {isAddingCustomCategory ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="e.g. Ledius Purse, Bengels, Nekles..."
                    className="w-full text-xs px-2.5 py-2 border border-amber-400 rounded-md focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customCategoryInput.trim()) {
                        const res = storage.addCategory(customCategoryInput.trim());
                        if (res.success) {
                          setCategoriesList(res.categories);
                          setCategory(customCategoryInput.trim());
                          setIsAddingCustomCategory(false);
                          setCustomCategoryInput('');
                        } else {
                          setError(res.error || 'Failed to add category');
                        }
                      }
                    }}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-md shrink-0"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-stone-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Fabric Material
              </label>
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="e.g. 100% Giza Egyptian Cotton"
                className="w-full text-sm px-3 py-2 border border-stone-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Fit Silhouette
              </label>
              <select
                value={fit}
                onChange={(e) => setFit(e.target.value as Product['fit'])}
                className="w-full text-sm px-3 py-2 border border-stone-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Slim Fit">Slim Fit</option>
                <option value="Regular Fit">Regular Fit</option>
                <option value="Comfort Fit">Comfort Fit</option>
                <option value="Relaxed Fit">Relaxed Fit</option>
              </select>
            </div>
          </div>

          {/* Pricing & Margin Section */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-4">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Pricing, Discounts & Profit Margin
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 border border-stone-300 rounded-md bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Purchase Cost (₹)
                  {!permissions.can_view_cost_price && ' (Restricted)'}
                </label>
                {permissions.can_view_cost_price ? (
                  <input
                    type="number"
                    min="0"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 border border-stone-300 rounded-md bg-white font-medium"
                  />
                ) : (
                  <div className="text-xs text-stone-400 py-2.5 italic">
                    Hidden from {currentUser.role}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full text-sm px-3 py-2 border border-stone-300 rounded-md bg-white"
                >
                  <option value="NONE">No Discount</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={discountType === 'NONE'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 border border-stone-300 rounded-md bg-white disabled:bg-stone-100"
                />
              </div>
            </div>

            {permissions.can_view_cost_price && (
              <div className="text-xs text-stone-600 flex items-center gap-3 pt-2 border-t border-stone-200">
                <span>
                  Estimated Gross Profit / Unit:{' '}
                  <strong className="text-emerald-700">
                    ₹{Math.max(0, sellingPrice - purchaseCost)}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Gross Margin:{' '}
                  <strong className="text-emerald-700">
                    {sellingPrice > 0 ? Math.round(((sellingPrice - purchaseCost) / sellingPrice) * 100) : 0}%
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
              Product Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of tailoring, fabric weave, collar style, and wash care instructions..."
              className="w-full text-sm px-3 py-2 border border-stone-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Size & Color Variants (With Stock & Negative-Stock Guard) */}
          <div className="border border-stone-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Sizes, Colors & Variant Stock
                </h4>
                <p className="text-[11px] text-stone-500">
                  Stock cannot be negative. Every adjustment is recorded in the Stock Audit Ledger.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-stone-900 text-white rounded hover:bg-stone-800 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {variants.map((variant, idx) => (
                <div key={variant.id || idx} className="py-2 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-stone-500 font-medium block">Size</label>
                    <input
                      type="text"
                      value={variant.size}
                      onChange={(e) => handleUpdateVariant(idx, 'size', e.target.value)}
                      placeholder="e.g. 40 (M)"
                      className="w-full text-xs px-2 py-1.5 border border-stone-300 rounded"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-stone-500 font-medium block">Color Name</label>
                    <input
                      type="text"
                      value={variant.color}
                      onChange={(e) => handleUpdateVariant(idx, 'color', e.target.value)}
                      placeholder="e.g. Royal Blue"
                      className="w-full text-xs px-2 py-1.5 border border-stone-300 rounded"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-stone-500 font-medium block">Variant SKU</label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                      placeholder="MF-OFS-BLU-40"
                      className="w-full text-xs font-mono px-2 py-1.5 border border-stone-300 rounded"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-stone-500 font-medium block">Stock Qty</label>
                    <input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) => handleUpdateVariant(idx, 'stock', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs font-semibold px-2 py-1.5 border border-stone-300 rounded"
                    />
                  </div>

                  <div className="sm:col-span-1 text-right pt-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                      title="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Images Section */}
          <div className="border border-stone-200 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Image className="w-4 h-4 text-amber-600" />
              <span>Product Photos & AI Studio Previews</span>
            </h4>

            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Paste high-res image URL (e.g. Unsplash or AI Studio output)..."
                className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-md focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium rounded-md"
              >
                Add Photo
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {images.map((imgUrl, i) => (
                <div key={i} className="relative group border border-stone-200 rounded-md overflow-hidden aspect-square bg-stone-100">
                  <img src={imgUrl} alt={`Product ${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 bg-stone-900/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Publishing & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Formal, Cotton, Best Seller, Office"
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-md focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-stone-800">
                  Publish to Public Online Storefront
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-md text-xs font-medium hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-xs font-bold shadow transition-colors"
            >
              {product ? 'Save & Sync Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
