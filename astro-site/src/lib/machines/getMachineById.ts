import machinesData from '../../data/machines/machines.json';

export interface BundleOption {
  bundleId: string;
  bundleName: string;
  bundleShortDescription: string;
  bundleIncludes: string[];
  bundleAvailabilityStatus: string;
  bundleLeadTimeMinWeeks: number | null;
  bundleLeadTimeMaxWeeks: number | null;
}

export interface Machine {
  id: string;
  brand: string;
  model: string;
  displayName: string;
  gaugeMm: number;
  gaugeLabel: string;
  gaugeName: string;
  shortDescription: string;
  bestFor: string;
  keyBenefits: string[];
  availabilityStatus: string;
  leadTimeMinWeeks: number | null;
  leadTimeMaxWeeks: number | null;
  imageMain: string;
  imageAlt: string;
  bundleOptions?: BundleOption[];
}

export function getAllMachines(): Machine[] {
  return machinesData as Machine[];
}

export function getMachineById(id: string): Machine | undefined {
  const machines = getAllMachines();
  return machines.find(m => m.id === id);
}

export function getMachinesByGauge(gaugeName: string): Machine[] {
  const machines = getAllMachines();
  return machines.filter(m => m.gaugeName === gaugeName);
}

export function getUniqueGaugeNames(): string[] {
  const machines = getAllMachines();
  const gauges = new Set(machines.map(m => m.gaugeName));
  return Array.from(gauges);
}

export function getUniqueAvailabilityStatuses(): string[] {
  const machines = getAllMachines();
  const statuses = new Set(machines.map(m => m.availabilityStatus));
  return Array.from(statuses);
}
