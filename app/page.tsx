import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-3xl">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Image Deblurring Tool</h1>
            <p className="text-gray-500 max-w-md">
              Upload your blurry images and our AI will enhance them to create sharper, clearer versions.
            </p>

            <div className="w-full max-w-sm">
              <Link href="/upload" passHref>
                <Button className="w-full" size="lg">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
