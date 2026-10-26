import React, { useRef, useState } from 'react'
import { UploadCloud, FileText, X, Loader2 } from 'lucide-react'
import { uploadFile, formatBytes, UploadedFile } from '@/lib/upload'

interface Props {
  accept?: string
  hint?: string
  value: { url: string; name?: string; size?: number } | null
  onChange: (file: UploadedFile | null) => void
  // Optional check before uploading, e.g. image dimensions; return an error message to reject the file
  validate?: (file: File) => Promise<string | void>
  showImage?: boolean
}

export default function FileUpload({ accept, hint, value, onChange, validate, showImage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    const problem = validate ? await validate(file) : undefined
    if (problem) {
      setError(problem)
      return
    }
    setUploading(true)
    try {
      onChange(await uploadFile(file))
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (value?.url) {
    return (
      <div className="space-y-2">
        {showImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.url} alt="" className="w-full rounded-lg border border-white/10 object-cover" />
        )}
        <div className="flex items-center gap-3 p-3 bg-[#16123D]/60 border border-white/20 rounded-lg">
          <FileText className="w-5 h-5 text-[#00CBB3] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{value.name || 'Uploaded file'}</p>
            {value.size ? <p className="text-xs text-gray-400">{formatBytes(value.size)}</p> : null}
          </div>
          <button type="button" onClick={() => inputRef.current?.click()} className="text-sm text-[#00CBB3] hover:text-[#1EDCC8] font-semibold">
            Replace
          </button>
          <button type="button" onClick={() => onChange(null)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg" aria-label="Remove file">
            <X className="w-4 h-4" />
          </button>
        </div>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        disabled={uploading}
        className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-lg transition-colors ${
          dragging ? 'border-[#00CBB3] bg-[#00CBB3]/10' : 'border-white/20 hover:border-white/40 bg-[#16123D]/40'
        }`}
      >
        {uploading ? <Loader2 className="w-7 h-7 text-[#00CBB3] animate-spin" /> : <UploadCloud className="w-7 h-7 text-[#00CBB3]" />}
        <span className="text-sm font-semibold text-white">{uploading ? 'Uploading...' : 'Click to upload or drag a file here'}</span>
        {hint && <span className="text-xs text-gray-400 text-center">{hint}</span>}
      </button>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}
