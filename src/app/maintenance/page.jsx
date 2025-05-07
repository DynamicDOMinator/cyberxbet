export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          Service Temporarily Unavailable
        </h1>

        <div className="mb-8">
          <svg
            className="mx-auto w-24 h-24 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>

        <p className="text-xl mb-8">
          We're currently performing system maintenance. Please check back soon.
        </p>

        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-lg font-semibold mb-4">What this means:</h2>
          <ul className="text-left text-gray-300 space-y-2">
            <li>• The system is temporarily offline for maintenance</li>
            <li>• All services are unavailable at this time</li>
            <li>• Your data is safe and will not be affected</li>
            <li>• We'll be back online as soon as possible</li>
          </ul>
        </div>

        <p className="text-gray-400">
          If you believe this message is in error or need immediate assistance,
          please contact the system administrator.
        </p>
      </div>
    </div>
  );
}
