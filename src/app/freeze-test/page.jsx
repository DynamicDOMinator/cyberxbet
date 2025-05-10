"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

export default function FreezeTestPage() {
  const [eventId, setEventId] = useState(
    "313a34d6-e72f-4f51-9658-431b6a88a856"
  );
  const [controlKey, setControlKey] = useState("cb209876540331298765");
  const [globalFrozen, setGlobalFrozen] = useState(false);
  const [eventFrozen, setEventFrozen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check current freeze states on load
  useEffect(() => {
    checkFreezeStates();
  }, []);

  const checkFreezeStates = async () => {
    try {
      setLoading(true);

      // Check global state
      const globalResponse = await axios.get("/api/freeze");
      setGlobalFrozen(globalResponse.data.frozen);

      // Check event-specific state if we have an eventId
      if (eventId) {
        const eventResponse = await axios.get(`/api/freeze?eventId=${eventId}`);
        setEventFrozen(eventResponse.data.frozen);
      }

      toast.success("Freeze states refreshed");
    } catch (error) {
      console.error("Error checking freeze states:", error);
      toast.error("Failed to check freeze states");
    } finally {
      setLoading(false);
    }
  };

  const toggleGlobalFreeze = async () => {
    try {
      setLoading(true);

      const response = await axios.post("/api/freeze", {
        frozen: !globalFrozen,
        key: controlKey,
      });

      if (response.data.success) {
        setGlobalFrozen(!globalFrozen);
        toast.success(
          `System ${!globalFrozen ? "frozen" : "unfrozen"} successfully`
        );
      }
    } catch (error) {
      console.error("Error toggling global freeze:", error);
      toast.error("Failed to toggle global freeze");
    } finally {
      setLoading(false);
    }
  };

  const toggleEventFreeze = async () => {
    if (!eventId) {
      toast.error("Please enter an event ID");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post("/api/freeze", {
        frozen: !eventFrozen,
        eventId: eventId,
        key: controlKey,
      });

      if (response.data.success) {
        setEventFrozen(!eventFrozen);
        toast.success(
          `Event ${!eventFrozen ? "frozen" : "unfrozen"} successfully`
        );
      }
    } catch (error) {
      console.error("Error toggling event freeze:", error);
      toast.error("Failed to toggle event freeze");
    } finally {
      setLoading(false);
    }
  };

  // Also try with the "freeze" parameter instead of "frozen"
  const testFreezeParameter = async () => {
    if (!eventId) {
      toast.error("Please enter an event ID");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post("/api/freeze", {
        freeze: !eventFrozen, // Using "freeze" instead of "frozen"
        eventId: eventId,
        key: controlKey,
      });

      if (response.data.success) {
        setEventFrozen(!eventFrozen);
        toast.success(
          `Event ${
            !eventFrozen ? "frozen" : "unfrozen"
          } using "freeze" parameter`
        );
      }
    } catch (error) {
      console.error("Error testing freeze parameter:", error);
      toast.error("Failed to test freeze parameter");
    } finally {
      setLoading(false);
    }
  };

  // Test socket.io freeze command
  const testSocketFreeze = async () => {
    if (!eventId) {
      toast.error("Please enter an event ID");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post("/api/socket", {
        action: "admin_freeze_control",
        freeze: !eventFrozen,
        eventId: eventId,
        key: controlKey,
      });

      if (response.data.success) {
        setEventFrozen(!eventFrozen);
        toast.success(
          `Event ${!eventFrozen ? "frozen" : "unfrozen"} via socket API`
        );
      }
    } catch (error) {
      console.error("Error testing socket freeze:", error);
      toast.error("Failed to test socket freeze");
    } finally {
      setLoading(false);
    }
  };

  // Test the broadcast-freeze API endpoint
  const testBroadcastFreeze = async () => {
    if (!eventId) {
      toast.error("Please enter an event ID");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post("/api/broadcast-freeze", {
        freeze: !eventFrozen,
        eventId: eventId,
        key: controlKey,
      });

      if (response.data.success) {
        setEventFrozen(!eventFrozen);
        toast.success(`Event freeze state broadcast successfully`);
      }
    } catch (error) {
      console.error("Error testing broadcast-freeze API:", error);
      toast.error("Failed to broadcast freeze state");
    } finally {
      setLoading(false);
    }
  };

  // Test refreshing the page
  const refreshClient = async () => {
    toast.success("Refreshing client state...");
    try {
      setLoading(true);
      // First check the freeze states
      await checkFreezeStates();

      // Then force a client-side broadcast to update any open clients
      await axios.post("/api/broadcast-activity", {
        type: "system_freeze",
        frozen: eventFrozen,
        eventId: eventId,
        timestamp: new Date().toISOString(),
        source: "manual_refresh",
      });

      toast.success("Client refresh completed");
    } catch (error) {
      console.error("Error refreshing client:", error);
      toast.error("Failed to refresh client state");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Toaster position="top-center" />

      <h1 className="text-3xl font-bold mb-6">Freeze Control Test Page</h1>

      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Freeze States</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-2">Global System</h3>
            <div
              className={`text-lg font-bold ${
                globalFrozen ? "text-red-500" : "text-green-500"
              }`}
            >
              {globalFrozen ? "FROZEN" : "ACTIVE"}
            </div>
          </div>

          <div className="flex-1 p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-2">Current Event</h3>
            <div
              className={`text-lg font-bold ${
                eventFrozen ? "text-red-500" : "text-green-500"
              }`}
            >
              {eventFrozen ? "FROZEN" : "ACTIVE"}
            </div>
          </div>
        </div>

        <button
          onClick={checkFreezeStates}
          disabled={loading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh States"}
        </button>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event ID</label>
            <input
              type="text"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md text-white"
              placeholder="Enter event ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Control Key
            </label>
            <input
              type="text"
              value={controlKey}
              onChange={(e) => setControlKey(e.target.value)}
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md text-white"
              placeholder="Enter control key"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <button
            onClick={toggleGlobalFreeze}
            disabled={loading}
            className={`py-3 ${
              globalFrozen
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white rounded-md disabled:opacity-50`}
          >
            {globalFrozen ? "Unfreeze System" : "Freeze System"}
          </button>

          <button
            onClick={toggleEventFreeze}
            disabled={loading}
            className={`py-3 ${
              eventFrozen
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white rounded-md disabled:opacity-50`}
          >
            {eventFrozen ? "Unfreeze Event" : "Freeze Event"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <button
            onClick={testFreezeParameter}
            disabled={loading}
            className="py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50"
          >
            Test with "freeze" parameter
          </button>

          <button
            onClick={testSocketFreeze}
            disabled={loading}
            className="py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md disabled:opacity-50"
          >
            Test via Socket API
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={testBroadcastFreeze}
            disabled={loading}
            className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
          >
            Force Broadcast Freeze
          </button>

          <button
            onClick={refreshClient}
            disabled={loading}
            className="py-3 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
          >
            Force Client Refresh
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Use the controls above to toggle freeze states</li>
          <li>Navigate to the Events page in another tab</li>
          <li>Verify that freeze notifications appear in real-time</li>
          <li>Check that registration/team buttons are disabled when frozen</li>
          <li>Try both the regular API and Socket API methods</li>
        </ol>
      </div>
    </div>
  );
}
