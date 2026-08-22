export interface Category {
  id: string;
  name: string;
  emoji?: string | null;
  color?: string | null;
  parentId?: string | null;
}

export interface Company {
  syncTalentWorkspaceId?: string | null;
  id: string;
  name: string;
  ruc?: string | null;
  industry?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  clientCount?: number;
  globalCompanyId?: string | null;
  clients?: { id: string; name: string }[];
}

export interface Client {
  id: string;
  companyId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface Person {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  initials?: string | null;
  role?: string | null;
  kind?: string;
  status?: string;
  salary?: string | null;
  notes?: string | null;
}

export interface GlobalCompany {
  id: string;
  name: string;
  ruc?: string | null;
  legalName?: string | null;
  website?: string | null;
  clients?: { id: string; name: string }[];
  contractCount?: number;
}

export interface GlobalClient {
  id: string;
  name: string;
  globalCompanyId?: string | null;
  companyIds?: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  emoji?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Application {
  id: string;
  name: string;
  provider?: string | null;
  category?: string | null;
  url?: string | null;
}
