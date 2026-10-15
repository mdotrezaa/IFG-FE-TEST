type ProductListSkeletonProps = {
  view?: "table" | "grid";
  rows?: number;
};

export default function ProductListSkeleton({
  view = "table",
  rows = 10,
}: ProductListSkeletonProps) {
  return view === "grid" ? (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white"
        >
          <div className="h-44 bg-gray-200" />

          <div className="space-y-3 p-4">
            <div className="h-3 w-1/3 rounded bg-gray-200" />
            <div className="h-5 w-3/4 rounded bg-gray-200" />

            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-20 rounded bg-gray-200" />
              <div className="h-6 w-24 rounded-full bg-gray-200" />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <div className="h-7 w-14 rounded bg-gray-200" />
              <div className="h-7 w-16 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-180 text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            {["Product", "Category", "Price", "Stock", "Actions"].map(
              (heading) => (
                <th key={heading} className="px-4 py-3 font-semibold">
                  {heading}
                </th>
              ),
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="animate-pulse">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-gray-200" />
                    <div className="h-3 w-24 rounded bg-gray-200" />
                  </div>
                </div>
              </td>

              <td className="px-4 py-3">
                <div className="h-4 w-20 rounded bg-gray-200" />
              </td>

              <td className="px-4 py-3">
                <div className="h-4 w-16 rounded bg-gray-200" />
              </td>

              <td className="px-4 py-3">
                <div className="h-6 w-24 rounded-full bg-gray-200" />
              </td>

              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <div className="h-7 w-14 rounded bg-gray-200" />
                  <div className="h-7 w-16 rounded bg-gray-200" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
