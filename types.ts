
export interface Photo {
  url: string; // base64 data URL
  date: string;
}

export interface SubjectInformation {
  name: string;
  dob: string;
  pob: string;
  ssn: string;
  driverLicense: string;
  fbiNumber: string;
  heightWeight: string;
  hairEyes: string;
  supervision: string;
  cfpRestriction: string;
  alerts: string;
  mugshot: Photo | null;
}

export interface AddressEntry {
  address: string;
  source: string;
  doi: string;
}

export interface EmploymentEntry {
  address: string;
  source: string;
  dates: string;
}

export interface PhoneNumberEntry {
  phone: string;
  source: string;
  companyCarrier: string;
  doi: string;
}

export interface Vehicle {
  color: string;
  year: string;
  make: string;
  model: string;
  license: string;
  vin: string;
  expiration: string;
  ro: string; // Registered Owner
}

export interface SocialMediaProfile {
  socialNetwork: string;
  profileHandle: string;
  profileIdNumber: string;
  notes: string;
}

export interface RecentLEInvolvement {
  date: string;
  role: string;
  synopsis: string;
  caseNumber: string;
  notes: string;
}

export interface ProtectiveOrder {
  dateIssued: string;
  type: string;
  respondent: string;
  petitioner: string;
  otherProtectedPersons: string;
  protectedAddresses: string;
  dateServed: string;
}

export interface Warrant {
  dateIssued: string;
  agency: string;
  charge: string;
  class: string;
  extradition: string;
  bail: string;
  warrantNumber: string;
}

export interface CriminalRecordEntry {
  dateOfArrest: string;
  charges: string;
  severity: string;
  agency: string;
  caseNumber: string;
  disposition: string;
}

export interface RelativeAssociate {
  name: string;
  dob: string;
  relationship: string;
  address: string;
  phoneNumber: string;
}

export interface CaseSupportWorkUp {
  subjectInfo: SubjectInformation;
  tattoosMarks: string;
  aliases: string[];
  addresses: AddressEntry[];
  employment: EmploymentEntry[];
  phoneNumbers: PhoneNumberEntry[];
  vehicles: Vehicle[];
  emails: string[];
  socialMediaProfiles: SocialMediaProfile[];
  recentLEInvolvements: RecentLEInvolvement[];
  protectiveOrders: ProtectiveOrder[];
  warrants: Warrant[];
  criminalRecord: CriminalRecordEntry[];
  relativesAssociates: RelativeAssociate[];
  additionalInformation: string;
  databasesSearched: string[];
  otherPhotos: Photo[];
}
