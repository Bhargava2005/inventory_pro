import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, AlertCircle } from 'lucide-react';
import useProductStore from '../../store/productStore.js';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  sku: z.string().optional(),
  category: z.string().optional(),
  description: z.string().max(500).optional(),
  price: z.coerce.number({ invalid_type_error: 'Required' }).min(0, 'Cannot be negative'),
  costPrice: z.coerce.number().min(0).optional().default(0),
  quantity: z.coerce.number({ invalid_type_error: 'Required' }).min(0, 'Cannot be negative'),
  minStockLevel: z.coerce.number().min(0).optional().default(5),
  unit: z.string().optional().default('pcs'),
  supplier: z.string().max(100).optional(),
});

export default function ProductModal({ product, onClose, onSaved }) {
  const { categories, createProduct, updateProduct, isSubmitting } = useProductStore();
  const isEdit = !!product;

  const { register, handleSubmit, formState: { errors }, setError, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? {
      name: product.name,
      sku: product.sku,
      category: product.category?._id || '',
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      quantity: product.quantity,
      minStockLevel: product.minStockLevel,
      unit: product.unit,
      supplier: product.supplier,
    } : { unit: 'pcs', minStockLevel: 5, costPrice: 0 },
  });

  const onSubmit = async (data) => {
    const payload = { ...data, category: data.category || null };
    const result = isEdit
      ? await updateProduct(product._id, payload)
      : await createProduct(payload);

    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError('root', { message: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {errors.root && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="label">Product Name <span className="text-red-400">*</span></label>
            <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Wireless Mouse" />
            {errors.name && <p className="error-text"><AlertCircle className="w-3 h-3" />{errors.name.message}</p>}
          </div>

          {/* SKU + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">SKU <span className="text-gray-400 text-xs">(auto if blank)</span></label>
              <input {...register('sku')} className="input" placeholder="PRD-0001" />
            </div>
            <div>
              <label className="label">Category</label>
              <select {...register('category')} className="input">
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price + Cost row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Selling Price (₹) <span className="text-red-400">*</span></label>
              <input {...register('price')} type="number" step="0.01" className={`input ${errors.price ? 'input-error' : ''}`} placeholder="0.00" />
              {errors.price && <p className="error-text"><AlertCircle className="w-3 h-3" />{errors.price.message}</p>}
            </div>
            <div>
              <label className="label">Cost Price (₹)</label>
              <input {...register('costPrice')} type="number" step="0.01" className="input" placeholder="0.00" />
            </div>
          </div>

          {/* Qty + Min Stock + Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Quantity <span className="text-red-400">*</span></label>
              <input {...register('quantity')} type="number" className={`input ${errors.quantity ? 'input-error' : ''}`} placeholder="0" />
              {errors.quantity && <p className="error-text"><AlertCircle className="w-3 h-3" />{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="label">Min Stock</label>
              <input {...register('minStockLevel')} type="number" className="input" placeholder="5" />
            </div>
            <div>
              <label className="label">Unit</label>
              <input {...register('unit')} className="input" placeholder="pcs" />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="label">Supplier</label>
            <input {...register('supplier')} className="input" placeholder="Supplier name" />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={2} className="input resize-none" placeholder="Optional product description" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? 'Saving...' : 'Creating...'}</> : (isEdit ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
