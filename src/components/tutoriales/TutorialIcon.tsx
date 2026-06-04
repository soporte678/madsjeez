import {
  Rocket, UserPlus, Package, CreditCard, MessageCircle, Truck,
  BarChart3, Megaphone, Gift, Search, Camera, ShoppingCart,
  Crown, Star, RotateCcw, HelpCircle, Wallet, Tag, ImageIcon,
  ListChecks, Banknote,
} from 'lucide-react';

const MAP = {
  rocket:        Rocket,
  'user-plus':   UserPlus,
  package:       Package,
  'credit-card': CreditCard,
  message:       MessageCircle,
  truck:         Truck,
  chart:         BarChart3,
  megaphone:     Megaphone,
  gift:          Gift,
  search:        Search,
  camera:        Camera,
  cart:          ShoppingCart,
  crown:         Crown,
  star:          Star,
  return:        RotateCcw,
  help:          HelpCircle,
  wallet:        Wallet,
  tag:           Tag,
  image:         ImageIcon,
  'list-checks': ListChecks,
  banknote:      Banknote,
} as const;

export function TutorialIcon({
  name,
  size = 24,
  className,
}: {
  name: keyof typeof MAP;
  size?: number;
  className?: string;
}) {
  const Icon = MAP[name] ?? Rocket;
  return <Icon size={size} className={className} strokeWidth={1.75} />;
}
