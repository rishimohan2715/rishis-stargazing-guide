'use client'
import { useEffect, useState } from 'react'
import { BANGALORE_LOCATION } from '@/lib/astronomyUtils'

function envCoordinate(value: string | undefined, fallback: number, limit: number): number {
const n = value && value.trim() !== '' ? Number(value) : NaN
return Number.isFinite(n) && Math.abs(n) <= limit ? n : fallback
}

// Shown until browser geolocation succeeds, or if it is denied or times out.
// Configurable at build time; defaults to Bangalore if the variables are unset.
export const DEFAULT_LOCATION = {
lat: envCoordinate(process.env.NEXT_PUBLIC_DEFAULT_LAT, BANGALORE_LOCATION.latitude, 90),
lon: envCoordinate(process.env.NEXT_PUBLIC_DEFAULT_LON, BANGALORE_LOCATION.longitude, 180),
}

export type UserLocation = { lat: number; lon: number; located: boolean }

let cached: UserLocation | null = null
let pending: Promise<UserLocation | null> | null = null

function requestLocation(): Promise<UserLocation | null> {
if (cached) return Promise.resolve(cached)
if (pending) return pending
pending = new Promise((resolve) => {
if (typeof navigator === 'undefined' || !navigator.geolocation) {
resolve(null)
return
}
navigator.geolocation.getCurrentPosition(
(pos) => {
cached = { lat: pos.coords.latitude, lon: pos.coords.longitude, located: true }
resolve(cached)
},
(err) => {
console.log('useUserLocation failed', err.code, err.message)
pending = null
resolve(null)
},
{ timeout: 30000, maximumAge: 10 * 60 * 1000 }
)
})
return pending
}

export function useUserLocation(): UserLocation {
const [loc, setLoc] = useState<UserLocation>(cached ?? { ...DEFAULT_LOCATION, located: false })
useEffect(() => {
let alive = true
requestLocation().then((result) => {
if (alive && result) setLoc(result)
})
return () => {
alive = false
}
}, [])
return loc
}
