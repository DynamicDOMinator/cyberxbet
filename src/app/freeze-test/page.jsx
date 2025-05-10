"use client";

import { useState, useEffect } from "react";
import { createSocket, getSystemFreezeState } from "@/lib/socket-client";

export default function FreezeTestPage() {
  const [eventId, setEventId] = useState(
    "313a34d6-e72f-4f51-9658-431b6a88a856"
  );
  const [apiKey, setApiKey] = useState("cb209876540331298765");
  const [freezeState, setFreezeState] = useState(false);
  const [eventFreezeState, setEventFreezeState] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = createSocket();
    setSocket(newSocket);

    if (newSocket) {
      newSocket.on("connect", () => {
        setSocketConnected(true);
        console.log("Socket connected");
      });

      newSocket.on("disconnect", () => {
        setSocketConnected(false);
        console.log("Socket disconnected");
      });

      // Listen for freeze state updates
      newSocket.on("system_freeze", (data) => {
        console.log("Received system_freeze event:", data);
        if (data.eventId && data.eventId === eventId) {
          setEventFreezeState(data.frozen);
          setMessage(
            `Event freeze state updated: ${data.frozen ? "FROZEN" : "UNFROZEN"}`
          );
        } else if (!data.eventId) {
          setFreezeState(data.frozen);
          setMessage(
            `Global freeze state updated: ${
              data.frozen ? "FROZEN" : "UNFROZEN"
            }`
          );
        }
      });
    }

    return () => {
      if (newSocket) {
        newSocket.off("system_freeze");
      }
    };
  }, [eventId]);

  // Listen for custom events from the window
  useEffect(() => {
    const handleFreezeUpdate = (event) => {
      console.log("Received system_freeze_update custom event:", event.detail);
      const { frozen, eventId: updatedEventId, isGlobal } = event.detail;

      if (isGlobal) {
        setFreezeState(frozen);
        setMessage(
          `Global freeze state updated via custom event: ${
            frozen ? "FROZEN" : "UNFROZEN"
          }`
        );
      } else if (updatedEventId === eventId) {
        setEventFreezeState(frozen);
        setMessage(
          `Event freeze state updated via custom event: ${
            frozen ? "FROZEN" : "UNFROZEN"
          }`
        );
      }
    };

    window.addEventListener("system_freeze_update", handleFreezeUpdate);

    return () => {
      window.removeEventListener("system_freeze_update", handleFreezeUpdate);
    };
  }, [eventId]);

  // Check current freeze states on load and when eventId changes
  useEffect(() => {
    const checkFreezeStates = async () => {
      try {
        // Check global freeze state
        const response = await fetch("/api/freeze");
        const globalData = await response.json();
        setFreezeState(globalData.frozen);

        // Check event-specific freeze state
        if (eventId) {
          const eventResponse = await fetch(`/api/freeze?eventId=${eventId}`);
          const eventData = await eventResponse.json();
          setEventFreezeState(eventData.frozen);
        }
      } catch (error) {
        console.error("Error checking freeze states:", error);
      }
    };

    checkFreezeStates();
  }, [eventId]);

  const toggleFreeze = async (isGlobal = false) => {
    setLoading(true);
    try {
      const targetState = isGlobal ? !freezeState : !eventFreezeState;
      const targetId = isGlobal ? null : eventId;

      const url = `/api/admin-freeze?state=${targetState}&key=${apiKey}${
        targetId ? `&eventId=${targetId}` : ""
      }`;
      console.log("Calling API:", url);

      const response = await fetch(url);
      const data = await response.json();

      setLastResponse(data);
      setMessage(`API call successful: ${data.message}`);

      // Update local state
      if (isGlobal) {
        setFreezeState(targetState);
      } else {
        setEventFreezeState(targetState);
      }

      // Force refresh current states
      const refreshResponse = await fetch(`/api/freeze?eventId=${eventId}`);
      const refreshData = await refreshResponse.json();
      setEventFreezeState(refreshData.frozen);
    } catch (error) {
      console.error("Error toggling freeze state:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendDirectPost = async (isGlobal = false) => {
    setLoading(true);
    try {
      const targetState = isGlobal ? !freezeState : !eventFreezeState;
      const targetId = isGlobal ? null : eventId;

      console.log("Sending direct POST request");

      const response = await fetch("/api/direct-freeze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          freeze: targetState,
          eventId: targetId,
          key: apiKey,
        }),
      });

      const data = await response.json();

      setLastResponse(data);
      setMessage(
        `Direct POST successful: ${targetState ? "FROZEN" : "UNFROZEN"}`
      );

      // Update local state based on verified state from response
      if (isGlobal) {
        setFreezeState(data.current_state);
      } else {
        setEventFreezeState(data.current_state);
      }

      // Force refresh current states
      const refreshResponse = await fetch(`/api/freeze?eventId=${eventId}`);
      const refreshData = await refreshResponse.json();
      setEventFreezeState(refreshData.frozen);
    } catch (error) {
      console.error("Error in direct POST:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Freeze State Test Page</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Socket Status</h2>
        <div className="flex items-center">
          <div
            className={`w-4 h-4 rounded-full mr-2 ${
              socketConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span>{socketConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Current States</h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <span className="mr-2">Global Freeze State:</span>
            <span
              className={`font-bold ${
                freezeState ? "text-red-500" : "text-green-500"
              }`}
            >
              {freezeState ? "FROZEN" : "UNFROZEN"}
            </span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">Event Freeze State:</span>
            <span
              className={`font-bold ${
                eventFreezeState ? "text-red-500" : "text-green-500"
              }`}
            >
              {eventFreezeState ? "FROZEN" : "UNFROZEN"}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Configuration</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-1">Event ID:</label>
            <input
              type="text"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
          </div>
          <div>
            <label className="block mb-1">API Key:</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Actions</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={() => toggleFreeze(false)}
            disabled={loading}
            className={`px-4 py-2 rounded ${
              eventFreezeState
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white`}
          >
            {loading
              ? "Processing..."
              : eventFreezeState
              ? "Unfreeze Event"
              : "Freeze Event"}
          </button>

          <button
            onClick={() => toggleFreeze(true)}
            disabled={loading}
            className={`px-4 py-2 rounded ${
              freezeState
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white`}
          >
            {loading
              ? "Processing..."
              : freezeState
              ? "Unfreeze Global"
              : "Freeze Global"}
          </button>
        </div>

        <h3 className="text-lg font-semibold mb-2">Direct POST</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => sendDirectPost(false)}
            disabled={loading}
            className={`px-4 py-2 rounded ${
              eventFreezeState
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white border border-yellow-400`}
          >
            {loading
              ? "Processing..."
              : eventFreezeState
              ? "POST Unfreeze Event"
              : "POST Freeze Event"}
          </button>

          <button
            onClick={() => sendDirectPost(true)}
            disabled={loading}
            className={`px-4 py-2 rounded ${
              freezeState
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white border border-yellow-400`}
          >
            {loading
              ? "Processing..."
              : freezeState
              ? "POST Unfreeze Global"
              : "POST Freeze Global"}
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-gray-800 rounded">
          <h2 className="text-xl font-semibold mb-2">Status</h2>
          <p>{message}</p>
        </div>
      )}

      {lastResponse && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Last API Response</h2>
          <pre className="p-4 bg-gray-800 rounded overflow-auto max-h-60">
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Manual API Calls</h2>
        <div className="flex flex-col gap-2 text-sm">
          <p>GET: /api/freeze?eventId={eventId}</p>
          <p>
            POST to /api/freeze with body: {"{"} "freeze": true, "eventId": "
            {eventId}", "key": "{apiKey}" {"}"}
          </p>
          <p>
            GET: /api/admin-freeze?state=true&eventId={eventId}&key={apiKey}
          </p>
        </div>
      </div>
    </div>
  );
}
