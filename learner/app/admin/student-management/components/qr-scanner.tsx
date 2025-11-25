"use client"

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, User, Loader2 } from "lucide-react"

// Define the scan data interface
interface ScanData {
  student_id: string
  student_name: string
  grade: string
  section: string
}

interface QRScannerProps {
  onScan: (data: ScanData) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRScanner({ onScan, open, onOpenChange }: QRScannerProps) {
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    
    try {
      console.log('📷 Processing uploaded QR code...')
      
      const formData = new FormData()
      formData.append('qrCode', file)

      const response = await fetch('/api/auth/qr-login', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      console.log('📦 QR login response:', data)

      if (data.success) {
        console.log('✅ QR scan successful:', data.data)
        onScan(data.data)
        onOpenChange(false)
      } else {
        alert(`QR scan failed: ${data.error}`)
        console.error('❌ QR scan failed:', data)
      }
    } catch (error) {
      console.error('❌ QR upload error:', error)
      alert('Failed to process QR code')
    } finally {
      setLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleManualInput = () => {
    const studentId = prompt('Enter Student ID manually:')
    if (studentId) {
      onScan({ 
        student_id: studentId, 
        student_name: 'Manual Entry', 
        grade: '', 
        section: '' 
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Student QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 p-4">
          {/* File Upload Area */}
          <div className="w-64 h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-blue-400 transition-colors">
            {loading ? (
              <>
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                <p className="text-sm text-gray-600">Decoding QR code...</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400" />
                <p className="text-sm text-center text-gray-600">
                  Click to upload QR code image
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, JPEG supported
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={loading}
          />
          
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={handleManualInput}
              disabled={loading}
              className="flex-1"
            >
              <User className="h-4 w-4 mr-2" />
              Manual Input
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload QR
            </Button>
          </div>

          {loading && (
            <p className="text-sm text-blue-600 text-center">
              Processing QR code... This may take a few seconds.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}