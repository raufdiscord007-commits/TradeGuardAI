# Stripe Subscription Integration - Environment Variables
# Add these to your .env file in the Backend directory

# ============================================
# STRIPE KEYS (CONFIGURED ✅)
# ============================================

# Stripe Secret Key (sk_live_... for live, sk_test_... for test)
STRIPE_SECRET_KEY=sk_live_... (configured in .env)

# Stripe Publishable Key (pk_live_... for live, pk_test_... for test)
STRIPE_PUBLISHABLE_KEY=pk_live_... (configured in .env)

# Stripe Webhook Secret (starts with whsec_)
# Get this when you create a webhook endpoint in Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# ============================================
# STRIPE PRICE IDS (STILL NEEDED)
# Create these in Stripe Dashboard -> Products
# ============================================

# Pro Plan ($29/month, $239/year)
STRIPE_PRO_MONTHLY_PRICE_ID=price_YOUR_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_YEARLY_PRICE_ID=price_YOUR_PRO_YEARLY_PRICE_ID

# API Plan ($99/month, $950/year)
STRIPE_API_MONTHLY_PRICE_ID=price_YOUR_API_MONTHLY_PRICE_ID
STRIPE_API_YEARLY_PRICE_ID=price_YOUR_API_YEARLY_PRICE_ID

# ============================================
# SETUP INSTRUCTIONS
# ============================================
#
# 1. Create a Stripe account (https://stripe.com)
# 2. Go to Dashboard -> Developers -> API Keys
# 3. Copy your test keys (they start with sk_test_ and pk_test_)
# 4. Go to Products and create two products:
#    - "Pro Plan" with two prices: $29/month and $239/year (recurring)
#    - "API Access Plan" with two prices: $99/month and $950/year (recurring)
# 5. Copy each price ID (starts with price_)
# 6. Set up a webhook endpoint:
#    - Go to Developers -> Webhooks
#    - Add endpoint: YOUR_BACKEND_URL/api/subscription/webhook
#    - Select events: checkout.session.completed, customer.subscription.*
#    - Copy the webhook signing secret
# 7. Add all values to your .env file
#
# For local development with webhooks, use Stripe CLI:
#   stripe listen --forward-to localhost:5000/api/subscription/webhook
