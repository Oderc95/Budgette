import {
  ArrowDownFromLine, ArrowLeft, ArrowRight, ArrowUpRight, Baby, Banknote, Bike, Bird, BookCheck,
  Building, Building2, CalendarCheck, CalendarDays, CalendarRange, Car, Check, CheckCircle2, ChefHat,
  ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, CreditCard, Crown, CupSoda, Droplets,
  FileText, Flag, Flame, Flower2, Footprints, Gem, Gift, GraduationCap, Hammer, HeartPulse, Hourglass,
  House, HousePlus, IceCreamCone, Info, Landmark, LayoutDashboard, Leaf, ListChecks, Lock, LogOut,
  Luggage, Menu, Moon, Monitor, Mountain, PackageOpen, Palmtree, PenLine, PiggyBank, Plane, Plus,
  Repeat, RotateCcw, Scale, Scissors, Settings, Shield, ShieldCheck, ShoppingBag, ShoppingBasket, Smartphone,
  Snowflake, Sparkles, Split, Sprout, Sun, Target, Telescope, Terminal, Ticket, TramFront, TrendingDown,
  Search, Tag, TrendingUp, Trophy, Umbrella, Undo2, UserPlus, Users, Utensils, Wallet, Wheat, Wifi, X, Zap,
} from 'lucide-react'
import type { ComponentType } from 'react'

/**
 * Registre d'icônes explicite.
 *
 * Un import nommé plutôt qu'un `import * as` : c'est ce qui permet au bundler
 * d'écarter les milliers d'icônes inutilisées de la bibliothèque.
 */
const REGISTRY: Record<string, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  ArrowDownFromLine, ArrowLeft, ArrowRight, ArrowUpRight, Baby, Banknote, Bike, Bird, BookCheck,
  Building, Building2, CalendarCheck, CalendarDays, CalendarRange, Car, Check, CheckCircle2, ChefHat,
  ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, CreditCard, Crown, CupSoda, Droplets,
  FileText, Flag, Flame, Flower2, Footprints, Gem, Gift, GraduationCap, Hammer, HeartPulse, Hourglass,
  House, HousePlus, IceCreamCone, Info, Landmark, LayoutDashboard, Leaf, ListChecks, Lock, LogOut,
  Luggage, Menu, Moon, Monitor, Mountain, PackageOpen, Palmtree, PenLine, PiggyBank, Plane, Plus,
  Repeat, RotateCcw, Scale, Scissors, Settings, Shield, ShieldCheck, ShoppingBag, ShoppingBasket, Smartphone,
  Snowflake, Sparkles, Split, Sprout, Sun, Target, Telescope, Terminal, Ticket, TramFront, TrendingDown,
  Search, Tag, TrendingUp, Trophy, Umbrella, Undo2, UserPlus, Users, Utensils, Wallet, Wheat, Wifi, X, Zap,
}

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.75,
  className,
}: {
  name: string
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const Component = REGISTRY[name] ?? Sparkles
  return <Component size={size} strokeWidth={strokeWidth} className={className} />
}
