"use client"

import { Image } from "lucide-react"
import { useState } from "react"

interface QRCodeImageProps {
  src: string
  alt: string
  referenceNumber: string
}

export function QRCodeImage({ src, alt, referenceNumber }: QRCodeImageProps) {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center">
        <Image className="h-12 w-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">QR Code Image</p>
        <p className="text-xs text-gray-400">Not available</p>
      </div>
    )
  }

  return (
    <div className="w-64 h-64 bg-white border rounded-lg p-4 flex items-center justify-center">
      <img 
        src={src} 
        alt={alt}
        className="w-full h-full object-contain"
        onError={() => setImageError(true)}
      />
    </div>
  )
}