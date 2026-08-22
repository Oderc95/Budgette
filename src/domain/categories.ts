import type { Category, Flow, Tone } from './types'

/** Libellé et teinte de chaque flux, utilisés partout dans l'interface. */
export const FLOW_META: Record<Flow, { label: string; short: string; tone: Tone; icon: string }> = {
  income: { label: 'Revenus', short: 'Revenus', tone: 'mint', icon: 'Sprout' },
  fixed: { label: 'Charges contraintes', short: 'Charges', tone: 'indigo', icon: 'House' },
  debt: { label: 'Dettes', short: 'Dettes', tone: 'berry', icon: 'Scale' },
  saving: { label: 'Épargne', short: 'Épargne', tone: 'amber', icon: 'PiggyBank' },
  discretionary: { label: 'Dépenses non essentielles', short: 'Non essentiel', tone: 'orchid', icon: 'IceCreamCone' },
}

export const FLOW_ORDER: Flow[] = ['income', 'fixed', 'debt', 'saving', 'discretionary']

/**
 * Catalogue par défaut. Il reprend les lignes du classeur Excel de l'utilisateur
 * et y ajoute les postes lus sur ses relevés (livraison de repas, abonnements
 * logiciels, retraits d'espèces) qui n'y figuraient pas encore.
 */
export const CATEGORIES: Category[] = [
  // Revenus
  { id: 'inc_carryover', label: 'Report du mois précédent', flow: 'income', icon: 'Undo2', hint: 'Reste de fin de mois, reporté à la clôture' },
  { id: 'inc_salary', label: 'Salaire', flow: 'income', icon: 'Wallet', recurring: true },
  { id: 'inc_unemployment', label: 'France Travail', flow: 'income', icon: 'FileText' },
  { id: 'inc_family', label: 'Allocations familiales', flow: 'income', icon: 'Baby' },
  { id: 'inc_apl', label: 'APL', flow: 'income', icon: 'HousePlus' },
  { id: 'inc_activity_bonus', label: "Prime d'activité", flow: 'income', icon: 'Gift' },
  { id: 'inc_rental', label: 'Revenus locatifs', flow: 'income', icon: 'Building2' },
  { id: 'inc_refunds', label: 'Remboursements reçus', flow: 'income', icon: 'Undo2' },
  { id: 'inc_savings_out', label: "Sortie d'épargne", flow: 'income', icon: 'ArrowDownFromLine', hint: "À n'utiliser que si vous puisez dans votre épargne" },
  { id: 'inc_other', label: 'Autres revenus', flow: 'income', icon: 'Plus' },

  // Charges contraintes
  { id: 'fix_housing', label: 'Loyer / crédit immobilier', flow: 'fixed', icon: 'House', recurring: true },
  { id: 'fix_charges', label: 'Charges de copropriété', flow: 'fixed', icon: 'Building', recurring: true },
  { id: 'fix_energy', label: 'Électricité / gaz', flow: 'fixed', icon: 'Zap', recurring: true },
  { id: 'fix_water', label: 'Eau', flow: 'fixed', icon: 'Droplets', recurring: true },
  { id: 'fix_internet', label: 'Internet', flow: 'fixed', icon: 'Wifi', recurring: true },
  { id: 'fix_phone', label: 'Téléphone', flow: 'fixed', icon: 'Smartphone', recurring: true },
  { id: 'fix_transport', label: 'Transport en commun', flow: 'fixed', icon: 'TramFront', recurring: true },
  { id: 'fix_fuel', label: 'Carburant / véhicule', flow: 'fixed', icon: 'Car' },
  { id: 'fix_insurance_home', label: 'Assurance habitation', flow: 'fixed', icon: 'ShieldCheck', recurring: true },
  { id: 'fix_insurance_health', label: 'Mutuelle santé', flow: 'fixed', icon: 'HeartPulse', recurring: true },
  { id: 'fix_bank_fees', label: 'Frais bancaires', flow: 'fixed', icon: 'Landmark', recurring: true, hint: 'Cotisation carte, commissions, agios' },
  { id: 'fix_groceries', label: 'Courses alimentaires', flow: 'fixed', icon: 'ShoppingBasket', recurring: true },
  { id: 'fix_canteen', label: 'Cantine / déjeuners travail', flow: 'fixed', icon: 'Utensils' },
  { id: 'fix_childcare', label: 'Garde d’enfants / scolarité', flow: 'fixed', icon: 'GraduationCap' },
  { id: 'fix_tools', label: 'Abonnements professionnels', flow: 'fixed', icon: 'Terminal', hint: 'Hébergement, outils, licences' },
  { id: 'fix_other', label: 'Autres charges fixes', flow: 'fixed', icon: 'Plus' },

  // Dettes
  { id: 'debt_loan', label: 'Emprunt bancaire', flow: 'debt', icon: 'Landmark', recurring: true },
  { id: 'debt_overdraft', label: 'Découvert à rembourser', flow: 'debt', icon: 'TrendingDown', hint: 'Le poste à éteindre en priorité' },
  { id: 'debt_installments', label: 'Paiement en plusieurs fois', flow: 'debt', icon: 'Split' },
  { id: 'debt_consumer', label: 'Crédit à la consommation', flow: 'debt', icon: 'CreditCard' },
  { id: 'debt_family', label: 'Dette envers un proche', flow: 'debt', icon: 'Users' },

  // Épargne
  { id: 'sav_emergency', label: "Fonds d'urgence", flow: 'saving', icon: 'Umbrella' },
  { id: 'sav_buffer', label: 'Épargne de précaution', flow: 'saving', icon: 'ShieldCheck' },
  { id: 'sav_travel', label: 'Épargne voyages', flow: 'saving', icon: 'Plane' },
  { id: 'sav_home', label: 'Épargne logement', flow: 'saving', icon: 'HousePlus' },
  { id: 'sav_retirement', label: 'Épargne retraite', flow: 'saving', icon: 'Palmtree' },
  { id: 'sav_project', label: 'Épargne projet', flow: 'saving', icon: 'Target' },

  // Dépenses non essentielles
  { id: 'dis_delivery', label: 'Livraison de repas', flow: 'discretionary', icon: 'Bike', hint: 'Deliveroo, Uber Eats…' },
  { id: 'dis_restaurant', label: 'Restaurants & cafés', flow: 'discretionary', icon: 'CupSoda' },
  { id: 'dis_shopping', label: 'Shopping & vêtements', flow: 'discretionary', icon: 'ShoppingBag' },
  { id: 'dis_leisure', label: 'Sorties & loisirs', flow: 'discretionary', icon: 'Ticket' },
  { id: 'dis_subscriptions', label: 'Abonnements confort', flow: 'discretionary', icon: 'Sparkles', hint: 'Streaming, IA, applications' },
  { id: 'dis_gifts', label: 'Cadeaux', flow: 'discretionary', icon: 'Gift' },
  { id: 'dis_travel', label: 'Voyages & week-ends', flow: 'discretionary', icon: 'Luggage' },
  { id: 'dis_cash', label: "Retraits d'espèces", flow: 'discretionary', icon: 'Banknote', hint: 'Les retraits hors réseau sont souvent facturés' },
  { id: 'dis_other', label: 'Autres dépenses', flow: 'discretionary', icon: 'Plus' },
]

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
)

export function categoriesOf(flow: Flow): Category[] {
  return CATEGORIES.filter((c) => c.flow === flow)
}
