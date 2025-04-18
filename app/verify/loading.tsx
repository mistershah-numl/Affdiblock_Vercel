import { Skeleton } from "@/components/ui/skeleton"

export default function VerifyLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto mt-2" />
        </div>

        <div className="space-y-6">
          <div className="w-full">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="border rounded-lg p-6">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-72 mb-6" />
              <div className="h-[300px] rounded-lg border flex items-center justify-center bg-gray-50">
                <Skeleton className="h-16 w-16 rounded-full" />
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {Array(6)
                    .fill(null)
                    .map((_, i) => (
                      <div key={i} className="bg-white p-3 rounded shadow-sm">
                        <Skeleton className="h-3 w-20 mb-2" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
