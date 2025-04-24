"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload } from "lucide-react"
import { uploadImage } from "@/lib/actions"

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    try {
      setIsUploading(true)
      const result = await uploadImage(file)
      router.push(`/results/${result.id}`)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert(
          `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}. Please check the console for more details.`,
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-3xl">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-center">Upload Your Image</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="image">Select an image to deblur</Label>
                <Input id="image" type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
              </div>

              {preview && (
                  <div className="flex justify-center">
                    <div className="relative w-full max-w-md h-64 border rounded-md overflow-hidden">
                      <Image
                          src={preview || "/placeholder.svg"}
                          alt="Image preview"
                          fill
                          style={{ objectFit: "contain" }}
                      />
                    </div>
                  </div>
              )}

              <div className="flex justify-center">
                <Button type="submit" disabled={!file || isUploading} className="w-full max-w-xs">
                  {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                  ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload & Process
                      </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
  )
}