export const COMPONENTS = [
  { 
    key: 'cpu',         
    label: 'CPU',          
    slug: 'processors',
    icon: '🔧',
    description: 'The brain of your computer',
    compatibility: ['motherboard'],
    required: true
  },
  { 
    key: 'cooler',      
    label: 'Cooling',   
    slug: ['air-cooler', 'liquid-cooler'],
    tabNames: ['Air Cooler', 'Liquid Cooler'],
    icon: '❄️',
    description: 'Keep your CPU cool',
    compatibility: ['cpu', 'case'],
    required: true
  },
  { 
    key: 'fans', 
    label: 'System Fans',  
    slug: 'case-fan',
    icon: '🌪️',
    description: 'Additional case ventilation',
    multi: true,
    required: false
  },
  { 
    key: 'motherboard', 
    label: 'Motherboard',  
    slug: ['amd-motherboards', 'intel-motherboards'],
    tabNames: ['AMD', 'Intel'],
    icon: '🔌',
    description: 'Connects all components',
    compatibility: ['cpu', 'memory', 'gpu'],
    required: true
  },
  { 
    key: 'memory',      
    label: 'Memory (RAM)',       
    slug: 'memory',
    attrType: 'memory-type',
    attrCap: 'memory-size',
    icon: '💾',
    description: 'System memory for multitasking',
    multi: false,
    required: true
  },
  { 
    key: 'storage',     
    label: 'Storage',      
    slug: ['ssd', 'desktop-hard-drives'],
    tabNames: ['SSD', 'HDD'],
    icon: '💿',
    description: 'Store your files and programs',
    multi: true,
    required: false
  },
  { 
    key: 'bootdrive',         
    label: 'Operating System Drive',   
    slug: 'ssd',
    icon: '⚡',
    description: 'Primary drive for OS',
    multi: false,
    required: true
  },
  { 
    key: 'gpu',         
    label: 'Graphics Card',   
    slug: 'graphics-cards',
    icon: '🎮',
    description: 'Graphics processing power',
    compatibility: ['motherboard', 'psu'],
    required: false
  },
  { 
    key: 'case',        
    label: 'Case',         
    slug: 'computer-casings',
    icon: '📦',
    description: 'Houses all components',
    compatibility: ['motherboard', 'gpu', 'cooler'],
    required: true
  },
  { 
    key: 'psu',         
    label: 'Power Supply', 
    slug: 'power-supply',
    icon: '⚡',
    description: 'Powers your entire system',
    compatibility: ['gpu'],
    required: true
  },
];

// Component categories for organization
export const COMPONENT_CATEGORIES = {
  CORE: ['cpu', 'motherboard', 'memory', 'bootdrive'],
  PERFORMANCE: ['gpu', 'storage'],
  COOLING: ['cooler', 'fans'],
  INFRASTRUCTURE: ['case', 'psu']
};

// Validation rules
export const VALIDATION_RULES = {
  cpu: {
    requiresCompatible: ['motherboard'],
    powerRequirement: true
  },
  gpu: {
    requiresCompatible: ['motherboard', 'psu'],
    powerRequirement: true,
    sizeCheck: ['case']
  },
  memory: {
    requiresCompatible: ['motherboard'],
    capacityCheck: true
  }
};