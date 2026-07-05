import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ShipmentStatusEnum = {
  created: 'created',
  picked_up: 'picked_up',
  in_transit: 'in_transit',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  exception: 'exception',
} as const;

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@trlnow.com' },
    update: {},
    create: {
      email: 'admin@trlnow.com',
      passwordHash: adminPassword,
      name: 'System Administrator',
      role: "ADMIN",
      staffRole: "SUPER_ADMIN",
    },
  });
  console.log(`Seeded admin: ${admin.email}`);

  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@trlnow.com' },
    update: {},
    create: {
      email: 'customer@trlnow.com',
      passwordHash: customerPassword,
      name: 'Alice Customer',
      phone: '07700 123456',
      role: "CUSTOMER",
    },
  });
  console.log(`Seeded customer: ${customer.email}`);

  const branches = await Promise.all([
    prisma.branch.upsert({
      where: { name: 'London Hub' },
      update: {},
      create: { name: 'London Hub', address: '1 TrlNow Way, London, UK', phone: '020 1111 2222', email: 'london@trlnow.com' },
    }),
    prisma.branch.upsert({
      where: { name: 'Manchester Depot' },
      update: {},
      create: { name: 'Manchester Depot', address: '22 Northern Road, Manchester, UK', phone: '0161 222 3333', email: 'manchester@trlnow.com' },
    }),
    prisma.branch.upsert({
      where: { name: 'Birmingham Centre' },
      update: {},
      create: { name: 'Birmingham Centre', address: '45 Midlands Ave, Birmingham, UK', phone: '0121 444 5555', email: 'birmingham@trlnow.com' },
    }),
  ]);
  console.log(`Seeded ${branches.length} branches`);

  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@trlnow.com' },
    update: {},
    create: {
      email: 'staff@trlnow.com',
      passwordHash: staffPassword,
      name: 'Demo Staff',
      role: "STAFF",
      staffRole: "STAFF",
    },
  });
  console.log(`Seeded staff: ${staff.email}`);

  const sampleShipments = [
    {
      trackingNumber: 'TRL-0001-0001',
      senderId: customer.id,
      senderName: 'Alice Customer',
      senderPhone: '07700 123456',
      senderAddress: '12 Customer Lane, London',
      recipientName: 'Bob Recipient',
      recipientPhone: '07700 654321',
      recipientAddress: '99 Receiver Road, Manchester',
      originBranchId: branches[0].id,
      destBranchId: branches[1].id,
      weight: 2.5,
      status: ShipmentStatusEnum.in_transit,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      history: [
        { status: ShipmentStatusEnum.created, description: 'Shipment booked online', location: 'London Hub', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { status: ShipmentStatusEnum.picked_up, description: 'Collected from sender', location: 'London Hub', timestamp: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000) },
        { status: ShipmentStatusEnum.in_transit, description: 'Departed origin facility', location: 'London Hub', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      ],
    },
    {
      trackingNumber: 'TRL-0002-0002',
      senderId: customer.id,
      senderName: 'Alice Customer',
      senderPhone: '07700 123456',
      senderAddress: '12 Customer Lane, London',
      recipientName: 'Carol Receiver',
      recipientPhone: '07700 111222',
      recipientAddress: '33 Delivery Street, Birmingham',
      originBranchId: branches[0].id,
      destBranchId: branches[2].id,
      weight: 1.2,
      status: ShipmentStatusEnum.delivered,
      estimatedDelivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      history: [
        { status: ShipmentStatusEnum.created, description: 'Shipment booked', location: 'London Hub', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { status: ShipmentStatusEnum.picked_up, description: 'Collected from sender', location: 'London Hub', timestamp: new Date(Date.now() - 4.8 * 24 * 60 * 60 * 1000) },
        { status: ShipmentStatusEnum.in_transit, description: 'In transit to destination', location: 'London Hub', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { status: ShipmentStatusEnum.out_for_delivery, description: 'Out for delivery', location: 'Birmingham Centre', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { status: ShipmentStatusEnum.delivered, description: 'Delivered to recipient', location: 'Birmingham Centre', timestamp: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000) },
      ],
    },
  ];

  for (const data of sampleShipments) {
    const { history, ...shipmentData } = data;
    const shipment = await prisma.shipment.upsert({
      where: { trackingNumber: shipmentData.trackingNumber },
      update: {},
      create: shipmentData,
    });

    const existingCount = await prisma.shipmentStatus.count({ where: { shipmentId: shipment.id } });
    if (existingCount === 0) {
      await prisma.shipmentStatus.createMany({
        data: history.map((h) => ({
          shipmentId: shipment.id,
          status: h.status,
          location: h.location,
          description: h.description,
          timestamp: h.timestamp,
        })),
      });
    }
  }
  console.log(`Seeded ${sampleShipments.length} sample shipments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
