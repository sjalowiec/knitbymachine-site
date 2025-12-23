export type AvailabilityStatus = 
  | 'in_stock' 
  | 'usually_in_stock' 
  | 'on_order' 
  | 'pre_order' 
  | 'limited' 
  | 'backorder' 
  | 'discontinued';

export interface AvailabilityInfo {
  label: string;
  message: string;
  colorClass: string;
}

export function getAvailabilityInfo(
  status: AvailabilityStatus,
  leadTimeMinWeeks?: number | null,
  leadTimeMaxWeeks?: number | null
): AvailabilityInfo {
  const leadTimeText = getLeadTimeText(leadTimeMinWeeks, leadTimeMaxWeeks);

  const statusMap: Record<AvailabilityStatus, AvailabilityInfo> = {
    in_stock: {
      label: 'In Stock',
      message: 'Available and ready to ship.',
      colorClass: 'bg-green-100 text-green-800 border-green-200'
    },
    usually_in_stock: {
      label: 'Usually In Stock',
      message: leadTimeText 
        ? `Typically available. ${leadTimeText}` 
        : 'Typically available with short lead times.',
      colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    on_order: {
      label: 'On Order',
      message: leadTimeText 
        ? `Currently on order. ${leadTimeText}` 
        : 'Currently on order from the manufacturer.',
      colorClass: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    pre_order: {
      label: 'Pre-Order',
      message: leadTimeText 
        ? `Available for pre-order. ${leadTimeText}` 
        : 'Available for pre-order.',
      colorClass: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    limited: {
      label: 'Limited Availability',
      message: 'Limited quantities available.',
      colorClass: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    backorder: {
      label: 'Backorder',
      message: leadTimeText 
        ? `Currently backordered. ${leadTimeText}` 
        : 'Currently backordered.',
      colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    discontinued: {
      label: 'Discontinued',
      message: 'This model has been discontinued.',
      colorClass: 'bg-gray-100 text-gray-600 border-gray-200'
    }
  };

  return statusMap[status] || statusMap.in_stock;
}

function getLeadTimeText(
  minWeeks?: number | null, 
  maxWeeks?: number | null
): string {
  if (!minWeeks && !maxWeeks) return '';
  
  if (minWeeks && maxWeeks) {
    if (minWeeks === maxWeeks) {
      return `Expected in about ${minWeeks} week${minWeeks === 1 ? '' : 's'}.`;
    }
    return `Expected in ${minWeeks}–${maxWeeks} weeks.`;
  }
  
  if (minWeeks) {
    return `Expected in ${minWeeks}+ weeks.`;
  }
  
  if (maxWeeks) {
    return `Expected within ${maxWeeks} week${maxWeeks === 1 ? '' : 's'}.`;
  }
  
  return '';
}
