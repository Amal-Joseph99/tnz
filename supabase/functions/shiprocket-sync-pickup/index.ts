import {
  assertAdmin,
  corsHeaders,
  createAuthedSupabase,
  getShiprocketToken,
  jsonResponse,
  loadShiprocketSettings,
  shiprocketRequest,
} from '../_shared/shiprocket.ts'

type SyncPickupRequest = {
  userId: string
  provider: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, serviceClient } = await createAuthedSupabase(req)
    await assertAdmin(serviceClient, user.id)

    const body = await req.json() as SyncPickupRequest
    if (!body.userId) return jsonResponse({ error: 'userId is required.' }, 400)
    if (body.provider !== 'shiprocket') return jsonResponse({ error: 'Unsupported shipping provider.' }, 400)

    const { data: warehouse, error: warehouseError } = await serviceClient
      .from('seller_warehouses')
      .select(`
        user_id,
        warehouse_id,
        address_line_1,
        address_line,
        landmark,
        postal_code,
        city,
        state_name,
        country_name,
        contact_name,
        contact_email,
        contact_phone,
        shiprocket_pickup_location_name
      `)
      .eq('user_id', body.userId)
      .maybeSingle()

    if (warehouseError) return jsonResponse({ error: warehouseError.message }, 500)
    if (!warehouse) return jsonResponse({ error: 'Warehouse not found.' }, 404)

    const settings = await loadShiprocketSettings(serviceClient)
    const token = await getShiprocketToken(serviceClient, settings)
    const pickupPath = (settings as { add_pickup_path?: string }).add_pickup_path
      ?? '/v1/external/settings/company/addpickup'

    const pickupLocationName = String(
      warehouse.shiprocket_pickup_location_name
        || warehouse.warehouse_id
        || `AGT-${body.userId.slice(0, 8)}`,
    ).slice(0, 36)

    const addressLine = String(warehouse.address_line_1 || warehouse.address_line || '').trim()
    if (!addressLine || !warehouse.postal_code || !warehouse.city || !warehouse.state_name) {
      return jsonResponse({ error: 'Warehouse address, pincode, city, and state are required for pickup sync.' }, 400)
    }

    const payload = {
      pickup_location: pickupLocationName,
      name: String(warehouse.contact_name || pickupLocationName).slice(0, 80),
      email: String(warehouse.contact_email || 'info@agtrenz.com'),
      phone: String(warehouse.contact_phone || '').replace(/\D/g, '').slice(-10) || '9999999999',
      address: addressLine,
      address_2: warehouse.landmark ? String(warehouse.landmark) : '',
      city: String(warehouse.city),
      state: String(warehouse.state_name),
      country: String(warehouse.country_name || 'India'),
      pin_code: String(warehouse.postal_code),
    }

    await shiprocketRequest(settings, token, pickupPath, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const { error: markError } = await serviceClient.rpc('admin_mark_warehouse_pickup_synced', {
      p_user_id: body.userId,
      p_provider: 'shiprocket',
      p_pickup_location_name: pickupLocationName,
    })

    if (markError) return jsonResponse({ error: markError.message }, 500)

    return jsonResponse({
      ok: true,
      provider: 'shiprocket',
      pickupLocationName,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pickup sync failed.'
    return jsonResponse({ error: message }, 500)
  }
})
