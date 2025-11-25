"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Edit, Save, X, QrCode, Wallet, CreditCard, Banknote, Trash2, Search, Upload, Download, ArrowLeft, UserCog } from "lucide-react"
const API_BASE_URL = 'https://dev.datsgedli.com/api';
interface PaymentMethod {
  id: number;
  method_code: string;
  method_name: string;
  description: string;
  is_active: boolean;
  has_qr: boolean;
  qr_code_data?: any;
  qr_code_filename?: string;
  qr_code_mimetype?: string;
  account_number?: string;
  account_name?: string;
  instructions: string;
  created_at: string;
  updated_at: string;
}


const validatePaymentMethod = (data: Partial<PaymentMethod>): string[] => {
  const errors: string[] = [];
  
  if (!data.method_code?.trim()) {
    errors.push('Method code is required');
  }
  
  if (!data.method_name?.trim()) {
    errors.push('Method name is required');
  }
  
  if (data.method_code && !/^[a-z_]+$/.test(data.method_code)) {
    errors.push('Method code should contain only lowercase letters and underscores');
  }
  
  return errors;
};

export function PaymentMethodsConfig() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [filteredMethods, setFilteredMethods] = useState<PaymentMethod[]>([])
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [useDummyData, setUseDummyData] = useState(false)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = methods.filter(method =>
        method.method_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        method.method_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        method.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredMethods(filtered)
    } else {
      setFilteredMethods(methods)
    }
  }, [searchTerm, methods])

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      setError(null)
      setUseDummyData(false)
      
      const response = await fetch('/api/payment-methods')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch payment methods')
      }
      
      setMethods(result.data || [])
      
    } catch (error) {
      console.log('API not available, using dummy data:', error)
      setError('Failed to load payment methods from API. Using demo data.')
      setUseDummyData(true)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setIsEditModalOpen(true)
  }

  const handleCreate = () => {
    setEditingMethod(null)
    setIsCreateModalOpen(true)
  }

  const handleDeleteClick = (method: PaymentMethod) => {
    setMethodToDelete(method)
    setIsDeleteModalOpen(true)
  }

 const saveMethod = async (methodData: Partial<PaymentMethod>) => {
  try {
    setSaving(true)
    
    const validationErrors = validatePaymentMethod(methodData)
    if (validationErrors.length > 0) {
      alert(`Validation errors:\n${validationErrors.join('\n')}`)
      return
    }

    if (useDummyData) {
      const isCreating = !editingMethod
      
      if (isCreating) {
        const newMethod: PaymentMethod = {
          id: methods.length > 0 ? Math.max(...methods.map(m => m.id)) + 1 : 1,
          method_code: methodData.method_code || "",
          method_name: methodData.method_name || "",
          description: methodData.description || "",
          is_active: methodData.is_active ?? true,
          has_qr: methodData.has_qr || false,
          account_number: methodData.account_number || "",
          account_name: methodData.account_name || "",
          instructions: methodData.instructions || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setMethods(prev => [...prev, newMethod])
      } else if (editingMethod) {
        setMethods(prev => prev.map(m => 
          m.id === editingMethod.id 
            ? { 
                ...m, 
                // Only update the fields that are in the form
                method_code: methodData.method_code || m.method_code,
                method_name: methodData.method_name || m.method_name,
                description: methodData.description || m.description,
                has_qr: methodData.has_qr ?? m.has_qr,
                account_number: methodData.account_number || m.account_number,
                account_name: methodData.account_name || m.account_name,
                instructions: methodData.instructions || m.instructions,
                is_active: methodData.is_active ?? m.is_active,
                updated_at: new Date().toISOString() 
              }
            : m
        ))
      }
    } else {
      const isCreating = !editingMethod
      const url = isCreating 
        ? '/api/payment-methods'
        : `/api/payment-methods?id=${editingMethod?.id}`
      
      if (isCreating) {
        // For new methods, send all form data
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method_code: methodData.method_code,
            method_name: methodData.method_name,
            description: methodData.description,
            has_qr: methodData.has_qr,
            account_number: methodData.account_number,
            account_name: methodData.account_name,
            instructions: methodData.instructions,
            is_active: methodData.is_active ?? true
          })
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create payment method')
        }
      } else {
        // For updates, only send the fields that should be updated
        // Don't send QR-related fields as they should be handled separately
        const updateData = {
          method_code: methodData.method_code,
          method_name: methodData.method_name,
          description: methodData.description,
          has_qr: methodData.has_qr,
          account_number: methodData.account_number,
          account_name: methodData.account_name,
          instructions: methodData.instructions,
          is_active: methodData.is_active
        }
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update payment method')
        }
      }
      
      await fetchPaymentMethods()
    }
    
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setEditingMethod(null)
    
    alert(`Payment method ${!editingMethod ? 'created' : 'updated'} successfully!`)
    
  } catch (error) {
    console.error('Error saving payment method:', error)
    alert(`Failed to save payment method: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    setSaving(false)
  }
}
  const deleteMethod = async () => {
    if (!methodToDelete) return
    
    try {
      setSaving(true)
      
      if (useDummyData) {
        setMethods(prev => prev.filter(m => m.id !== methodToDelete.id))
      } else {
        const response = await fetch(`/api/payment-methods?id=${methodToDelete.id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete payment method')
        }
        
        await fetchPaymentMethods()
      }
      
      setIsDeleteModalOpen(false)
      setMethodToDelete(null)
      alert('Payment method deleted successfully!')
      
    } catch (error) {
      console.error('Error deleting payment method:', error)
      alert(`Failed to delete payment method: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

 const handleFileUpload = async (methodId: number, file: File) => {
  try {
    setUploading(true)
    console.log('📤 Starting upload:', { methodId, fileName: file.name, fileSize: file.size, fileType: file.type })
    
    const formData = new FormData()
    formData.append('qrCode', file)
    formData.append('methodId', methodId.toString())

    console.log('🔄 Sending request to /api/upload...')
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    console.log('📥 Response received:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Upload failed:', errorText)
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('📊 Upload result:', result)
    
    if (result.success) {
      alert('QR code uploaded successfully!')
      await fetchPaymentMethods() // Refresh the data
    } else {
      throw new Error(result.error || 'Upload failed')
    }
  } catch (error) {
    console.error('❌ Upload error:', error)
    alert(`Failed to upload QR code: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    setUploading(false)
  }
}

const deleteQrCode = async (methodId: number) => {
  try {
    if (useDummyData) {
      setMethods(prev => prev.map(method =>
        method.id === methodId
          ? { ...method, has_qr: false, qr_code_filename: undefined }
          : method
      ))
      alert('QR code removed successfully!')
    } else {
      // First, get the current method data to preserve other fields
      const currentMethod = methods.find(m => m.id === methodId);
      if (!currentMethod) {
        throw new Error('Payment method not found');
      }

      // Update the payment method - only modify QR-related fields
      const response = await fetch(`/api/payment-methods?id=${methodId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Preserve all existing fields
          method_code: currentMethod.method_code,
          method_name: currentMethod.method_name,
          description: currentMethod.description,
          is_active: currentMethod.is_active,
          has_qr: false, // Only change this
          account_number: currentMethod.account_number,
          account_name: currentMethod.account_name,
          instructions: currentMethod.instructions,
          // Clear QR data
          qr_code_data: null,
          qr_code_filename: null,
          qr_code_mimetype: null
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove QR code')
      }

      alert('QR code removed successfully!')
      await fetchPaymentMethods()
    }
  } catch (error) {
    console.error('Delete QR error:', error)
    alert(`Failed to remove QR code: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
function QrCodeDisplay({ methodId, methodName }: { methodId: number, methodName: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQrCode();
  }, [methodId]);

  const loadQrCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Loading QR code for method ${methodId}...`);
      
      const response = await fetch(`/api/payment-methods/${methodId}/qr`);
      const result = await response.json();
      
      console.log(`📊 QR data response for method ${methodId}:`, result);
      
      if (result.success && result.data.dataUrl) {
        setQrDataUrl(result.data.dataUrl);
        console.log(`✅ QR code loaded successfully for method ${methodId}`);
      } else {
        throw new Error(result.error || 'No QR data found');
      }
    } catch (error) {
      console.error(`❌ Failed to load QR code for method ${methodId}:`, error);
      setError(error instanceof Error ? error.message : 'Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-32 h-32 flex items-center justify-center border rounded bg-muted/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-1"></div>
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-32 h-32 flex flex-col items-center justify-center border rounded bg-destructive/10">
        <QrCode className="h-6 w-6 text-destructive mb-1" />
        <p className="text-xs text-destructive text-center">Failed to load</p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadQrCode}
          className="mt-1 h-6 text-xs"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (qrDataUrl) {
    return (
      <img 
        src={qrDataUrl}
        alt={`${methodName} QR Code`}
        className="w-32 h-32 object-contain border rounded"
        onError={() => {
          console.error(`❌ Image failed to render for method ${methodId}`);
          setError('Image rendering failed');
        }}
      />
    );
  }

  return (
    <div className="w-32 h-32 flex items-center justify-center border rounded bg-muted/20">
      <div className="text-center">
        <QrCode className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
        <p className="text-xs text-muted-foreground">No QR code</p>
      </div>
    </div>
  );
}
const toggleMethodStatus = async (methodId: number, isActive: boolean) => {
  try {
    const method = methods.find(m => m.id === methodId)
    if (!method) return

    if (useDummyData) {
      setMethods(prev => prev.map(m =>
        m.id === methodId
          ? { ...m, is_active: !isActive, updated_at: new Date().toISOString() }
          : m
      ))
    } else {
      // Only send the is_active field for status toggle
      const response = await fetch(`/api/payment-methods?id=${methodId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          is_active: !isActive 
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update payment method status')
      }
      
      await fetchPaymentMethods()
    }
    
    alert(`Payment method ${!isActive ? 'activated' : 'deactivated'} successfully!`)
  } catch (error) {
    console.error('Error updating method status:', error)
    alert(`Failed to update payment method status: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

  const getMethodIcon = (methodCode: string) => {
    switch (methodCode) {
      case 'gcash': return <Wallet className="h-5 w-5" />
      case 'paymaya': return <QrCode className="h-5 w-5" />
      case 'cash': return <Banknote className="h-5 w-5" />
      case 'bank_transfer': return <CreditCard className="h-5 w-5" />
      default: return <CreditCard className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading payment methods...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a href="/admin">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </a>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-muted-foreground">
            Configure and manage payment methods
          </p>
        </div>
          <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Adviser Mode</span>
        </div>
       
      </div>
 <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Method
        </Button>
    
   

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search payment methods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMethods.map((method) => (
          <Card key={method.id} className={!method.is_active ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {getMethodIcon(method.method_code)}
                  {method.method_name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={method.is_active ? "default" : "secondary"}>
                    {method.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {method.has_qr && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <QrCode className="h-3 w-3" />
                      QR
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>{method.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {method.account_number && (
                <div>
                  <Label className="text-sm">Account Number</Label>
                  <p className="text-sm font-mono">{method.account_number}</p>
                </div>
              )}

              {method.account_name && (
                <div>
                  <Label className="text-sm">Account Name</Label>
                  <p className="text-sm">{method.account_name}</p>
                </div>
              )}

              {/* QR Code Section - Always show if has_qr is true */}
         {method.has_qr && (
  <div className="space-y-3">
    <Label className="text-sm">QR Code</Label>
    
    {method.qr_code_filename ? (
      <div className="space-y-2">
        <div className="bg-white p-3 rounded border flex flex-col items-center">
      <Image
  src={`/api/payment-methods/${method.id}/qr`}
  alt={`${method.method_name || "Payment"} QR Code`} // ✅ add this
  width={250}
  height={250}
  className="mx-auto border rounded-lg"
  unoptimized
/>
          <p className="text-xs text-muted-foreground mt-2 truncate max-w-full">
            {method.qr_code_filename}
          </p>
        </div>
        <div className="flex gap-2">
      
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => deleteQrCode(method.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    ) : (
      <QrCodeUpload 
        methodId={method.id}
        onUpload={handleFileUpload}
        uploading={uploading}
      />
    )}
  </div>
)}

              {/* Add QR Code Button for methods without QR */}
              {!method.has_qr && (
                <div className="space-y-2">
                  <Label className="text-sm">QR Code</Label>
                  <QrCodeUpload 
                    methodId={method.id}
                    onUpload={handleFileUpload}
                    uploading={uploading}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-1"
                  onClick={() => handleEdit(method)}
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteClick(method)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMethods.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No payment methods found matching "{searchTerm}"</p>
        </div>
      )}

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Payment Method</DialogTitle>
            <DialogDescription>
              Create a new payment method for students to use
            </DialogDescription>
          </DialogHeader>
          <PaymentMethodForm
            method={null}
            onSave={saveMethod}
            onCancel={() => setIsCreateModalOpen(false)}
            isCreating={true}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
            <DialogDescription>
              Update the payment method details
            </DialogDescription>
          </DialogHeader>
          <PaymentMethodForm
            method={editingMethod}
            onSave={saveMethod}
            onCancel={() => setIsEditModalOpen(false)}
            isCreating={false}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{methodToDelete?.method_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteMethod}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function QrCodeUpload({ 
  methodId, 
  onUpload, 
  uploading 
}: { 
  methodId: number
  onUpload: (methodId: number, file: File) => void
  uploading: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(methodId, selectedFile)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-2">
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="cursor-pointer"
        disabled={uploading}
      />
      
      {selectedFile && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground truncate flex-1">
            {selectedFile.name}
          </span>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={uploading}
            className="gap-1"
          >
            <Upload className="h-3 w-3" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Supports PNG, JPG, JPEG (Max 5MB)
      </p>
    </div>
  )
}

function PaymentMethodForm({ 
  method, 
  onSave, 
  onCancel, 
  isCreating,
  saving
}: { 
  method?: PaymentMethod | null
  onSave: (method: Partial<PaymentMethod>) => void
  onCancel: () => void
  isCreating: boolean
  saving: boolean
}) {
  const [formData, setFormData] = useState({
    method_code: method?.method_code || "",
    method_name: method?.method_name || "",
    description: method?.description || "",
    has_qr: method?.has_qr || false,
    account_number: method?.account_number || "",
    account_name: method?.account_name || "",
    instructions: method?.instructions || "",
    is_active: method?.is_active ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="method_code">Method Code *</Label>
          <Input
            id="method_code"
            value={formData.method_code}
            onChange={(e) => setFormData({ ...formData, method_code: e.target.value.toLowerCase() })}
            placeholder="e.g., gcash, cash"
            required
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground mt-1">Unique identifier (lowercase letters and underscores only)</p>
        </div>

        <div>
          <Label htmlFor="method_name">Method Name *</Label>
          <Input
            id="method_name"
            value={formData.method_name}
            onChange={(e) => setFormData({ ...formData, method_name: e.target.value })}
            placeholder="e.g., GCash, Cash"
            required
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground mt-1">Display name</p>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the payment method"
            disabled={saving}
          />
        </div>

        <div>
          <Label htmlFor="account_number">Account Number</Label>
          <Input
            id="account_number"
            value={formData.account_number}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            placeholder="e.g., 0917 123 4567"
            disabled={saving}
          />
        </div>

        <div>
          <Label htmlFor="account_name">Account Name</Label>
          <Input
            id="account_name"
            value={formData.account_name}
            onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
            placeholder="e.g., School Name"
            disabled={saving}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="instructions">Instructions</Label>
          <Textarea
            id="instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            placeholder="Step-by-step payment instructions..."
            rows={4}
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use new lines for each step
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
    

        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            disabled={saving}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : (isCreating ? "Create Method" : "Save Changes")}
        </Button>
      </DialogFooter>
    </form>
  )
}