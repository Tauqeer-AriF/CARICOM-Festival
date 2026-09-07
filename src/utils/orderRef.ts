import { FormSubmissionItem } from '../types';

/**
 * Returns the canonical reference string for any submission or pass order.
 * Follows the standard festival protocol:
 * 1. submission.extraDetails.OrderRef
 * 2. submission.extraDetails.Reference
 * 3. Fallback based on submission type / ID (e.g., GCF-XXXX, REG-XXXX, INQ-XXXX, TRN-XXXX)
 */
export function getSubmissionReference(submission: FormSubmissionItem): string {
  if (!submission) return 'GCF-2027-00000';

  if (submission.extraDetails?.OrderRef && String(submission.extraDetails.OrderRef).trim()) {
    return String(submission.extraDetails.OrderRef).trim();
  }

  if (submission.extraDetails?.Reference && String(submission.extraDetails.Reference).trim()) {
    return String(submission.extraDetails.Reference).trim();
  }

  const rawId = String(submission.id || 'sub-0000');
  
  if (submission.type === 'pass-order') {
    return rawId.toUpperCase().replace('SUB-', 'GCF-');
  }

  if (submission.type === 'flight-registration') {
    return rawId.toUpperCase().replace('SUB-', 'REG-');
  }

  if (submission.type === 'contact') {
    return rawId.toUpperCase().replace('SUB-', 'INQ-');
  }

  if (submission.type === 'transport-request') {
    return rawId.toUpperCase().replace('SUB-', 'TRN-');
  }

  if (submission.type === 'newsletter') {
    return rawId.toUpperCase().replace('SUB-', 'VIP-');
  }

  return rawId.toUpperCase().replace('SUB-', 'GCF-');
}
