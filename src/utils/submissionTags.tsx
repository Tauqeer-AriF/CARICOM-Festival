import React from 'react';
import { 
  Ticket, 
  MessageSquare, 
  Plane, 
  Truck, 
  Mail, 
  AlertCircle, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { FormSubmissionItem } from '../types';

export interface TypeTagMeta {
  type: FormSubmissionItem['type'];
  label: string;
  shortLabel: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  aliases: string[];
}

export interface StatusTagMeta {
  status: FormSubmissionItem['status'];
  label: string;
  shortLabel: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  aliases: string[];
}

export const ALL_SUBMISSION_TYPE_TAGS: Record<FormSubmissionItem['type'], TypeTagMeta> = {
  'pass-order': {
    type: 'pass-order',
    label: 'Pass Order & Ticketing',
    shortLabel: 'Pass Order',
    badgeLabel: 'Pass Order',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/20',
    icon: Ticket,
    description: 'VIP festival passes, weekend hoppers, day wristbands and package orders (£)',
    aliases: ['pass-order', 'pass_order', 'pass order', 'pass', 'order', 'orders', 'ticket', 'tickets', 'ticketing', 'package', 'packages', 'vip-pass', 'vip pass', 'reservation', 'reservations', 'booking', 'bookings']
  },
  'contact': {
    type: 'contact',
    label: 'Contact Inquiry',
    shortLabel: 'Contact',
    badgeLabel: 'Contact',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/20',
    icon: MessageSquare,
    description: 'General festival inquiries, cultural partnerships, media press, and attendee messages',
    aliases: ['contact', 'contact-inquiry', 'contact inquiry', 'inquiry', 'inquiries', 'enquiry', 'enquiries', 'message', 'messages', 'general', 'support', 'help', 'question', 'feedback', 'contact request']
  },
  'flight-registration': {
    type: 'flight-registration',
    label: 'Flight Registration',
    shortLabel: 'Flight Log',
    badgeLabel: 'Flight Log',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/20',
    icon: Plane,
    description: 'Arrival flight manifests, Maurice Bishop International (GND) logs, airline tickets',
    aliases: ['flight-registration', 'flight_registration', 'flight registration', 'flight', 'flights', 'airline', 'airlines', 'airport', 'gnd', 'plane', 'arrival', 'arrivals', 'flight log', 'flight-reg']
  },
  'transport-request': {
    type: 'transport-request',
    label: 'Airport & Hotel Shuttle',
    shortLabel: 'Shuttle',
    badgeLabel: 'Shuttle',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/20',
    icon: Truck,
    description: 'Airport shuttles, catamaran boat transfers, hotel transport, and island logistics',
    aliases: ['transport-request', 'transport_request', 'transport request', 'transport', 'shuttle', 'shuttles', 'transfer', 'transfers', 'airport shuttle', 'pickup', 'taxi', 'coach', 'transit', 'travel']
  },
  'newsletter': {
    type: 'newsletter',
    label: 'VIP Newsletter Subscriber',
    shortLabel: 'Newsletter',
    badgeLabel: 'VIP Newsletter',
    badgeBg: 'bg-teal-500/10',
    badgeText: 'text-teal-400',
    badgeBorder: 'border-teal-500/20',
    icon: Mail,
    description: 'VIP mailing list subscribers, line-up announcements, and pre-sale drops',
    aliases: ['newsletter', 'newsletter-signup', 'newsletter signup', 'vip newsletter', 'subscriber', 'subscribers', 'subscribe', 'mailing list', 'email list', 'mail-list', 'updates', 'alerts']
  }
};

export const ALL_SUBMISSION_STATUS_TAGS: Record<FormSubmissionItem['status'], StatusTagMeta> = {
  'new': {
    status: 'new',
    label: 'New / Unprocessed',
    shortLabel: 'New',
    badgeLabel: 'NEW',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
    icon: AlertCircle,
    description: 'Newly received submission or booking requiring initial coordinator review',
    aliases: ['new', 'open', 'unread', 'recent', 'created', 'unprocessed', 'incoming', 'pending review']
  },
  'in-review': {
    status: 'in-review',
    label: 'In Review / In Progress',
    shortLabel: 'In Review',
    badgeLabel: 'IN REVIEW',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    icon: Clock,
    description: 'Currently being processed, verifying flights, or awaiting payment confirmation',
    aliases: ['in-review', 'in_review', 'in review', 'in progress', 'in-progress', 'review', 'pending', 'processing', 'working', 'action needed', 'under review']
  },
  'resolved': {
    status: 'resolved',
    label: 'Resolved / Confirmed',
    shortLabel: 'Resolved',
    badgeLabel: 'CONFIRMED',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    icon: CheckCircle2,
    description: 'Confirmed order, ticket wristband issued, flight matched, or inquiry answered',
    aliases: ['resolved', 'confirmed', 'paid', 'complete', 'completed', 'done', 'approved', 'processed', 'closed', 'success', 'dispatched']
  }
};

/**
 * Robust Normalizer for Category / Form Type Tag.
 * Treats all 5 tags with identical priority and alias matching.
 */
export const normalizeTypeTag = (
  raw: string | undefined, 
  defaultType: FormSubmissionItem['type'] = 'contact'
): FormSubmissionItem['type'] => {
  if (!raw) return defaultType;
  const clean = raw.toLowerCase().trim().replace(/[\s_\-\/\(\)]/g, '');
  if (!clean) return defaultType;

  // Search each tag's aliases with identical logic
  for (const tagKey of Object.keys(ALL_SUBMISSION_TYPE_TAGS) as FormSubmissionItem['type'][]) {
    const meta = ALL_SUBMISSION_TYPE_TAGS[tagKey];
    for (const alias of meta.aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[\s_\-\/\(\)]/g, '');
      if (clean === cleanAlias || clean.includes(cleanAlias) || cleanAlias.includes(clean)) {
        return tagKey;
      }
    }
  }

  return defaultType;
};

/**
 * Robust Normalizer for Status Tag.
 * Treats all 3 lifecycle statuses with identical priority and alias matching.
 */
export const normalizeStatusTag = (
  raw: string | undefined, 
  defaultStatus: FormSubmissionItem['status'] = 'new'
): FormSubmissionItem['status'] => {
  if (!raw) return defaultStatus;
  const clean = raw.toLowerCase().trim().replace(/[\s_\-\/\(\)]/g, '');
  if (!clean) return defaultStatus;

  // First check resolved/confirmed
  for (const alias of ALL_SUBMISSION_STATUS_TAGS['resolved'].aliases) {
    const cleanAlias = alias.toLowerCase().replace(/[\s_\-\/\(\)]/g, '');
    if (clean === cleanAlias || clean.includes(cleanAlias)) return 'resolved';
  }

  // Then check in-review/pending
  for (const alias of ALL_SUBMISSION_STATUS_TAGS['in-review'].aliases) {
    const cleanAlias = alias.toLowerCase().replace(/[\s_\-\/\(\)]/g, '');
    if (clean === cleanAlias || clean.includes(cleanAlias)) return 'in-review';
  }

  // Then check new
  for (const alias of ALL_SUBMISSION_STATUS_TAGS['new'].aliases) {
    const cleanAlias = alias.toLowerCase().replace(/[\s_\-\/\(\)]/g, '');
    if (clean === cleanAlias || clean.includes(cleanAlias)) return 'new';
  }

  return defaultStatus;
};

/**
 * Reusable Type Tag Badge Component with synchronized styling
 */
export const SubmissionTypeBadge: React.FC<{
  type: FormSubmissionItem['type'];
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}> = ({ type, className = '', showIcon = true, size = 'md' }) => {
  const meta = ALL_SUBMISSION_TYPE_TAGS[type] || ALL_SUBMISSION_TYPE_TAGS['contact'];
  const IconComponent = meta.icon;
  const isSm = size === 'sm';

  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} ${
        isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      } ${className}`}
      title={meta.description}
    >
      {showIcon && <IconComponent className={isSm ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />}
      <span className="whitespace-nowrap">{meta.badgeLabel}</span>
    </span>
  );
};

/**
 * Reusable Status Tag Badge Component with synchronized styling
 */
export const SubmissionStatusBadge: React.FC<{
  status: FormSubmissionItem['status'];
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  customLabel?: string;
}> = ({ status, className = '', showIcon = true, size = 'md', customLabel }) => {
  const meta = ALL_SUBMISSION_STATUS_TAGS[status] || ALL_SUBMISSION_STATUS_TAGS['new'];
  const IconComponent = meta.icon;
  const isSm = size === 'sm';

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wider font-mono ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} ${
        isSm ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[10px]'
      } ${className}`}
      title={meta.description}
    >
      {showIcon && <IconComponent className={isSm ? 'w-2.5 h-2.5 shrink-0' : 'w-3 h-3 shrink-0'} />}
      <span className="whitespace-nowrap">{customLabel || meta.badgeLabel}</span>
    </span>
  );
};
