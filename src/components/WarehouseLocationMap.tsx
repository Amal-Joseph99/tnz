type WarehouseLocationMapProps = {
  latitude: number | null
  longitude: number | null
  locationLabel?: string
}

function buildMapEmbedUrl(latitude: number, longitude: number) {
  const delta = 0.01
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join('%2C')

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`
}

export function WarehouseLocationMap({ latitude, longitude, locationLabel }: WarehouseLocationMapProps) {
  if (latitude == null || longitude == null) {
    return (
      <div className="warehouse-map warehouse-map--empty">
        <p>Map preview will appear after you fetch and confirm your location.</p>
      </div>
    )
  }

  return (
    <div className="warehouse-map">
      <iframe
        title={locationLabel ? `Map for ${locationLabel}` : 'Warehouse location map'}
        src={buildMapEmbedUrl(latitude, longitude)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
