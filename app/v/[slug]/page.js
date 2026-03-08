'use client';

import { use } from 'react';
import Tokenly from '../../components/Tokenly';

export default function VendorLoginPage({ params }) {
  const { slug } = use(params);
  return <Tokenly vendorSlug={slug} />;
}
