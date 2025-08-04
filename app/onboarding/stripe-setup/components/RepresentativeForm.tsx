import { useState } from "react";

interface RepresentativeFormProps {
  onRepresentativeInfo: (info: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dob: {
      day: number;
      month: number;
      year: number;
    };
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  }) => void;
}

export default function RepresentativeForm({
  onRepresentativeInfo,
}: RepresentativeFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: {
      day: "",
      month: "",
      year: "",
    },
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "US",
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert string values to numbers for date of birth
    const dob = {
      day: parseInt(formData.dob.day),
      month: parseInt(formData.dob.month),
      year: parseInt(formData.dob.year),
    };

    onRepresentativeInfo({
      ...formData,
      dob,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => {
        // Get the parent object safely with type checking
        const parentObj = prev[parent as keyof typeof prev];
        // Make sure it's an object before spreading
        if (parentObj && typeof parentObj === 'object') {
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: value,
            },
          };
        }
        return prev; // Return unchanged if parent is not an object
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="firstName" className="block font-medium">
            Nombre *!
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="lastName" className="block font-medium">
            Apellido *
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block font-medium">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="block font-medium">
          Teléfono *
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block font-medium">Fecha de nacimiento!!! *</label>
        <div className="grid grid-cols-3 gap-4">
          <input
            name="dob.day"
            type="number"
            placeholder="Día"
            min="1"
            max="31"
            value={formData.dob.day}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <input
            name="dob.month"
            type="number"
            placeholder="Mes"
            min="1"
            max="12"
            value={formData.dob.month}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <input
            name="dob.year"
            type="number"
            placeholder="Año"
            min="1900"
            max={new Date().getFullYear()}
            value={formData.dob.year}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="address.line1" className="block font-medium">
          Dirección *
        </label>
        <input
          id="address.line1"
          name="address.line1"
          type="text"
          value={formData.address.line1}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="address.line2" className="block font-medium">
          Dirección (línea 2)
        </label>
        <input
          id="address.line2"
          name="address.line2"
          type="text"
          value={formData.address.line2}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="address.city" className="block font-medium">
            Ciudad *
          </label>
          <input
            id="address.city"
            name="address.city"
            type="text"
            value={formData.address.city}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="address.state" className="block font-medium">
            Estado *
          </label>
          <input
            id="address.state"
            name="address.state"
            type="text"
            value={formData.address.state}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="address.postal_code" className="block font-medium">
            Código postal *
          </label>
          <input
            id="address.postal_code"
            name="address.postal_code"
            type="text"
            value={formData.address.postal_code}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="address.country" className="block font-medium">
            País *
          </label>
          <select
            id="address.country"
            name="address.country"
            value={formData.address.country}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="US">Estados Unidos</option>
            <option value="MX">México</option>
            <option value="ES">España</option>
            {/* Add more countries as needed */}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Guardar información del representante
      </button>
    </form>
  );
}
