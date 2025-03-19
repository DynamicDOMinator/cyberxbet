"use client";

import Select from "react-select";
import countryList from "react-select-country-list";
import { useId, useMemo } from "react";
import Image from "next/image";
export default function CountrySelect({
  value,
  onChange,
  customStyles,
  isEnglish,
}) {
  // Generate a stable ID for this component instance
  const selectId = useId();

  // Memoize the countries data to prevent unnecessary re-renders
  const countries = useMemo(() => countryList().getData(), []);

  return (
    <Select
      instanceId={selectId}
      options={countries}
      value={value}
      onChange={onChange}
      styles={customStyles}
      className="country-select"
      placeholder={isEnglish ? "Select your country" : "اختر بلدك"}
      formatOptionLabel={({ label, value }) => (
        <div className="flex items-center gap-2 ">
          <img
            src={`https://flagcdn.com/24x18/${value.toLowerCase()}.png`}
            alt={label}
            className="w-6 h-4 object-cover"
          />
          <span>{label}</span>
        </div>
      )}
    />
  );
}
