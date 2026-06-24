import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SellerProductConfirmDialog } from '../components/SellerProductConfirmDialog'
import { SellerOrderFulfillmentActions } from '../components/SellerOrderFulfillmentActions'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import {
  fetchOrderProductThumbnails,
  fetchSellerOrders,
  formatOrderStatus,
  getOrderThumbnailProductId,
  getPrimaryOrderItem,
  sellerRespondToOrder,
  showSellerOrderFulfillment,
  type MarketplaceOrderRow,
} from '../lib/marketplaceOrders'

type ConfirmState = {
  order: MarketplaceOrderRow
  action: 'accept' | 'reject'
} | null

const STATUS_SORT_ORDER: Record<MarketplaceOrderRow['status'], number> = {
  awaiting_payment: 99,
  pending_seller_acceptance: 0,
  seller_accepted: 1,
  shiprocket_pending: 2,
  shiprocket_created: 3,
  packed: 4,
  shipped: 5,
  delivered: 6,
  seller_rejected: 7,
  cancelled: 99,
}

export function SellerOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<MarketplaceOrderRow[]>([])
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)
  const [responding, setResponding] = useState(false)

  const sortedOrders = useMemo(
    () =>
      [...orders].sort((left, right) => {
        const statusDiff = (STATUS_SORT_ORDER[left.status] ?? 98) - (STATUS_SORT_ORDER[right.status] ?? 98)
        if (statusDiff !== 0) return statusDiff
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      }),
    [orders],
  )

  const loadOrders = async () => {
    const rows = await fetchSellerOrders()
    setOrders(rows)

    const productIds = rows
      .map((order) => getOrderThumbnailProductId(order))
      .filter((id): id is number => id !== null)

    setThumbnails(await fetchOrderProductThumbnails(productIds))
  }

  useEffect(() => {
    void loadOrders().finally(() => setLoading(false))
  }, [])

  const handleConfirm = async () => {
    if (!confirmState) return

    setResponding(true)
    setError('')
    setMessage('')

    const result = await sellerRespondToOrder(
      confirmState.order.id,
      confirmState.action === 'accept',
    )

    setResponding(false)
    setConfirmState(null)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(
      confirmState.action === 'accept'
        ? `Order ${confirmState.order.order_number} accepted.`
        : `Order ${confirmState.order.order_number} rejected.`,
    )
    await loadOrders()
  }

  return (
    <SellerDashboardShell>
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {message && <div className="auth-message auth-message--success">{message}</div>}

      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div>
            <h2>Orders</h2>
            <p>Accept orders, download labels, and mark packed.</p>
          </div>
        </div>

        {loading ? (
          <p>Loading orders...</p>
        ) : sortedOrders.length === 0 ? (
          <p>No confirmed orders yet.</p>
        ) : (
          <div className="seller-order-list">
            {sortedOrders.map((order) => {
              const primaryItem = getPrimaryOrderItem(order)
              const productId = getOrderThumbnailProductId(order)
              const imageUrl = productId ? thumbnails.get(productId) : undefined
              const isPending = order.status === 'pending_seller_acceptance'
              const showFulfillment = showSellerOrderFulfillment(order)

              return (
                <article key={order.id} className="seller-order-list__row">
                  <div className="seller-order-list__product">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={primaryItem?.product_name ?? 'Product'}
                        className="seller-order-list__thumb"
                      />
                    ) : (
                      <div className="seller-order-list__thumb seller-order-list__thumb--empty">No image</div>
                    )}
                    <div className="seller-order-list__copy">
                      <strong>{order.order_number}</strong>
                      <span>{primaryItem?.product_name ?? 'Order item'}</span>
                      {order.marketplace_order_items && order.marketplace_order_items.length > 1 && (
                        <small>+{order.marketplace_order_items.length - 1} more item(s)</small>
                      )}
                    </div>
                  </div>

                  <div className="seller-order-list__buyer">
                    <span>Buyer</span>
                    <strong>{order.delivery_full_name}</strong>
                    <small>{order.delivery_city}, {order.delivery_country_iso2}</small>
                  </div>

                  <div className="seller-order-list__status">
                    <span className="seller-order-list__badge">{formatOrderStatus(order.status)}</span>
                  </div>

                  <div className="seller-order-list__actions">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          className="admin-accept"
                          onClick={() => setConfirmState({ order, action: 'accept' })}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="admin-reject"
                          onClick={() => setConfirmState({ order, action: 'reject' })}
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost"
                      onClick={() => navigate(`/seller/orders/${order.id}`)}
                    >
                      View
                    </button>
                  </div>

                  {showFulfillment ? (
                    <div className="seller-order-list__fulfillment">
                      <SellerOrderFulfillmentActions
                        order={order}
                        compact
                        onOrderUpdated={loadOrders}
                        onError={setError}
                        onMessage={setMessage}
                      />
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <SellerProductConfirmDialog
        open={confirmState !== null}
        title={confirmState?.action === 'accept' ? 'Accept order' : 'Reject order'}
        message={
          confirmState
            ? confirmState.action === 'accept'
              ? `Accept order ${confirmState.order.order_number} from ${confirmState.order.delivery_full_name}?`
              : `Reject order ${confirmState.order.order_number} from ${confirmState.order.delivery_full_name}? This cannot be undone.`
            : ''
        }
        confirmLabel={confirmState?.action === 'accept' ? 'Accept order' : 'Reject order'}
        onCancel={() => {
          if (!responding) setConfirmState(null)
        }}
        onConfirm={() => void handleConfirm()}
      />
    </SellerDashboardShell>
  )
}
