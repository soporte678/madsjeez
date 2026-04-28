import React from 'react';
import { 
  User, ChevronDown, ChevronRight, ShoppingBag, Tag, 
  Megaphone, FileText, CreditCard, Settings, Star, 
  MessageSquare, ClipboardList, Bookmark, Store, 
  X, Maximize2, LayoutGrid
} from 'lucide-react';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    name: string;
    email: string;
    image?: string | null;
  };
  onNavigate: (view: string) => void;
}

interface DropdownItemProps {
  text: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
}

/**
 * COMPONENTE: UserMenu
 * Este es el menú desplegable que aparece cuando el usuario hace clic en su nombre.
 * * @param {boolean} isOpen - Controla si el menú es visible.
 * @param {function} onClose - Función para cerrar el menú.
 * @param {object} userData - Datos del usuario (nombre, email).
 * @param {function} onNavigate - Función para cambiar la vista activa en el dashboard.
 */
export const UserMenu: React.FC<UserMenuProps> = ({ isOpen, onClose, userData, onNavigate }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Capa invisible para cerrar el menú al hacer clic fuera */}
      <div 
        className="fixed inset-0 z-40 cursor-default" 
        onClick={onClose}
      ></div>
      
      {/* Contenedor del Menú */}
      <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 py-1 z-50 text-gray-800 text-[13.5px] font-normal cursor-default max-h-[80vh] overflow-y-auto custom-scrollbar">
        
        {/* Cabecera: Perfil del usuario */}
        <div 
          className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors" 
          onClick={() => { onNavigate('perfil'); onClose(); }}
        >
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 overflow-hidden shrink-0">
              {userData.image ? (
                <img src={userData.image} alt={userData.name} className="w-full h-full object-cover" />
              ) : (
                <User size={24} />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[15px] truncate w-40">{userData.name}</span>
              <span className="text-gray-500 text-xs truncate w-40">{userData.email}</span>
            </div>
          </div>
          <button className="p-1 hover:bg-gray-200 rounded-full">
            <ChevronDown size={16} className="rotate-180 text-gray-500" />
          </button>
        </div>

        {/* Opción: Agregar cuenta */}
        <div className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="w-5 h-5 border-2 border-gray-400 rounded-full flex items-center justify-center shrink-0 text-gray-500">
            <User size={12} />
          </div>
          <span className="text-gray-700 font-medium">Agregar cuenta</span>
        </div>

        {/* Banner de Suscripción Mads+ */}
        {false && (
          <div className="px-4 py-2">
            <div className="bg-gradient-to-r from-purple-800 to-fuchsia-600 rounded-md p-2 flex items-center justify-between text-white cursor-pointer hover:opacity-95 transition-opacity">
              <div className="flex items-center gap-2">
                <span className="font-black bg-white text-purple-800 px-1.5 py-0.5 rounded-[4px] text-[10px] lowercase tracking-wide">mads+</span>
                <span className="font-medium text-[12px]">Suscribite desde $ 3.490/mes</span>
              </div>
              <ChevronRight size={14} />
            </div>
          </div>
        )}

        <hr className="border-gray-100 my-1" />

        {/* SECCIÓN 1: Compras y actividad de usuario */}
        <div className="py-1">
          <DropdownItem text="Compras" onClick={() => { onNavigate('compras'); onClose(); }} />
          <DropdownItem text="Historial" onClick={() => { onNavigate('historial'); onClose(); }} />
          <DropdownItem text="Preguntas" onClick={() => { onNavigate('preguntas'); onClose(); }} />
          <DropdownItem text="Opiniones" onClick={() => { onNavigate('opiniones'); onClose(); }} />
        </div>

        <hr className="border-gray-100 my-1" />

        {/* SECCIÓN 2: Servicios y Entretenimiento */}
        <div className="py-1">
          <DropdownItem text="Suscripciones" />
          {false && (
            <DropdownItem text="Mads Play" badge="GRATIS" badgeColor="bg-emerald-500" />
          )}
        </div>

        <hr className="border-gray-100 my-1" />

        {/* SECCIÓN 3: Gestión de Ventas */}
        <div className="py-1">
          <DropdownItem text="Vender" />
          <DropdownItem text="Resumen" onClick={() => { onNavigate('resumen'); onClose(); }} />
          <DropdownItem text="Publicaciones" onClick={() => { onNavigate('publicaciones'); onClose(); }} />
          <DropdownItem text="Ventas" onClick={() => { onNavigate('ventas-lista'); onClose(); }} />
          <DropdownItem text="Posventa" onClick={() => { onNavigate('posventa'); onClose(); }} />
          <DropdownItem text="Reputación" onClick={() => { onNavigate('reputacion'); onClose(); }} />
          <DropdownItem text="Publicidad" />
          <DropdownItem text="Clips" />
          <DropdownItem text="Mi página" />
          <DropdownItem text="Central de Marketing" badge="NUEVO" badgeColor="bg-blue-500" />
          <DropdownItem text="Métricas" onClick={() => { onNavigate('metricas'); onClose(); }} />
          <DropdownItem text="Facturación" />
        </div>

        <hr className="border-gray-100 my-1" />

        {/* SECCIÓN 4: Salida */}
        <div className="py-1">
          <DropdownItem text="Salir" />
        </div>
      </div>
    </>
  );
};

/**
 * SUB-COMPONENTE: DropdownItem
 * Item individual para las listas del menú desplegable.
 */
const DropdownItem: React.FC<DropdownItemProps> = ({ text, badge, badgeColor, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="w-full flex justify-between items-center px-4 py-2 hover:bg-blue-50/50 hover:text-blue-600 text-gray-600 transition-colors text-left"
    >
      <span>{text}</span>
      {badge && (
        <span className={`${badgeColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm`}>
          {badge}
        </span>
      )}
    </button>
  );
};

// Ejemplo de uso rápido (Para previsualizar en el entorno)
export default function App() {
  const [isOpen, setIsOpen] = React.useState(true);
  const userData = { name: "Ezequiel Ziegler", email: "ezequiel@madsjeez.com" };

  const handleNavigate = (view: string) => {
    console.log("Navegando a:", view);
  };

  return (
    <div className="p-20 bg-gray-200 min-h-screen flex justify-center">
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white px-4 py-2 rounded shadow-sm font-bold flex items-center gap-2"
        >
          <User size={18} /> {userData.name} <ChevronDown size={16} />
        </button>
        
        <UserMenu 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
          userData={userData} 
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
}
