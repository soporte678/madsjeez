"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Check, User, FileText, Home, Mail, Phone, AtSign, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileInfoViewProps {
  onBack: () => void;
  userData?: {
    name?: string;
    email?: string;
    image?: string | null;
  } | null;
}

type FieldValue = string | null;

interface ProfileSection {
  id: string;
  label: string;
  value: FieldValue;
  sublabel: string;
  completed: boolean;
  icon: React.ReactNode;
  type: 'text' | 'select' | 'file' | 'email' | 'phone';
  options?: string[];
}

const STORAGE_KEY = 'madsjeez_profile_data';

const defaultProfileData = {
  name: 'EZEQUIEL ZIEGLER',
  cuil: '20449505957',
  maritalStatus: 'Unión convivencial',
  displayName: 'MadsJeez III Repuestos Para Maquinas',
  taxCondition: 'Monotributista',
  taxAddress: '92 (m. D.) 1101, Chivilcoy, Buenos Aires',
  iibb: null as string | null,
  exemptionDocs: null as string | null,
  exclusionCert: null as string | null,
  email: 'vianferreteria@gmail.com',
  phone: '+541125307958',
  username: 'MADSJEEZ_III',
};

export default function ProfileInfoView({ onBack, userData }: ProfileInfoViewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [data, setData] = useState(defaultProfileData);

  // Load persisted data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(prev => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Override with userData if available
  useEffect(() => {
    if (userData?.name) {
      setData(prev => ({ ...prev, name: userData.name! }));
    }
    if (userData?.email) {
      setData(prev => ({ ...prev, email: userData.email! }));
    }
  }, [userData]);

  const saveToStorage = useCallback((newData: typeof defaultProfileData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  const handleEdit = (fieldId: string, currentValue: FieldValue) => {
    setEditingField(fieldId);
    setEditValue(currentValue || '');
  };

  const handleSave = (fieldId: string) => {
    const newData = { ...data, [fieldId]: editValue || null };
    saveToStorage(newData);
    setEditingField(null);
    toast.success('Guardado correctamente');
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleFileUpload = (fieldId: string, file: File | null) => {
    if (!file) return;
    // Simulate file upload with filename
    const newData = { ...data, [fieldId]: `Archivo: ${file.name}` };
    saveToStorage(newData);
    toast.success('Documento guardado');
  };

  const clearFile = (fieldId: string) => {
    const newData = { ...data, [fieldId]: null };
    saveToStorage(newData);
    toast.success('Documento eliminado');
  };

  const personalInfo: ProfileSection[] = [
    {
      id: 'name',
      label: data.name,
      value: data.name,
      sublabel: 'Nombre y apellido.',
      completed: true,
      icon: <User size={18} className="text-gray-500" />,
      type: 'text',
    },
    {
      id: 'cuil',
      label: data.cuil,
      value: data.cuil,
      sublabel: 'Número de CUIL.',
      completed: true,
      icon: <FileText size={18} className="text-gray-500" />,
      type: 'text',
    },
    {
      id: 'maritalStatus',
      label: data.maritalStatus,
      value: data.maritalStatus,
      sublabel: 'Estado civil.',
      completed: true,
      icon: <User size={18} className="text-gray-500" />,
      type: 'select',
      options: ['Soltero/a', 'Casado/a', 'Unión convivencial', 'Divorciado/a', 'Viudo/a'],
    },
    {
      id: 'displayName',
      label: data.displayName,
      value: data.displayName,
      sublabel: 'Nombre elegido.',
      completed: true,
      icon: <AtSign size={18} className="text-gray-500" />,
      type: 'text',
    },
  ];

  const fiscalData: ProfileSection[] = [
    {
      id: 'taxCondition',
      label: data.taxCondition,
      value: data.taxCondition,
      sublabel: 'Condición fiscal.',
      completed: true,
      icon: <FileText size={18} className="text-gray-500" />,
      type: 'select',
      options: ['Monotributista', 'Responsable Inscripto', 'Consumidor Final', 'Exento'],
    },
    {
      id: 'taxAddress',
      label: data.taxAddress,
      value: data.taxAddress,
      sublabel: 'Domicilio fiscal.',
      completed: true,
      icon: <Home size={18} className="text-gray-500" />,
      type: 'text',
    },
    {
      id: 'iibb',
      label: data.iibb || 'Subí tu inscripción de ingresos brutos',
      value: data.iibb,
      sublabel: 'Ingresos Brutos.',
      completed: !!data.iibb,
      icon: <FileText size={18} className="text-gray-500" />,
      type: 'file',
    },
    {
      id: 'exemptionDocs',
      label: data.exemptionDocs || 'Subí los documentos que respaldan tu exención de impuestos',
      value: data.exemptionDocs,
      sublabel: 'Exención de impuestos.',
      completed: !!data.exemptionDocs,
      icon: <FileText size={18} className="text-gray-500" />,
      type: 'file',
    },
    {
      id: 'exclusionCert',
      label: data.exclusionCert || 'Subí el certificado de tus exclusiones de impuestos',
      value: data.exclusionCert,
      sublabel: 'Exclusiones de impuestos.',
      completed: !!data.exclusionCert,
      icon: <FileText size={18} className="text-gray-500" />,
      type: 'file',
    },
  ];

  const accountData: ProfileSection[] = [
    {
      id: 'email',
      label: data.email,
      value: data.email,
      sublabel: 'E-mail donde recibís comunicaciones.',
      completed: true,
      icon: <Mail size={18} className="text-gray-500" />,
      type: 'email',
    },
    {
      id: 'phone',
      label: data.phone,
      value: data.phone,
      sublabel: 'Número donde recibís códigos de verificación y comunicaciones.',
      completed: true,
      icon: <Phone size={18} className="text-gray-500" />,
      type: 'phone',
    },
    {
      id: 'username',
      label: data.username,
      value: data.username,
      sublabel: 'Nombre de usuario.',
      completed: true,
      icon: <AtSign size={18} className="text-gray-500" />,
      type: 'text',
    },
  ];

  const renderEditInput = (field: ProfileSection) => {
    if (field.type === 'select' && field.options) {
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          autoFocus
        >
          {field.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        autoFocus
      />
    );
  };

  const renderField = (field: ProfileSection) => (
    <div
      key={field.id}
      className="flex items-start justify-between py-4 px-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="mt-0.5">{field.icon}</div>
        <div className="flex-1 min-w-0">
          {editingField === field.id ? (
            <div className="space-y-2">
              {renderEditInput(field)}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave(field.id)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md font-medium hover:bg-blue-700"
                >
                  Guardar
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-md font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : field.type === 'file' ? (
            <div className="space-y-2">
              {field.value ? (
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  <span className="text-sm text-gray-800">{field.value}</span>
                  <button
                    onClick={() => clearFile(field.id)}
                    className="p-1 hover:bg-red-50 rounded-full text-red-500"
                    title="Eliminar"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[15px] text-gray-800 font-medium">
                    {field.label}
                  </p>
                  {field.sublabel && (
                    <p className="text-xs text-gray-500 mt-0.5">{field.sublabel}</p>
                  )}
                </>
              )}
              <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-md font-medium hover:bg-blue-100 cursor-pointer transition-colors">
                <Upload size={14} />
                {field.value ? 'Cambiar archivo' : 'Subir archivo'}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(field.id, e.target.files?.[0] || null)}
                />
              </label>
            </div>
          ) : (
            <button
              onClick={() => handleEdit(field.id, field.value)}
              className="text-left w-full"
            >
              <p className="text-[15px] text-gray-800 font-medium truncate">
                {field.value || field.label}
              </p>
              {field.sublabel && (
                <p className="text-xs text-gray-500 mt-0.5">{field.sublabel}</p>
              )}
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        {field.completed && editingField !== field.id && (
          <Check size={18} className="text-green-500" />
        )}
        {field.type !== 'file' && editingField !== field.id && (
          <button onClick={() => handleEdit(field.id, field.value)}>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
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
