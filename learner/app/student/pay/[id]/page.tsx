// app/student/payments/pay/[id]/page.tsx
"use client"
import Image from "next/image"
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Copy, CheckCircle, QrCode, Banknote, Wallet, CreditCard, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PaymentMethodFromDB {
  id: number
  method_code: string
  method_name: string
  description: string
  account_number: string
  account_name: string
  instructions: string
  qr_code_image: string
  is_active: boolean
  has_qr: boolean
}

interface PaymentData {
  id: number | null
  student_id: string
  student_name: string
  amount: number
  status: string
  description: string
  payment_method_id?: number
  reference_number?: string  // <-- add this
}
export default function PaymentMethodPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const paymentId = params.id
  const methodId = searchParams.get('methodId')

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodFromDB | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setImageError(false)
        
        // Fetch payment details first
        const studentId = localStorage.getItem('studentId')
        console.log('🔍 Fetching payment data:', { paymentId, studentId })
        
        if (studentId) {
          const paymentResponse = await fetch(`/api/student/payments?studentId=${studentId}`)
          const paymentResult = await paymentResponse.json()
          
          console.log('📊 All payments for student:', paymentResult.data)
          
          if (paymentResult.success) {
            // If paymentId is provided, try to find that specific payment
            let currentPayment = null
            if (paymentId) {
            currentPayment = paymentResult.data.find((p: PaymentData) => {
  if (p.id === null) return false
  return p.id.toString() === paymentId
})
            }
            
            // If no specific payment found but we have methodId, we can create a payment
            if (!currentPayment && methodId) {
              console.log('ℹ️ No payment found, but we have methodId. We can create a payment on submit.')
              // We'll create a dummy payment data for the UI
              currentPayment = {
                id: null, // This will be created when submitting
                student_id: studentId,
                student_name: paymentResult.studentInfo?.student_name || '',
                amount: 0, // You might want to get this from somewhere
                status: 'pending',
                description: 'Payment awaiting submission'
              }
            }
            
            setPaymentData(currentPayment)

            // Fetch payment method details
            if (methodId) {
              const methodsResponse = await fetch('/api/payment-methods')
              const methodsResult = await methodsResponse.json()
              
              if (methodsResult.success) {
                const method = methodsResult.data.find((m: PaymentMethodFromDB) => m.id.toString() === methodId)
                console.log('🔍 Payment Method Found:', method)
                setPaymentMethod(method)
              }
            }
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [paymentId, methodId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleImageError = () => {
    console.error('❌ QR code image failed to load')
    setImageError(true)
  }

  const handleImageLoad = () => {
    console.log('✅ QR code image loaded successfully')
    setImageError(false)
  }

  const getMethodIcon = (methodCode: string) => {
    switch (methodCode) {
      case 'gcash': return <Wallet className="h-5 w-5 text-purple-600" />
      case 'cash': return <Banknote className="h-5 w-5 text-green-600" />
      case 'bank_transfer':
      case 'bank': return <CreditCard className="h-5 w-5 text-blue-600" />
      default: return <CreditCard className="h-5 w-5 text-gray-600" />
    }
  }

  const handlePaymentComplete = async () => {
    if (!referenceNumber.trim()) {
      alert("Please enter your payment reference number")
      return
    }

    try {
      setSubmitting(true)
      
      const studentId = localStorage.getItem('studentId')
      if (!studentId) {
        alert('Student ID not found')
        return
      }

      // Prepare the data for submission
      const submissionData = {
        paymentId: paymentData?.id || null,
        studentId: studentId,
        referenceNumber: referenceNumber.trim(),
        methodId: paymentMethod?.id,
        amount: paymentData?.amount || 0,
        description: paymentData?.description || 'Payment submitted with reference number',
        status: 'forapproval'
      }

      console.log('📤 Submitting payment with data:', submissionData)

      const response = await fetch('/api/student/payments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      })

      console.log('📥 Submit response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Submit failed:', errorText)
        throw new Error(`Submission failed with status: ${response.status}`)
      }

      const result = await response.json()
      console.log('📥 Submit result:', result)

      if (result.success) {
        alert("Thank you! Your payment has been submitted for review. Please allow 1-2 business days for processing.")
        window.location.href = "/student/payments"
      } else {
        throw new Error(result.error || 'Failed to submit payment')
      }
} catch (error: unknown) {
  console.error('❌ Error completing payment:', error)

  if (error instanceof Error) {
    alert(`Failed to submit payment: ${error.message}`)
  } else {
    alert('Failed to submit payment: Unknown error occurred')
  }
} finally {
  setSubmitting(false)
}
  }

  const renderQRCodeSection = () => {
    if (!paymentMethod?.has_qr) {
      return (
        <div className="text-center space-y-4">
          <div className="bg-gray-100 p-8 rounded-lg border-2 border-dashed border-gray-300">
            <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">QR code not available for this payment method</p>
          </div>
        </div>
      )
    }

    return (
      <div className="text-center space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 inline-block">
          {imageError ? (
            <div className="w-64 h-64 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center text-red-600">
              <AlertCircle className="h-12 w-12 mb-2" />
              <p className="text-sm">Failed to load QR code</p>
              <p className="text-xs mt-1">Please contact support</p>
            </div>
          ) : (
    <div>
  <Label className="text-sm font-medium text-muted-foreground">Payment Method QR</Label>
  <Image
    src={`/api/payment-methods/${paymentMethod.id}/qr`}
    alt={`${paymentMethod.method_name} QR Code`}
    width={250}
    height={250}
    className="mx-auto border rounded-lg"
    onError={handleImageError}
    onLoad={handleImageLoad}
    unoptimized
  />
</div>
            
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Open your {paymentMethod.method_name} app and scan the QR code to pay
        </p>
      </div>
    )
  }

  // Check if payment is already submitted for approval
  const isSubmittedForApproval = paymentData?.status === 'forapproval'

  if (loading) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="container mx-auto py-6">
          <div className="text-center">Loading payment details...</div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!paymentData) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="container mx-auto py-6">
          <div className="text-center">Payment not found. Please check if this payment belongs to you.</div>
          <Button className="mt-4" asChild>
            <a href="/student/payments">Back to Payments</a>
          </Button>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="student">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href="/student/payments">
                <ArrowLeft className="h-4 w-4" />
                Back to Payments
              </a>
            </Button>
          </div>
        </div>

        {/* Title Section */}
        <div className="flex items-center gap-3">
          {paymentMethod && getMethodIcon(paymentMethod.method_code)}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {paymentMethod?.method_name} Payment
            </h1>
            <p className="text-muted-foreground mt-1">
              Complete your payment using {paymentMethod?.method_name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Review your payment information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-lg font-bold text-green-600">
                  ₱{paymentData.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Student ID:</span>
                <span className="font-mono text-sm">{paymentData.student_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Student Name:</span>
                <span className="text-sm">{paymentData.student_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Description:</span>
                <span className="text-sm">{paymentData.description}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline" className={
                  paymentData.status === 'forapproval' 
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : paymentData.status === 'approved'
                    ? "bg-green-100 text-green-800 border-green-200"
                    : paymentData.status === 'rejected'
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                }>
                  {paymentData.status === 'forapproval' ? 'Pending Approval' : paymentData.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Payment ID:</span>
                <span className="font-mono text-sm">#{paymentData.id || 'New'}</span>
              </div>
              {paymentData.reference_number && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Reference Number:</span>
                  <span className="font-mono text-sm">{paymentData.reference_number}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {paymentMethod?.has_qr && <QrCode className="h-5 w-5 text-purple-600" />}
                {paymentMethod?.has_qr ? 'Scan to Pay' : 'Payment Instructions'}
              </CardTitle>
              <CardDescription>
                {paymentMethod?.has_qr 
                  ? `Use ${paymentMethod.method_name} to scan the QR code` 
                  : `Follow the instructions to complete your ${paymentMethod?.method_name} payment`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderQRCodeSection()}
              
              {/* Account Details and Instructions */}
              {paymentMethod && (paymentMethod.account_number || paymentMethod.account_name) && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-sm text-gray-800">Account Details:</h4>
                  {paymentMethod.account_number && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Account Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{paymentMethod.account_number}</span>
                     
                      </div>
                    </div>
                  )}
                  {paymentMethod.account_name && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Account Name:</span>
                      <span className="text-sm font-medium">{paymentMethod.account_name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              {paymentMethod?.instructions && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-blue-800 mb-2">Instructions:</h4>
                  <p className="text-sm text-blue-700 whitespace-pre-line">
                    {paymentMethod.instructions}
                  </p>
                </div>
              )}

              {/* Default instructions if no custom instructions */}
              {!paymentMethod?.instructions && paymentMethod?.has_qr && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-blue-800 mb-2">Instructions:</h4>
                 
                </div>
              )}

              {/* Show different content based on payment status */}
              {isSubmittedForApproval ? (
                // Show status message when already submitted for approval
                <div className="border-t pt-6">
                  <div className="text-center space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">
                        Payment Submitted for Approval
                      </h3>
                      <p className="text-blue-700 mb-3">
                        Your payment has been submitted and is currently pending approval.
                      </p>
                      {paymentData.reference_number && (
                        <div className="bg-white p-3 rounded border">
                          <p className="text-sm font-medium text-gray-600">Reference Number:</p>
                          <p className="text-lg font-mono text-gray-800">{paymentData.reference_number}</p>
                        </div>
                      )}
                      <p className="text-sm text-blue-600 mt-3">
                        Please allow 1-2 business days for processing.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = "/student/payments"}
                      className="w-full"
                    >
                      Back to Payments
                    </Button>
                  </div>
                </div>
              ) : (
                // Show reference number input and submit button for pending payments
                <>
                  {/* Reference Number Input */}
                  <div className="border-t pt-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="referenceNumber" className="text-base font-medium">
                          Payment Reference Number
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Enter the reference number from your payment confirmation
                        </p>
                      </div>
                      
                      <Input
                        id="referenceNumber"
                        placeholder="Enter your payment reference number"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="text-lg"
                      />
                      
                      <p className="text-sm text-muted-foreground">
                        This is usually found in your payment confirmation receipt, SMS, or email
                      </p>
                    </div>
                  </div>

                  {/* Complete Payment Button */}
                  <Button 
                    onClick={handlePaymentComplete} 
                    className="w-full gap-2"
                    size="lg"
                    disabled={submitting || !referenceNumber.trim()}
                  >
                    <CheckCircle className="h-5 w-5" />
                    {submitting ? 'Submitting...' : 'Submit Payment'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}