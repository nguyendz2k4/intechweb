import type { Product } from '../app/lib/catalog-types'
export const productList: Product[] = [
  {
    slug: 'test-switch',
    name: 'Test Switch',
    brand: 'Cisco',
    category: 'Switch',
    categorySlug: 'switch',
    summary: 'A test-only product',
    badges: ['Switch'],
    specs: ['8 ports', 'Gigabit', 'Managed', 'PoE', 'Rack mount'],
    applications: ['Office'],
    imageUrl: '',
    datasheetUrl: '',
  },
  {
    slug: 'test-firewall',
    name: 'Test Firewall',
    brand: 'Fortinet',
    category: 'Firewall',
    categorySlug: 'firewall',
    summary: 'Test-only firewall',
    badges: ['Security'],
    specs: ['VPN'],
    applications: ['Office'],
    imageUrl: '',
    datasheetUrl: '',
  },
]
