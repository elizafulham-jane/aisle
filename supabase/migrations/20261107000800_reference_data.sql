-- Reference data every environment needs (not demo data). Admins edit these later in the
-- admin console; this is only the starting set.

insert into public.vendor_categories (key, name, sort_order) values
  ('venues', 'Venues', 10),
  ('catering', 'Catering', 20),
  ('photography', 'Photography', 30),
  ('videography', 'Videography', 40),
  ('florists', 'Florists', 50),
  ('music', 'Music', 60),
  ('officiants', 'Officiants and celebrants', 70),
  ('hair_makeup', 'Hair and makeup', 80),
  ('attire', 'Attire', 90),
  ('cakes', 'Cakes', 100),
  ('planners', 'Planners', 110),
  ('rentals', 'Rentals', 120),
  ('stationery', 'Stationery', 130),
  ('transport', 'Transport', 140),
  ('lighting_decor', 'Lighting and decor', 150),
  ('entertainment', 'Entertainment', 160),
  ('jewellery', 'Jewellery', 170),
  ('favours', 'Favours', 180),
  ('honeymoon_travel', 'Honeymoon travel', 190)
on conflict (key) do nothing;

insert into public.vendor_categories (key, name, parent_id, sort_order)
select v.key, v.name, p.id, v.sort_order
from (values
  ('music_dj', 'DJs', 61),
  ('music_band', 'Bands', 62),
  ('music_ceremony', 'Ceremony musicians', 63)
) as v(key, name, sort_order)
join public.vendor_categories p on p.key = 'music'
on conflict (key) do nothing;

-- Starter checklist. offset_days is relative to the wedding date (negative = before).
-- applies_when keys are read by onboarding (Phase 1), e.g. {"destination": true}.
insert into public.task_templates (key, title, category, offset_days, applies_when, sort_order) values
  ('set_budget', 'Agree your total budget and who is contributing', 'budget', -400, '{}', 10),
  ('draft_guest_list', 'Draft your guest list', 'guests', -390, '{}', 20),
  ('choose_date_window', 'Choose a date or date range', 'planning', -390, '{}', 30),
  ('book_venue', 'Book your venue', 'vendors', -365, '{}', 40),
  ('book_officiant', 'Book your officiant or celebrant', 'vendors', -350, '{}', 50),
  ('book_photographer', 'Book your photographer', 'vendors', -340, '{}', 60),
  ('book_planner', 'Decide whether you want a planner', 'vendors', -360, '{}', 70),
  ('wedding_insurance', 'Look into wedding insurance', 'admin', -330, '{}', 80),
  ('book_caterer', 'Book your caterer (if not included with the venue)', 'vendors', -300, '{}', 90),
  ('send_save_the_dates', 'Send save-the-dates', 'guests', -270, '{}', 100),
  ('book_videographer', 'Book a videographer', 'vendors', -270, '{}', 110),
  ('book_music', 'Book your band or DJ', 'vendors', -270, '{}', 120),
  ('wedding_website', 'Publish your wedding website', 'guests', -260, '{}', 130),
  ('choose_attire', 'Choose your wedding outfits', 'attire', -240, '{}', 140),
  ('book_florist', 'Book your florist', 'vendors', -210, '{}', 150),
  ('room_blocks', 'Arrange hotel room blocks for guests', 'travel', -210, '{}', 160),
  ('book_hair_makeup', 'Book hair and makeup', 'vendors', -180, '{}', 170),
  ('wedding_party_outfits', 'Sort wedding party outfits', 'attire', -180, '{}', 180),
  ('registry', 'Set up your gift registry', 'gifts', -180, '{}', 190),
  ('book_cake', 'Order your cake', 'vendors', -150, '{}', 200),
  ('book_transport', 'Book transport', 'vendors', -150, '{}', 210),
  ('plan_honeymoon', 'Plan your honeymoon', 'travel', -150, '{}', 220),
  ('order_invitations', 'Order or design your invitations', 'guests', -120, '{}', 230),
  ('menu_tasting', 'Menu tasting with your caterer', 'vendors', -120, '{}', 240),
  ('notice_of_marriage', 'Give notice of marriage / lodge your intention to marry', 'admin', -100, '{}', 250),
  ('send_invitations', 'Send invitations', 'guests', -90, '{}', 260),
  ('buy_rings', 'Buy your wedding rings', 'attire', -90, '{}', 270),
  ('plan_ceremony', 'Plan the ceremony with your officiant', 'planning', -75, '{}', 280),
  ('first_fitting', 'First outfit fitting', 'attire', -60, '{}', 290),
  ('rsvp_deadline', 'Chase outstanding RSVPs', 'guests', -45, '{}', 300),
  ('final_numbers', 'Give final numbers to venue and caterer', 'vendors', -30, '{}', 310),
  ('seating_plan', 'Finish the seating plan', 'guests', -21, '{}', 320),
  ('run_of_show', 'Share the day-of timeline with vendors and wedding party', 'planning', -14, '{}', 330),
  ('final_payments', 'Make final vendor payments', 'budget', -14, '{}', 340),
  ('write_vows', 'Write your vows or readings', 'planning', -14, '{}', 350),
  ('final_fitting', 'Final outfit fitting', 'attire', -10, '{}', 360),
  ('confirm_vendors', 'Confirm arrival times with every vendor', 'vendors', -7, '{}', 370),
  ('pack_day_kit', 'Pack an emergency kit for the day', 'planning', -3, '{}', 380),
  ('rehearsal', 'Ceremony rehearsal', 'planning', -1, '{}', 390),
  ('return_rentals', 'Return hired items and outfits', 'admin', 3, '{}', 400),
  ('thank_you_cards', 'Send thank-you cards', 'gifts', 30, '{}', 410),
  ('review_vendors', 'Review your vendors', 'vendors', 30, '{}', 420),
  ('name_change', 'Update your name on documents (if changing)', 'admin', 45, '{}', 430),
  ('destination_travel_info', 'Write travel and local info pages for guests', 'travel', -240, '{"destination": true}', 440),
  ('destination_legal', 'Check legal requirements for marrying abroad', 'admin', -330, '{"destination": true}', 450)
on conflict (key) do nothing;

-- Vendor plans. Prices live in Stripe (Phase 2); entitlements live here so changing what a
-- plan includes needs no code change.
insert into public.plans (key, audience, name, description, is_default, sort_order) values
  ('vendor_free', 'vendor', 'Free listing', 'A basic listing with enquiries.', true, 10),
  ('vendor_pro', 'vendor', 'Pro', 'More photos, quotes and contracts.', false, 20),
  ('vendor_premium', 'vendor', 'Premium', 'Everything in Pro plus analytics and team seats.', false, 30)
on conflict (key) do nothing;

insert into public.plan_entitlements (plan_id, key, value)
select p.id, e.key, e.value::jsonb
from public.plans p
join (values
  ('vendor_free', 'listings.max', '{"limit": 1}'),
  ('vendor_free', 'media.max_per_listing', '{"limit": 10}'),
  ('vendor_free', 'quotes.enabled', '{"enabled": true}'),
  ('vendor_free', 'contracts.enabled', '{"enabled": false}'),
  ('vendor_free', 'analytics.enabled', '{"enabled": false}'),
  ('vendor_free', 'team.max_members', '{"limit": 1}'),
  ('vendor_pro', 'listings.max', '{"limit": 3}'),
  ('vendor_pro', 'media.max_per_listing', '{"limit": 40}'),
  ('vendor_pro', 'quotes.enabled', '{"enabled": true}'),
  ('vendor_pro', 'contracts.enabled', '{"enabled": true}'),
  ('vendor_pro', 'analytics.enabled', '{"enabled": false}'),
  ('vendor_pro', 'team.max_members', '{"limit": 3}'),
  ('vendor_premium', 'listings.max', '{"limit": 10}'),
  ('vendor_premium', 'media.max_per_listing', '{"limit": 100}'),
  ('vendor_premium', 'quotes.enabled', '{"enabled": true}'),
  ('vendor_premium', 'contracts.enabled', '{"enabled": true}'),
  ('vendor_premium', 'analytics.enabled', '{"enabled": true}'),
  ('vendor_premium', 'team.max_members', '{"limit": 10}')
) as e(plan_key, key, value) on e.plan_key = p.key
on conflict (plan_id, key) do nothing;

insert into public.feature_flags (key, description, enabled) values
  ('ai.assistant', 'Couple AI assistant (Phase 4)', false),
  ('payments.connect', 'In-app vendor payments via Stripe Connect (Phase 3)', false),
  ('gifts.cash_fund', 'Cash and honeymoon fund for couples', false),
  ('couple.premium', 'Couple premium tier', false),
  ('messaging.whatsapp_templates', 'Send WhatsApp template messages via Twilio', false)
on conflict (key) do nothing;
