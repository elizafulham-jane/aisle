/**
 * Base English catalogue (ICU MessageFormat). Every user-facing string goes here.
 * Keys are stable identifiers; never reuse a key for a different meaning.
 */
export const enGB = {
  'app.name': 'Aisle',
  'app.tagline': 'Calm, capable wedding planning',

  'auth.signIn.promise': 'From the first yes to the last thank-you card.',
  'auth.signIn.title': 'Sign in',
  'auth.signIn.subtitle':
    'No password needed. We’ll email you a link, or you can use Apple or Google.',
  'auth.signIn.emailLabel': 'Email address',
  'auth.signIn.emailPlaceholder': 'you@example.com',
  'auth.signIn.sendLink': 'Email me a sign-in link',
  'auth.signIn.sending': 'Sending…',
  'auth.signIn.linkSent': 'Check {email} for a sign-in link. It expires in one hour.',
  'auth.signIn.or': 'or',
  'auth.signIn.withApple': 'Continue with Apple',
  'auth.signIn.withGoogle': 'Continue with Google',
  'auth.signIn.legal': 'By continuing you agree to our Terms and Privacy Policy.',
  'auth.signIn.error': 'We couldn’t sign you in. Please try again.',
  'auth.signOut': 'Sign out',

  'home.welcome': 'Welcome, {name}',
  'home.noWedding.title': 'Let’s start planning',
  'home.noWedding.body': 'Create your wedding to get a personalised checklist and budget.',
  'home.noWedding.cta': 'Create our wedding',
  'home.weddings.title': 'Your weddings',
  'home.weddings.role.owner': 'Couple',
  'home.weddings.role.editor': 'Editor',
  'home.weddings.role.contributor': 'Contributor',
  'home.weddings.role.viewer': 'Viewer',
  'home.weddings.dateUnset': 'Date not set yet',
  'wedding.create.partnerA': 'Your name',
  'wedding.create.partnerB': 'Your partner’s name',
  'wedding.create.partnerBHint': 'Optional. You can invite them once the wedding is created.',
  'wedding.create.currency': 'Currency',
  'wedding.create.submit': 'Create our wedding',
  'wedding.create.created':
    'Wedding created. Next up: your checklist (coming in the next release).',

  'common.loading': 'Loading…',
  'common.retry': 'Try again',
  'common.error.title': 'Something went wrong',
  'common.error.body': 'The problem has been reported. Please try again.',
} as const;

export type MessageKey = keyof typeof enGB;
export type Messages = Record<MessageKey, string>;
