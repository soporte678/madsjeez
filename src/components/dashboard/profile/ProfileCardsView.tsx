"use client";

import React, { useState } from 'react';
import { ChevronLeft, Plus, CreditCard } from 'lucide-react';

interface ProfileCardsViewProps {
  onBack: () => void;
}

interface SavedCard {
  id: string;
  lastFour: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'other';
  bank: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
}

export default function ProfileCardsView({ onBack }: ProfileCardsViewProps) {
  const [cards, setCards] = useState<SavedCard[]>([
    {
      id: '1',
      lastFour: '0846',
      brand: 'visa',
      bank: 'BBVA',
      expiryMonth: 9,
      expiryYear: 2030,
      holderName: 'GUSTAVO DANIEL JARA',
    },
    {
      id: '2',
      lastFour: '0482',
      brand: 'mastercard',
      bank: 'Mastercard',
      expiryMonth: 12,
      expiryYear: 2030,
      holderName: 'GUSTAVO DANIEL JARA',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCard, setNewCard] = useState({
    number: '',
    holderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  const handleDelete = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const handleAdd = () => {
    const lastFour = newCard.number.slice(-4);
    let brand: SavedCard['brand'] = 'other';
    if (newCard.number.startsWith('4')) brand = 'visa';
    else if (/^5[1-5]/.test(newCard.number)) brand = 'mastercard';
    else if (/^3[47]/.test(newCard.number)) brand = 'amex';

    setCards(prev => [...prev, {
      id: Date.now().toString(),
      lastFour,
      brand,
      bank: 'Nueva tarjeta',
      expiryMonth: parseInt(newCard.expiryMonth),
      expiryYear: parseInt(newCard.expiryYear),
      holderName: newCard.holderName,
    }]);
    setNewCard({ number: '', holderName: '', expiryMonth: '', expiryYear: '', cvv: '' });
    setShowAddModal(false);
  };

  const getCardIcon = (brand: SavedCard['brand']) => {
    switch (brand) {
      case 'visa':
        return (
          <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-bold italic">
            VISA
          </div>
        );
      case 'mastercard':
        return (
          <div className="w-12 h-8 relative flex items-center justify-center">
            <div className="w-6 h-6 bg-red-500 rounded-full opacity-80 absolute left-1" />
            <div className="w-6 h-6 bg-yellow-500 rounded-full opacity-80 absolute right-1" />
          </div>
        );
      case 'amex':
        return (
          <div className="w-12 h-8 bg-blue-400 rounded flex items-center justify-center text-white text-[8px] font-bold">
            AMEX
          </div>
        );
      default:
        return <CreditCard size={32} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-[22px] font-bold text-gray-800">Tarjetas</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Agregar tarjeta
        </button>
      </div>

      {/* Cards list */}
      {cards.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center text-center">
          <CreditCard size={48} className="text-gray-300 mb-4" />
          <h3 className="text-[16px] font-bold text-gray-800 mb-2">
            No tenés tarjetas guardadas
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Agregá una tarjeta para realizar compras de forma rápida y segura en la plataforma.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(card => (
            <div
              key={card.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {getCardIcon(card.brand)}
                <div>
                  <p className="text-[15px] text-gray-800 font-medium">
                    Terminada en {card.lastFour}
                  </p>
                  <p className="text-sm text-gray-500">{card.bank}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Vencimiento: {card.expiryMonth}/{card.expiryYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(card.id)}
                className="text-blue-600 text-sm font-medium hover:underline px-3 py-1"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Agregar tarjeta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  value={newCard.number}
                  onChange={(e) => setNewCard(prev => ({ ...prev, number: e.target.value.replace(/\D/g, '').slice(0, 16) }))}
                  placeholder="1234 5678 9012 3456"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del titular
                </label>
                <input
                  type="text"
                  value={newCard.holderName}
                  onChange={(e) => setNewCard(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                  placeholder="COMO APARECE EN LA TARJETA"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mes
                  </label>
                  <input
                    type="text"
                    value={newCard.expiryMonth}
                    onChange={(e) => setNewCard(prev => ({ ...prev, expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                    placeholder="MM"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año
                  </label>
                  <input
                    type="text"
                    value={newCard.expiryYear}
                    onChange={(e) => setNewCard(prev => ({ ...prev, expiryYear: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    placeholder="AAAA"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    value={newCard.cvv}
                    onChange={(e) => setNewCard(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    placeholder="123"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
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
                disabled={!newCard.number || newCard.number.length < 16 || !newCard.holderName || !newCard.expiryMonth || !newCard.expiryYear || !newCard.cvv}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar tarjeta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
