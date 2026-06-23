import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrashIcon } from '../components/Icons'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { useCheckout } from '../context/CheckoutContext'
import { useConfirmDialog } from '../context/ConfirmDialogContext'
import { useCurrency } from '../context/CurrencyContext'
import type { CartItem } from '../lib/checkout'
import { getCartTotals } from '../lib/checkout'
import { formatVariantColor, formatVariantSize } from '../lib/variantDisplay'

function variantLabel(item: { variantSize?: string; variantColor?: string }) {
  const parts = [
    item.variantSize ? formatVariantSize(item.variantSize) : '',
    item.variantColor ? formatVariantColor(item.variantColor) : '',
  ].filter(Boolean)

  return parts.join(' · ')
}

function syncSelectedIds(previous: Set<string>, items: CartItem[]) {
  const itemIds = items.map((item) => item.id)
  if (items.length === 0) return new Set<string>()

  const next = new Set<string>()
  for (const id of itemIds) {
    if (previous.has(id)) next.add(id)
  }

  if (next.size === 0) {
    return new Set(itemIds)
  }

  return next
}

export function CartPage() {
  const navigate = useNavigate()
  const { confirmAction } = useConfirmDialog()
  const { formatDisplayAmount, formatListingPrice, toDisplayListingAmount } = useCurrency()
  const {
    items,
    removeItem,
    removeItems,
    beginCheckout,
    restoreHeldCartItems,
    updateQuantity,
  } = useCheckout()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    restoreHeldCartItems()
  }, [restoreHeldCartItems])

  useEffect(() => {
    setSelectedIds((current) => syncSelectedIds(current, items))
  }, [items])

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  )
  const allSelected = items.length > 0 && selectedItems.length === items.length
  const selectedCount = selectedItems.length
  const { subtotal, total } = getCartTotals(selectedItems, null, {
    toDisplayAmount: toDisplayListingAmount,
  })

  const toggleItem = (lineId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(lineId)) {
        next.delete(lineId)
      } else {
        next.add(lineId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(items.map((item) => item.id)))
  }

  const confirmRemove = async (itemLabel: string) => {
    return confirmAction('remove', {
      placeholders: { item_label: itemLabel },
    })
  }

  const handleDeleteItem = async (item: CartItem) => {
    const confirmed = await confirmRemove(item.title)
    if (!confirmed) return
    removeItem(item.id)
  }

  const handleDeleteSelected = async () => {
    if (selectedCount === 0) return

    const itemLabel = selectedCount === 1
      ? selectedItems[0]?.title ?? 'this item'
      : `${selectedCount} selected items`

    const confirmed = await confirmRemove(itemLabel)
    if (!confirmed) return
    removeItems([...selectedIds])
  }

  const handleCheckout = () => {
    if (selectedCount === 0) return
    beginCheckout([...selectedIds])
    navigate('/checkout')
  }

  return (
    <section className="cart-page">
      <div className="container cart-page__inner">
        <header className="cart-page__header">
          <span>Shopping cart</span>
          <h1>Your cart</h1>
          <p>{items.length} item{items.length !== 1 ? 's' : ''} in your cart.</p>
        </header>

        {items.length === 0 ? (
          <PanelEmptyState title="Your cart is empty" message="Browse the marketplace and add products to checkout." />
        ) : (
          <div className="cart-layout">
            <section className="cart-items-panel">
              <div className="cart-items-toolbar">
                <label className="cart-items-toolbar__select-all">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    aria-label="Select all items"
                    onChange={toggleSelectAll}
                  />
                  <span>Select all</span>
                </label>
                {selectedCount > 0 && (
                  <button
                    type="button"
                    className="cart-items-toolbar__delete"
                    onClick={() => void handleDeleteSelected()}
                  >
                    Delete selected ({selectedCount})
                  </button>
                )}
              </div>
              <div className="cart-item-list">
                {items.map((item) => (
                  <article key={item.id} className="cart-item-row">
                    <label className="cart-item-row__check">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        aria-label={`Select ${item.title}`}
                        onChange={() => toggleItem(item.id)}
                      />
                    </label>
                    <img src={item.image} alt={item.title} />
                    <div className="cart-item-row__details">
                      <span>{item.brand}</span>
                      <h3>
                        <Link to={`/product/${item.productId}`}>{item.title}</Link>
                      </h3>
                      {variantLabel(item) && <span>{variantLabel(item)}</span>}
                      <div className="cart-item-row__controls">
                        <label>
                          Qty
                          <select
                            value={item.quantity}
                            aria-label={`Quantity for ${item.title}`}
                            onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                          >
                            {[1, 2, 3, 4, 5].map((qty) => (
                              <option key={qty} value={qty}>{qty}</option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          className="cart-item-row__delete"
                          aria-label={`Remove ${item.title}`}
                          onClick={() => void handleDeleteItem(item)}
                        >
                          <TrashIcon />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-row__price">
                      <strong>
                        {formatListingPrice(
                          item.price * item.quantity,
                          item.listingCurrencyCode,
                        )}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="cart-summary-panel">
              <h2>Order summary</h2>
              <p className="cart-summary-panel__selection">
                {selectedCount} of {items.length} item{items.length !== 1 ? 's' : ''} selected
              </p>
              <div className="cart-summary-lines">
                <div><span>Subtotal</span><strong>{formatDisplayAmount(subtotal)}</strong></div>
                <div className="cart-summary-lines__total"><span>Total</span><strong>{formatDisplayAmount(total)}</strong></div>
              </div>
              <button
                type="button"
                className="cart-checkout-btn"
                disabled={selectedCount === 0}
                onClick={handleCheckout}
              >
                {selectedCount === items.length
                  ? 'Proceed to checkout'
                  : `Checkout ${selectedCount} item${selectedCount !== 1 ? 's' : ''}`}
              </button>
              <Link to="/" className="cart-continue-link">Continue shopping</Link>
            </aside>
          </div>
        )}

        {items.length === 0 && (
          <Link to="/" className="cart-continue-link">Continue shopping</Link>
        )}
      </div>
    </section>
  )
}
