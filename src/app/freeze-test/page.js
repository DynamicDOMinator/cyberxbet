"use client";

import { useState, useEffect } from "react";

export default function FreezeTest() {
  const [eventId, setEventId] = useState(
    "313a34d6-e72f-4f51-9658-431b6a88a856"
  );
  const [freezeState, setFreezeState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs((prev) => [`[${new Date().toISOString()}] ${message}`, ...prev]);
  };

  const checkFreezeState = async () => {
    setLoading(true);
    try {
      addLog(`Checking freeze state for event: ${eventId}`);
      const response = await fetch(`/api/freeze?eventId=${eventId}`);
      const data = await response.json();
      setFreezeState(data);
      addLog(`Received freeze state: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`Error checking freeze state: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleFreezeState = async () => {
    setLoading(true);
    try {
      const newState = freezeState?.frozen === true ? false : true;
      addLog(`Setting freeze state to ${newState} for event: ${eventId}`);

      const response = await fetch("/api/freeze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer cb209876540331298765",
        },
        body: JSON.stringify({
          freeze: newState,
          eventId: eventId,
          key: "cb209876540331298765",
        }),
      });

      const data = await response.json();
      addLog(`Received response: ${JSON.stringify(data)}`);

      // Check the state again to verify
      await checkFreezeState();
    } catch (error) {
      addLog(`Error toggling freeze state: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkFreezeState();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Freeze API Test</h1>

      <div className="mb-4">
        <label className="block mb-2">Event ID:</label>
        <input
          type="text"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="border p-2 w-full"
        />
      </div>

      <div className="mb-4">
        <button
          onClick={checkFreezeState}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 mr-2 rounded"
        >
          Check Freeze State
        </button>

        <button
          onClick={toggleFreezeState}
          disabled={loading}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Toggle Freeze State
        </button>
      </div>

      {freezeState && (
        <div className="mb-4 p-4 border rounded">
          <h2 className="font-bold">Current State:</h2>
          <pre className="bg-gray-100 p-2 mt-2 overflow-auto">
            {JSON.stringify(freezeState, null, 2)}
          </pre>
        </div>
      )}

      <div>
        <h2 className="font-bold mb-2">Logs:</h2>
        <div className="bg-black text-green-400 p-4 rounded h-64 overflow-auto">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
