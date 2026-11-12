'use client'
import { useEffect } from 'react'
import { Toaster, toaster } from '../../components/ui/toaster.jsx'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
    toaster.error({
      title: "Nesto je poslo po krivu",
      type: "loading",
      description: error.message || "Unknown error occurred.",
      action: {
        label: "Pokusajte ponovno",
        onClick: () => reset(),
      },
    })
  }, [error, reset])

  return (
    <Toaster />
  )
}