import type { RegulatoryRule, OperatingSubject } from '../engine/compliance-engine.js';

export const DRIVER_PDP_VALID_RULE: RegulatoryRule = {
  code: 'DRIVER_PDP_VALID',
  description: 'Driver must have a verified, unexpired Professional Driving Permit (PDP)',
  evaluate(input: OperatingSubject) {
    const doc = input.documents.find(d => d.documentType === 'PDP');
    if (!doc) {
      return { passed: false, reason: 'PDP document missing' };
    }
    if (doc.verificationStatus !== 'VERIFIED') {
      return { passed: false, reason: `PDP status is ${doc.verificationStatus}, expected VERIFIED` };
    }
    if (doc.expiresAt && new Date(doc.expiresAt).getTime() < (input.dateTime?.getTime() ?? Date.now())) {
      return { passed: false, reason: 'PDP has expired' };
    }
    return { passed: true };
  },
};

export const VEHICLE_ROADWORTHY_RULE: RegulatoryRule = {
  code: 'VEHICLE_ROADWORTHY',
  description: 'Vehicle must have a verified, unexpired Certificate of Roadworthiness (CRW)',
  evaluate(input: OperatingSubject) {
    const doc = input.documents.find(d => d.documentType === 'ROADWORTHY');
    if (!doc) {
      return { passed: false, reason: 'Roadworthy certificate missing' };
    }
    if (doc.verificationStatus !== 'VERIFIED') {
      return { passed: false, reason: `Roadworthy certificate status is ${doc.verificationStatus}` };
    }
    if (doc.expiresAt && new Date(doc.expiresAt).getTime() < (input.dateTime?.getTime() ?? Date.now())) {
      return { passed: false, reason: 'Roadworthy certificate has expired' };
    }
    return { passed: true };
  },
};

export const VEHICLE_INSURANCE_VALID_RULE: RegulatoryRule = {
  code: 'INSURANCE_VALID',
  description: 'Vehicle must possess valid commercial passenger liability insurance',
  evaluate(input: OperatingSubject) {
    const doc = input.documents.find(d => d.documentType === 'INSURANCE');
    if (!doc) {
      return { passed: false, reason: 'Commercial passenger insurance policy missing' };
    }
    if (doc.verificationStatus !== 'VERIFIED') {
      return { passed: false, reason: `Insurance status is ${doc.verificationStatus}` };
    }
    if (doc.expiresAt && new Date(doc.expiresAt).getTime() < (input.dateTime?.getTime() ?? Date.now())) {
      return { passed: false, reason: 'Insurance policy has expired' };
    }
    return { passed: true };
  },
};

export const OPERATING_AUTHORITY_VALID_RULE: RegulatoryRule = {
  code: 'OPERATING_AUTHORITY_VALID',
  description: 'Vehicle or platform operator must possess valid Operating Licence or NPTR operating credentials',
  evaluate(input: OperatingSubject) {
    const doc = input.documents.find(d => d.documentType === 'OPERATING_LICENCE');
    if (!doc) {
      return { passed: false, reason: 'Operating Licence document missing' };
    }
    if (doc.verificationStatus !== 'VERIFIED') {
      return { passed: false, reason: `Operating Licence status is ${doc.verificationStatus}` };
    }
    if (doc.expiresAt && new Date(doc.expiresAt).getTime() < (input.dateTime?.getTime() ?? Date.now())) {
      return { passed: false, reason: 'Operating licence has expired' };
    }
    return { passed: true };
  },
};

export const SEVEN_SEATER_CAPABILITY_RULE: RegulatoryRule = {
  code: 'SEVEN_SEATER_CAPABILITY_GRANTED',
  description: 'Vehicle and operation must possess SEVEN_SEATER capability grant for 7-seater dispatch',
  evaluate(input: OperatingSubject) {
    if (input.serviceType.includes('SEVEN_SEATER')) {
      if (!input.capabilities.includes('SEVEN_SEATER')) {
        return { passed: false, reason: 'Vehicle does not have SEVEN_SEATER capability granted' };
      }
    }
    return { passed: true };
  },
};
