import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface ShippingAddressFormProps {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
  errors?: Partial<Record<keyof ShippingAddress, string>>;
}

const countries = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AE', name: 'United Arab Emirates' },
];

export default function ShippingAddressForm({ address, onChange, errors }: ShippingAddressFormProps) {
  const updateField = (field: keyof ShippingAddress, value: string) => {
    onChange({ ...address, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold text-foreground">Shipping Address</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            value={address.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            className={errors?.fullName ? 'border-destructive' : ''}
          />
          {errors?.fullName && (
            <p className="text-xs text-destructive mt-1">{errors.fullName}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+234 800 000 0000"
            value={address.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className={errors?.phone ? 'border-destructive' : ''}
          />
          {errors?.phone && (
            <p className="text-xs text-destructive mt-1">{errors.phone}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            placeholder="123 Main Street, Apt 4B"
            value={address.address}
            onChange={(e) => updateField('address', e.target.value)}
            className={errors?.address ? 'border-destructive' : ''}
          />
          {errors?.address && (
            <p className="text-xs text-destructive mt-1">{errors.address}</p>
          )}
        </div>

        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="Lagos"
            value={address.city}
            onChange={(e) => updateField('city', e.target.value)}
            className={errors?.city ? 'border-destructive' : ''}
          />
          {errors?.city && (
            <p className="text-xs text-destructive mt-1">{errors.city}</p>
          )}
        </div>

        <div>
          <Label htmlFor="state">State / Province</Label>
          <Input
            id="state"
            placeholder="Lagos State"
            value={address.state}
            onChange={(e) => updateField('state', e.target.value)}
            className={errors?.state ? 'border-destructive' : ''}
          />
          {errors?.state && (
            <p className="text-xs text-destructive mt-1">{errors.state}</p>
          )}
        </div>

        <div>
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            placeholder="100001"
            value={address.postalCode}
            onChange={(e) => updateField('postalCode', e.target.value)}
            className={errors?.postalCode ? 'border-destructive' : ''}
          />
          {errors?.postalCode && (
            <p className="text-xs text-destructive mt-1">{errors.postalCode}</p>
          )}
        </div>

        <div>
          <Label htmlFor="country">Country</Label>
          <Select
            value={address.country}
            onValueChange={(value) => updateField('country', value)}
          >
            <SelectTrigger className={errors?.country ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.country && (
            <p className="text-xs text-destructive mt-1">{errors.country}</p>
          )}
        </div>
      </div>
    </div>
  );
}
