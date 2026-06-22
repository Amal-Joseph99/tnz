import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { WarehouseConfirmLocationDialog } from '../components/WarehouseConfirmLocationDialog'
import { WarehouseLocationMap } from '../components/WarehouseLocationMap'
import { detectLocationWithOpenCage } from '../lib/opencage'
import { lookupPincode } from '../lib/pincodeLookup'
import {
  fetchSellerWarehouse,
  saveSellerWarehouse,
  WAREHOUSE_ADDRESS_LINE_ERROR,
  validateWarehouseAddressLine1,
} from '../lib/sellerWarehouse'
import { fetchSellerWorkflow, type SellerWorkflowState } from '../lib/sellerWorkflow'
import { fetchWarehouseFormOptions, type WarehouseFormOptions } from '../lib/warehouseFormOptions'

export function SellerWarehousePage() {
  const [workflow, setWorkflow] = useState<SellerWorkflowState | null>(null)
  const [options, setOptions] = useState<WarehouseFormOptions | null>(null)
  const [addressTagId, setAddressTagId] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [landmark, setLandmark] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [stateName, setStateName] = useState('')
  const [countryName, setCountryName] = useState('India')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [pendingLocation, setPendingLocation] = useState<{
    latitude: number
    longitude: number
    locationLabel: string
    city: string
    state: string
    country: string
  } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactRoleId, setContactRoleId] = useState('')
  const [operationalDays, setOperationalDays] = useState<string[]>([])
  const [openingTime, setOpeningTime] = useState('')
  const [closingTime, setClosingTime] = useState('')
  const [isSupplierAddress, setIsSupplierAddress] = useState(false)
  const [supplierName, setSupplierName] = useState('')
  const [supplierGstin, setSupplierGstin] = useState('')
  const [shiprocketPickupLocationName, setShiprocketPickupLocationName] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [addressLineError, setAddressLineError] = useState('')
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([fetchSellerWorkflow(), fetchSellerWarehouse(), fetchWarehouseFormOptions()])
      .then(([workflowState, warehouse, formOptions]) => {
        if (!active) return
        setWorkflow(workflowState)
        setOptions(formOptions)

        if (warehouse) {
          setWarehouseId(warehouse.warehouseId)
          setAddressTagId(warehouse.addressTagId ? String(warehouse.addressTagId) : '')
          setAddressLine1(warehouse.addressLine1)
          setLandmark(warehouse.landmark)
          setPostalCode(warehouse.postalCode)
          setCity(warehouse.city)
          setStateName(warehouse.stateName)
          setCountryName(warehouse.countryName || 'India')
          setLatitude(warehouse.latitude)
          setLongitude(warehouse.longitude)
          setLocationLabel(warehouse.locationLabel)
          setContactName(warehouse.contactName)
          setContactEmail(warehouse.contactEmail)
          setContactPhone(warehouse.contactPhone)
          setContactRoleId(warehouse.contactRoleId ? String(warehouse.contactRoleId) : '')
          setOperationalDays(warehouse.operationalDays)
          setOpeningTime(warehouse.openingTime)
          setClosingTime(warehouse.closingTime)
          setIsSupplierAddress(warehouse.isSupplierAddress)
          setSupplierName(warehouse.supplierName)
          setSupplierGstin(warehouse.supplierGstin)
          setShiprocketPickupLocationName(warehouse.shiprocketPickupLocationName)
        } else if (formOptions.addressTags[0]) {
          setAddressTagId(String(formOptions.addressTags[0].id))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const normalized = postalCode.replace(/\D/g, '')
    if (normalized.length !== 6) return

    let active = true
    setPincodeLoading(true)

    void lookupPincode(normalized).then((result) => {
      if (!active || !result) {
        if (active) setPincodeLoading(false)
        return
      }

      setCity(result.city)
      setStateName(result.state)
      setCountryName(result.country)
      setPincodeLoading(false)
    })

    return () => {
      active = false
    }
  }, [postalCode])

  const toggleOperationalDay = (dayCode: string) => {
    setOperationalDays((current) =>
      current.includes(dayCode) ? current.filter((code) => code !== dayCode) : [...current, dayCode],
    )
  }

  const handleAddressLine1Change = (value: string) => {
    setAddressLine1(value)
    if (!value.trim()) {
      setAddressLineError('')
      return
    }

    setAddressLineError(validateWarehouseAddressLine1(value) ? '' : WAREHOUSE_ADDRESS_LINE_ERROR)
  }

  const handleFetchCurrentLocation = async () => {
    setError('')
    setLocationLoading(true)

    const location = await detectLocationWithOpenCage()
    setLocationLoading(false)

    if (!location || location.latitude == null || location.longitude == null) {
      setError('Unable to fetch your current location. Allow location access and try again.')
      return
    }

    setPendingLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      locationLabel: location.locationLabel,
      city: location.city,
      state: location.state,
      country: location.country,
    })
    setConfirmOpen(true)
  }

  const handleConfirmLocation = () => {
    if (!pendingLocation) return

    setLatitude(pendingLocation.latitude)
    setLongitude(pendingLocation.longitude)
    setLocationLabel(pendingLocation.locationLabel)

    if (!city.trim() && pendingLocation.city) setCity(pendingLocation.city)
    if (!stateName.trim() && pendingLocation.state) setStateName(pendingLocation.state)
    if (!countryName.trim() && pendingLocation.country) setCountryName(pendingLocation.country)

    setConfirmOpen(false)
    setPendingLocation(null)
  }

  const handleSaveWarehouse = async () => {
    setError('')
    setMessage('')

    if (!validateWarehouseAddressLine1(addressLine1)) {
      setAddressLineError(WAREHOUSE_ADDRESS_LINE_ERROR)
      setError(WAREHOUSE_ADDRESS_LINE_ERROR)
      return
    }

    if (latitude == null || longitude == null || !locationLabel.trim()) {
      setError('Fetch and confirm your location on the map before saving.')
      return
    }

    setSaving(true)

    const result = await saveSellerWarehouse({
      addressTagId: Number(addressTagId),
      addressLine1,
      landmark,
      postalCode,
      city,
      stateName,
      countryName,
      latitude,
      longitude,
      locationLabel,
      contactName,
      contactEmail,
      contactPhone,
      contactRoleId: Number(contactRoleId),
      operationalDays,
      openingTime,
      closingTime,
      isSupplierAddress,
      supplierName,
      supplierGstin,
      shiprocketPickupLocationName,
    })

    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    if (result.warehouseId) {
      setWarehouseId(result.warehouseId)
    }

    const nextWorkflow = await fetchSellerWorkflow()
    setWorkflow(nextWorkflow)
    setMessage('Warehouse verified and saved. Product listing is now unlocked.')
  }

  if (loading || !workflow || !options) {
    return (
      <SellerDashboardShell>
        <p>Loading warehouse...</p>
      </SellerDashboardShell>
    )
  }

  if (workflow.kycStatus !== 'approved') {
    return (
      <SellerDashboardShell>
        <section className="seller-console-card seller-gate-card">
          <h2>Warehouse setup locked</h2>
          <p>Your KYC must be approved by admin before you can add warehouse address and fulfillment settings.</p>
          <div className="seller-status-list">
            <div><strong>KYC ID</strong><span>{workflow.kycId || 'Not submitted'}</span></div>
            <div><strong>KYC status</strong><span>{workflow.kycStatus.replace('_', ' ')}</span></div>
          </div>
          <Link to="/seller/kyc" className="seller-primary-action seller-profile-kyc-link">
            Open KYC verification
          </Link>
        </section>
      </SellerDashboardShell>
    )
  }

  return (
    <SellerDashboardShell>
      <section className="seller-console-grid seller-warehouse-page">
        <article className="seller-console-card seller-warehouse-card">
          <div className="seller-console-card__header">
            <div>
              <h2>Warehouse creation</h2>
              <p>Complete address, map location, contact, and operational details.</p>
            </div>
            {warehouseId ? <span className="seller-badge">ID: {warehouseId}</span> : null}
          </div>

          <form className="seller-warehouse-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              Tag this address as
              <select value={addressTagId} onChange={(event) => setAddressTagId(event.target.value)} required>
                <option value="">Select tag</option>
                {options.addressTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>{tag.label}</option>
                ))}
              </select>
            </label>

            <div className="warehouse-address-layout">
              <div className="warehouse-address-form">
                <label>
                  Complete address
                  <input
                    value={addressLine1}
                    onChange={(event) => handleAddressLine1Change(event.target.value)}
                    placeholder="House/Floor No., Building Name or Street, Locality"
                    required
                  />
                  {addressLineError ? <span className="warehouse-field-error">{addressLineError}</span> : null}
                </label>

                <label>
                  Landmark
                  <input
                    value={landmark}
                    onChange={(event) => setLandmark(event.target.value)}
                    placeholder="Any nearby post office, market, hospital as the landmark"
                  />
                </label>

                <div className="warehouse-address-grid">
                  <label>
                    Pincode
                    <input
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Add Pincode"
                      inputMode="numeric"
                      required
                    />
                    {pincodeLoading ? <span className="warehouse-field-hint">Looking up city and state...</span> : null}
                  </label>
                  <label>
                    City
                    <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" required />
                  </label>
                  <label>
                    State
                    <input value={stateName} onChange={(event) => setStateName(event.target.value)} placeholder="State" required />
                  </label>
                  <label>
                    Country
                    <input value={countryName} onChange={(event) => setCountryName(event.target.value)} required />
                  </label>
                </div>
              </div>

              <div className="warehouse-map-panel">
                <WarehouseLocationMap latitude={latitude} longitude={longitude} locationLabel={locationLabel} />
                <button
                  type="button"
                  className="seller-secondary-action warehouse-fetch-location"
                  disabled={locationLoading}
                  onClick={() => void handleFetchCurrentLocation()}
                >
                  {locationLoading ? 'Fetching location...' : 'Fetch my current location'}
                </button>
                {locationLabel ? <p className="warehouse-location-label">{locationLabel}</p> : null}
              </div>
            </div>

            <section className="warehouse-form-section">
              <h3>Pickup/RTO incharge at address</h3>
              <div className="warehouse-contact-grid">
                <label>
                  Name
                  <input value={contactName} onChange={(event) => setContactName(event.target.value)} required />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Mobile no.
                  <input
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                    inputMode="numeric"
                    required
                  />
                </label>
                <label>
                  Role
                  <select value={contactRoleId} onChange={(event) => setContactRoleId(event.target.value)} required>
                    <option value="">Select role</option>
                    {options.contactRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="warehouse-form-section">
              <h3>Operational timings</h3>
              <div className="warehouse-weekdays">
                {options.weekdays.map((day) => (
                  <label key={day.id} className="warehouse-weekday">
                    <input
                      type="checkbox"
                      checked={operationalDays.includes(day.code)}
                      onChange={() => toggleOperationalDay(day.code)}
                    />
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>
              <div className="warehouse-time-grid">
                <label>
                  Opening timing
                  <select value={openingTime} onChange={(event) => setOpeningTime(event.target.value)} required>
                    <option value="">Select opening time</option>
                    {options.timeSlots.map((slot) => (
                      <option key={slot.id} value={slot.time}>{slot.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Closing time
                  <select value={closingTime} onChange={(event) => setClosingTime(event.target.value)} required>
                    <option value="">Select closing time</option>
                    {options.timeSlots.map((slot) => (
                      <option key={slot.id} value={slot.time}>{slot.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="warehouse-form-section">
              <label className="warehouse-supplier-check">
                <input
                  type="checkbox"
                  checked={isSupplierAddress}
                  onChange={(event) => setIsSupplierAddress(event.target.checked)}
                />
                <span>Add this address as Supplier/Vendor address (optional)</span>
              </label>

              {isSupplierAddress ? (
                <div className="warehouse-supplier-grid">
                  <label>
                    Supplier/Vendor&apos;s name
                    <input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} />
                  </label>
                  <label>
                    Supplier/Vendor&apos;s GSTIN
                    <input
                      value={supplierGstin}
                      onChange={(event) => setSupplierGstin(event.target.value.toUpperCase())}
                      maxLength={15}
                    />
                  </label>
                </div>
              ) : null}
            </section>

            <label>
              Shiprocket pickup location name (optional)
              <input
                value={shiprocketPickupLocationName}
                onChange={(event) => setShiprocketPickupLocationName(event.target.value)}
                placeholder="Exact pickup name from Shiprocket panel"
              />
            </label>
          </form>

          {error && <div className="auth-message auth-message--error">{error}</div>}
          {message && <div className="auth-message auth-message--success">{message}</div>}

          <button type="button" className="seller-primary-action" disabled={saving} onClick={() => void handleSaveWarehouse()}>
            {saving ? 'Saving...' : 'Verify & Save'}
          </button>
        </article>
      </section>

      <WarehouseConfirmLocationDialog
        open={confirmOpen}
        locationLabel={pendingLocation?.locationLabel ?? ''}
        latitude={pendingLocation?.latitude ?? 0}
        longitude={pendingLocation?.longitude ?? 0}
        onCancel={() => {
          setConfirmOpen(false)
          setPendingLocation(null)
        }}
        onConfirm={handleConfirmLocation}
      />
    </SellerDashboardShell>
  )
}
