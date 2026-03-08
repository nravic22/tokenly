'use client';

import { useParams } from 'next/navigation';
import Tokenly from '../../components/Tokenly';

export default function VendorLoginPage() {
  const { slug } = useParams();
  return <Tokenly vendorSlug={slug} />;
}
