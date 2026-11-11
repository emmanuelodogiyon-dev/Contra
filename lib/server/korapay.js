export const KORA_API = 'https://api.korapay.com/merchant/api/v1'

export function getKoraSecret() {
  const key = process.env.KORAPAY_SECRET_KEY
  if (!key) throw new Error('KORAPAY_SECRET_KEY is not configured')
  return key
}

export async function initializeKoraCharge(payload) {
  const response = await fetch(`${KORA_API}/charges/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getKoraSecret()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || result.status !== true || !result.data?.checkout_url) {
    throw new Error(result.message || 'Kora could not initialize this payment')
  }
  return result.data
}
