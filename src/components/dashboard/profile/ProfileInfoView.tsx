"use client";

import React, { useState } from 'react';
import { ChevronRight, Check, User, FileText, Home, CreditCard, Mail, Phone, AtSign } from 'lucide-react';

interface ProfileInfoViewProps {
  onBack: () => void;
  userData?: {
    name?: string;
    email?: string;
    image?: string | null;
  } | null;
}

interface ProfileField {
  id: string;
  label: string;
  value: string | null;
  sublabel: string;
  completed: boolean;
  icon: React.ReactNode;
  editable: boolean;
}

export default function ProfileInfoView({ onBack, userData }: ProfileInfoViewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const personalInfo: ProfileField[] = [
    {
      id: 'name',
      label: userData?.name || 'Gustavo Daniel Jara',
      value: userData?.name || 'Gustavo Daniel Jara',
      sublabel: 'Nombre y apellido.',
      completed: true,
      icon: <User size={18} className="text-gray-500" />,
      editable: true,
    },
    {
      id: 'cuil',
      label: '20449505957',
      value: '20449505957',
      sublabel: 'Número de CUIL.',
      completed: true,
      icon: <FileText size={18} className="text-gray-500" />,
      editable: true,
    },
    {
      id: 'maritalStatus',
      label: 'Unión convivencial',
      value: 'Unión convivencial',
      sublabel: 'Estado civil.',
      completed: false,
      icon: <User size={18} className="text-gray-500" />,
      editable: true,
    },
    {
      id: 'displayName',
      label: 'MaqJeez III Repuestos Para Maquinas',
      value: 'MaqJeez III Repuestos Para Maquinas',
      sublabel: 'Nombre elegido.',
      completed: false,
      icon: <AtSign size={18} className="text-gray-500" />,
      editable: true,
    },
  ];

  const fiscalData: ProfileField[] = [
    {
      id: 'taxCondition',
      label: 'Monotributista',
      value: 'Monotributista',
      sublabel: 'Condición fiscal.',
      completed: true,
      icon: <FileText size={18} className="text-gray-500" />,
      editable: true,
    },
    {
      id: 'taxAddress',
      label: '92 (m. D.) 1101, Chivilcoy, Buenos Aires',
      value: '92 (m. D.) 1101, Chivilcoy, Buenos Aires',
      sublabel: 'Domicilio fiscal.',
      completed: true,
      icon: <Home size={18} className="text-gray-500" />,
      editable: true,
    },
    {
      id: 'iibb',
      label: 'Subí tu inscripción de ingresos brutos',
      value: null,
      sublabel: '',
      completed: false,
      icon: <FileText size={18} className="text-gray-500" />,
      editable: true,
    },
    {
      id: 'exemptionDocs',
      label: 'Subí los documentos que respaldan tu exención de impuestos',
      value: null,
      sublabel: '',
      completed: false,
      icon: <FileText size={18} className="text-gray-500" />,
      editable: true,
    },
    {
      id: 'exclusionCert',
      label: 'Subí el certificado de tus exclusiones de impuestos',
      value: null,
      sublabel: '',
      completed: false,
      icon: <FileText size={18} className="text-gray-500" />,
      editable: true,
    },
  ];

  const accountData: ProfileField[] = [
    {
      id: 'email',
      label: userData?.email || 'tavijara1@gmail.com',
      value: userData?.email || 'tavijara1@gmail.com',
      sublabel: 'E-mail donde recibís comunicaciones.',
      completed: true,
      icon: <Mail size={18} className="text-gray-500" />,
      editable: true,
    },
    {
      id: 'phone',
      label: '+541125307958',
      value: '+541125307958',
      sublabel: 'Número donde recibís códigos de verificación y comunicaciones.',
      completed: true,
      icon: <Phone size={18} className="text-gray-500" />,
      editable: true,
    },
    {
      id: 'username',
      label: 'MAQJEEZ_III',
      value: 'MAQJEEZ_III',
      sublabel: 'Nombre de usuario.',
      completed: false,
      icon: <AtSign size={18} className="text-gray-500" />,
      editable: true,
    },
  ];

  const handleEdit = (field: ProfileField) => {
    setEditingField(field.id);
    setEditValue(field.value || '');
  };

  const handleSave = () => {
    setEditingField(null);
    // TODO: API call to save
  };

  const renderField = (field: ProfileField) => (
    <div
      key={field.id}
      className="flex items-start justify-between py-4 px-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
      onClick={() => !editingField && handleEdit(field)}
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="mt-0.5">{field.icon}</div>
        <div className="flex-1 min-w-0">
          {editingField === field.id ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md font-medium hover:bg-blue-700"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditingField(null)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-md font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[15px] text-gray-800 font-medium truncate">
                {field.value || field.label}
              </p>
              {field.sublabel && (
                <p className="text-xs text-gray-500 mt-0.5">{field.sublabel}</p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        {field.completed && editingField !== field.id && (
          <Check size={18} className="text-green-500" />
        )}
        {editingField !== field.id && (
          <ChevronRight size={18} className="text-gray-400" />
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={onBack}
          className="text-blue-600 font-medium hover:underline"
        >
          Mi perfil
        </button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-500">Información de tu perfil</span>
      </div>

      {/* Título */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-800">
          Información de tu perfil
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Podés agregar, modificar o corregir tu información personal, los datos de la cuenta y los datos fiscales.
        </p>
      </div>

      {/* Información personal */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-gray-800">Información personal</h2>
        </div>
        <div>
          {personalInfo.map(renderField)}
        </div>
      </div>

      {/* Datos fiscales */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-gray-800">Datos fiscales</h2>
        </div>
        <div>
          {fiscalData.map(renderField)}
        </div>
      </div>

      {/* Datos de la cuenta */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-gray-800">Datos de la cuenta</h2>
        </div>
        <div>
          {accountData.map(renderField)}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 text-xs text-gray-500 px-4">
        <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center">
          <span className="text-[10px]">?</span>
        </div>
        <span>
          Tu información personal está siempre protegida. Si tenés dudas, podés consultar{' '}
          <button className="text-blue-600 hover:underline font-medium">cómo cuidamos tus datos</button>.
        </span>
      </div>
    </div>
  );
}
