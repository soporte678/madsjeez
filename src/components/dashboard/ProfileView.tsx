import React from 'react';
import { 
  User, ShieldCheck, Users, CreditCard, 
  MapPin, Lock, MessageSquare, Star, 
  AlertCircle, ChevronRight, X, Key
} from 'lucide-react';

interface ProfileViewProps {
  userData?: {
    name?: string;
    email?: string;
    avatar?: string | null;
    image?: string | null;
  } | null;
}

export default function ProfileView({ userData }: ProfileViewProps) {
  const user = userData || {
    name: "MadsJeez II Repuestos Para Maquinas",
    email: "amanecer.dannu556@gmail.com",
    avatar: null
  };

  // Use image if avatar is not provided (from Google auth session)
  const profileImage = user.avatar || user.image || null;

  const profileCards = [
    {
      id: 'info',
      title: "Información de tu perfil",
      description: "Datos personales, de la cuenta y fiscales.",
      icon: <User className="text-gray-400" size={24} />,
      status: null
    },
    {
      id: 'security',
      title: "Seguridad",
      description: "Tenés configuraciones pendientes.",
      icon: <ShieldCheck className="text-gray-400" size={24} />,
      status: 'warning'
    },
    {
      id: 'colaboradores',
      title: "Colaboradores",
      description: "Personas que operan con tu cuenta.",
      icon: <Users className="text-gray-400" size={24} />,
      status: null
    },
    {
      id: 'mads-plus',
      title: "Mads+",
      description: "Suscripción con beneficios en envíos, compras y entretenimiento.",
      icon: <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-black italic">M</div>,
      status: null
    },
    {
      id: 'tarjetas',
      title: "Tarjetas",
      description: "Tarjetas guardadas en tu cuenta.",
      icon: <CreditCard className="text-gray-400" size={24} />,
      status: null
    },
    {
      id: 'direcciones',
      title: "Direcciones",
      description: "Direcciones guardadas en tu cuenta.",
      icon: <MapPin className="text-gray-400" size={24} />,
      status: null
    },
    {
      id: 'privacidad',
      title: "Privacidad",
      description: "Preferencias y control sobre el uso de tus datos.",
      icon: <Lock className="text-gray-400" size={24} />,
      status: null
    },
    {
      id: 'comunicaciones',
      title: "Comunicaciones",
      description: "Elegí qué tipo de información querés recibir.",
      icon: <MessageSquare className="text-gray-400" size={24} />,
      status: null
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20">
      
      {/* --- SECCIÓN CABECERA --- */}
      <div className="flex flex-col items-center py-8">
        <div className="relative group cursor-pointer">
          <div className="w-24 h-24 bg-gray-200 rounded-full border-4 border-white shadow-sm overflow-hidden flex items-center justify-center">
            {profileImage ? (
              <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-gray-400" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-blue-600 group-hover:scale-110 transition-transform">
             <ChevronRight size={14} className="-rotate-90" />
          </div>
        </div>
        
        <h1 className="mt-4 text-[22px] font-bold text-gray-800 tracking-tight">
          {user.name}
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          {user.email}
        </p>
        <span className="mt-2 bg-yellow-100 text-yellow-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
          Negocio
        </span>
      </div>

      {/* --- BANNER DE ALERTA: LLAVE DE ACCESO --- */}
      <div className="bg-white border-l-4 border-l-orange-400 rounded-lg shadow-sm p-4 flex items-center justify-between border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
            <Key size={20} />
          </div>
          <span className="text-[15px] text-gray-700 font-medium">
            Creá tu llave de acceso para mantener tu cuenta segura
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors">
            Crear
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* --- GRID DE OPCIONES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {profileCards.map((card) => (
          <div 
            key={card.id}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative"
          >
            {card.status === 'warning' && (
              <div className="absolute top-4 right-4">
                <AlertCircle className="text-orange-500" size={18} />
              </div>
            )}

            <div className="mb-4">
              {card.icon}
            </div>
            
            <h3 className="text-[16px] font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
              {card.title}
            </h3>
            <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* --- FOOTER --- */}
      <div className="mt-8 text-center">
        <button className="text-[13px] text-blue-500 font-medium hover:underline">
          Podés <span className="font-bold">cancelar tu cuenta</span> siempre que lo desees.
        </button>
      </div>

    </div>
  );
}
