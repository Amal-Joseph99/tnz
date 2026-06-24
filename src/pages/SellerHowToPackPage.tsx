import { Link } from 'react-router-dom'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { buildHowToPackEmbedUrl } from '../lib/sellerPackingGuide'

export function SellerHowToPackPage() {
  const embedUrl = buildHowToPackEmbedUrl()

  return (
    <SellerDashboardShell>
      <section className="seller-console-card seller-how-to-pack-page">
        <div className="seller-console-card__header">
          <div>
            <Link to="/seller/orders" className="seller-order-detail__back">← Back to orders</Link>
            <h2>How to pack</h2>
            <p>Watch the packing guide before sealing your shipment.</p>
          </div>
        </div>

        {embedUrl ? (
          <div className="seller-how-to-pack-page__video">
            <iframe
              title="How to pack your AGTRENZ order"
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="seller-how-to-pack-page__placeholder">
            <p>Video link will be added soon.</p>
            <p className="seller-how-to-pack-page__hint">
              Update `SELLER_HOW_TO_PACK_YOUTUBE_VIDEO_ID` in `src/lib/sellerPackingGuide.ts`.
            </p>
          </div>
        )}
      </section>
    </SellerDashboardShell>
  )
}
