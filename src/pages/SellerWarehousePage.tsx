import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { StatusMessageDialog } from '../components/StatusMessageDialog'
import { WarehouseConfirmLocationDialog } from '../components/WarehouseConfirmLocationDialog'
import { WarehouseLocationMap } from '../components/WarehouseLocationMap'
import { detectLocationWithOpenCage, forwardGeocodeWithOpenCage } from '../lib/opencage'
import { lookupPincode } from '../lib/pincodeLookup'
import { fetchSellerAccountProfile } from '../lib/sellerKyc'
import {
  fetchSellerWarehouse,
  saveSellerWarehouse,
  WAREHOUSE_ADDRESS_LINE_ERROR,
  validateWarehouseAddressLine1,
} from '../lib/sellerWarehouse'
import { fetchSellerWorkflow, type SellerWorkflowState } from '../lib/sellerWorkflow'
import { fetchWarehouseFormOptions, type WarehouseFormOptions } from '../lib/warehouseFormOptions'

function isIndianSeller(isoAlpha2: string) {
  return isoAlpha2.toUpperCase() === 'IN'
}

export function SellerWarehousePage() {
  const [workflow, setWorkflow] = useState<SellerWorkflowState | null>(null)
  const [options, setOptions] = useState<WarehouseFormOptions | null>(null)
  const [addressTagId, setAddressTagId] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [landmark, setLandmark] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [stateName, setStateName] = useState('')
  const [countryName, setCountryName] = useState('')
  const [sellerIsoAlpha2, setSellerIsoAlpha2] = useState('')
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
  const [pincodeHint, setPincodeHint] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [addressLocateLoading, setAddressLocateLoading] = useState(false)
  const [locationFetchError, setLocationFetchError] = useState('')
  const [locationNotice, setLocationNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isWarehouseLocked, setIsWarehouseLocked] = useState(false)
  const [statusDialog, setStatusDialog] = useState<{
    title: string
    message: string
    variant: 'success' | 'error'
  } | null>(null)

  const isIndiaWarehouse = useMemo(
    () => isIndianSeller(sellerIsoAlpha2) || countryName.trim().toLowerCase() === 'india',
    [sellerIsoAlpha2, countryName],
  )

  useEffect(() => {
    let active = true

    Promise.all([
      fetchSellerWorkflow(),
      fetchSellerWarehouse(),
      fetchWarehouseFormOptions(),
      fetchSellerAccountProfile(),
    ])
      .then(([workflowState, warehouse, formOptions, accountProfile]) => {
        if (!active) return
        setWorkflow(workflowState)
        setOptions(formOptions)

        if (accountProfile) {
          setSellerIsoAlpha2(accountProfile.isoAlpha2)
          if (!warehouse) {
            if (accountProfile.countryName) setCountryName(accountProfile.countryName)
            if (accountProfile.phone) setContactPhone(accountProfile.phone)
          }
        }

        if (warehouse) {
          setWarehouseId(warehouse.warehouseId)
          setAddressTagId(warehouse.addressTagId ? String(warehouse.addressTagId) : '')
          setAddressLine1(warehouse.addressLine1)
          setLandmark(warehouse.landmark)
          setPostalCode(warehouse.postalCode)
          setCity(warehouse.city)
          setStateName(warehouse.stateName)
          setCountryName(warehouse.countryName || accountProfile?.countryName || '')
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
          setIsWarehouseLocked(warehouse.isCompleted)
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
    if (!isIndiaWarehouse || isWarehouseLocked) {
      setPincodeHint('')
      return
    }

    const normalized = postalCode.replace(/\D/g, '')
    if (normalized.length !== 6) {
      setPincodeHint('')
      return
    }

    let active = true
    setPincodeLoading(true)
    setPincodeHint('')

    void lookupPincode(normalized).then((result) => {
      if (!active) return

      setPincodeLoading(false)
      if (!result) {
        setPincodeHint('Pincode lookup found no match. Enter city and state manually.')
        return
      }

      setCity(result.city)
      setStateName(result.state)
      setCountryName(result.country)
    })

    return () => {
      active = false
    }
  }, [postalCode, isIndiaWarehouse, isWarehouseLocked])

  const toggleOperationalDay = (dayCode: string) => {
    if (isWarehouseLocked) return
    setOperationalDays((current) =>
      current.includes(dayCode) ? current.filter((code) => code !== dayCode) : [...current, dayCode],
    )
  }

  const handleAddressLine1Change = (value: string) => {
    if (isWarehouseLocked) return
    setAddressLine1(value)
    if (!value.trim()) {
      setAddressLineError('')
      return
    }

    setAddressLineError(validateWarehouseAddressLine1(value) ? '' : WAREHOUSE_ADDRESS_LINE_ERROR)
  }

  const applyDetectedLocation = (location: {
    latitude: number
    longitude: number
    locationLabel: string
    city: string
    state: string
    country: string
  }) => {
    if (isWarehouseLocked) return
    setPendingLocation(location)
    setConfirmOpen(true)
  }

  const showSaveDialog = (title: string, message: string, variant: 'success' | 'error') => {
    setStatusDialog({ title, message, variant })
  }

  const handleFetchCurrentLocation = async () => {
    if (isWarehouseLocked) return

    setLocationFetchError('')
    setLocationNotice('')
    setLocationLoading(true)

    const result = await detectLocationWithOpenCage()
    setLocationLoading(false)

    if (!result.ok) {
      setLocationFetchError(result.message)
      return
    }

    if (result.notice) {
      setLocationNotice(result.notice)
    }

    applyDetectedLocation({
      latitude: result.location.latitude,
      longitude: result.location.longitude,
      locationLabel: result.location.locationLabel,
      city: result.location.city,
      state: result.location.state,
      country: result.location.country,
    })
  }

  const handleLocateFromAddress = async () => {
    if (isWarehouseLocked) return

    setLocationFetchError('')
    setLocationNotice('')

    const query = [addressLine1, city, stateName, countryName].filter((part) => part.trim()).join(', ')
    if (query.trim().length < 3) {
      setLocationFetchError('Enter your street address, city, and country first, then locate from address.')
      return
    }

    setAddressLocateLoading(true)
    const result = await forwardGeocodeWithOpenCage(query)
    setAddressLocateLoading(false)

    if (!result.ok) {
      setLocationFetchError(result.message)
      return
    }

    applyDetectedLocation({
      latitude: result.location.latitude,
      longitude: result.location.longitude,
      locationLabel: result.location.locationLabel,
      city: result.location.city,
      state: result.location.state,
      country: result.location.country,
    })
  }

  const handleConfirmLocation = () => {
    if (!pendingLocation || isWarehouseLocked) return

    setLatitude(pendingLocation.latitude)
    setLongitude(pendingLocation.longitude)
    setLocationLabel(pendingLocation.locationLabel)

    if (!city.trim() && pendingLocation.city) setCity(pendingLocation.city)
    if (!stateName.trim() && pendingLocation.state) setStateName(pendingLocation.state)
    if (pendingLocation.country) setCountryName(pendingLocation.country)

    setLocationFetchError('')

    setConfirmOpen(false)
    setPendingLocation(null)
  }

  const handleSaveWarehouse = async () => {
    if (isWarehouseLocked) return

    if (!validateWarehouseAddressLine1(addressLine1)) {
      setAddressLineError(WAREHOUSE_ADDRESS_LINE_ERROR)
      showSaveDialog('Could not save warehouse', WAREHOUSE_ADDRESS_LINE_ERROR, 'error')
      return
    }

    if (latitude == null || longitude == null || !locationLabel.trim()) {
      showSaveDialog(
        'Could not save warehouse',
        'Fetch and confirm your location on the map before saving.',
        'error',
      )
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
    }, { sellerIsoAlpha2 })

    setSaving(false)

    if (!result.ok) {
      showSaveDialog('Could not save warehouse', result.message, 'error')
      return
    }

    if (result.warehouseId) {
      setWarehouseId(result.warehouseId)
    }

    const nextWorkflow = await fetchSellerWorkflow()
    setWorkflow(nextWorkflow)
    setIsWarehouseLocked(true)
    showSaveDialog(
      'Warehouse saved',
      'Warehouse verified and saved. Product listing is now unlocked.',
      'success',
    )
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
            {warehouseId ? (
              <span className={`seller-badge${isWarehouseLocked ? ' seller-badge--success' : ''}`}>
                {isWarehouseLocked ? `Verified · ID: ${warehouseId}` : `ID: ${warehouseId}`}
              </span>
            ) : null}
          </div>

          {isWarehouseLocked ? (
            <p className="warehouse-locked-notice">
              This warehouse has been verified and saved. Details can no longer be edited.
            </p>
          ) : null}

          <form
            className={`seller-warehouse-form${isWarehouseLocked ? ' seller-warehouse-form--locked' : ''}`}
            onSubmit={(event) => event.preventDefault()}
          >
            <label>
              Tag this address as
              <select
                value={addressTagId}
                disabled={isWarehouseLocked}
                onChange={(event) => setAddressTagId(event.target.value)}
                required
              >
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
                    disabled={isWarehouseLocked}
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
                    disabled={isWarehouseLocked}
                    onChange={(event) => setLandmark(event.target.value)}
                    placeholder="Any nearby post office, market, hospital as the landmark"
                  />
                </label>

                <div className="warehouse-address-grid">
                  <label>
                    {isIndiaWarehouse ? 'Pincode' : 'Postal code'}
                    <input
                      value={postalCode}
                      disabled={isWarehouseLocked}
                      onChange={(event) => {
                        const value = event.target.value
                        setPostalCode(
                          isIndiaWarehouse
                            ? value.replace(/\D/g, '').slice(0, 6)
                            : value.slice(0, 20),
                        )
                      }}
                      placeholder={isIndiaWarehouse ? 'Add pincode' : 'Postal / ZIP code'}
                      inputMode={isIndiaWarehouse ? 'numeric' : 'text'}
                      required
                    />
                    {pincodeLoading ? (
                      <span className="warehouse-field-hint">Looking up city and state...</span>
                    ) : null}
                    {pincodeHint ? <span className="warehouse-field-error">{pincodeHint}</span> : null}
                  </label>
                  <label>
                    City
                    <input value={city} disabled={isWarehouseLocked} onChange={(event) => setCity(event.target.value)} placeholder="City" required />
                  </label>
                  <label>
                    State
                    <input value={stateName} disabled={isWarehouseLocked} onChange={(event) => setStateName(event.target.value)} placeholder="State" required />
                  </label>
                  <label>
                    Country
                    <input value={countryName} disabled={isWarehouseLocked} onChange={(event) => setCountryName(event.target.value)} required />
                  </label>
                </div>
              </div>

              <div className="warehouse-map-panel">
                <WarehouseLocationMap latitude={latitude} longitude={longitude} locationLabel={locationLabel} />
                <div className="warehouse-location-actions">
                  <button
                    type="button"
                    className="seller-secondary-action warehouse-fetch-location"
                    disabled={isWarehouseLocked || locationLoading || addressLocateLoading}
                    onClick={() => void handleFetchCurrentLocation()}
                  >
                    {locationLoading ? 'Fetching location...' : 'Fetch my current location'}
                  </button>
                  <button
                    type="button"
                    className="seller-secondary-action warehouse-fetch-location"
                    disabled={isWarehouseLocked || locationLoading || addressLocateLoading}
                    onClick={() => void handleLocateFromAddress()}
                  >
                    {addressLocateLoading ? 'Locating address...' : 'Locate from address'}
                  </button>
                </div>
                {locationFetchError ? (
                  <p className="warehouse-location-error" role="alert">{locationFetchError}</p>
                ) : null}
                {locationNotice ? <p className="warehouse-location-notice">{locationNotice}</p> : null}
                {locationLabel ? <p className="warehouse-location-label">{locationLabel}</p> : null}
                {!locationLabel ? (
                  <p className="warehouse-field-hint">
                    Use GPS or locate from your address above, then confirm the pin on the map.
                  </p>
                ) : null}
              </div>
            </div>

            <section className="warehouse-form-section">
              <h3>Pickup/RTO incharge at address</h3>
              <div className="warehouse-contact-grid">
                <label>
                  Name
                  <input value={contactName} disabled={isWarehouseLocked} onChange={(event) => setContactName(event.target.value)} required />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={contactEmail}
                    disabled={isWarehouseLocked}
                    onChange={(event) => setContactEmail(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Mobile no.
                  <input
                    value={contactPhone}
                    disabled={isWarehouseLocked}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, '')
                      setContactPhone(
                        isIndianSeller(sellerIsoAlpha2) ? digits.slice(0, 10) : digits.slice(0, 15),
                      )
                    }}
                    inputMode="numeric"
                    required
                  />
                </label>
                <label>
                  Role
                  <select value={contactRoleId} disabled={isWarehouseLocked} onChange={(event) => setContactRoleId(event.target.value)} required>
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
                      disabled={isWarehouseLocked}
                      onChange={() => toggleOperationalDay(day.code)}
                    />
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>
              <div className="warehouse-time-grid">
                <label>
                  Opening timing
                  <select value={openingTime} disabled={isWarehouseLocked} onChange={(event) => setOpeningTime(event.target.value)} required>
                    <option value="">Select opening time</option>
                    {options.timeSlots.map((slot) => (
                      <option key={slot.id} value={slot.time}>{slot.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Closing time
                  <select value={closingTime} disabled={isWarehouseLocked} onChange={(event) => setClosingTime(event.target.value)} required>
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
                  disabled={isWarehouseLocked}
                  onChange={(event) => setIsSupplierAddress(event.target.checked)}
                />
                <span>Add this address as Supplier/Vendor address (optional)</span>
              </label>

              {isSupplierAddress ? (
                <div className="warehouse-supplier-grid">
                  <label>
                    Supplier/Vendor&apos;s name
                    <input value={supplierName} disabled={isWarehouseLocked} onChange={(event) => setSupplierName(event.target.value)} />
                  </label>
                  <label>
                    Supplier/Vendor&apos;s GSTIN
                    <input
                      value={supplierGstin}
                      disabled={isWarehouseLocked}
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
                disabled={isWarehouseLocked}
                onChange={(event) => setShiprocketPickupLocationName(event.target.value)}
                placeholder="Exact pickup name from Shiprocket panel"
              />
            </label>
          </form>

          {!isWarehouseLocked ? (
            <button type="button" className="seller-primary-action" disabled={saving} onClick={() => void handleSaveWarehouse()}>
              {saving ? 'Saving...' : 'Verify & Save'}
            </button>
          ) : null}
        </article>
      </section>

      <StatusMessageDialog
        open={statusDialog !== null}
        title={statusDialog?.title ?? ''}
        message={statusDialog?.message ?? ''}
        variant={statusDialog?.variant}
        onClose={() => setStatusDialog(null)}
      />

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
