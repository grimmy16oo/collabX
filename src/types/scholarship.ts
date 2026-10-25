export interface ScholarshipTracker {
  _id?: string;
  status: 'saved' | 'preparing' | 'applied' | 'interviewing' | 'awarded' | 'rejected';
  notes?: string;
  reminderDate?: string;
  savedAt?: string;
}

export interface Scholarship {
  id: string;
  title: string;
  provider_name: string;
  country: string;
  study_levels: string[];
  fields_of_study: string[];
  eligible_countries: string[];
  eligibility_requirements?: {
    minimum_cgpa?: number;
    cgpa_scale?: number;
    degrees?: string[];
    fields?: string[];
    languages?: string[];
    nationalities?: string[];
    other?: string[];
  };
  award_amount: string;
  currency: string;
  benefits: string[];
  deadline: string;
  deadline_timezone: string;
  source_url: string;
  application_url: string;
  last_verified_at: string;
  tracker?: ScholarshipTracker;
}
