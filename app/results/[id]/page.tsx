"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Home, Loader2 } from "lucide-react"
import { getProcessedImage } from "@/lib/actions"

export default function ResultsPage({ params }: { params: { id: string } }) {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true)
        const result = await getProcessedImage(params.id)
        setOriginalImage(result.originalUrl)
        setProcessedImage(result.processedUrl)
      } catch (err) {
        console.error("Error fetching results:", err)
        setError("Failed to load the processed image. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()

    // Set up cleanup when the component unmounts
    return () => {
      console.log("[Component] Unmounting ResultsPage component, triggering cleanup for ID:", params.id)
      cleanupImages(params.id)
    }
  }, [params.id])

  // Function to clean up images when user leaves the page
  const cleanupImages = async (id: string): Promise<boolean> => {
    try {
      console.log(`[UI] Cleaning up images for ID: ${id}`)

      // Call the cleanup API endpoint
      const response = await fetch(`/api/cleanup/${id}`, {
        method: 'DELETE',
        // Add cache: 'no-store' to prevent caching of the DELETE request
        cache: 'no-store',
        headers: {
          // Add a cache-busting header
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`[UI] Successfully cleaned up images for ID: ${id}`, result)
        return true
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error(`[UI] Failed to clean up images for ID: ${id}`, errorData)
        return false
      }
    } catch (error) {
      console.error("[UI] Error cleaning up images:", error)
      return false
    }
  }

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement("a")
      link.href = processedImage
      link.download = `deblurred-image-${params.id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleGoHome = () => {
    // Clean up images before going home
    if (params.id) {
      cleanupImages(params.id)
    }
    router.push("/")
  }

  return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-5xl">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-center">Deblurring Results</h1>

            {isLoading ? (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Original Image</p>
                      <Skeleton className="w-full h-64 rounded-md" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Deblurred Image</p>
                      <Skeleton className="w-full h-64 rounded-md" />
                    </div>
                  </div>
                  <div className="flex justify-center mt-4">
                    <Button disabled className="w-full max-w-xs">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </Button>
                  </div>
                </div>
            ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Link href="/upload" passHref>
                    <Button>Try Again</Button>
                  </Link>
                </div>
            ) : (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Original Image</p>
                      <div className="relative w-full h-64 border rounded-md overflow-hidden bg-white">
                        {originalImage && (
                            <Image
                                src={originalImage || "/placeholder.svg"}
                                alt="Original image"
                                fill
                                style={{ objectFit: "contain" }}
                            />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Deblurred Image</p>
                      <div className="relative w-full h-64 border rounded-md overflow-hidden bg-white">
                        {processedImage && (
                            <Image
                                src={processedImage || "/placeholder.svg"}
                                alt="Deblurred image"
                                fill
                                style={{ objectFit: "contain" }}
                            />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                    <Button onClick={handleDownload} className="flex-1 max-w-xs mx-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Download Deblurred Image
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 max-w-xs mx-auto"
                        onClick={() => {
                          console.log("[UI] Process Another Image button clicked, cleaning up current images first")
                          cleanupImages(params.id).then(() => {
                            router.push("/upload")
                          })
                        }}
                    >
                      Process Another Image
                    </Button>
                  </div>
                </div>
            )}

            <div className="mt-8 text-center">
              <Button variant="ghost" size="sm" onClick={handleGoHome}>
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
  )
}