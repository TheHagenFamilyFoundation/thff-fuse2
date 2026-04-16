/**
 * Default solicitation (must match thff-be/src/views/solicitation-email-default-plain.js).
 * Full letter in one block. Placeholders are filled when sending: {{REFERRAL_LINK}}, {{DIRECTOR_NAME}}, {{DIRECTOR_EMAIL}}, {{DIRECTOR_CONTACT}}, {{GRANT_YEAR}}
 */
export const DEFAULT_SOLICITATION_MESSAGE_PLAIN = `To Whom It May Concern,

On behalf of the Hagen Family Foundation Board, we invite your organization to consider applying for a grant. Our foundation focuses on arts, education, environment, religion, and social services, and we aim to be a catalyst for change by helping new programs get off the ground.

Most grants fall between $5,000 and $20,000. Because we receive many requests, the amount awarded may be less than the amount requested.

We look for proposals that are:
• Innovative — new, creative work; we favor start-up projects over ongoing operations or capital campaigns.
• Clearly goal-oriented — achievable, valuable goals, ideally within a one- to two-year timeline.
• High impact — where our grant can be a substantial contribution and we can be a meaningful partner.

Please apply using this referral link so we can associate your proposal with my sponsorship:
{{REFERRAL_LINK}}

To apply, visit our portal, sign in or create an account, and complete the application for submission year {{GRANT_YEAR}}. Please see the timeline on our website for deadlines.

Sincerely,

The Hagen Family Foundation
A Catalyst for Change

Please do not reply to this email. If you have questions, contact your sponsoring director {{DIRECTOR_CONTACT}}.`;
