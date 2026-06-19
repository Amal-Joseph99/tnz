import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import {
  createCategoryTaxonomy,
  deleteCategoryTaxonomy,
  fetchCategoryTaxonomy,
  isValidHsnCode,
  updateCategoryTaxonomy,
  type CategoryTaxonomyRow,
} from '../lib/catalogCategories'

type FormState = {
  categoryName: string
  subCategoryName: string
  productTypeName: string
  hsnCode: string
}

const emptyForm: FormState = {
  categoryName: '',
  subCategoryName: '',
  productTypeName: '',
  hsnCode: '',
}

export function AdminCategoriesPage() {
  const [rows, setRows] = useState<CategoryTaxonomyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  const loadRows = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchCategoryTaxonomy(true)
      setRows(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRows()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    setError('')
    setMessage('')

    if (!form.categoryName.trim() || !form.subCategoryName.trim() || !form.productTypeName.trim()) {
      setError('Category, sub category, and product type are required.')
      return
    }

    if (!isValidHsnCode(form.hsnCode)) {
      setError('HSN code must be exactly 8 digits.')
      return
    }

    setSaving(true)
    const payload = {
      categoryName: form.categoryName,
      subCategoryName: form.subCategoryName,
      productTypeName: form.productTypeName,
      hsnCode: form.hsnCode,
    }

    const result = editingId
      ? await updateCategoryTaxonomy(editingId, payload)
      : await createCategoryTaxonomy(payload)

    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(editingId ? 'Category taxonomy updated.' : 'Category taxonomy added.')
    resetForm()
    await loadRows()
  }

  const startEdit = (row: CategoryTaxonomyRow) => {
    setEditingId(row.id)
    setForm({
      categoryName: row.category_name,
      subCategoryName: row.sub_category_name,
      productTypeName: row.product_type_name,
      hsnCode: row.hsn_code,
    })
    setError('')
    setMessage('')
  }

  const handleDelete = async (row: CategoryTaxonomyRow) => {
    const confirmed = window.confirm(
      `Delete ${row.category_name} / ${row.sub_category_name} / ${row.product_type_name}?`,
    )
    if (!confirmed) return

    setError('')
    setMessage('')
    setSaving(true)
    const result = await deleteCategoryTaxonomy(row.id)
    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    if (editingId === row.id) {
      resetForm()
    }

    setMessage('Category taxonomy deleted.')
    await loadRows()
  }

  return (
    <AdminDashboardShell
      title="Category management"
      subtitle="Maintain category, sub category, product type, and 8-digit HSN mappings for sellers and storefront navigation."
    >
      <section className="admin-panel">
        <div className="admin-panel__header">
          <h2>{editingId ? 'Edit category taxonomy' : 'Add category taxonomy'}</h2>
          <p>Each row maps category → sub category → product type to one 8-digit HSN code.</p>
        </div>

        {error && <div className="auth-message auth-message--error">{error}</div>}
        {message && <div className="auth-message auth-message--success">{message}</div>}

        <form
          className="admin-form admin-form--grid"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}
        >
          <label>
            Category
            <input
              value={form.categoryName}
              placeholder="e.g. Electronics"
              required
              onChange={(event) => setForm((current) => ({ ...current, categoryName: event.target.value }))}
            />
          </label>
          <label>
            Sub category
            <input
              value={form.subCategoryName}
              placeholder="e.g. Audio"
              required
              onChange={(event) => setForm((current) => ({ ...current, subCategoryName: event.target.value }))}
            />
          </label>
          <label>
            Product type
            <input
              value={form.productTypeName}
              placeholder="e.g. Wireless Headphones"
              required
              onChange={(event) => setForm((current) => ({ ...current, productTypeName: event.target.value }))}
            />
          </label>
          <label>
            HSN code (8 digits)
            <input
              value={form.hsnCode}
              inputMode="numeric"
              maxLength={8}
              placeholder="85183000"
              required
              onChange={(event) => setForm((current) => ({ ...current, hsnCode: event.target.value.replace(/\D/g, '').slice(0, 8) }))}
            />
          </label>
          <div className="admin-form__actions">
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add taxonomy row'}
            </button>
            {editingId && (
              <button type="button" className="admin-btn admin-btn--ghost" onClick={resetForm} disabled={saving}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Existing category taxonomy</h2>
            <p>Only administrators can edit or delete these rows.</p>
          </div>
        </div>

        {loading ? (
          <p>Loading categories...</p>
        ) : rows.length === 0 ? (
          <PanelEmptyState
            title="No categories configured"
            message="Add your first category, sub category, product type, and HSN code above."
          />
        ) : (
          <div className="admin-table admin-table--categories">
            <div className="admin-table__row admin-table__row--head">
              <span>Category</span>
              <span>Sub category</span>
              <span>Product type</span>
              <span>HSN</span>
              <span>Actions</span>
            </div>
            {rows.map((row) => (
              <div key={row.id} className="admin-table__row">
                <span>{row.category_name}</span>
                <span>{row.sub_category_name}</span>
                <span>{row.product_type_name}</span>
                <span>{row.hsn_code}</span>
                <span className="admin-table__actions">
                  <button type="button" onClick={() => startEdit(row)} disabled={saving}>Edit</button>
                  <button type="button" onClick={() => void handleDelete(row)} disabled={saving}>Delete</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminDashboardShell>
  )
}
