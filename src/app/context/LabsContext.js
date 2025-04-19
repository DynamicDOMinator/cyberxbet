"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const LabsContext = createContext();

export function LabsProvider({ children }) {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");

        if (!token) {
          setLabs([]);
          setLoading(false);
          return;
        }

        const response = await axios.get(`${apiUrl}/labs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.status === "success") {
          setLabs(response.data.data);
        } else {
          setError("Failed to fetch labs data");
        }
      } catch (error) {
        console.error("Error fetching labs:", error);
        setError("An error occurred while fetching labs");
      } finally {
        setLoading(false);
      }
    };

    fetchLabs();
  }, []);

  // Method to refresh labs data
  const refreshLabs = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      if (!token) {
        setLabs([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${apiUrl}/labs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === "success") {
        setLabs(response.data.data);
      } else {
        setError("Failed to refresh labs data");
      }
    } catch (error) {
      console.error("Error refreshing labs:", error);
      setError("An error occurred while refreshing labs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LabsContext.Provider value={{ labs, loading, error, refreshLabs }}>
      {children}
    </LabsContext.Provider>
  );
}

export function useLabs() {
  return useContext(LabsContext);
}
