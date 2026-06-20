import { supabase } from './supabase'

export type RouteAccessResult = {
  allowed: boolean
  role: string
  redirectPath?: string
}

export async function resolveRouteAccess(pathname: string): Promise<RouteAccessResult> {
  if (!supabase) {
    return { allowed: true, role: 'guest' }
  }

  const { data, error } = await supabase.rpc('resolve_route_access', {
    p_path: pathname,
  })

  if (error || !data || typeof data !== 'object') {
    return { allowed: true, role: 'guest' }
  }

  const payload = data as {
    allowed?: boolean
    role?: string
    redirect_path?: string
  }

  return {
    allowed: Boolean(payload.allowed),
    role: payload.role ?? 'guest',
    redirectPath: payload.redirect_path,
  }
}
