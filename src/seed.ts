import dotenv from 'dotenv';

import { connectToDatabase } from './config/db';
import Claim from './models/Claim';
import Policy from './models/Policy';
import User from './models/User';

dotenv.config();

const seed = async (): Promise<void> => {
  await connectToDatabase();

  await Claim.deleteMany({});
  await Policy.deleteMany({});
  await User.deleteMany({});

  const admin = await User.create({
    name: 'Ava Admin',
    email: 'admin@example.com',
    password: 'AdminPass123',
    role: 'admin',
  });

  const adjusterOne = await User.create({
    name: 'Jordan Adjuster',
    email: 'jordan@example.com',
    password: 'Adjuster123',
    role: 'adjuster',
  });

  const adjusterTwo = await User.create({
    name: 'Taylor Claims',
    email: 'taylor@example.com',
    password: 'ClaimsPass123',
    role: 'adjuster',
  });

  const policies = await Policy.insertMany([
    {
      policyNumber: 'AUTO-1001',
      holderName: 'Michael Reed',
      type: 'auto',
      premium: 1240,
      status: 'active',
      effectiveDate: new Date('2026-01-01'),
      expirationDate: new Date('2026-12-31'),
      owner: adjusterOne._id,
    },
    {
      policyNumber: 'HOME-2001',
      holderName: 'Sofia Bennett',
      type: 'home',
      premium: 2150,
      status: 'active',
      effectiveDate: new Date('2026-02-15'),
      expirationDate: new Date('2027-02-14'),
      owner: admin._id,
    },
    {
      policyNumber: 'LIFE-3001',
      holderName: 'Daniel Carter',
      type: 'life',
      premium: 980,
      status: 'expired',
      effectiveDate: new Date('2024-03-01'),
      expirationDate: new Date('2025-02-28'),
      owner: adjusterTwo._id,
    },
    {
      policyNumber: 'AUTO-1002',
      holderName: 'Priya Shah',
      type: 'auto',
      premium: 1435,
      status: 'cancelled',
      effectiveDate: new Date('2025-07-01'),
      expirationDate: new Date('2026-06-30'),
      owner: adjusterOne._id,
    },
    {
      policyNumber: 'HOME-2002',
      holderName: 'Elena Torres',
      type: 'home',
      premium: 1895,
      status: 'active',
      effectiveDate: new Date('2026-05-10'),
      expirationDate: new Date('2027-05-09'),
      owner: admin._id,
    },
  ]);

  const claimsData = [
    {
      policy: policies[0]._id,
      description: 'Rear-end collision with bumper damage',
      incidentDate: new Date('2026-07-04'),
      amount: 3200,
      status: 'submitted' as const,
      assignedTo: adjusterOne._id,
      notes: [
        {
          author: adjusterOne._id,
          text: 'Initial documents received from policy holder.',
          createdAt: new Date('2026-07-05'),
        },
      ],
    },
    {
      policy: policies[1]._id,
      description: 'Storm damage to roof and gutters',
      incidentDate: new Date('2026-06-20'),
      amount: 8700,
      status: 'under-review' as const,
      assignedTo: admin._id,
      notes: [
        {
          author: admin._id,
          text: 'Inspector scheduled for site visit.',
          createdAt: new Date('2026-06-22'),
        },
        {
          author: adjusterTwo._id,
          text: 'Waiting on contractor estimate.',
          createdAt: new Date('2026-06-24'),
        },
      ],
    },
    {
      policy: policies[2]._id,
      description: 'Beneficiary payout request review',
      incidentDate: new Date('2025-01-14'),
      amount: 15000,
      status: 'approved' as const,
      assignedTo: adjusterTwo._id,
      notes: [],
    },
    {
      policy: policies[3]._id,
      description: 'Windshield replacement after road debris impact',
      incidentDate: new Date('2026-03-11'),
      amount: 650,
      status: 'denied' as const,
      assignedTo: adjusterOne._id,
      notes: [
        {
          author: adjusterOne._id,
          text: 'Claim denied due to policy cancellation before incident date.',
          createdAt: new Date('2026-03-13'),
        },
      ],
    },
    {
      policy: policies[4]._id,
      description: 'Kitchen water leak remediation',
      incidentDate: new Date('2026-08-02'),
      amount: 4100,
      status: 'closed' as const,
      assignedTo: admin._id,
      notes: [
        {
          author: admin._id,
          text: 'Payment issued and file closed.',
          createdAt: new Date('2026-08-10'),
        },
      ],
    },
    {
      policy: policies[0]._id,
      description: 'Minor side-panel scrape in parking lot',
      incidentDate: new Date('2026-08-15'),
      amount: 1200,
      status: 'under-review' as const,
      assignedTo: adjusterTwo._id,
      notes: [],
    },
  ];

  for (const claimData of claimsData) {
    const claim = new Claim(claimData);
    await claim.save();
  }

  console.log('Seed completed successfully.');
  console.log('Users: 3');
  console.log('Policies: 5');
  console.log('Claims: 6');
};

void seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([
      Claim.db.close(),
    ]);
  });