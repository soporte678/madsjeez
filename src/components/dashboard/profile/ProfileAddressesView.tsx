"use client";

import React, { useState } from 'react';
import { ChevronLeft, Plus, MapPin, MoreVertical } from 'lucide-react';

interface ProfileAddressesViewProps {
  onBack: () => void;
}

interface Address {
  id: string;
  street: string;
  number: string;
  postalCode: string;
  province: string;
  city: string;
  label: 'residential' | 'work' | 'billing' | 'shipping';
  contactName: string;
  contactPhone: string;
  tags: string[];
}

const LABEL_MAP: Record<string, string> = {
  residential: 'Domicilio residencial',
  work: 'Domicilio laboral',
  billing: 'Facturación',
  shipping: 'Domicilio de envío',
};

export default function ProfileAddressesView({ onBack }: ProfileAddressesViewProps) {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      street: 'Calle Monteagudo',
      number: '75 75',
      postalCode: '6620',
      province: 'Buenos Aires',
      city: 'Chivilcoy',
      label: 'residential',
      contactName: 'Gustavo Daniel Jara',
      contactPhone: '2346530157',
      tags: [],
    },
    {
      id: '2',
      street: 'Calle Constancio C Vigil',
      number: '150',
      postalCode: '1812',
      province: 'Buenos Aires',
      city: 'Carlos Spegcazzini',
      label: 'work',
      contactName: 'GUSTAVO JARA',
      contactPhone: '2346530157',
      tags: ['Facturación', 'Domicilio de devoluciones', 'Venta', 'Domicilio de envío'],
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    number: '',
    postalCode: '',
    province: '',
    city: '',
    label: 'residential' as Address['label'],
    contactName: '',
    contactPhone: '',
  });

  const handleAdd = () => {
    setAddresses(prev => [...prev, {
      id: Date.now().toString(),
      ...newAddress,
      tags: [],
    }]);
    setNewAddress({
      street: '', number: '', postalCode: '', province: '', city: '',
      label: 'residential', contactName: '', contactPhone: '',
    });
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-[22px] font-bold text-gray-800">Direcciones</h1>
      </div>

      {/* Addresses list */}
      <div className="space-y-4">
        {addresses.map(addr => (
          <div
            key={addr.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 relative"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-[15px] text-gray-800 font-bold">
                  {addr.street} {addr.number}
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Código postal {addr.postalCode} - {addr.province} - {addr.city}
                </p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                  {LABEL_MAP[addr.label]}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {addr.contactName} - {addr.contactPhone}
                </p>

                {addr.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {addr.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <button className="text-blue-600 text-sm font-medium mt-3 hover:underline flex items-center gap-1">
                  Agregar información adicional
                  <span className="text-lg">→</span>
                </button>
              </div>

              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Agregar nueva dirección
      </button>

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Agregar dirección</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calle</label>
                  <input
                    type="text"
                    value={newAddress.street}
                    onChange={e => setNewAddress(p => ({ ...p, street: e.target.value }))}
                    placeholder="Ej: Av. Corrientes"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={newAddress.number}
                    onChange={e => setNewAddress(p => ({ ...p, number: e.target.value }))}
                    placeholder="1234"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
                  <input
                    type="text"
                    value={newAddress.postalCode}
                    onChange={e => setNewAddress(p => ({ ...p, postalCode: e.target.value }))}
                    placeholder="1000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))}
                    placeholder="Buenos Aires"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <input
                  type="text"
                  value={newAddress.province}
                  onChange={e => setNewAddress(p => ({ ...p, province: e.target.value }))}
                  placeholder="Buenos Aires"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de domicilio</label>
                <select
                  value={newAddress.label}
                  onChange={e => setNewAddress(p => ({ ...p, label: e.target.value as Address['label'] }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="residential">Domicilio residencial</option>
                  <option value="work">Domicilio laboral</option>
                  <option value="billing">Facturación</option>
                  <option value="shipping">Domicilio de envío</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del contacto</label>
                <input
                  type="text"
                  value={newAddress.contactName}
                  onChange={e => setNewAddress(p => ({ ...p, contactName: e.target.value }))}
                  placeholder="Nombre completo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={newAddress.contactPhone}
                  onChange={e => setNewAddress(p => ({ ...p, contactPhone: e.target.value }))}
                  placeholder="11 1234-5678"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={!newAddress.street || !newAddress.city || !newAddress.province}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar dirección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
