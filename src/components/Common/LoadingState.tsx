export function LoadingState() {
  return (
    <div className="space-y-4 my-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"
          />
        ))}
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
    </div>
  );
}

