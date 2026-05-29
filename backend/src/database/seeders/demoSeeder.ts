import { initializeModels } from '../models';
import { sequelize } from '../../config/database';

type DemoUserSeed = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'OWNER' | 'TENANT';
  phoneNumber?: string;
};

type DemoUnitSeed = {
  unitIdentifier: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqMeters?: number;
  rentAmount: number;
  depositAmount?: number;
  status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | 'UNAVAILABLE';
  description: string;
  amenities?: string[];
  floorNumber?: number;
};

type DemoBuildingSeed = {
  ownerEmail: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  addressCity: string;
  addressStreet: string;
  addressSubCity: string;
  addressWoreda: string;
  addressHouseNumber: string;
  buildingDetails: {
    buildingType: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'OFFICE' | 'WAREHOUSE';
    totalFloors: number;
    totalUnits: number;
    hasParking: boolean;
    hasElevator: boolean;
    hasSecurity: boolean;
    yearBuilt: number;
    amenities: string[];
  };
  units: DemoUnitSeed[];
};

type DemoVehicleSeed = {
  ownerEmail: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  addressCity: string;
  addressStreet: string;
  addressSubCity: string;
  addressWoreda: string;
  addressHouseNumber?: string;
  vehicleDetails: {
    plateNumber: string;
    vehicleType: 'SEDAN' | 'SUV' | 'TRUCK' | 'MOTORCYCLE' | 'VAN' | 'BUS';
    brand: string;
    model: string;
    manufactureYear: number;
    color: string;
    transmissionType: 'MANUAL' | 'AUTOMATIC';
    fuelType: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
    engineCapacity?: string;
    mileage?: number;
  };
};

const demoUsers: DemoUserSeed[] = [
  {
    email: 'admin@demo.local',
    password: 'admin123',
    firstName: 'System',
    lastName: 'Admin',
    role: 'ADMIN',
  },
  {
    email: 'owner@demo.local',
    password: 'owner123',
    firstName: 'Demo',
    lastName: 'Owner',
    role: 'OWNER',
    phoneNumber: '+251911000001',
  },
  {
    email: 'hana.owner@demo.local',
    password: 'owner123',
    firstName: 'Hana',
    lastName: 'Bekele',
    role: 'OWNER',
    phoneNumber: '+251911000003',
  },
  {
    email: 'dawit.owner@demo.local',
    password: 'owner123',
    firstName: 'Dawit',
    lastName: 'Kebede',
    role: 'OWNER',
    phoneNumber: '+251911000004',
  },
  {
    email: 'selam.owner@demo.local',
    password: 'owner123',
    firstName: 'Selam',
    lastName: 'Tadesse',
    role: 'OWNER',
    phoneNumber: '+251911000005',
  },
  {
    email: 'tenant@demo.local',
    password: 'tenant123',
    firstName: 'Demo',
    lastName: 'Tenant',
    role: 'TENANT',
    phoneNumber: '+251911000002',
  },
  {
    email: 'liya.tenant@demo.local',
    password: 'tenant123',
    firstName: 'Liya',
    lastName: 'Mekonnen',
    role: 'TENANT',
    phoneNumber: '+251911000006',
  },
  {
    email: 'samuel.tenant@demo.local',
    password: 'tenant123',
    firstName: 'Samuel',
    lastName: 'Abebe',
    role: 'TENANT',
    phoneNumber: '+251911000007',
  },
  {
    email: 'betty.tenant@demo.local',
    password: 'tenant123',
    firstName: 'Betty',
    lastName: 'Solomon',
    role: 'TENANT',
    phoneNumber: '+251911000008',
  },
];

const demoBuildings: DemoBuildingSeed[] = [
  {
    ownerEmail: 'owner@demo.local',
    title: 'Sunrise Demo Apartments',
    description: 'Well-lit apartment block close to the airport road with mixed family units.',
    status: 'ACTIVE',
    addressCity: 'Addis Ababa',
    addressStreet: 'Bole Road',
    addressSubCity: 'Bole',
    addressWoreda: '03',
    addressHouseNumber: '22',
    buildingDetails: {
      buildingType: 'APARTMENT',
      totalFloors: 6,
      totalUnits: 24,
      hasParking: true,
      hasElevator: true,
      hasSecurity: true,
      yearBuilt: 2021,
      amenities: ['Generator', 'Water tank', 'Guard room'],
    },
    units: [
      {
        unitIdentifier: 'A-101',
        bedrooms: 1,
        bathrooms: 1,
        areaSqMeters: 58,
        rentAmount: 6500,
        depositAmount: 13000,
        status: 'VACANT',
        description: 'Compact starter apartment near the main entrance.',
        amenities: ['Balcony', 'Storage'],
        floorNumber: 1,
      },
      {
        unitIdentifier: 'A-204',
        bedrooms: 2,
        bathrooms: 1,
        areaSqMeters: 84,
        rentAmount: 8900,
        depositAmount: 17800,
        status: 'OCCUPIED',
        description: 'Mid-size apartment with open kitchen and east-facing windows.',
        amenities: ['Built-in cabinets', 'Laundry nook'],
        floorNumber: 2,
      },
      {
        unitIdentifier: 'A-305',
        bedrooms: 3,
        bathrooms: 2,
        areaSqMeters: 112,
        rentAmount: 13200,
        depositAmount: 26400,
        status: 'VACANT',
        description: 'Large family apartment with city views.',
        amenities: ['City view', 'Balcony', 'Master ensuite'],
        floorNumber: 3,
      },
      {
        unitIdentifier: 'A-402',
        bedrooms: 2,
        bathrooms: 2,
        areaSqMeters: 96,
        rentAmount: 11800,
        depositAmount: 23600,
        status: 'MAINTENANCE',
        description: 'Unit temporarily under repainting and plumbing fixes.',
        amenities: ['Corner windows'],
        floorNumber: 4,
      },
    ],
  },
  {
    ownerEmail: 'owner@demo.local',
    title: 'Kazanchis Heights Residence',
    description: 'Modern residential block suited for professionals working downtown.',
    status: 'ACTIVE',
    addressCity: 'Addis Ababa',
    addressStreet: 'Kazanchis Avenue',
    addressSubCity: 'Kirkos',
    addressWoreda: '08',
    addressHouseNumber: '17',
    buildingDetails: {
      buildingType: 'APARTMENT',
      totalFloors: 9,
      totalUnits: 36,
      hasParking: true,
      hasElevator: true,
      hasSecurity: true,
      yearBuilt: 2023,
      amenities: ['Rooftop lounge', 'Backup generator', 'CCTV'],
    },
    units: [
      {
        unitIdentifier: 'K-203',
        bedrooms: 1,
        bathrooms: 1,
        areaSqMeters: 62,
        rentAmount: 9200,
        depositAmount: 18400,
        status: 'VACANT',
        description: 'Downtown one-bedroom apartment with strong internet coverage.',
        amenities: ['Wi-Fi ready', 'Built-in kitchen'],
        floorNumber: 2,
      },
      {
        unitIdentifier: 'K-507',
        bedrooms: 2,
        bathrooms: 2,
        areaSqMeters: 101,
        rentAmount: 14800,
        depositAmount: 29600,
        status: 'VACANT',
        description: 'Executive two-bedroom apartment with lounge access.',
        amenities: ['Gym access', 'Master ensuite'],
        floorNumber: 5,
      },
      {
        unitIdentifier: 'K-801',
        bedrooms: 3,
        bathrooms: 2,
        areaSqMeters: 128,
        rentAmount: 18200,
        depositAmount: 36400,
        status: 'UNAVAILABLE',
        description: 'Reserved penthouse-style unit for upcoming furnished demo.',
        amenities: ['Panoramic view', 'Private terrace'],
        floorNumber: 8,
      },
    ],
  },
  {
    ownerEmail: 'hana.owner@demo.local',
    title: 'CMC Family Courtyard Homes',
    description: 'Low-rise family compound with larger units and outdoor play space.',
    status: 'INACTIVE',
    addressCity: 'Addis Ababa',
    addressStreet: 'CMC Ring Road',
    addressSubCity: 'Yeka',
    addressWoreda: '11',
    addressHouseNumber: '44',
    buildingDetails: {
      buildingType: 'HOUSE',
      totalFloors: 2,
      totalUnits: 8,
      hasParking: true,
      hasElevator: false,
      hasSecurity: true,
      yearBuilt: 2018,
      amenities: ['Shared garden', 'Water reserve'],
    },
    units: [
      {
        unitIdentifier: 'C-01',
        bedrooms: 3,
        bathrooms: 2,
        areaSqMeters: 136,
        rentAmount: 12000,
        depositAmount: 24000,
        status: 'VACANT',
        description: 'Ground floor family home facing the courtyard.',
        amenities: ['Private yard', 'Pantry'],
        floorNumber: 0,
      },
      {
        unitIdentifier: 'C-02',
        bedrooms: 4,
        bathrooms: 3,
        areaSqMeters: 168,
        rentAmount: 15800,
        depositAmount: 31600,
        status: 'VACANT',
        description: 'Large family unit currently hidden from tenant searches while inactive.',
        amenities: ['Servant quarter', 'Garden access'],
        floorNumber: 1,
      },
    ],
  },
  {
    ownerEmail: 'hana.owner@demo.local',
    title: 'Lebu Courtyard Lofts',
    description: 'Mixed residential block undergoing selective upgrades.',
    status: 'MAINTENANCE',
    addressCity: 'Addis Ababa',
    addressStreet: 'Lebu Main Street',
    addressSubCity: 'Nifas Silk',
    addressWoreda: '05',
    addressHouseNumber: '91',
    buildingDetails: {
      buildingType: 'APARTMENT',
      totalFloors: 4,
      totalUnits: 16,
      hasParking: true,
      hasElevator: false,
      hasSecurity: false,
      yearBuilt: 2016,
      amenities: ['Courtyard', 'Rooftop drying area'],
    },
    units: [
      {
        unitIdentifier: 'L-102',
        bedrooms: 1,
        bathrooms: 1,
        areaSqMeters: 49,
        rentAmount: 5200,
        depositAmount: 10400,
        status: 'MAINTENANCE',
        description: 'Studio-style loft temporarily unavailable during repairs.',
        amenities: ['Courtyard access'],
        floorNumber: 1,
      },
      {
        unitIdentifier: 'L-203',
        bedrooms: 2,
        bathrooms: 1,
        areaSqMeters: 78,
        rentAmount: 7600,
        depositAmount: 15200,
        status: 'UNAVAILABLE',
        description: 'Held off market while the building common areas are upgraded.',
        amenities: ['Corner unit'],
        floorNumber: 2,
      },
    ],
  },
  {
    ownerEmail: 'dawit.owner@demo.local',
    title: 'Adama Transit Flats',
    description: 'Affordable apartments near the industrial corridor and bus routes.',
    status: 'ACTIVE',
    addressCity: 'Adama',
    addressStreet: 'Mebrat Road',
    addressSubCity: 'Kebele 07',
    addressWoreda: '07',
    addressHouseNumber: '12',
    buildingDetails: {
      buildingType: 'APARTMENT',
      totalFloors: 5,
      totalUnits: 25,
      hasParking: true,
      hasElevator: false,
      hasSecurity: true,
      yearBuilt: 2019,
      amenities: ['Laundry area', 'Water tank'],
    },
    units: [
      {
        unitIdentifier: 'T-103',
        bedrooms: 1,
        bathrooms: 1,
        areaSqMeters: 46,
        rentAmount: 3800,
        depositAmount: 7600,
        status: 'VACANT',
        description: 'Budget-friendly one-bedroom for single tenants.',
        amenities: ['Near gate'],
        floorNumber: 1,
      },
      {
        unitIdentifier: 'T-207',
        bedrooms: 2,
        bathrooms: 1,
        areaSqMeters: 73,
        rentAmount: 5600,
        depositAmount: 11200,
        status: 'OCCUPIED',
        description: 'Popular two-bedroom layout with shaded balcony.',
        amenities: ['Balcony'],
        floorNumber: 2,
      },
      {
        unitIdentifier: 'T-404',
        bedrooms: 3,
        bathrooms: 2,
        areaSqMeters: 98,
        rentAmount: 7600,
        depositAmount: 15200,
        status: 'VACANT',
        description: 'Large unit suitable for families relocating to Adama.',
        amenities: ['Store room', 'Dual balcony'],
        floorNumber: 4,
      },
    ],
  },
  {
    ownerEmail: 'dawit.owner@demo.local',
    title: 'Hawassa Lake View Suites',
    description: 'Higher-end apartments with lake-facing balconies and newer finishes.',
    status: 'ACTIVE',
    addressCity: 'Hawassa',
    addressStreet: 'Lake Side Boulevard',
    addressSubCity: 'Tabor',
    addressWoreda: '02',
    addressHouseNumber: '5',
    buildingDetails: {
      buildingType: 'APARTMENT',
      totalFloors: 7,
      totalUnits: 28,
      hasParking: true,
      hasElevator: true,
      hasSecurity: true,
      yearBuilt: 2022,
      amenities: ['Lake view', 'Backup power', 'Reception'],
    },
    units: [
      {
        unitIdentifier: 'H-201',
        bedrooms: 1,
        bathrooms: 1,
        areaSqMeters: 64,
        rentAmount: 9800,
        depositAmount: 19600,
        status: 'VACANT',
        description: 'Premium one-bedroom with direct morning light.',
        amenities: ['Lake view', 'Built-in wardrobes'],
        floorNumber: 2,
      },
      {
        unitIdentifier: 'H-402',
        bedrooms: 2,
        bathrooms: 2,
        areaSqMeters: 108,
        rentAmount: 14500,
        depositAmount: 29000,
        status: 'OCCUPIED',
        description: 'Two-bedroom suite frequently requested by remote workers.',
        amenities: ['Lake view', 'Dedicated workspace'],
        floorNumber: 4,
      },
      {
        unitIdentifier: 'H-603',
        bedrooms: 3,
        bathrooms: 2,
        areaSqMeters: 142,
        rentAmount: 18900,
        depositAmount: 37800,
        status: 'VACANT',
        description: 'Top-floor family suite with wide balcony.',
        amenities: ['Lake view', 'Large balcony', 'Pantry'],
        floorNumber: 6,
      },
    ],
  },
  {
    ownerEmail: 'selam.owner@demo.local',
    title: 'Bahir Dar Riverside Villas',
    description: 'Spacious townhouse-style rentals for long-stay family leases.',
    status: 'ACTIVE',
    addressCity: 'Bahir Dar',
    addressStreet: 'Abay Riverside',
    addressSubCity: 'Kebele 14',
    addressWoreda: '14',
    addressHouseNumber: '3',
    buildingDetails: {
      buildingType: 'HOUSE',
      totalFloors: 2,
      totalUnits: 6,
      hasParking: true,
      hasElevator: false,
      hasSecurity: true,
      yearBuilt: 2020,
      amenities: ['Private parking', 'Garden strip', 'River access road'],
    },
    units: [
      {
        unitIdentifier: 'R-01',
        bedrooms: 3,
        bathrooms: 2,
        areaSqMeters: 154,
        rentAmount: 12500,
        depositAmount: 25000,
        status: 'VACANT',
        description: 'Three-bedroom villa with private front patio.',
        amenities: ['Private patio', 'Garden strip'],
        floorNumber: 0,
      },
      {
        unitIdentifier: 'R-02',
        bedrooms: 4,
        bathrooms: 3,
        areaSqMeters: 188,
        rentAmount: 16800,
        depositAmount: 33600,
        status: 'OCCUPIED',
        description: 'Large corner villa with extra storage and shaded parking.',
        amenities: ['Corner lot', 'Covered parking', 'Pantry'],
        floorNumber: 0,
      },
    ],
  },
  {
    ownerEmail: 'selam.owner@demo.local',
    title: 'Dire Dawa Commerce Center',
    description: 'Flexible office and mixed-use rental block for small businesses.',
    status: 'ACTIVE',
    addressCity: 'Dire Dawa',
    addressStreet: 'Sabian Main Road',
    addressSubCity: 'Sabian',
    addressWoreda: '01',
    addressHouseNumber: '66',
    buildingDetails: {
      buildingType: 'OFFICE',
      totalFloors: 3,
      totalUnits: 12,
      hasParking: true,
      hasElevator: false,
      hasSecurity: true,
      yearBuilt: 2017,
      amenities: ['Reception desk', 'Shared meeting room'],
    },
    units: [
      {
        unitIdentifier: 'D-1A',
        bathrooms: 1,
        areaSqMeters: 42,
        rentAmount: 4800,
        depositAmount: 9600,
        status: 'VACANT',
        description: 'Small office suite for startups or consulting teams.',
        amenities: ['Reception access'],
        floorNumber: 1,
      },
      {
        unitIdentifier: 'D-2B',
        bathrooms: 1,
        areaSqMeters: 68,
        rentAmount: 7200,
        depositAmount: 14400,
        status: 'VACANT',
        description: 'Mid-size office with road-facing signage opportunity.',
        amenities: ['Road-facing windows', 'Meeting room access'],
        floorNumber: 2,
      },
      {
        unitIdentifier: 'D-3C',
        bathrooms: 2,
        areaSqMeters: 102,
        rentAmount: 10500,
        depositAmount: 21000,
        status: 'OCCUPIED',
        description: 'Larger office floor currently leased to a logistics firm.',
        amenities: ['Private washroom', 'Corner office'],
        floorNumber: 3,
      },
    ],
  },
];

const demoVehicles: DemoVehicleSeed[] = [
  {
    ownerEmail: 'owner@demo.local',
    title: 'Toyota Corolla 2021',
    description: 'Reliable city sedan for monthly rental with low fuel consumption.',
    status: 'ACTIVE',
    addressCity: 'Addis Ababa',
    addressStreet: 'Mexico',
    addressSubCity: 'Kirkos',
    addressWoreda: '08',
    addressHouseNumber: '14',
    vehicleDetails: {
      plateNumber: 'AA-20011',
      vehicleType: 'SEDAN',
      brand: 'Toyota',
      model: 'Corolla',
      manufactureYear: 2021,
      color: 'Silver',
      transmissionType: 'AUTOMATIC',
      fuelType: 'PETROL',
      engineCapacity: '1.8L',
      mileage: 42000,
    },
  },
  {
    ownerEmail: 'hana.owner@demo.local',
    title: 'Hyundai Tucson 2022',
    description: 'Comfortable SUV suited for family use and regional travel.',
    status: 'ACTIVE',
    addressCity: 'Addis Ababa',
    addressStreet: 'Summit Road',
    addressSubCity: 'Yeka',
    addressWoreda: '10',
    addressHouseNumber: '9',
    vehicleDetails: {
      plateNumber: 'AA-33445',
      vehicleType: 'SUV',
      brand: 'Hyundai',
      model: 'Tucson',
      manufactureYear: 2022,
      color: 'Blue',
      transmissionType: 'AUTOMATIC',
      fuelType: 'PETROL',
      engineCapacity: '2.0L',
      mileage: 28000,
    },
  },
  {
    ownerEmail: 'dawit.owner@demo.local',
    title: 'Isuzu D-Max 2019',
    description: 'Pickup truck for cargo and field work, currently under servicing.',
    status: 'MAINTENANCE',
    addressCity: 'Adama',
    addressStreet: 'Industrial Zone',
    addressSubCity: 'Kebele 06',
    addressWoreda: '06',
    addressHouseNumber: '27',
    vehicleDetails: {
      plateNumber: 'OR-77881',
      vehicleType: 'TRUCK',
      brand: 'Isuzu',
      model: 'D-Max',
      manufactureYear: 2019,
      color: 'White',
      transmissionType: 'MANUAL',
      fuelType: 'DIESEL',
      engineCapacity: '2.5L',
      mileage: 86000,
    },
  },
  {
    ownerEmail: 'selam.owner@demo.local',
    title: 'Yamaha NMAX 2023',
    description: 'Compact scooter for short city commutes, paused from active listing.',
    status: 'INACTIVE',
    addressCity: 'Hawassa',
    addressStreet: 'Piassa Link',
    addressSubCity: 'Hayek Dar',
    addressWoreda: '04',
    addressHouseNumber: '2',
    vehicleDetails: {
      plateNumber: 'SN-11004',
      vehicleType: 'MOTORCYCLE',
      brand: 'Yamaha',
      model: 'NMAX',
      manufactureYear: 2023,
      color: 'Black',
      transmissionType: 'AUTOMATIC',
      fuelType: 'PETROL',
      engineCapacity: '155cc',
      mileage: 9000,
    },
  },
  {
    ownerEmail: 'selam.owner@demo.local',
    title: 'Ford Transit 2020',
    description: 'Passenger van useful for teams, school runs, or airport transfers.',
    status: 'ACTIVE',
    addressCity: 'Bahir Dar',
    addressStreet: 'Station Road',
    addressSubCity: 'Kebele 12',
    addressWoreda: '12',
    addressHouseNumber: '18',
    vehicleDetails: {
      plateNumber: 'BD-55421',
      vehicleType: 'VAN',
      brand: 'Ford',
      model: 'Transit',
      manufactureYear: 2020,
      color: 'White',
      transmissionType: 'MANUAL',
      fuelType: 'DIESEL',
      engineCapacity: '2.2L',
      mileage: 64000,
    },
  },
];

export async function runDemoSeeder(): Promise<void> {
  const {
    User,
    Property,
    PropertyBuilding,
    PropertyVehicle,
    RentalUnit,
  } = initializeModels(sequelize);

  const usersByEmail = new Map<string, { id: string; email: string; role: string }>();

  for (const userSeed of demoUsers) {
    const [user] = await User.findOrCreate({
      where: { email: userSeed.email },
      defaults: {
        email: userSeed.email,
        password: userSeed.password,
        firstName: userSeed.firstName,
        lastName: userSeed.lastName,
        role: userSeed.role,
        accountStatus: 'ACTIVE',
        phoneNumber: userSeed.phoneNumber,
      },
    });

    usersByEmail.set(user.email, { id: user.id, email: user.email, role: user.role });
  }

  let propertyCount = 0;
  let unitCount = 0;
  let vehicleCount = 0;

  for (const buildingSeed of demoBuildings) {
    const owner = usersByEmail.get(buildingSeed.ownerEmail);
    if (!owner) {
      throw new Error(`Demo seeder owner not found: ${buildingSeed.ownerEmail}`);
    }

    const [property] = await Property.findOrCreate({
      where: { ownerId: owner.id, title: buildingSeed.title },
      defaults: {
        ownerId: owner.id,
        title: buildingSeed.title,
        description: buildingSeed.description,
        type: 'BUILDING',
        addressCity: buildingSeed.addressCity,
        addressStreet: buildingSeed.addressStreet,
        addressSubCity: buildingSeed.addressSubCity,
        addressWoreda: buildingSeed.addressWoreda,
        addressHouseNumber: buildingSeed.addressHouseNumber,
        status: buildingSeed.status,
      },
    });

    propertyCount += 1;

    await PropertyBuilding.findOrCreate({
      where: { propertyId: property.id },
      defaults: {
        propertyId: property.id,
        ...buildingSeed.buildingDetails,
      },
    });

    for (const unitSeed of buildingSeed.units) {
      await RentalUnit.findOrCreate({
        where: {
          propertyId: property.id,
          unitIdentifier: unitSeed.unitIdentifier,
        },
        defaults: {
          propertyId: property.id,
          unitIdentifier: unitSeed.unitIdentifier,
          bedrooms: unitSeed.bedrooms,
          bathrooms: unitSeed.bathrooms,
          areaSqMeters: unitSeed.areaSqMeters,
          rentAmount: unitSeed.rentAmount,
          depositAmount: unitSeed.depositAmount,
          status: unitSeed.status,
          description: unitSeed.description,
          amenities: unitSeed.amenities,
          floorNumber: unitSeed.floorNumber,
        },
      });

      unitCount += 1;
    }
  }

  for (const vehicleSeed of demoVehicles) {
    const owner = usersByEmail.get(vehicleSeed.ownerEmail);
    if (!owner) {
      throw new Error(`Demo seeder owner not found: ${vehicleSeed.ownerEmail}`);
    }

    const [property] = await Property.findOrCreate({
      where: { ownerId: owner.id, title: vehicleSeed.title },
      defaults: {
        ownerId: owner.id,
        title: vehicleSeed.title,
        description: vehicleSeed.description,
        type: 'VEHICLE',
        addressCity: vehicleSeed.addressCity,
        addressStreet: vehicleSeed.addressStreet,
        addressSubCity: vehicleSeed.addressSubCity,
        addressWoreda: vehicleSeed.addressWoreda,
        addressHouseNumber: vehicleSeed.addressHouseNumber,
        status: vehicleSeed.status,
      },
    });

    propertyCount += 1;
    vehicleCount += 1;

    await PropertyVehicle.findOrCreate({
      where: { propertyId: property.id },
      defaults: {
        propertyId: property.id,
        ...vehicleSeed.vehicleDetails,
      },
    });
  }

  console.log('Demo seed completed successfully.');
  console.log(`Users seeded: ${demoUsers.length}`);
  console.log(`Properties seeded: ${propertyCount} (${demoBuildings.length} buildings, ${vehicleCount} vehicles)`);
  console.log(`Rental units seeded: ${unitCount}`);
  console.log('Demo credentials:');
  console.log('  Admin: admin@demo.local / admin123');
  console.log('  Owners: owner@demo.local / owner123');
  console.log('          hana.owner@demo.local / owner123');
  console.log('          dawit.owner@demo.local / owner123');
  console.log('          selam.owner@demo.local / owner123');
  console.log('  Tenants: tenant@demo.local / tenant123');
  console.log('           liya.tenant@demo.local / tenant123');
  console.log('           samuel.tenant@demo.local / tenant123');
  console.log('           betty.tenant@demo.local / tenant123');
}
