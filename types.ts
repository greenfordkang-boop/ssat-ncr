
export type NCRStatus = 'Open' | 'Closed' | 'Delay';

export enum Type {
  TYPE_UNSPECIFIED = 'TYPE_UNSPECIFIED',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
  NULL = 'NULL',
}

export interface NCRAttachment {
  name: string;
  data: string; // Base64 encoded string
  type: string;
}

export interface EightDData {
  docNo: string;
  lastUpdate: string;
  relatedPerson: {
    actionDetail: string;
    assemblyTeam: string;
    developmentTeam: string;
  };
  sevenW: {
    who: string;
    what: string;
    when: string;
    where: string;
    why: string;
    howMany: string;
    howOften: string;
  };
  // Step 3
  containment: string;
  // Step 4
  rootCause: {
    whyHappened: string[];
    whyNotDetected: string[];
    diagramInfo?: string;
  };
  // Step 5
  countermeasures: Array<{
    type: 'Prevent' | 'Detection';
    action: string;
    owner: string;
    complete: string;
    implement: string;
    status: string;
  }>;
  // Step 6
  verification: Array<{
    item: string;
    yes: boolean;
    no: boolean;
    date: string;
  }>;
  // Step 7
  prevention: Array<{
    standard: string;
    owner: string;
    complete: string;
    readAcross: string;
    raOwner: string;
    raComplete: string;
  }>;
  // Step 8
  reviewAndConfirm: string;
  approvals: {
    madeBy: string;
    reviewBy: string;
    approveBy: string;
    date: string;
  };
}

export interface NCREntry {
  id: string;
  month: number;
  day: number;
  source: string;
  customer: string;
  model: string;
  partName: string;
  partNo: string;
  defectContent: string;
  outflowCause: string;
  rootCause: string;
  countermeasure: string;
  planDate: string;
  resultDate: string;
  effectivenessCheck: string;
  status: NCRStatus;
  progressRate: number;
  remarks: string;
  attachments: NCRAttachment[]; 
  effectivenessAttachment?: NCRAttachment;
  eightDData?: EightDData;
}

export interface CustomerSummary {
  customer: string;
  customerCount: number;
  newCount: number;
  internalCount: number;
  total: number;
  close: number;
  open: number;
  delay: number;
  progressRate: number;
}
