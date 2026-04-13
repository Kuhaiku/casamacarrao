import { useState, useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
  }
}

export function useGoogleAddress(apiKey: string) {
  const [addressData, setAddressData] = useState({
    logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: ""
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!apiKey) return;
    
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      document.head.appendChild(script);
      script.onload = initAutocomplete;
    } else {
      initAutocomplete();
    }

    function initAutocomplete() {
      if (!inputRef.current) return;
      
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "BR" },
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;

        let newAddress = { logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" };

        for (const component of place.address_components) {
          const type = component.types[0];
          switch (type) {
            case "route": newAddress.logradouro = component.long_name; break;
            case "street_number": newAddress.numero = component.long_name; break;
            case "sublocality_level_1": case "sublocality": newAddress.bairro = component.long_name; break;
            case "administrative_area_level_2": newAddress.cidade = component.long_name; break;
            case "administrative_area_level_1": newAddress.estado = component.short_name; break;
            case "postal_code": newAddress.cep = component.long_name; break;
          }
        }
        setAddressData(newAddress);
      });
    }
  }, [apiKey]);

  return { inputRef, addressData, setAddressData };
}