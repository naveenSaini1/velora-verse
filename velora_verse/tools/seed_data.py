import frappe
from frappe.utils import now_datetime, add_days
import random


def seed():
	"""Seed the database with comprehensive e-commerce data for Velora Verse.

	Usage: bench --site veloraverse.com execute velora_verse.tools.seed_data.seed

	Creates 50+ entries for every major DocType, covers all order/payment/return
	scenarios, and adds 3+ images per item.
	"""
	frappe.flags.ignore_permissions = True
	frappe.flags.mute_emails = True
	random.seed(2026)

	print("\n=== Seeding Velora Verse Data ===\n")

	steps = [
		("0", "Cleaning up existing data", _cleanup),
		("1", "Configuring Store Settings", _create_store_settings),
		("2", "Creating Number Cards", _create_number_cards),
		("3", "Creating Item Types (50)", _create_item_types),
		("4", "Creating Categories (50)", _create_categories),
		("5", "Creating Variant Types", _create_variant_types),
		("6", "Creating Variant Type Properties", _create_variant_type_properties),
	]

	results = {}
	for step_num, label, fn in steps:
		print(f"\n{step_num}/33 {label}...")
		fn()
		frappe.db.commit()

	print("\n7/33 Creating Items (50) with images...")
	results["items"] = _create_items()
	frappe.db.commit()

	print("\n8/33 Creating Variants (~150) with images...")
	_create_variants(results["items"])
	frappe.db.commit()

	print("\n9/33 Creating Users (25)...")
	results["users"] = _create_users()
	frappe.db.commit()

	print("\n10/33 Creating Addresses (55+)...")
	results["addresses"] = _create_addresses(results["users"])
	frappe.db.commit()

	print("\n11/33 Creating Coupons (15)...")
	_create_coupons(results["items"])
	frappe.db.commit()

	print("\n12/33 Creating Orders (55+)...")
	results["orders"] = _create_orders(results["users"], results["addresses"])
	frappe.db.commit()

	print("\n13/33 Creating Reviews (60+)...")
	_create_reviews(results["items"], results["users"])
	frappe.db.commit()

	print("\n14/33 Creating Wishlists (25)...")
	_create_wishlists(results["users"])
	frappe.db.commit()

	print("\n15/33 Creating Carts (25)...")
	_create_carts(results["users"])
	frappe.db.commit()

	print("\n16/33 Creating Failed/Initiated Payment Logs...")
	_create_extra_payment_logs(results["users"])
	frappe.db.commit()

	print("\n17/33 Creating Return Requests (10)...")
	_create_return_requests(results["orders"], results["users"], results["addresses"])
	frappe.db.commit()

	print("\n18/33 Creating Stock Notifications (12)...")
	_create_stock_notifications(results["users"])
	frappe.db.commit()

	print("\n19/33 Creating Inventory Adjustments...")
	_create_extra_inventory_logs()
	frappe.db.commit()

	print("\n20/33 Creating Serviceable Pincodes (55)...")
	_create_serviceable_pincodes()
	frappe.db.commit()

	print("\n21/33 Creating Recent Views...")
	_create_recent_views(results["items"], results["users"])
	frappe.db.commit()

	print("\n22/33 Creating HSN Codes (20)...")
	_create_hsn_codes()
	frappe.db.commit()

	print("\n23/33 Creating Promotions (5)...")
	_create_promotions(results["items"])
	frappe.db.commit()

	print("\n24/33 Creating Loyalty Points Rules (3)...")
	_create_loyalty_rules()
	frappe.db.commit()

	print("\n25/33 Creating Loyalty Points Ledger entries...")
	_create_loyalty_ledger(results["users"], results["orders"])
	frappe.db.commit()

	print("\n26/33 Creating Customer Segments (4)...")
	_create_customer_segments(results["users"])
	frappe.db.commit()

	print("\n27/33 Creating Product Bundles (5)...")
	_create_product_bundles()
	frappe.db.commit()

	print("\n28/33 Creating Gift Cards (10)...")
	_create_gift_cards(results["users"])
	frappe.db.commit()

	print("\n29/33 Creating Warehouses (3)...")
	_create_warehouses()
	frappe.db.commit()

	print("\n30/33 Creating Webhook Subscriptions (3)...")
	_create_webhook_subscriptions()
	frappe.db.commit()

	print("\n31/33 Creating User Notifications...")
	_create_user_notifications(results["users"], results["orders"])
	frappe.db.commit()

	print("\n32/33 Creating Analytics Events (500+)...")
	_create_analytics_events(results["users"], results["items"])
	frappe.db.commit()

	print("\n33/33 Assigning HSN Codes to Items...")
	_assign_hsn_to_items()
	frappe.db.commit()

	frappe.flags.mute_emails = False
	print("\n=== Seed complete! ===\n")


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def _unsplash(photo_id, w=800, h=1000):
	"""Build an Unsplash CDN URL for a verified photo ID."""
	return f"https://images.unsplash.com/photo-{photo_id}?w={w}&h={h}&fit=crop&q=80"


def _img(slug, n, w=800, h=1000):
	"""Fallback: deterministic placeholder from picsum."""
	return f"https://picsum.photos/seed/{slug}-{n}/{w}/{h}"


# Verified Unsplash photo IDs mapped to each product slug.
# Each list has 3-4 IDs: [main/front, alternate, detail, lifestyle(optional)]
PRODUCT_IMAGES = {
	# ── Clothing ──────────────────────────────────────────────────────────
	"classic-cotton-tshirt": [
		"1521572163474-6864f9cf17ab",  # white tee on hanger
		"1583743814966-8936f5b7be1a",  # folded t-shirts
		"1562157873-818bc0726f68",     # flat-lay tee
		"1576566588028-4147f3842f27",  # colourful tees
	],
	"premium-zip-hoodie": [
		"1556821840-3a63f95609a7",  # grey hoodie
		"1620799140408-edc6dcb6d633",  # hoodie on rack
		"1578768079052-aa76e52ff62e",  # zip hoodie
	],
	"slim-fit-denim-jeans": [
		"1542272604-787c3835535d",  # blue denim jeans
		"1541099649105-f69ad21f3246",  # denim close-up
		"1560769629-975ec94e6a86",  # fashion denim
	],
	"winter-puffer-jacket": [
		"1548126032-079a0fb0099d",  # puffer jacket
		"1544022613-e87ca75a784a",  # jacket detail
		"1591085686350-798c0f9faa7f",  # winter outerwear
		"1606107557195-0e29a4b5b4aa",  # lifestyle
	],
	"floral-maxi-dress": [
		"1496747611176-843222e1e57c",  # dresses on rack
		"1618354691373-d851c5c3a990",  # fashion dress
		"1564584217132-2271feaeb3c5",  # dress detail
	],
	"cotton-cargo-shorts": [
		"1591348278863-a8fb3887e2aa",  # casual shorts
		"1591047139829-d91aecb6caea",  # shorts detail
		"1606107557195-0e29a4b5b4aa",  # casual wear
	],
	"classic-polo-shirt": [
		"1622434641406-a158123450f9",  # polo shirt
		"1521572163474-6864f9cf17ab",  # shirt on hanger
		"1576566588028-4147f3842f27",  # coloured shirts
	],
	"merino-wool-sweater": [
		"1576566588028-4147f3842f27",  # knitwear colours
		"1516762689617-e1cffcef479d",  # sweater
		"1543163521-1bf539c55dd2",     # cosy knit
	],
	"striped-crew-neck-tshirt": [
		"1583743814966-8936f5b7be1a",  # tees stack
		"1562157873-818bc0726f68",     # flat-lay tee
		"1521572163474-6864f9cf17ab",  # tee on hanger
	],
	"graphic-tank-top": [
		"1562157873-818bc0726f68",  # casual top
		"1576566588028-4147f3842f27",  # tops stack
		"1583743814966-8936f5b7be1a",  # folded tops
	],
	"linen-button-down-shirt": [
		"1517841905240-472988babdf9",  # button-down shirt
		"1622434641406-a158123450f9",  # dress shirt
		"1521572163474-6864f9cf17ab",  # shirt on hanger
	],
	"velvet-evening-blazer": [
		"1507679799987-c73779587ccf",  # blazer / suit
		"1594938298603-c8148c4dae35",  # formal wear
		"1591561954557-26941169b49e",  # evening wear
		"1517841905240-472988babdf9",  # lifestyle
	],
	"slim-jogger-track-pants": [
		"1585386959984-a4155224a1ad",  # joggers
		"1591047139829-d91aecb6caea",  # track pants
		"1606107557195-0e29a4b5b4aa",  # activewear
	],
	"classic-denim-jacket": [
		"1544022613-e87ca75a784a",  # denim jacket
		"1548126032-079a0fb0099d",  # jacket
		"1560769629-975ec94e6a86",  # denim style
	],
	"wrap-mini-skirt": [
		"1564584217132-2271feaeb3c5",  # skirt
		"1496747611176-843222e1e57c",  # clothing rack
		"1618354691373-d851c5c3a990",  # fashion
	],
	"cropped-zip-hoodie": [
		"1578768079052-aa76e52ff62e",  # cropped hoodie
		"1556821840-3a63f95609a7",  # hoodie
		"1620799140408-edc6dcb6d633",  # hoodie style
	],
	"henley-long-sleeve-tee": [
		"1521572163474-6864f9cf17ab",  # long sleeve on hanger
		"1583743814966-8936f5b7be1a",  # tees
		"1525966222134-fcfa99b8ae77",  # casual wear
	],
	"pleated-palazzo-pants": [
		"1594938298603-c8148c4dae35",  # wide-leg trousers
		"1591047139829-d91aecb6caea",  # pants
		"1564584217132-2271feaeb3c5",  # fashion
	],
	"quilted-puffer-vest": [
		"1548126032-079a0fb0099d",  # puffer outerwear
		"1591085686350-798c0f9faa7f",  # vest / outerwear
		"1606107557195-0e29a4b5b4aa",  # outdoor style
	],
	"vneck-cashmere-sweater": [
		"1516762689617-e1cffcef479d",  # v-neck sweater
		"1543163521-1bf539c55dd2",     # cashmere knit
		"1576566588028-4147f3842f27",  # knitwear
	],
	# ── Footwear ──────────────────────────────────────────────────────────
	"urban-runner-sneakers": [
		"1542291026-7eec264c27ff",  # red running sneaker
		"1460353581641-37baddab0fa2",  # running shoe
		"1549298916-b41d501d3772",  # sneaker pair
		"1600185365926-3a2ce3cdb9eb",  # white sneakers
	],
	"chelsea-leather-boots": [
		"1638247025967-b4e38f787b76",  # leather boots
		"1605733160314-4fc7dac4bb16",  # chelsea boots
		"1638247025967-b4e38f787b76",  # boot detail
	],
	"summer-slide-sandals": [
		"1603487742131-4160ec999306",  # slides
		"1603487742131-4160ec999306",  # sandal detail
		"1491553895911-0055eca6402d",  # summer footwear
	],
	"canvas-low-top-sneakers": [
		"1600185365926-3a2ce3cdb9eb",  # white canvas sneakers
		"1549298916-b41d501d3772",  # low-top pair
		"1542291026-7eec264c27ff",  # sneaker style
	],
	"hiking-trail-boots": [
		"1605733160314-4fc7dac4bb16",  # trail boots
		"1638247025967-b4e38f787b76",  # hiking boots
		"1605733160314-4fc7dac4bb16",  # boot sole detail
		"1638247025967-b4e38f787b76",  # outdoor
	],
	"classic-leather-loafers": [
		"1515886657613-9f3515b0c78f",  # leather loafers
		"1638247025967-b4e38f787b76",  # leather shoe detail
		"1605733160314-4fc7dac4bb16",  # formal shoe
	],
	"sports-running-shoes": [
		"1460353581641-37baddab0fa2",  # running shoe
		"1542291026-7eec264c27ff",  # sports sneaker
		"1549298916-b41d501d3772",  # shoe pair
	],
	"strappy-platform-sandals": [
		"1603487742131-4160ec999306",  # platform sandals
		"1491553895911-0055eca6402d",  # strappy sandal
		"1603487742131-4160ec999306",  # sandal detail
	],
	"suede-desert-boots": [
		"1638247025967-b4e38f787b76",  # suede boots
		"1605733160314-4fc7dac4bb16",  # desert boot
		"1515886657613-9f3515b0c78f",  # boot detail
	],
	"comfort-flip-flops": [
		"1603487742131-4160ec999306",  # flip flops
		"1491553895911-0055eca6402d",  # beach footwear
		"1603487742131-4160ec999306",  # comfort detail
	],
	# ── Accessories ────────────────────────────────────────────────────────
	"snapback-baseball-cap": [
		"1556306535-0f09a537f0a3",  # snapback cap
		"1556306535-0f09a537f0a3",  # cap detail
		"1622445275463-afa2ab738c34",  # lifestyle
	],
	"chronograph-wrist-watch": [
		"1524592094714-0f0654e20314",  # watch face
		"1523170335258-f5ed11844a49",  # luxury watch
		"1547996160-81dfa63595aa",     # wrist watch
		"1524592094714-0f0654e20314",  # chronograph dial
	],
	"aviator-sunglasses": [
		"1511499767150-a48a237f0083",  # aviator sunglasses
		"1572635196237-14b3f281503f",  # sunglasses flat-lay
		"1508296695146-257a814070b4",  # sunglasses on table
	],
	"genuine-leather-belt": [
		"1624222247344-550fb60583dc",  # leather belt
		"1624222247344-550fb60583dc",  # belt buckle detail
		"1594938298603-c8148c4dae35",  # accessories
	],
	"bi-fold-leather-wallet": [
		"1556905055-8f358a7a47b2",  # leather wallet
		"1624222247344-550fb60583dc",  # leather goods
		"1575537302964-96cd47c06b1b",  # wallet detail
	],
	"cashmere-winter-scarf": [
		"1543163521-1bf539c55dd2",  # winter scarf
		"1516762689617-e1cffcef479d",  # knit scarf
		"1576566588028-4147f3842f27",  # winter accessories
	],
	"silver-chain-bracelet": [
		"1611312449412-6cefac5dc3e4",  # bracelet
		"1608667508764-33cf0726b13a",  # silver jewellery
		"1575537302964-96cd47c06b1b",  # accessories
	],
	"knit-beanie-winter-hat": [
		"1556306535-0f09a537f0a3",  # knit beanie
		"1543163521-1bf539c55dd2",  # winter headwear
		"1622445275463-afa2ab738c34",  # lifestyle
	],
	"silk-pocket-square": [
		"1507679799987-c73779587ccf",  # suit pocket square
		"1594938298603-c8148c4dae35",  # formal accessories
		"1517841905240-472988babdf9",  # detail
	],
	"titanium-cufflinks-set": [
		"1608667508764-33cf0726b13a",  # cufflinks
		"1507679799987-c73779587ccf",  # formal accessories
		"1594938298603-c8148c4dae35",  # accessory set
	],
	# ── Bags ───────────────────────────────────────────────────────────────
	"leather-travel-backpack": [
		"1553062407-98eeb64c6a62",  # leather backpack
		"1553062407-98eeb64c6a62",  # backpack detail
		"1622445275463-afa2ab738c34",  # travel lifestyle
		"1553062407-98eeb64c6a62",  # hardware detail
	],
	"canvas-tote-bag": [
		"1591561954557-26941169b49e",  # tote bag
		"1553062407-98eeb64c6a62",  # bag detail
		"1622445275463-afa2ab738c34",  # lifestyle
	],
	"laptop-messenger-bag": [
		"1553062407-98eeb64c6a62",  # messenger bag
		"1548102245-c79dbcfa9f92",  # laptop bag
		"1622445275463-afa2ab738c34",  # work lifestyle
	],
	"gym-duffel-bag": [
		"1553062407-98eeb64c6a62",  # duffel bag
		"1585386959984-a4155224a1ad",  # gym bag
		"1606107557195-0e29a4b5b4aa",  # sport lifestyle
	],
	"crossbody-sling-bag": [
		"1553062407-98eeb64c6a62",  # sling bag
		"1548102245-c79dbcfa9f92",  # crossbody
		"1622445275463-afa2ab738c34",  # street lifestyle
	],
	# ── Misc / Activewear ─────────────────────────────────────────────────
	"compression-gym-shorts": [
		"1585386959984-a4155224a1ad",  # gym shorts
		"1591047139829-d91aecb6caea",  # activewear
		"1606107557195-0e29a4b5b4aa",  # workout
	],
	"thermal-base-layer-top": [
		"1591085686350-798c0f9faa7f",  # thermal top
		"1516762689617-e1cffcef479d",  # base layer
		"1576566588028-4147f3842f27",  # layering
	],
	"performance-windbreaker": [
		"1548126032-079a0fb0099d",  # windbreaker
		"1591085686350-798c0f9faa7f",  # performance jacket
		"1606107557195-0e29a4b5b4aa",  # outdoor
	],
	"board-swim-shorts": [
		"1591348278863-a8fb3887e2aa",  # swim shorts
		"1491553895911-0055eca6402d",  # beach wear
		"1603487742131-4160ec999306",  # summer
	],
	"organic-cotton-cardigan": [
		"1543163521-1bf539c55dd2",  # cardigan
		"1516762689617-e1cffcef479d",  # knit detail
		"1576566588028-4147f3842f27",  # cotton knitwear
	],
}


def _make_images(slug, alt_base, count=3):
	"""Build image child-table rows for an item or variant.

	Uses curated Unsplash photos when available, falls back to picsum.
	"""
	labels = ["front", "back", "detail", "lifestyle"]
	photo_ids = PRODUCT_IMAGES.get(slug, [])
	rows = []
	for i in range(count):
		if i < len(photo_ids):
			url = _unsplash(photo_ids[i])
		else:
			url = _img(slug, labels[i] if i < len(labels) else str(i))
		rows.append({
			"image": url,
			"display_order": i + 1,
			"is_primary": 1 if i == 0 else 0,
			"alt_text": f"{alt_base} — {labels[i] if i < len(labels) else 'view ' + str(i)}",
		})
	return rows


# ---------------------------------------------------------------------------
# 0. Cleanup
# ---------------------------------------------------------------------------
def _cleanup():
	for dt in [
		"Analytics Event", "User Notification", "Webhook Subscription",
		"Loyalty Points Ledger", "Loyalty Points Rule",
		"Customer Segment", "Gift Card", "Product Bundle",
		"HSN Code", "Promotion", "Warehouse",
		"Recent View", "Serviceable Pincode",
		"Stock Notification", "Return Request",
		"Payment Log", "Inventory Log",
		"Order", "Cart", "Wishlist", "Review", "Coupon", "Address",
		"Variants", "Items",
		"Variant Type Property", "Variants Type", "Category", "Item Type",
	]:
		docs = frappe.get_all(dt, pluck="name")
		for name in docs:
			if dt in ("Order", "Return Request"):
				doc = frappe.get_doc(dt, name)
				if doc.docstatus == 1:
					doc.flags.ignore_permissions = True
					doc.cancel()
				frappe.delete_doc(dt, name, ignore_permissions=True, force=True)
			else:
				frappe.delete_doc(dt, name, ignore_permissions=True, force=True)
		if docs:
			print(f"  Deleted {len(docs)} {dt} records")

	for card_name in [
		"Total Products", "In-Stock Variants", "Customer Reviews", "Active Carts",
		"Total Orders", "Pending Returns", "Low Stock Variants",
		"Active Promotions", "Active Gift Cards", "Product Bundles", "Loyalty Rules",
	]:
		if frappe.db.exists("Number Card", card_name):
			frappe.delete_doc("Number Card", card_name, ignore_permissions=True, force=True)
			print(f"  Deleted Number Card: {card_name}")

	test_users = frappe.get_all(
		"User",
		filters={"email": ["like", "%@veloraverse.com"]},
		pluck="name",
	)
	for email in test_users:
		frappe.delete_doc("User", email, ignore_permissions=True, force=True)
	if test_users:
		print(f"  Deleted {len(test_users)} test User records")

	# Force-clean any leftover addresses from test users via direct SQL
	frappe.db.sql("""
		DELETE FROM `tabAddress`
		WHERE user IN (SELECT name FROM `tabUser` WHERE name LIKE '%%@veloraverse.com')
	""")

	for series in ["ITEM-", "VV-ORD-", "VV-RET-", "VV-PROMO-", "VV-BDL-"]:
		if frappe.db.exists("Series", series):
			frappe.db.sql("UPDATE `tabSeries` SET current=0 WHERE name=%s", series)


# ---------------------------------------------------------------------------
# 1. Store Settings
# ---------------------------------------------------------------------------
def _create_store_settings():
	s = frappe.get_single("Store Settings")
	s.store_name = "Velora Verse"
	s.store_email = "veloraverse@gmail.com"
	s.store_phone = "+91 98765 43210"
	s.currency = "INR"
	s.currency_symbol = "Rs."
	s.enable_gst = 1
	s.gst_rate = 18
	s.gst_included_in_price = 1
	s.enable_shipping_charges = 1
	s.free_shipping_threshold = 1500
	s.default_shipping_charge = 49
	s.shipping_rate_per_kg = 20
	s.min_order_value = 0
	s.auto_cancel_unpaid_hours = 24
	s.cod_enabled = 1
	s.send_order_confirmation = 1
	s.send_shipping_notification = 1
	s.send_delivery_confirmation = 1
	s.low_stock_threshold = 5
	s.enable_low_stock_alerts = 1
	s.low_stock_alert_email = "veloraverse@gmail.com"
	s.enable_hsn_tax = 1
	s.enable_analytics = 1
	s.enable_loyalty_points = 1
	s.points_to_currency_ratio = 10
	s.min_points_to_redeem = 100
	s.max_points_per_order = 500
	s.points_expiry_days = 365
	s.enable_customer_segments = 1
	s.enable_gift_cards = 1
	s.gift_card_expiry_months = 12
	s.enable_multi_warehouse = 0
	s.shipping_zones = []
	for zn, st, flat, pkg, free in [
		("South India", "Karnataka, Tamil Nadu, Kerala, Telangana, Andhra Pradesh", 39, 15, 1000),
		("West India", "Maharashtra, Gujarat, Goa, Rajasthan", 49, 18, 1500),
		("North India", "Delhi, Uttar Pradesh, Haryana, Punjab, Uttarakhand, Himachal Pradesh", 59, 20, 1500),
		("East India", "West Bengal, Odisha, Bihar, Jharkhand, Assam", 69, 25, 2000),
	]:
		s.append("shipping_zones", {
			"zone_name": zn, "states": st, "flat_rate": flat,
			"rate_per_kg": pkg, "free_shipping_threshold": free,
		})
	s.save(ignore_permissions=True)
	print("  + Store Settings configured")


# ---------------------------------------------------------------------------
# 2. Number Cards
# ---------------------------------------------------------------------------
def _create_number_cards():
	cards = [
		("Total Products", "Items", '[["Items","status","=","Active"]]', "#29cd42"),
		("In-Stock Variants", "Variants", '[["Variants","is_stock","=",1]]', "#4299e1"),
		("Customer Reviews", "Review", "[]", "#ECAD4B"),
		("Active Carts", "Cart", "[]", "#EC864B"),
		("Total Orders", "Order", '[["Order","docstatus","=",1]]', "#7c3aed"),
		("Pending Returns", "Return Request", '[["Return Request","status","=","Pending"]]', "#e53e3e"),
		("Low Stock Variants", "Variants", '[["Variants","quantity","<=",5],["Variants","quantity",">",0]]', "#d69e2e"),
		("Active Promotions", "Promotion", '[["Promotion","is_active","=",1]]', "#f56565"),
		("Active Gift Cards", "Gift Card", '[["Gift Card","status","=","Active"]]', "#9f7aea"),
		("Product Bundles", "Product Bundle", "[]", "#38b2ac"),
		("Loyalty Rules", "Loyalty Points Rule", '[["Loyalty Points Rule","is_active","=",1]]', "#ed8936"),
	]
	for name, dt, fj, color in cards:
		if not frappe.db.exists("Number Card", name):
			frappe.get_doc({
				"doctype": "Number Card", "type": "Document Type",
				"name": name, "label": name, "document_type": dt,
				"function": "Count", "is_public": 1, "filters_json": fj,
				"show_percentage_stats": 1, "stats_time_interval": "Monthly", "color": color,
			}).insert(ignore_permissions=True)
			print(f"  + {name}")


# ---------------------------------------------------------------------------
# 3. Item Types (50)
# ---------------------------------------------------------------------------
ITEM_TYPES = [
	("T-Shirt", "Casual and graphic tees for everyday wear"),
	("Hoodie", "Hooded sweatshirts for warmth and style"),
	("Jeans", "Denim jeans in various cuts and washes"),
	("Sneakers", "Athletic and casual sneaker footwear"),
	("Jacket", "Outerwear jackets for all seasons"),
	("Dress", "Formal and casual dresses for women"),
	("Shorts", "Short-length bottoms for warm weather"),
	("Polo Shirt", "Collared polo-style shirts"),
	("Sweater", "Knit pullovers and cardigans"),
	("Cap", "Baseball caps and headwear"),
	("Backpack", "Bags designed to be carried on the back"),
	("Watch", "Wristwatches and timepieces"),
	("Sunglasses", "UV-protective eyewear"),
	("Belt", "Waist belts in leather and fabric"),
	("Wallet", "Pocket-sized money and card holders"),
	("Scarf", "Neck scarves for warmth and fashion"),
	("Socks", "Ankle and crew socks for daily wear"),
	("Boots", "Ankle-high and knee-high boots"),
	("Sandals", "Open-toe summer footwear"),
	("Tank Top", "Sleeveless tops for casual and athletic use"),
	("Shirt", "Button-down and casual shirts"),
	("Blazer", "Structured jackets for formal occasions"),
	("Track Pants", "Athletic and leisure track pants"),
	("Skirt", "Casual and formal skirts"),
	("Vest", "Sleeveless outer garments"),
	("Loafers", "Slip-on leather shoes"),
	("Running Shoes", "Performance running footwear"),
	("Bracelet", "Wrist jewellery and bands"),
	("Beanie", "Knit winter caps"),
	("Pocket Square", "Suit pocket accessories"),
	("Cufflinks", "Shirt cuff accessories"),
	("Tote Bag", "Open-top carry bags"),
	("Messenger Bag", "Crossbody flap bags"),
	("Duffel Bag", "Cylindrical travel bags"),
	("Sling Bag", "Compact crossbody bags"),
	("Henley", "Button-neck long-sleeve tees"),
	("Palazzo Pants", "Wide-leg flowing trousers"),
	("Base Layer", "Thermal underlayer clothing"),
	("Poncho", "Waterproof pullover outerwear"),
	("Shrug", "Short open-front cover-ups"),
	("Joggers", "Tapered athletic trousers"),
	("Cardigan", "Open-front knit sweaters"),
	("Chinos", "Casual cotton twill trousers"),
	("Flip Flops", "Simple toe-post sandals"),
	("Moccasins", "Soft leather slip-on shoes"),
	("Parka", "Insulated hooded winter coats"),
	("Windbreaker", "Lightweight wind-resistant jackets"),
	("Swim Shorts", "Quick-dry swim trunks"),
	("Suspenders", "Adjustable trouser braces"),
	("Leggings", "Stretch-fit athletic bottoms"),
]


def _create_item_types():
	count = 0
	for name, desc in ITEM_TYPES:
		if not frappe.db.exists("Item Type", name):
			doc = frappe.new_doc("Item Type")
			doc.__newname = name
			doc.description = desc
			doc.insert(ignore_permissions=True)
			count += 1
	print(f"  Created {count} item types")


# ---------------------------------------------------------------------------
# 4. Categories (50) — 10 parents + 40 children
# ---------------------------------------------------------------------------
PARENT_CATEGORIES = [
	("Clothing", "All types of clothing and apparel", 1),
	("Footwear", "Shoes, boots, sandals and more", 2),
	("Accessories", "Fashion accessories and add-ons", 3),
	("Bags", "Bags, backpacks and luggage", 4),
	("Sportswear", "Athletic and performance wear", 5),
	("Formal Wear", "Professional and event clothing", 6),
	("Winter Collection", "Cold weather essentials", 7),
	("Summer Collection", "Warm weather favourites", 8),
	("Unisex", "Gender-neutral styles", 9),
	("New Arrivals", "Latest drops and fresh styles", 10),
]

# Unsplash photo IDs for category hero images
CATEGORY_IMAGES = {
	# Parent categories
	"Clothing": "1441986300917-64674bd600d8",
	"Footwear": "1549298916-b41d501d3772",
	"Accessories": "1611923134239-b9be5816e23c",
	"Bags": "1553062407-98eeb64c6a62",
	"Sportswear": "1571019613454-1cb2f99b2d8b",
	"Formal Wear": "1507679799987-c73779587ccf",
	"Winter Collection": "1483985988355-763728e1935b",
	"Summer Collection": "1507525428034-b723cf961d3e",
	"Unisex": "1523381210434-271e8be1f52b",
	"New Arrivals": "1441984904996-e0b6ba687e04",
	# Child categories
	"T-Shirts & Tanks": "1521572163474-6864f9cf17ab",
	"Polo Shirts": "1576566588028-4147f3842f27",
	"Hoodies & Sweatshirts": "1556821840-3a63f95609a7",
	"Jeans & Trousers": "1602810318383-e386cc2a3ccf",
	"Shorts": "1591195853828-11db59a44f6b",
	"Jackets & Coats": "1591047139829-d91aecb6caea",
	"Sweaters": "1543163521-1bf539c55dd2",
	"Dresses & Skirts": "1496747611176-843222e1e57c",
	"Sneakers": "1549298916-b41d501d3772",
	"Boots": "1608256246200-53e635b5b65f",
	"Sandals & Slippers": "1603487742131-4160ec999306",
	"Loafers & Moccasins": "1606107557195-0e29a4b5b4aa",
	"Running Shoes": "1539185441755-769473a23570",
	"Watches": "1524592094714-0f0654e20314",
	"Sunglasses": "1511499767150-a48a237f0083",
	"Belts & Wallets": "1556905055-8f358a7a47b2",
	"Hats & Scarves": "1521369909029-2afed882baee",
	"Jewellery": "1611312449408-fcece27cdbb7",
	"Backpacks & Totes": "1553062407-98eeb64c6a62",
	"Messenger & Laptop": "1584917865442-de89df76afd3",
	"Duffel & Gym": "1595950653106-6c9ebd614d3a",
	"Sling & Crossbody": "1560343090-f0409e92791a",
	"Activewear Tops": "1571019613454-1cb2f99b2d8b",
	"Activewear Bottoms": "1506629082955-511b1aa562c8",
	"Compression Wear": "1594938298603-c8148c4dae35",
	"Sports Shoes": "1539185441755-769473a23570",
	"Blazers & Suits": "1507679799987-c73779587ccf",
	"Formal Shirts": "1517841905240-472988babdf9",
	"Formal Trousers": "1473966968600-fa801b869a1a",
	"Formal Shoes": "1606107557195-0e29a4b5b4aa",
	"Puffer Jackets": "1544022613-e87ca75a784a",
	"Sweaters & Cardigans": "1543163521-1bf539c55dd2",
	"Thermals": "1483985988355-763728e1935b",
	"Scarves & Beanies": "1521369909029-2afed882baee",
	"Summer Dresses": "1496747611176-843222e1e57c",
	"Beach Wear": "1507525428034-b723cf961d3e",
	"Light Shirts": "1517841905240-472988babdf9",
	"Unisex Tees": "1523381210434-271e8be1f52b",
	"Unisex Sneakers": "1549298916-b41d501d3772",
	"This Season": "1441984904996-e0b6ba687e04",
}

CHILD_CATEGORIES = [
	# (name, parent, description, display_order)
	("T-Shirts & Tanks", "Clothing", "Casual tees and tank tops", 1),
	("Polo Shirts", "Clothing", "Classic polo neck shirts", 2),
	("Hoodies & Sweatshirts", "Clothing", "Hoodies, sweatshirts and zip-ups", 3),
	("Jeans & Trousers", "Clothing", "Denim jeans and formal trousers", 4),
	("Shorts", "Clothing", "Casual and athletic shorts", 5),
	("Jackets & Coats", "Clothing", "Outerwear for all seasons", 6),
	("Sweaters", "Clothing", "Knit sweaters and cardigans", 7),
	("Dresses & Skirts", "Clothing", "Dresses and skirts for women", 8),
	("Sneakers", "Footwear", "Casual and athletic sneakers", 1),
	("Boots", "Footwear", "Ankle boots, chelsea boots and more", 2),
	("Sandals & Slippers", "Footwear", "Open-toe and casual footwear", 3),
	("Loafers & Moccasins", "Footwear", "Slip-on leather shoes", 4),
	("Running Shoes", "Footwear", "Performance running footwear", 5),
	("Watches", "Accessories", "Wristwatches and smartwatches", 1),
	("Sunglasses", "Accessories", "Fashion and sport sunglasses", 2),
	("Belts & Wallets", "Accessories", "Leather belts and wallets", 3),
	("Hats & Scarves", "Accessories", "Caps, hats, scarves and wraps", 4),
	("Jewellery", "Accessories", "Bracelets, rings, cufflinks", 5),
	("Backpacks & Totes", "Bags", "Everyday carry bags and totes", 1),
	("Messenger & Laptop", "Bags", "Crossbody and laptop bags", 2),
	("Duffel & Gym", "Bags", "Gym bags and duffel bags", 3),
	("Sling & Crossbody", "Bags", "Compact crossbody sling bags", 4),
	("Activewear Tops", "Sportswear", "Athletic tops and jerseys", 1),
	("Activewear Bottoms", "Sportswear", "Shorts, leggings, joggers", 2),
	("Compression Wear", "Sportswear", "Performance compression gear", 3),
	("Sports Shoes", "Sportswear", "Running and training shoes", 4),
	("Blazers & Suits", "Formal Wear", "Structured blazers and suits", 1),
	("Formal Shirts", "Formal Wear", "Dress shirts and button-downs", 2),
	("Formal Trousers", "Formal Wear", "Tailored trousers and chinos", 3),
	("Formal Shoes", "Formal Wear", "Oxford, derby, loafers", 4),
	("Puffer Jackets", "Winter Collection", "Insulated puffer outerwear", 1),
	("Sweaters & Cardigans", "Winter Collection", "Warm knit layers", 2),
	("Thermals", "Winter Collection", "Base layers and thermals", 3),
	("Scarves & Beanies", "Winter Collection", "Winter neck and head wear", 4),
	("Summer Dresses", "Summer Collection", "Light dresses for warm days", 1),
	("Beach Wear", "Summer Collection", "Swim shorts, sandals, tees", 2),
	("Light Shirts", "Summer Collection", "Breathable casual shirts", 3),
	("Unisex Tees", "Unisex", "Gender-neutral t-shirts", 1),
	("Unisex Sneakers", "Unisex", "Gender-neutral sneakers", 2),
	("This Season", "New Arrivals", "Latest additions to the store", 1),
]


def _create_categories():
	count = 0
	for name, desc, order in PARENT_CATEGORIES:
		if not frappe.db.exists("Category", name):
			img_id = CATEGORY_IMAGES.get(name)
			frappe.get_doc({
				"doctype": "Category", "category_name": name, "description": desc,
				"is_child": 0, "is_active": 1, "display_order": order,
				"image": _unsplash(img_id, 1200, 800) if img_id else None,
			}).insert(ignore_permissions=True)
			count += 1

	for name, parent, desc, order in CHILD_CATEGORIES:
		if not frappe.db.exists("Category", name):
			img_id = CATEGORY_IMAGES.get(name)
			frappe.get_doc({
				"doctype": "Category", "category_name": name, "description": desc,
				"is_child": 1, "parent_category": parent, "is_active": 1, "display_order": order,
				"image": _unsplash(img_id, 1200, 800) if img_id else None,
			}).insert(ignore_permissions=True)
			count += 1

	print(f"  Created {count} categories")


# ---------------------------------------------------------------------------
# 5-6. Variant Types & Properties (same as before)
# ---------------------------------------------------------------------------
def _create_variant_types():
	for name, desc in [
		("Color", "Color options for products"),
		("Size", "Size options (XS to XXL)"),
		("Material", "Fabric and material types"),
		("Pattern", "Visual patterns and prints"),
		("Fit", "Fit styles from slim to oversized"),
		("Sleeve Length", "Sleeve length variations"),
	]:
		if not frappe.db.exists("Variants Type", name):
			doc = frappe.new_doc("Variants Type")
			doc.__newname = name
			doc.description = desc
			doc.insert(ignore_permissions=True)
	print("  Created 6 variant types")


VARIANT_PROPERTIES = {
	"Color": [
		("Red", "R"), ("Blue", "B"), ("Black", "BLK"), ("White", "W"),
		("Green", "G"), ("Navy", "NV"), ("Grey", "GR"), ("Beige", "BG"),
		("Brown", "BR"), ("Pink", "PK"),
	],
	"Size": [("XS", "XS"), ("S", "S"), ("M", "M"), ("L", "L"), ("XL", "XL"), ("XXL", "XXL")],
	"Material": [
		("Cotton", "CT"), ("Polyester", "PL"), ("Leather", "LT"), ("Denim", "DN"),
		("Wool", "WL"), ("Silk", "SK"), ("Nylon", "NY"), ("Linen", "LN"),
	],
	"Pattern": [
		("Solid", "SLD"), ("Striped", "STR"), ("Plaid", "PLD"),
		("Floral", "FLR"), ("Graphic", "GFX"), ("Camo", "CMO"),
	],
	"Fit": [("Slim", "SLM"), ("Regular", "REG"), ("Relaxed", "RLX"), ("Oversized", "OVR")],
	"Sleeve Length": [
		("Short Sleeve", "SS"), ("Long Sleeve", "LS"), ("Three Quarter", "3Q"), ("Sleeveless", "SL"),
	],
}


def _create_variant_type_properties():
	for vtype, props in VARIANT_PROPERTIES.items():
		if not frappe.db.exists("Variant Type Property", vtype):
			doc = frappe.new_doc("Variant Type Property")
			doc.variant_type = vtype
			for val, abbr in props:
				row = doc.append("variant_properties", {})
				row.values = val
				row.abbreviation = abbr
			doc.insert(ignore_permissions=True)
	print("  Created 6 variant type property sets")


# ---------------------------------------------------------------------------
# 7. Items (50) with 3+ images each
# ---------------------------------------------------------------------------
# (name, type, price, has_variants, sku, [categories], description, status, is_featured, slug, img_count)
ITEMS_DATA = [
	# --- Clothing (20) ---
	("Classic Cotton T-Shirt", "T-Shirt", 599, 1, "VV-TSH-001", ["T-Shirts & Tanks", "Unisex Tees"],
	 "Timeless crew-neck tee in 100% combed cotton. Soft, breathable, perfect for everyday layering.", "Active", 1, "classic-cotton-tshirt", 4),
	("Premium Zip Hoodie", "Hoodie", 1499, 1, "VV-HOD-001", ["Hoodies & Sweatshirts"],
	 "Heavyweight zip-up hoodie with brushed fleece lining, kangaroo pocket, and metal zipper.", "Active", 1, "premium-zip-hoodie", 3),
	("Slim Fit Denim Jeans", "Jeans", 1299, 1, "VV-JNS-001", ["Jeans & Trousers"],
	 "Modern slim-fit jeans in premium stretch denim. Five-pocket styling, tapered leg.", "Active", 1, "slim-fit-denim-jeans", 3),
	("Winter Puffer Jacket", "Jacket", 3999, 1, "VV-JKT-001", ["Jackets & Coats", "Puffer Jackets"],
	 "Insulated puffer with water-resistant shell and synthetic down fill for sub-zero temps.", "Active", 1, "winter-puffer-jacket", 4),
	("Floral Maxi Dress", "Dress", 1899, 1, "VV-DRS-001", ["Dresses & Skirts", "Summer Dresses"],
	 "Elegant floor-length maxi dress with all-over floral print, V-neckline, flowing skirt.", "Active", 1, "floral-maxi-dress", 3),
	("Cotton Cargo Shorts", "Shorts", 899, 1, "VV-SHR-001", ["Shorts", "Beach Wear"],
	 "Durable cotton cargo shorts with utility pockets. Relaxed fit, elastic waistband.", "Active", 0, "cotton-cargo-shorts", 3),
	("Classic Polo Shirt", "Polo Shirt", 799, 1, "VV-POL-001", ["Polo Shirts"],
	 "Refined pique polo with two-button placket and embroidered logo for smart-casual.", "Active", 1, "classic-polo-shirt", 3),
	("Merino Wool Sweater", "Sweater", 1799, 1, "VV-SWR-001", ["Sweaters", "Sweaters & Cardigans"],
	 "Ultra-fine merino wool crew-neck. Temperature-regulating and itch-free all day.", "Active", 1, "merino-wool-sweater", 3),
	("Striped Crew Neck T-Shirt", "T-Shirt", 699, 1, "VV-TSH-002", ["T-Shirts & Tanks"],
	 "Nautical-inspired striped tee in soft jersey cotton. Relaxed fit, ribbed neckline.", "Active", 0, "striped-crew-neck-tshirt", 3),
	("Graphic Tank Top", "Tank Top", 449, 1, "VV-TNK-001", ["T-Shirts & Tanks"],
	 "Bold graphic print tank top in lightweight cotton. Racerback cut, raw-edge armholes.", "Draft", 0, "graphic-tank-top", 3),
	("Linen Button-Down Shirt", "Shirt", 1099, 1, "VV-SHT-001", ["Formal Shirts", "Light Shirts"],
	 "Breathable pure linen shirt with mother-of-pearl buttons. Ideal for summer events.", "Active", 1, "linen-button-down-shirt", 3),
	("Velvet Evening Blazer", "Blazer", 3499, 1, "VV-BLZ-001", ["Blazers & Suits"],
	 "Luxurious velvet blazer with satin lapels. Tailored fit for weddings and galas.", "Active", 1, "velvet-evening-blazer", 4),
	("Slim Jogger Track Pants", "Joggers", 999, 1, "VV-JOG-001", ["Activewear Bottoms"],
	 "Tapered joggers in French terry with zippered pockets and elastic cuffs.", "Active", 0, "slim-jogger-track-pants", 3),
	("Classic Denim Jacket", "Jacket", 2499, 1, "VV-JKT-002", ["Jackets & Coats"],
	 "Vintage-wash denim jacket with button front, chest pockets, and adjustable waist tabs.", "Active", 1, "classic-denim-jacket", 3),
	("Wrap Mini Skirt", "Skirt", 799, 1, "VV-SKT-001", ["Dresses & Skirts"],
	 "A-line wrap mini skirt with tie waist. Lightweight poly-blend, available in solid colours.", "Active", 0, "wrap-mini-skirt", 3),
	("Cropped Zip Hoodie", "Hoodie", 1299, 1, "VV-HOD-002", ["Hoodies & Sweatshirts"],
	 "Cropped boxy hoodie with oversized fit, drawstring hood, and front zip.", "Active", 0, "cropped-zip-hoodie", 3),
	("Henley Long Sleeve Tee", "Henley", 749, 1, "VV-HNL-001", ["T-Shirts & Tanks"],
	 "Soft cotton henley with three-button placket. Perfect layering piece for autumn.", "Active", 0, "henley-long-sleeve-tee", 3),
	("Pleated Palazzo Pants", "Palazzo Pants", 1199, 1, "VV-PLZ-001", ["Jeans & Trousers", "Formal Trousers"],
	 "Wide-leg pleated palazzo pants in flowing crepe fabric. High waist, zip closure.", "Active", 0, "pleated-palazzo-pants", 3),
	("Quilted Puffer Vest", "Vest", 1999, 1, "VV-VST-001", ["Jackets & Coats", "Puffer Jackets"],
	 "Sleeveless quilted vest with synthetic insulation. Zip front, stand collar.", "Active", 0, "quilted-puffer-vest", 3),
	("V-Neck Cashmere Sweater", "Sweater", 2499, 1, "VV-SWR-002", ["Sweaters", "Sweaters & Cardigans"],
	 "Premium cashmere V-neck sweater. Incredibly soft with a relaxed drape.", "Active", 1, "vneck-cashmere-sweater", 3),
	# --- Footwear (10) ---
	("Urban Runner Sneakers", "Sneakers", 2499, 1, "VV-SNK-001", ["Sneakers", "Sports Shoes", "Unisex Sneakers"],
	 "Lightweight mesh running sneakers with cushioned EVA soles for gym and street.", "Active", 1, "urban-runner-sneakers", 4),
	("Chelsea Leather Boots", "Boots", 4499, 1, "VV-BOT-001", ["Boots"],
	 "Premium leather Chelsea boots with elastic panels. Goodyear-welted sole.", "Active", 1, "chelsea-leather-boots", 3),
	("Summer Slide Sandals", "Sandals", 799, 1, "VV-SND-001", ["Sandals & Slippers", "Beach Wear"],
	 "Minimalist slides with contoured footbed and non-slip rubber outsole.", "Active", 0, "summer-slide-sandals", 3),
	("Canvas Low-Top Sneakers", "Sneakers", 1299, 1, "VV-SNK-002", ["Sneakers", "Unisex Sneakers"],
	 "Classic canvas low-tops with vulcanised rubber sole. Clean lines, everyday style.", "Active", 0, "canvas-low-top-sneakers", 3),
	("Hiking Trail Boots", "Boots", 3999, 1, "VV-BOT-002", ["Boots", "Sports Shoes"],
	 "Waterproof trail boots with Vibram outsole and ankle support for rough terrain.", "Active", 0, "hiking-trail-boots", 4),
	("Classic Leather Loafers", "Loafers", 2999, 1, "VV-LOF-001", ["Loafers & Moccasins", "Formal Shoes"],
	 "Hand-stitched penny loafers in polished leather. Blake-stitched construction.", "Active", 1, "classic-leather-loafers", 3),
	("Sports Running Shoes", "Running Shoes", 2799, 1, "VV-RUN-001", ["Running Shoes", "Sports Shoes"],
	 "Responsive foam cushioning with engineered mesh upper for marathon training.", "Active", 0, "sports-running-shoes", 3),
	("Strappy Platform Sandals", "Sandals", 1499, 1, "VV-SND-002", ["Sandals & Slippers"],
	 "Platform sandals with criss-cross straps and cushioned insole. 5cm lift.", "Active", 0, "strappy-platform-sandals", 3),
	("Suede Desert Boots", "Boots", 3299, 1, "VV-BOT-003", ["Boots"],
	 "Classic desert boots in premium suede with crepe rubber sole. Two-eyelet lacing.", "Active", 0, "suede-desert-boots", 3),
	("Comfort Flip Flops", "Flip Flops", 399, 1, "VV-FLP-001", ["Sandals & Slippers", "Beach Wear"],
	 "Ergonomic flip flops with arch support and soft EVA footbed.", "Active", 0, "comfort-flip-flops", 3),
	# --- Accessories (10) ---
	("Snapback Baseball Cap", "Cap", 499, 1, "VV-CAP-001", ["Hats & Scarves"],
	 "Structured six-panel snapback with embroidered logo and adjustable closure.", "Active", 0, "snapback-baseball-cap", 3),
	("Chronograph Wrist Watch", "Watch", 4999, 0, "VV-WCH-001", ["Watches"],
	 "Stainless steel chronograph with sapphire crystal. 50m water resistance, quartz.", "Active", 1, "chronograph-wrist-watch", 4),
	("Aviator Sunglasses", "Sunglasses", 1299, 1, "VV-SNG-001", ["Sunglasses"],
	 "Classic aviator sunglasses with polarized lenses. Lightweight metal frames, UV400.", "Active", 1, "aviator-sunglasses", 3),
	("Genuine Leather Belt", "Belt", 699, 1, "VV-BLT-001", ["Belts & Wallets"],
	 "Single-piece genuine leather belt with brushed nickel pin buckle.", "Active", 0, "genuine-leather-belt", 3),
	("Bi-fold Leather Wallet", "Wallet", 999, 0, "VV-WLT-001", ["Belts & Wallets"],
	 "Slim bi-fold in full-grain leather with RFID blocking. Six card slots, coin pocket.", "Active", 1, "bi-fold-leather-wallet", 3),
	("Cashmere Winter Scarf", "Scarf", 1499, 1, "VV-SCR-001", ["Hats & Scarves", "Scarves & Beanies"],
	 "100% cashmere scarf with fringed edges. Lightweight yet warm for winter layering.", "Active", 0, "cashmere-winter-scarf", 3),
	("Silver Chain Bracelet", "Bracelet", 899, 0, "VV-BRC-001", ["Jewellery"],
	 "Sterling silver chain bracelet with lobster clasp. Hypoallergenic, 7-inch length.", "Active", 0, "silver-chain-bracelet", 3),
	("Knit Beanie Winter Hat", "Beanie", 599, 1, "VV-BNE-001", ["Hats & Scarves", "Scarves & Beanies"],
	 "Double-knit acrylic beanie with fold-over cuff. Fleece-lined for extra warmth.", "Active", 0, "knit-beanie-winter-hat", 3),
	("Silk Pocket Square", "Pocket Square", 399, 0, "VV-PSQ-001", ["Blazers & Suits", "Jewellery"],
	 "Hand-rolled silk pocket square in classic paisley print. Italian-made.", "Active", 0, "silk-pocket-square", 3),
	("Titanium Cufflinks Set", "Cufflinks", 1299, 0, "VV-CLK-001", ["Jewellery", "Blazers & Suits"],
	 "Brushed titanium cufflinks with toggle back. Lightweight and hypoallergenic.", "Active", 0, "titanium-cufflinks-set", 3),
	# --- Bags (5) ---
	("Leather Travel Backpack", "Backpack", 3499, 1, "VV-BPK-001", ["Backpacks & Totes"],
	 "Full-grain leather backpack with padded laptop compartment and brass hardware.", "Active", 1, "leather-travel-backpack", 4),
	("Canvas Tote Bag", "Tote Bag", 799, 1, "VV-TOT-001", ["Backpacks & Totes"],
	 "Heavy-duty canvas tote with reinforced handles and interior pocket.", "Active", 0, "canvas-tote-bag", 3),
	("Laptop Messenger Bag", "Messenger Bag", 2499, 1, "VV-MSG-001", ["Messenger & Laptop"],
	 "Waxed canvas messenger with padded 15-inch laptop sleeve and brass buckles.", "Active", 0, "laptop-messenger-bag", 3),
	("Gym Duffel Bag", "Duffel Bag", 1799, 1, "VV-DFL-001", ["Duffel & Gym"],
	 "Water-resistant duffel with shoe compartment, ventilated mesh pockets.", "Active", 0, "gym-duffel-bag", 3),
	("Crossbody Sling Bag", "Sling Bag", 1299, 1, "VV-SLG-001", ["Sling & Crossbody"],
	 "Compact sling bag with RFID pocket, adjustable strap, and quick-access zip.", "Active", 0, "crossbody-sling-bag", 3),
	# --- Misc (5) ---
	("Compression Gym Shorts", "Shorts", 699, 1, "VV-CMP-001", ["Compression Wear", "Activewear Bottoms"],
	 "Performance compression shorts with moisture-wicking fabric and flat-lock seams.", "Active", 0, "compression-gym-shorts", 3),
	("Thermal Base Layer Top", "Base Layer", 999, 1, "VV-TBL-001", ["Thermals", "Activewear Tops"],
	 "Merino-blend thermal top with four-way stretch. Flatlock seams, thumbhole cuffs.", "Active", 0, "thermal-base-layer-top", 3),
	("Performance Windbreaker", "Windbreaker", 1999, 1, "VV-WBR-001", ["Jackets & Coats", "This Season"],
	 "Packable windbreaker with DWR coating, half-zip front, and reflective details.", "Active", 1, "performance-windbreaker", 3),
	("Board Swim Shorts", "Swim Shorts", 899, 1, "VV-SWM-001", ["Beach Wear", "Shorts"],
	 "Quick-dry board shorts with internal mesh brief and cargo pocket.", "Active", 0, "board-swim-shorts", 3),
	("Organic Cotton Cardigan", "Cardigan", 1599, 1, "VV-CRD-001", ["Sweaters & Cardigans", "Sweaters"],
	 "Button-front cardigan in certified organic cotton. Relaxed fit, patch pockets.", "Active", 0, "organic-cotton-cardigan", 3),
]


def _create_items():
	created = {}
	for name, itype, price, has_var, sku, cats, desc, status, featured, slug, img_count in ITEMS_DATA:
		existing = frappe.db.get_value("Items", {"item_name": name}, "name")
		if existing:
			created[name] = existing
			continue
		doc = frappe.get_doc({
			"doctype": "Items",
			"item_name": name, "type": itype, "base_price": price,
			"has_variants": has_var, "sku": sku, "in_stock": 0,
			"status": status, "is_featured": featured,
			"published": 1 if status == "Active" else 0,
			"description": desc, "slug": slug,
			"meta_title": name, "meta_description": desc[:160],
			"category": [{"category": c} for c in cats],
			"item_image": _make_images(slug, name, img_count),
		})
		doc.insert(ignore_permissions=True)
		created[name] = doc.name
		print(f"  + {name} ({doc.name}) [{img_count} images]")

	# Items without variants — set in_stock directly
	for n in ["Chronograph Wrist Watch", "Bi-fold Leather Wallet", "Silver Chain Bracelet",
			  "Silk Pocket Square", "Titanium Cufflinks Set"]:
		item_id = created.get(n)
		if item_id:
			frappe.db.set_value("Items", item_id, "in_stock", 1)

	print(f"\n  Total items: {len(created)}")
	return created


# ---------------------------------------------------------------------------
# 8. Variants (~150) with images
# ---------------------------------------------------------------------------
# (item_name, [(type, value), ...], price, qty, is_stock)
VARIANTS_DATA = [
	# Classic Cotton T-Shirt (6)
	("Classic Cotton T-Shirt", [("Color", "Red"), ("Size", "S")], 599, 45, 1),
	("Classic Cotton T-Shirt", [("Color", "Red"), ("Size", "M")], 599, 80, 1),
	("Classic Cotton T-Shirt", [("Color", "Blue"), ("Size", "M")], 599, 60, 1),
	("Classic Cotton T-Shirt", [("Color", "Blue"), ("Size", "L")], 599, 35, 1),
	("Classic Cotton T-Shirt", [("Color", "Black"), ("Size", "M")], 599, 70, 1),
	("Classic Cotton T-Shirt", [("Color", "Black"), ("Size", "XL")], 599, 25, 1),
	# Premium Zip Hoodie (4)
	("Premium Zip Hoodie", [("Color", "Grey"), ("Size", "M")], 1499, 30, 1),
	("Premium Zip Hoodie", [("Color", "Grey"), ("Size", "L")], 1499, 40, 1),
	("Premium Zip Hoodie", [("Color", "Black"), ("Size", "L")], 1599, 25, 1),
	("Premium Zip Hoodie", [("Color", "Black"), ("Size", "XL")], 1599, 15, 1),
	# Slim Fit Denim Jeans (4)
	("Slim Fit Denim Jeans", [("Color", "Blue"), ("Size", "M")], 1299, 50, 1),
	("Slim Fit Denim Jeans", [("Color", "Blue"), ("Size", "L")], 1299, 40, 1),
	("Slim Fit Denim Jeans", [("Color", "Black"), ("Size", "M")], 1299, 35, 1),
	("Slim Fit Denim Jeans", [("Color", "Black"), ("Size", "L")], 1399, 20, 1),
	# Winter Puffer Jacket (3)
	("Winter Puffer Jacket", [("Color", "Black"), ("Size", "L")], 3999, 12, 1),
	("Winter Puffer Jacket", [("Color", "Black"), ("Size", "XL")], 3999, 8, 1),
	("Winter Puffer Jacket", [("Color", "Navy"), ("Size", "L")], 4199, 6, 1),
	# Floral Maxi Dress (4)
	("Floral Maxi Dress", [("Color", "Red"), ("Size", "S")], 1899, 15, 1),
	("Floral Maxi Dress", [("Color", "Red"), ("Size", "M")], 1899, 20, 1),
	("Floral Maxi Dress", [("Color", "Blue"), ("Size", "S")], 1899, 10, 1),
	("Floral Maxi Dress", [("Color", "Blue"), ("Size", "M")], 1899, 0, 0),
	# Cotton Cargo Shorts (3)
	("Cotton Cargo Shorts", [("Color", "Beige"), ("Size", "M")], 899, 40, 1),
	("Cotton Cargo Shorts", [("Color", "Beige"), ("Size", "L")], 899, 30, 1),
	("Cotton Cargo Shorts", [("Color", "Green"), ("Size", "M")], 899, 25, 1),
	# Classic Polo Shirt (4)
	("Classic Polo Shirt", [("Color", "Navy"), ("Size", "M")], 799, 55, 1),
	("Classic Polo Shirt", [("Color", "Navy"), ("Size", "L")], 799, 40, 1),
	("Classic Polo Shirt", [("Color", "White"), ("Size", "M")], 799, 35, 1),
	("Classic Polo Shirt", [("Color", "White"), ("Size", "L")], 799, 30, 1),
	# Merino Wool Sweater (3)
	("Merino Wool Sweater", [("Color", "Grey"), ("Size", "M")], 1799, 18, 1),
	("Merino Wool Sweater", [("Color", "Grey"), ("Size", "L")], 1799, 22, 1),
	("Merino Wool Sweater", [("Color", "Navy"), ("Size", "L")], 1899, 12, 1),
	# Striped Crew Neck T-Shirt (3)
	("Striped Crew Neck T-Shirt", [("Color", "Navy"), ("Size", "M")], 699, 35, 1),
	("Striped Crew Neck T-Shirt", [("Color", "Navy"), ("Size", "L")], 699, 25, 1),
	("Striped Crew Neck T-Shirt", [("Color", "Red"), ("Size", "M")], 699, 20, 1),
	# Graphic Tank Top (2) — Draft item
	("Graphic Tank Top", [("Color", "Black"), ("Size", "M")], 449, 50, 1),
	("Graphic Tank Top", [("Color", "White"), ("Size", "L")], 449, 30, 1),
	# Linen Button-Down Shirt (3)
	("Linen Button-Down Shirt", [("Color", "White"), ("Size", "M")], 1099, 30, 1),
	("Linen Button-Down Shirt", [("Color", "White"), ("Size", "L")], 1099, 20, 1),
	("Linen Button-Down Shirt", [("Color", "Blue"), ("Size", "M")], 1099, 25, 1),
	# Velvet Evening Blazer (3)
	("Velvet Evening Blazer", [("Color", "Black"), ("Size", "M")], 3499, 10, 1),
	("Velvet Evening Blazer", [("Color", "Black"), ("Size", "L")], 3499, 8, 1),
	("Velvet Evening Blazer", [("Color", "Navy"), ("Size", "L")], 3699, 5, 1),
	# Slim Jogger Track Pants (3)
	("Slim Jogger Track Pants", [("Color", "Black"), ("Size", "M")], 999, 45, 1),
	("Slim Jogger Track Pants", [("Color", "Black"), ("Size", "L")], 999, 35, 1),
	("Slim Jogger Track Pants", [("Color", "Grey"), ("Size", "M")], 999, 30, 1),
	# Classic Denim Jacket (3)
	("Classic Denim Jacket", [("Color", "Blue"), ("Size", "M")], 2499, 15, 1),
	("Classic Denim Jacket", [("Color", "Blue"), ("Size", "L")], 2499, 12, 1),
	("Classic Denim Jacket", [("Color", "Black"), ("Size", "L")], 2699, 8, 1),
	# Wrap Mini Skirt (3)
	("Wrap Mini Skirt", [("Color", "Black"), ("Size", "S")], 799, 25, 1),
	("Wrap Mini Skirt", [("Color", "Red"), ("Size", "S")], 799, 20, 1),
	("Wrap Mini Skirt", [("Color", "Red"), ("Size", "M")], 799, 15, 1),
	# Cropped Zip Hoodie (3)
	("Cropped Zip Hoodie", [("Color", "Pink"), ("Size", "S")], 1299, 20, 1),
	("Cropped Zip Hoodie", [("Color", "Pink"), ("Size", "M")], 1299, 18, 1),
	("Cropped Zip Hoodie", [("Color", "Black"), ("Size", "M")], 1299, 22, 1),
	# Henley Long Sleeve Tee (3)
	("Henley Long Sleeve Tee", [("Color", "Grey"), ("Size", "M")], 749, 40, 1),
	("Henley Long Sleeve Tee", [("Color", "Grey"), ("Size", "L")], 749, 30, 1),
	("Henley Long Sleeve Tee", [("Color", "Navy"), ("Size", "M")], 749, 25, 1),
	# Pleated Palazzo Pants (3)
	("Pleated Palazzo Pants", [("Color", "Black"), ("Size", "M")], 1199, 20, 1),
	("Pleated Palazzo Pants", [("Color", "Black"), ("Size", "L")], 1199, 15, 1),
	("Pleated Palazzo Pants", [("Color", "Beige"), ("Size", "M")], 1199, 18, 1),
	# Quilted Puffer Vest (3)
	("Quilted Puffer Vest", [("Color", "Black"), ("Size", "M")], 1999, 14, 1),
	("Quilted Puffer Vest", [("Color", "Black"), ("Size", "L")], 1999, 10, 1),
	("Quilted Puffer Vest", [("Color", "Navy"), ("Size", "L")], 2099, 8, 1),
	# V-Neck Cashmere Sweater (3)
	("V-Neck Cashmere Sweater", [("Color", "Grey"), ("Size", "M")], 2499, 12, 1),
	("V-Neck Cashmere Sweater", [("Color", "Navy"), ("Size", "M")], 2499, 10, 1),
	("V-Neck Cashmere Sweater", [("Color", "Navy"), ("Size", "L")], 2499, 8, 1),
	# --- Footwear ---
	# Urban Runner Sneakers (4)
	("Urban Runner Sneakers", [("Color", "White"), ("Size", "M")], 2499, 18, 1),
	("Urban Runner Sneakers", [("Color", "White"), ("Size", "L")], 2499, 12, 1),
	("Urban Runner Sneakers", [("Color", "Black"), ("Size", "M")], 2699, 15, 1),
	("Urban Runner Sneakers", [("Color", "Black"), ("Size", "L")], 2699, 8, 1),
	# Chelsea Leather Boots (3)
	("Chelsea Leather Boots", [("Color", "Brown"), ("Size", "M")], 4499, 8, 1),
	("Chelsea Leather Boots", [("Color", "Brown"), ("Size", "L")], 4499, 6, 1),
	("Chelsea Leather Boots", [("Color", "Black"), ("Size", "L")], 4699, 5, 1),
	# Summer Slide Sandals (3)
	("Summer Slide Sandals", [("Color", "Black"), ("Size", "M")], 799, 40, 1),
	("Summer Slide Sandals", [("Color", "Black"), ("Size", "L")], 799, 30, 1),
	("Summer Slide Sandals", [("Color", "White"), ("Size", "M")], 799, 25, 1),
	# Canvas Low-Top Sneakers (3)
	("Canvas Low-Top Sneakers", [("Color", "White"), ("Size", "M")], 1299, 35, 1),
	("Canvas Low-Top Sneakers", [("Color", "Navy"), ("Size", "M")], 1299, 28, 1),
	("Canvas Low-Top Sneakers", [("Color", "Black"), ("Size", "L")], 1299, 22, 1),
	# Hiking Trail Boots (3)
	("Hiking Trail Boots", [("Color", "Brown"), ("Size", "M")], 3999, 10, 1),
	("Hiking Trail Boots", [("Color", "Brown"), ("Size", "L")], 3999, 8, 1),
	("Hiking Trail Boots", [("Color", "Black"), ("Size", "L")], 4199, 6, 1),
	# Classic Leather Loafers (3)
	("Classic Leather Loafers", [("Color", "Brown"), ("Size", "M")], 2999, 12, 1),
	("Classic Leather Loafers", [("Color", "Brown"), ("Size", "L")], 2999, 10, 1),
	("Classic Leather Loafers", [("Color", "Black"), ("Size", "M")], 2999, 8, 1),
	# Sports Running Shoes (3)
	("Sports Running Shoes", [("Color", "Black"), ("Size", "M")], 2799, 20, 1),
	("Sports Running Shoes", [("Color", "Black"), ("Size", "L")], 2799, 15, 1),
	("Sports Running Shoes", [("Color", "White"), ("Size", "M")], 2799, 12, 1),
	# Strappy Platform Sandals (3)
	("Strappy Platform Sandals", [("Color", "Black"), ("Size", "S")], 1499, 15, 1),
	("Strappy Platform Sandals", [("Color", "Brown"), ("Size", "S")], 1499, 12, 1),
	("Strappy Platform Sandals", [("Color", "Brown"), ("Size", "M")], 1499, 10, 1),
	# Suede Desert Boots (3)
	("Suede Desert Boots", [("Color", "Brown"), ("Size", "M")], 3299, 8, 1),
	("Suede Desert Boots", [("Color", "Brown"), ("Size", "L")], 3299, 6, 1),
	("Suede Desert Boots", [("Color", "Beige"), ("Size", "M")], 3299, 4, 1),
	# Comfort Flip Flops (3)
	("Comfort Flip Flops", [("Color", "Black"), ("Size", "M")], 399, 60, 1),
	("Comfort Flip Flops", [("Color", "Blue"), ("Size", "M")], 399, 50, 1),
	("Comfort Flip Flops", [("Color", "Blue"), ("Size", "L")], 399, 40, 1),
	# --- Accessories (color only) ---
	("Snapback Baseball Cap", [("Color", "Black")], 499, 80, 1),
	("Snapback Baseball Cap", [("Color", "Navy")], 499, 50, 1),
	("Snapback Baseball Cap", [("Color", "White")], 499, 35, 1),
	("Aviator Sunglasses", [("Color", "Black")], 1299, 30, 1),
	("Aviator Sunglasses", [("Color", "Brown")], 1299, 20, 1),
	("Aviator Sunglasses", [("Color", "Grey")], 1399, 15, 1),
	("Genuine Leather Belt", [("Color", "Brown")], 699, 40, 1),
	("Genuine Leather Belt", [("Color", "Black")], 699, 55, 1),
	("Genuine Leather Belt", [("Color", "Beige")], 749, 20, 1),
	("Cashmere Winter Scarf", [("Color", "Grey")], 1499, 18, 1),
	("Cashmere Winter Scarf", [("Color", "Navy")], 1499, 15, 1),
	("Cashmere Winter Scarf", [("Color", "Red")], 1599, 10, 1),
	("Knit Beanie Winter Hat", [("Color", "Black")], 599, 40, 1),
	("Knit Beanie Winter Hat", [("Color", "Grey")], 599, 35, 1),
	("Knit Beanie Winter Hat", [("Color", "Navy")], 599, 30, 1),
	# --- Bags ---
	("Leather Travel Backpack", [("Color", "Brown")], 3499, 10, 1),
	("Leather Travel Backpack", [("Color", "Black")], 3699, 8, 1),
	("Canvas Tote Bag", [("Color", "Beige")], 799, 40, 1),
	("Canvas Tote Bag", [("Color", "Black")], 799, 30, 1),
	("Canvas Tote Bag", [("Color", "Navy")], 799, 25, 1),
	("Laptop Messenger Bag", [("Color", "Brown")], 2499, 12, 1),
	("Laptop Messenger Bag", [("Color", "Black")], 2499, 10, 1),
	("Gym Duffel Bag", [("Color", "Black")], 1799, 15, 1),
	("Gym Duffel Bag", [("Color", "Navy")], 1799, 12, 1),
	("Gym Duffel Bag", [("Color", "Grey")], 1799, 10, 1),
	("Crossbody Sling Bag", [("Color", "Black")], 1299, 20, 1),
	("Crossbody Sling Bag", [("Color", "Brown")], 1299, 15, 1),
	# --- Misc ---
	("Compression Gym Shorts", [("Color", "Black"), ("Size", "M")], 699, 35, 1),
	("Compression Gym Shorts", [("Color", "Black"), ("Size", "L")], 699, 30, 1),
	("Compression Gym Shorts", [("Color", "Navy"), ("Size", "M")], 699, 25, 1),
	("Thermal Base Layer Top", [("Color", "Black"), ("Size", "M")], 999, 20, 1),
	("Thermal Base Layer Top", [("Color", "Black"), ("Size", "L")], 999, 15, 1),
	("Thermal Base Layer Top", [("Color", "Grey"), ("Size", "M")], 999, 18, 1),
	("Performance Windbreaker", [("Color", "Black"), ("Size", "M")], 1999, 14, 1),
	("Performance Windbreaker", [("Color", "Black"), ("Size", "L")], 1999, 10, 1),
	("Performance Windbreaker", [("Color", "Navy"), ("Size", "L")], 2099, 8, 1),
	("Board Swim Shorts", [("Color", "Blue"), ("Size", "M")], 899, 30, 1),
	("Board Swim Shorts", [("Color", "Blue"), ("Size", "L")], 899, 25, 1),
	("Board Swim Shorts", [("Color", "Black"), ("Size", "M")], 899, 20, 1),
	("Organic Cotton Cardigan", [("Color", "Grey"), ("Size", "M")], 1599, 15, 1),
	("Organic Cotton Cardigan", [("Color", "Grey"), ("Size", "L")], 1599, 12, 1),
	("Organic Cotton Cardigan", [("Color", "Navy"), ("Size", "M")], 1599, 10, 1),
]


def _create_variants(items):
	# Build property lookup
	prop_lookup = {}
	for vtype in ["Color", "Size", "Material", "Pattern", "Fit", "Sleeve Length"]:
		rows = frappe.get_all(
			"Variant Properties",
			filters={"parent": vtype, "parenttype": "Variant Type Property"},
			fields=["name", "values"],
		)
		for r in rows:
			prop_lookup[(vtype, r.get("values"))] = r.name

	count = 0
	for item_name, variant_values, price, qty, is_stock in VARIANTS_DATA:
		item_id = items.get(item_name)
		if not item_id:
			continue

		vv_rows = []
		for vtype, vval in variant_values:
			prop_name = prop_lookup.get((vtype, vval))
			if prop_name:
				vv_rows.append({"type": vtype, "value": prop_name})

		# Build slug for variant images
		color = next((v for t, v in variant_values if t == "Color"), "default")
		slug = items.get(item_name, "").lower().replace(" ", "-")
		v_slug = f"{slug}-{color.lower()}"

		doc = frappe.get_doc({
			"doctype": "Variants",
			"variant_name": item_id,
			"price": price,
			"quantity": qty,
			"is_stock": is_stock,
			"variant_values": vv_rows,
			"image": _make_images(v_slug, f"{item_name} {color}", 2),
		})

		try:
			doc.insert(ignore_permissions=True)
			count += 1
		except frappe.exceptions.ValidationError as e:
			print(f"  ! {item_name} — {str(e)[:80]}")

	print(f"  Created {count} variants with images")


# ---------------------------------------------------------------------------
# 9. Users (25)
# ---------------------------------------------------------------------------
USER_PROFILES = [
	("aarav.sharma@veloraverse.com", "Aarav", "Sharma"),
	("priya.patel@veloraverse.com", "Priya", "Patel"),
	("rohan.mehta@veloraverse.com", "Rohan", "Mehta"),
	("ananya.gupta@veloraverse.com", "Ananya", "Gupta"),
	("vikram.singh@veloraverse.com", "Vikram", "Singh"),
	("sneha.reddy@veloraverse.com", "Sneha", "Reddy"),
	("arjun.kumar@veloraverse.com", "Arjun", "Kumar"),
	("diya.nair@veloraverse.com", "Diya", "Nair"),
	("karthik.iyer@veloraverse.com", "Karthik", "Iyer"),
	("meera.joshi@veloraverse.com", "Meera", "Joshi"),
	("ishaan.deshmukh@veloraverse.com", "Ishaan", "Deshmukh"),
	("kavya.menon@veloraverse.com", "Kavya", "Menon"),
	("rahul.chatterjee@veloraverse.com", "Rahul", "Chatterjee"),
	("pooja.kapoor@veloraverse.com", "Pooja", "Kapoor"),
	("nikhil.saxena@veloraverse.com", "Nikhil", "Saxena"),
	("tanvi.bhat@veloraverse.com", "Tanvi", "Bhat"),
	("aditya.pillai@veloraverse.com", "Aditya", "Pillai"),
	("shreya.das@veloraverse.com", "Shreya", "Das"),
	("siddharth.malhotra@veloraverse.com", "Siddharth", "Malhotra"),
	("neha.agarwal@veloraverse.com", "Neha", "Agarwal"),
	("varun.mishra@veloraverse.com", "Varun", "Mishra"),
	("riya.sinha@veloraverse.com", "Riya", "Sinha"),
	("harsh.tiwari@veloraverse.com", "Harsh", "Tiwari"),
	("aisha.khan@veloraverse.com", "Aisha", "Khan"),
	("dev.rathore@veloraverse.com", "Dev", "Rathore"),
]


def _create_users():
	users = []
	for email, first, last in USER_PROFILES:
		if not frappe.db.exists("User", email):
			frappe.get_doc({
				"doctype": "User", "email": email,
				"first_name": first, "last_name": last,
				"user_type": "Website User", "send_welcome_email": 0,
				"new_password": "Velora@2026#Cx",
			}).insert(ignore_permissions=True)
		users.append(email)
	print(f"  Created {len(users)} users")
	return users


# ---------------------------------------------------------------------------
# 10. Addresses (55+) — 2 per user + 5 extras
# ---------------------------------------------------------------------------
# (user_idx, full_name, phone, type, is_default, line1, line2, city, state, pincode)
ADDRESS_DATA = [
	(0, "Aarav Sharma", "9876543210", "Shipping", 1, "42, MG Road, Indiranagar", "Near Metro Station", "Bengaluru", "Karnataka", "560038"),
	(0, "Aarav Sharma", "9876543210", "Billing", 0, "42, MG Road, Indiranagar", "Near Metro Station", "Bengaluru", "Karnataka", "560038"),
	(1, "Priya Patel", "9823456789", "Shipping", 1, "15, Satellite Road", "Opp. Nehru Bridge", "Ahmedabad", "Gujarat", "380015"),
	(1, "Priya Patel", "9823456789", "Billing", 0, "B-201, Shanti Apartment", "Vastrapur", "Ahmedabad", "Gujarat", "380054"),
	(2, "Rohan Mehta", "9712345678", "Shipping", 1, "8/3, Linking Road, Bandra West", "", "Mumbai", "Maharashtra", "400050"),
	(2, "Rohan Mehta", "9712345678", "Billing", 0, "8/3, Linking Road, Bandra West", "", "Mumbai", "Maharashtra", "400050"),
	(3, "Ananya Gupta", "9654321098", "Shipping", 1, "C-12, Hauz Khas Village", "Near Deer Park", "New Delhi", "Delhi", "110016"),
	(3, "Ananya Gupta", "9654321098", "Billing", 0, "C-12, Hauz Khas Village", "Near Deer Park", "New Delhi", "Delhi", "110016"),
	(4, "Vikram Singh", "9545678901", "Shipping", 1, "23, Civil Lines", "Opp. GPO", "Jaipur", "Rajasthan", "302006"),
	(4, "Vikram Singh", "9545678901", "Billing", 0, "45, Tonk Road, Lalkothi", "", "Jaipur", "Rajasthan", "302015"),
	(5, "Sneha Reddy", "9498765432", "Shipping", 1, "Plot 5, Jubilee Hills Road 36", "", "Hyderabad", "Telangana", "500033"),
	(5, "Sneha Reddy", "9498765432", "Billing", 0, "Plot 5, Jubilee Hills Road 36", "", "Hyderabad", "Telangana", "500033"),
	(6, "Arjun Kumar", "9387654321", "Shipping", 1, "17/A, Anna Nagar 2nd Street", "Near Tower Park", "Chennai", "Tamil Nadu", "600040"),
	(6, "Arjun Kumar", "9387654321", "Billing", 0, "17/A, Anna Nagar 2nd Street", "Near Tower Park", "Chennai", "Tamil Nadu", "600040"),
	(7, "Diya Nair", "9276543210", "Shipping", 1, "TC 25/1234, Kowdiar", "Near Museum", "Thiruvananthapuram", "Kerala", "695003"),
	(7, "Diya Nair", "9276543210", "Billing", 0, "TC 25/1234, Kowdiar", "Near Museum", "Thiruvananthapuram", "Kerala", "695003"),
	(8, "Karthik Iyer", "9165432109", "Shipping", 1, "32, Koramangala 4th Block", "Near Forum Mall", "Bengaluru", "Karnataka", "560034"),
	(8, "Karthik Iyer", "9165432109", "Billing", 0, "32, Koramangala 4th Block", "Near Forum Mall", "Bengaluru", "Karnataka", "560034"),
	(9, "Meera Joshi", "9054321098", "Shipping", 1, "9, FC Road, Shivajinagar", "Near Ferguson College", "Pune", "Maharashtra", "411004"),
	(9, "Meera Joshi", "9054321098", "Billing", 0, "9, FC Road, Shivajinagar", "Near Ferguson College", "Pune", "Maharashtra", "411004"),
	(10, "Ishaan Deshmukh", "9943210987", "Shipping", 1, "14, Deccan Gymkhana", "Lane 5", "Pune", "Maharashtra", "411004"),
	(10, "Ishaan Deshmukh", "9943210987", "Billing", 0, "14, Deccan Gymkhana", "Lane 5", "Pune", "Maharashtra", "411004"),
	(11, "Kavya Menon", "9832109876", "Shipping", 1, "23/A, MG Road, Ernakulam", "Near Lulu Mall", "Kochi", "Kerala", "682011"),
	(11, "Kavya Menon", "9832109876", "Billing", 0, "23/A, MG Road, Ernakulam", "Near Lulu Mall", "Kochi", "Kerala", "682011"),
	(12, "Rahul Chatterjee", "9721098765", "Shipping", 1, "45, Park Street", "Near Flurys", "Kolkata", "West Bengal", "700016"),
	(12, "Rahul Chatterjee", "9721098765", "Billing", 0, "45, Park Street", "Near Flurys", "Kolkata", "West Bengal", "700016"),
	(13, "Pooja Kapoor", "9610987654", "Shipping", 1, "D-8, Vasant Vihar", "Near PVR", "New Delhi", "Delhi", "110057"),
	(13, "Pooja Kapoor", "9610987654", "Billing", 0, "D-8, Vasant Vihar", "Near PVR", "New Delhi", "Delhi", "110057"),
	(14, "Nikhil Saxena", "9509876543", "Shipping", 1, "12, Mall Road", "Near Scandal Point", "Shimla", "Himachal Pradesh", "171001"),
	(14, "Nikhil Saxena", "9509876543", "Billing", 0, "12, Mall Road", "Near Scandal Point", "Shimla", "Himachal Pradesh", "171001"),
	(15, "Tanvi Bhat", "9498765432", "Shipping", 1, "7, Shivaji Nagar", "Tilak Road", "Pune", "Maharashtra", "411005"),
	(15, "Tanvi Bhat", "9498765432", "Billing", 0, "7, Shivaji Nagar", "Tilak Road", "Pune", "Maharashtra", "411005"),
	(16, "Aditya Pillai", "9387654321", "Shipping", 1, "5, Anna Salai", "Near Spencer Plaza", "Chennai", "Tamil Nadu", "600002"),
	(16, "Aditya Pillai", "9387654321", "Billing", 0, "5, Anna Salai", "Near Spencer Plaza", "Chennai", "Tamil Nadu", "600002"),
	(17, "Shreya Das", "9276543210", "Shipping", 1, "28, Salt Lake Sector V", "Near Technopolis", "Kolkata", "West Bengal", "700091"),
	(17, "Shreya Das", "9276543210", "Billing", 0, "28, Salt Lake Sector V", "Near Technopolis", "Kolkata", "West Bengal", "700091"),
	(18, "Siddharth Malhotra", "9165432109", "Shipping", 1, "22, Sector 17", "Near Lake", "Chandigarh", "Punjab", "160017"),
	(18, "Siddharth Malhotra", "9165432109", "Billing", 0, "22, Sector 17", "Near Lake", "Chandigarh", "Punjab", "160017"),
	(19, "Neha Agarwal", "9054321098", "Shipping", 1, "B-15, Gomti Nagar", "Near Fun Republic", "Lucknow", "Uttar Pradesh", "226010"),
	(19, "Neha Agarwal", "9054321098", "Billing", 0, "B-15, Gomti Nagar", "Near Fun Republic", "Lucknow", "Uttar Pradesh", "226010"),
	(20, "Varun Mishra", "8943210987", "Shipping", 1, "34, Kankarbagh Main Road", "", "Patna", "Bihar", "800020"),
	(20, "Varun Mishra", "8943210987", "Billing", 0, "34, Kankarbagh Main Road", "", "Patna", "Bihar", "800020"),
	(21, "Riya Sinha", "8832109876", "Shipping", 1, "C-7, Banjara Hills", "Road No 12", "Hyderabad", "Telangana", "500034"),
	(21, "Riya Sinha", "8832109876", "Billing", 0, "C-7, Banjara Hills", "Road No 12", "Hyderabad", "Telangana", "500034"),
	(22, "Harsh Tiwari", "8721098765", "Shipping", 1, "19, Arera Colony", "E-5 Sector", "Bhopal", "Madhya Pradesh", "462016"),
	(22, "Harsh Tiwari", "8721098765", "Billing", 0, "19, Arera Colony", "E-5 Sector", "Bhopal", "Madhya Pradesh", "462016"),
	(23, "Aisha Khan", "8610987654", "Shipping", 1, "A-4, Nampally", "Near Clock Tower", "Hyderabad", "Telangana", "500001"),
	(23, "Aisha Khan", "8610987654", "Billing", 0, "A-4, Nampally", "Near Clock Tower", "Hyderabad", "Telangana", "500001"),
	(24, "Dev Rathore", "8509876543", "Shipping", 1, "56, MI Road", "Near Panch Batti", "Jaipur", "Rajasthan", "302001"),
	(24, "Dev Rathore", "8509876543", "Billing", 0, "56, MI Road", "Near Panch Batti", "Jaipur", "Rajasthan", "302001"),
	# Extra shipping addresses (5 users with alternate shipping — different cities to avoid name clash)
	(0, "Aarav Sharma", "9876543210", "Shipping", 0, "12, MG Road", "Near City Centre Mall", "Mysuru", "Karnataka", "570001"),
	(2, "Rohan Mehta", "9712345678", "Shipping", 0, "15/B, FC Road", "Near Garware Bridge", "Pune", "Maharashtra", "411004"),
	(5, "Sneha Reddy", "9498765432", "Shipping", 0, "8, LB Nagar Main Road", "Near Kothapet", "Rangareddy", "Telangana", "500074"),
	(8, "Karthik Iyer", "9165432109", "Shipping", 0, "45, Indiranagar 12th Main", "Near 100 Feet Road", "Mangaluru", "Karnataka", "575001"),
	(13, "Pooja Kapoor", "9610987654", "Shipping", 0, "A-21, Sector 62", "Near Noida City Centre Metro", "Noida", "Uttar Pradesh", "201301"),
]


def _create_addresses(users):
	addresses = {}
	count = 0
	for user_idx, full_name, phone, addr_type, is_default, line1, line2, city, state, pincode in ADDRESS_DATA:
		user = users[user_idx]
		try:
			doc = frappe.get_doc({
				"doctype": "Address", "user": user, "full_name": full_name,
				"phone": phone, "address_type": addr_type, "is_default": is_default,
				"address_line_1": line1, "address_line_2": line2,
				"city": city, "state": state, "pincode": pincode, "country": "India",
			})
			doc.insert(ignore_permissions=True)
			if user not in addresses:
				addresses[user] = {}
			if addr_type not in addresses[user]:
				addresses[user][addr_type] = doc.name
			count += 1
		except Exception as e:
			print(f"  ! {full_name} — {str(e)[:80]}")

	print(f"  Created {count} addresses")
	return addresses


# ---------------------------------------------------------------------------
# 11. Coupons (15)
# ---------------------------------------------------------------------------
def _create_coupons(items):
	now = now_datetime()
	coupons = [
		{"coupon_code": "WELCOME10", "description": "10% off first order", "discount_type": "Percentage",
		 "discount_value": 10, "max_discount": 500, "min_order_value": 999, "usage_limit": 100,
		 "per_user_limit": 1, "valid_from": add_days(now, -30), "valid_to": add_days(now, 60)},
		{"coupon_code": "FLAT200", "description": "Flat Rs 200 off above Rs 1500", "discount_type": "Flat",
		 "discount_value": 200, "min_order_value": 1500, "usage_limit": 50,
		 "per_user_limit": 2, "valid_from": add_days(now, -15), "valid_to": add_days(now, 45)},
		{"coupon_code": "WINTER25", "description": "25% off winter collection", "discount_type": "Percentage",
		 "discount_value": 25, "max_discount": 1000, "min_order_value": 2000, "usage_limit": 30,
		 "per_user_limit": 1, "valid_from": add_days(now, -10), "valid_to": add_days(now, 30)},
		{"coupon_code": "FLAT500", "description": "Flat Rs 500 off above Rs 3000", "discount_type": "Flat",
		 "discount_value": 500, "min_order_value": 3000, "usage_limit": 20,
		 "per_user_limit": 1, "valid_from": add_days(now, -5), "valid_to": add_days(now, 25)},
		{"coupon_code": "EXPIRED20", "description": "Expired 20% promo", "discount_type": "Percentage",
		 "discount_value": 20, "max_discount": 800, "min_order_value": 1000, "usage_limit": 100,
		 "per_user_limit": 1, "valid_from": add_days(now, -90), "valid_to": add_days(now, -30), "is_active": 0},
		{"coupon_code": "SUMMER15", "description": "15% off summer styles", "discount_type": "Percentage",
		 "discount_value": 15, "max_discount": 600, "min_order_value": 800, "usage_limit": 200,
		 "per_user_limit": 2, "valid_from": add_days(now, -20), "valid_to": add_days(now, 40)},
		{"coupon_code": "FLAT100", "description": "Flat Rs 100 off any order", "discount_type": "Flat",
		 "discount_value": 100, "min_order_value": 500, "usage_limit": 500,
		 "per_user_limit": 3, "valid_from": add_days(now, -60), "valid_to": add_days(now, 30)},
		{"coupon_code": "VIP30", "description": "30% VIP exclusive discount", "discount_type": "Percentage",
		 "discount_value": 30, "max_discount": 2000, "min_order_value": 3000, "usage_limit": 10,
		 "per_user_limit": 1, "valid_from": add_days(now, -5), "valid_to": add_days(now, 15)},
		{"coupon_code": "FLAT1000", "description": "Rs 1000 off above Rs 5000", "discount_type": "Flat",
		 "discount_value": 1000, "min_order_value": 5000, "usage_limit": 15,
		 "per_user_limit": 1, "valid_from": add_days(now, -3), "valid_to": add_days(now, 20)},
		{"coupon_code": "NEWYEAR", "description": "New Year 20% off", "discount_type": "Percentage",
		 "discount_value": 20, "max_discount": 1500, "min_order_value": 1500, "usage_limit": 100,
		 "per_user_limit": 1, "valid_from": add_days(now, -45), "valid_to": add_days(now, -15), "is_active": 0},
		{"coupon_code": "SHOES10", "description": "10% off footwear", "discount_type": "Percentage",
		 "discount_value": 10, "max_discount": 500, "min_order_value": 1000, "usage_limit": 80,
		 "per_user_limit": 2, "valid_from": add_days(now, -10), "valid_to": add_days(now, 50)},
		{"coupon_code": "FLAT300", "description": "Flat Rs 300 off above Rs 2000", "discount_type": "Flat",
		 "discount_value": 300, "min_order_value": 2000, "usage_limit": 40,
		 "per_user_limit": 1, "valid_from": add_days(now, -7), "valid_to": add_days(now, 35)},
		{"coupon_code": "EXHAUSTED50", "description": "50% off — fully used", "discount_type": "Percentage",
		 "discount_value": 50, "max_discount": 500, "min_order_value": 500, "usage_limit": 5,
		 "per_user_limit": 1, "valid_from": add_days(now, -60), "valid_to": add_days(now, 10), "used_count": 5},
		{"coupon_code": "BAGS20", "description": "20% off bags", "discount_type": "Percentage",
		 "discount_value": 20, "max_discount": 800, "min_order_value": 1000, "usage_limit": 30,
		 "per_user_limit": 1, "valid_from": add_days(now, -10), "valid_to": add_days(now, 30)},
		{"coupon_code": "FLASH50", "description": "Flash sale — 50% off limited", "discount_type": "Percentage",
		 "discount_value": 50, "max_discount": 1000, "min_order_value": 1000, "usage_limit": 10,
		 "per_user_limit": 1, "valid_from": add_days(now, 0), "valid_to": add_days(now, 2)},
	]

	for data in coupons:
		code = data["coupon_code"]
		if not frappe.db.exists("Coupon", code):
			frappe.get_doc({"doctype": "Coupon", "is_active": data.pop("is_active", 1), **data}).insert(ignore_permissions=True)
	print(f"  Created {len(coupons)} coupons")


# ---------------------------------------------------------------------------
# 12. Orders (55+) — ALL status/payment/method combinations
# ---------------------------------------------------------------------------
# (user_idx, days_ago, status, payment_status, payment_method, num_items, coupon, ship, notes)
ORDERS_CONFIG = [
	# === DELIVERED + PAID (20) — various methods and dates ===
	(0, 60, "Delivered", "Paid", "UPI", 2, None, 49, "Leave at reception"),
	(1, 55, "Delivered", "Paid", "Credit Card", 3, None, 0, "Gift wrap please"),
	(2, 50, "Delivered", "Paid", "UPI", 2, "WELCOME10", 49, ""),
	(3, 45, "Delivered", "Paid", "Debit Card", 1, None, 0, ""),
	(4, 42, "Delivered", "Paid", "Net Banking", 2, None, 49, ""),
	(5, 40, "Delivered", "Paid", "UPI", 3, "FLAT200", 0, "Ring doorbell twice"),
	(6, 38, "Delivered", "Paid", "Credit Card", 2, None, 49, ""),
	(7, 35, "Delivered", "Paid", "UPI", 1, None, 0, "Call before delivery"),
	(8, 32, "Delivered", "Paid", "COD", 2, None, 49, "Keep change ready"),
	(9, 30, "Delivered", "Paid", "UPI", 2, "SUMMER15", 0, ""),
	(10, 28, "Delivered", "Paid", "Credit Card", 3, None, 49, ""),
	(11, 25, "Delivered", "Paid", "Debit Card", 2, None, 0, ""),
	(12, 22, "Delivered", "Paid", "UPI", 2, "FLAT100", 49, ""),
	(13, 20, "Delivered", "Paid", "COD", 1, None, 0, ""),
	(14, 18, "Delivered", "Paid", "Net Banking", 2, None, 49, "Leave with neighbour"),
	(15, 15, "Delivered", "Paid", "UPI", 3, None, 0, ""),
	(16, 12, "Delivered", "Paid", "Credit Card", 2, "FLAT300", 49, ""),
	(17, 10, "Delivered", "Paid", "UPI", 2, None, 0, ""),
	(18, 8, "Delivered", "Paid", "Debit Card", 1, None, 49, ""),
	(19, 7, "Delivered", "Paid", "UPI", 2, None, 0, ""),
	# === SHIPPED + PAID (6) ===
	(20, 5, "Shipped", "Paid", "UPI", 2, None, 49, ""),
	(21, 4, "Shipped", "Paid", "Credit Card", 3, "WINTER25", 0, "Handle with care"),
	(22, 4, "Shipped", "Paid", "Net Banking", 2, None, 49, ""),
	(23, 3, "Shipped", "Paid", "UPI", 1, None, 0, ""),
	(24, 3, "Shipped", "Paid", "COD", 2, None, 49, ""),
	(0, 2, "Shipped", "Paid", "Debit Card", 2, "FLAT200", 0, ""),
	# === PROCESSING + PAID (5) ===
	(1, 3, "Processing", "Paid", "UPI", 2, None, 49, ""),
	(2, 2, "Processing", "Paid", "Credit Card", 3, None, 0, "Express please"),
	(3, 2, "Processing", "Paid", "UPI", 2, "SUMMER15", 49, ""),
	(4, 1, "Processing", "Paid", "Net Banking", 1, None, 0, ""),
	(5, 1, "Processing", "Paid", "COD", 2, None, 49, ""),
	# === CONFIRMED + PAID (5) ===
	(6, 2, "Confirmed", "Paid", "UPI", 2, None, 0, ""),
	(7, 2, "Confirmed", "Paid", "Credit Card", 1, "FLAT100", 49, ""),
	(8, 1, "Confirmed", "Paid", "Debit Card", 3, None, 0, ""),
	(9, 1, "Confirmed", "Paid", "COD", 2, None, 49, ""),
	(10, 1, "Confirmed", "Paid", "UPI", 2, None, 0, ""),
	# === PENDING + PAID (5) ===
	(11, 1, "Pending", "Paid", "UPI", 2, None, 49, ""),
	(12, 1, "Pending", "Paid", "Credit Card", 1, None, 0, ""),
	(13, 0, "Pending", "Paid", "UPI", 2, "FLAT200", 49, ""),
	(14, 0, "Pending", "Paid", "Net Banking", 3, None, 0, ""),
	(15, 0, "Pending", "Paid", "COD", 2, None, 49, ""),
	# === PENDING + UNPAID (5) — abandoned or awaiting payment ===
	(16, 2, "Pending", "Unpaid", "COD", 2, None, 49, "Will pay on delivery"),
	(17, 1, "Pending", "Unpaid", "UPI", 1, None, 0, ""),
	(18, 1, "Pending", "Unpaid", "Credit Card", 2, None, 49, "Payment pending"),
	(19, 0, "Pending", "Unpaid", "UPI", 3, "FLAT500", 0, ""),
	(20, 0, "Pending", "Unpaid", "Net Banking", 2, None, 49, ""),
	# === CANCELLED (4) ===
	(21, 20, "Cancelled", "Refunded", "Credit Card", 2, None, 49, ""),
	(22, 15, "Cancelled", "Refunded", "UPI", 1, None, 0, ""),
	(23, 10, "Cancelled", "Unpaid", "COD", 2, None, 49, "Changed my mind"),
	(24, 5, "Cancelled", "Unpaid", "UPI", 1, None, 0, "Found better price"),
]


def _create_orders(users, addresses):
	all_variants = frappe.get_all(
		"Variants", filters={"is_stock": 1},
		fields=["name", "price", "title", "variant_name", "quantity"],
		order_by="creation",
	)
	if not all_variants:
		print("  ! No in-stock variants — skipping orders")
		return []

	now = now_datetime()
	created_orders = []
	v_idx = 0

	for user_idx, days_ago, status, pay_status, pay_method, num_items, coupon, ship_charge, notes in ORDERS_CONFIG:
		user = users[user_idx % len(users)]
		user_addrs = addresses.get(user, {})
		ship_addr = user_addrs.get("Shipping")
		bill_addr = user_addrs.get("Billing")
		if not ship_addr:
			continue

		# Pick items round-robin
		order_items = []
		for _ in range(num_items):
			v = all_variants[v_idx % len(all_variants)]
			v_idx += 1
			qty = random.choice([1, 1, 1, 2])
			order_items.append({
				"variant": v.name, "quantity": qty,
				"rate": v.price, "amount": v.price * qty,
			})

		order_date = add_days(now, -days_ago)

		# Coupon discount
		subtotal = sum(i["amount"] for i in order_items)
		discount = 0
		if coupon and frappe.db.exists("Coupon", coupon):
			c = frappe.get_doc("Coupon", coupon)
			if c.discount_type == "Percentage":
				discount = subtotal * (c.discount_value / 100)
				if c.max_discount and discount > c.max_discount:
					discount = c.max_discount
			else:
				discount = c.discount_value
			discount = min(discount, subtotal)

		try:
			doc = frappe.get_doc({
				"doctype": "Order", "user": user, "order_date": order_date,
				"status": "Pending", "payment_status": pay_status,
				"payment_method": pay_method,
				"shipping_address": ship_addr, "billing_address": bill_addr or ship_addr,
				"order_items": order_items, "coupon_code": coupon,
				"discount_amount": discount, "shipping_charge": ship_charge, "notes": notes,
			})
			doc.insert(ignore_permissions=True)
			doc.submit()

			# Set target status
			updates = {}
			if status != "Pending":
				updates["status"] = status
			if status in ("Shipped", "Delivered"):
				tracking = f"VV{random.randint(100000000, 999999999)}"
				updates["tracking_number"] = tracking
				updates["tracking_url"] = f"https://track.veloraverse.com/{tracking}"
			if status == "Delivered":
				updates["delivered_on"] = add_days(order_date, random.randint(3, 7))
			if updates:
				frappe.db.set_value("Order", doc.name, updates)

			# Cancel if needed
			if status == "Cancelled":
				cancel_doc = frappe.get_doc("Order", doc.name)
				cancel_doc.flags.ignore_permissions = True
				cancel_doc.cancel()
				frappe.db.set_value("Order", doc.name, {
					"cancelled_reason": notes or "Customer requested cancellation",
					"payment_status": pay_status,
				})

			# Increment coupon usage
			if coupon and frappe.db.exists("Coupon", coupon):
				used = frappe.db.get_value("Coupon", coupon, "used_count") or 0
				frappe.db.set_value("Coupon", coupon, "used_count", used + 1)

			created_orders.append(doc.name)
			user_short = user.split("@")[0]
			total = doc.total
			print(f"  + {doc.name} — {user_short} | {status} | {pay_status} | {pay_method} | Rs {total:.0f}")

		except Exception as e:
			print(f"  ! Order for {user} — {str(e)[:100]}")

	# Create Payment Logs for paid/refunded orders
	print("\n  Creating Payment Logs...")
	pay_count = 0
	for order_name in created_orders:
		order = frappe.get_doc("Order", order_name)
		if order.payment_status in ("Paid", "Refunded"):
			txn_id = f"TXN{random.randint(10000000, 99999999)}"
			frappe.get_doc({
				"doctype": "Payment Log", "order": order_name, "user": order.user,
				"payment_gateway": order.payment_method, "transaction_id": txn_id,
				"amount": order.total, "status": "Success",
				"gateway_response": frappe.as_json({
					"transaction_id": txn_id, "status": "SUCCESS",
					"method": order.payment_method, "amount": float(order.total),
				}),
			}).insert(ignore_permissions=True)
			pay_count += 1

			# Add refund log for refunded orders
			if order.payment_status == "Refunded":
				ref_id = f"REF{random.randint(10000000, 99999999)}"
				frappe.get_doc({
					"doctype": "Payment Log", "order": order_name, "user": order.user,
					"payment_gateway": order.payment_method, "transaction_id": ref_id,
					"amount": order.total, "status": "Refunded",
					"gateway_response": frappe.as_json({
						"refund_id": ref_id, "status": "REFUNDED",
						"original_txn": txn_id, "amount": float(order.total),
					}),
				}).insert(ignore_permissions=True)
				pay_count += 1

	print(f"  Created {pay_count} payment logs")
	print(f"\n  Total orders: {len(created_orders)}")
	return created_orders


# ---------------------------------------------------------------------------
# 13. Reviews (60+)
# ---------------------------------------------------------------------------
REVIEWS_DATA = [
	# (user_idx, item_name, rating, title, text)
	(0, "Classic Cotton T-Shirt", 1.0, "Best everyday tee", "Super soft cotton, fits perfectly. Colour hasn't faded after multiple washes."),
	(1, "Premium Zip Hoodie", 0.8, "Great hoodie, runs big", "Quality fleece lining. Zipper is solid. Runs a size bigger than expected."),
	(2, "Slim Fit Denim Jeans", 1.0, "Perfect fit and quality", "Stretch denim is comfortable all day. The slim fit looks sharp."),
	(3, "Urban Runner Sneakers", 0.8, "Comfortable and stylish", "Great for running and casual wear. Cushioning is excellent."),
	(4, "Winter Puffer Jacket", 1.0, "Essential winter gear", "Survived a -10 degree trip. Lightweight yet incredibly warm."),
	(5, "Floral Maxi Dress", 0.6, "Pretty but thin fabric", "The print is gorgeous but the fabric feels thin for the price."),
	(6, "Classic Polo Shirt", 0.8, "Smart casual staple", "Perfect for office and weekend. Pique fabric breathes well."),
	(7, "Merino Wool Sweater", 1.0, "Luxury at a great price", "Incredibly soft merino wool that doesn't itch at all."),
	(8, "Leather Travel Backpack", 0.8, "Beautiful craftsmanship", "Leather quality is outstanding. Brass hardware adds premium feel."),
	(9, "Chronograph Wrist Watch", 1.0, "Stunning timepiece", "Sapphire crystal is clear. Chronograph works flawlessly."),
	(10, "Aviator Sunglasses", 0.8, "Classic look", "Polarized lenses make a huge difference. Lightweight all-day wear."),
	(11, "Genuine Leather Belt", 1.0, "Solid leather belt", "Heavy-duty genuine leather that gets better with age."),
	(12, "Cashmere Winter Scarf", 0.8, "Soft and luxurious", "Incredibly soft cashmere. Warm without being bulky."),
	(13, "Chelsea Leather Boots", 1.0, "Worth the investment", "Built to last. Goodyear welt means they can be resoled."),
	(14, "Cotton Cargo Shorts", 0.6, "Good for the price", "Decent cargo shorts. Pockets are useful but fabric could be softer."),
	(15, "Classic Cotton T-Shirt", 0.8, "Reliable and comfortable", "Second purchase — first held up so well. Great value."),
	(16, "Slim Fit Denim Jeans", 0.8, "Solid jeans", "Nice stretch, rich colour. Slim fit without being too tight."),
	(17, "Snapback Baseball Cap", 1.0, "Perfect summer cap", "Love the snapback fit. Embroidery is clean, holds its shape."),
	(18, "Summer Slide Sandals", 0.6, "Decent for beach", "Comfortable footbed. Straps could be softer, but good overall."),
	(19, "Bi-fold Leather Wallet", 1.0, "Sleek and functional", "RFID blocking is a great feature. Slim profile fits easily."),
	(20, "Linen Button-Down Shirt", 0.8, "Perfect for summer", "Breathable linen, mother-of-pearl buttons are a nice touch."),
	(21, "Velvet Evening Blazer", 1.0, "Show stopper", "Wore this to a wedding — got so many compliments. Satin lapels are classy."),
	(22, "Slim Jogger Track Pants", 0.8, "Great for lounging", "Comfortable French terry fabric. Zippered pockets are very handy."),
	(23, "Classic Denim Jacket", 1.0, "Timeless piece", "Vintage wash looks amazing. Quality denim, well-stitched."),
	(24, "Wrap Mini Skirt", 0.8, "Cute and versatile", "Tie waist is adjustable. Lightweight fabric perfect for summer."),
	(0, "Cropped Zip Hoodie", 0.6, "Okay hoodie", "Fit is fine but the zipper gets stuck sometimes."),
	(1, "Henley Long Sleeve Tee", 0.8, "Good layering piece", "Soft cotton. Three-button placket looks great."),
	(2, "Pleated Palazzo Pants", 1.0, "Elegant and comfy", "Wide-leg design is so comfortable. High waist is flattering."),
	(3, "Quilted Puffer Vest", 0.8, "Warm without bulk", "Great layering piece. Zip front, light but warm."),
	(4, "V-Neck Cashmere Sweater", 1.0, "Premium quality", "Unbelievably soft cashmere. V-neck is elegant."),
	(5, "Canvas Low-Top Sneakers", 0.8, "Classic kicks", "Clean design, vulcanised sole is durable. True to size."),
	(6, "Hiking Trail Boots", 1.0, "Trail tested", "Vibram sole grips on any surface. Waterproofing works perfectly."),
	(7, "Classic Leather Loafers", 0.8, "Elegant shoes", "Hand-stitched quality. Comfortable right out of the box."),
	(8, "Sports Running Shoes", 1.0, "Marathon ready", "Responsive foam is amazing. Completed a half-marathon in these."),
	(9, "Strappy Platform Sandals", 0.6, "Pretty but uncomfortable", "Look great but the straps dig in after a few hours."),
	(10, "Suede Desert Boots", 0.8, "Stylish boots", "Premium suede looks classy. Crepe sole is surprisingly comfy."),
	(11, "Comfort Flip Flops", 0.8, "Best flip flops", "Arch support makes all the difference. Great for pool and beach."),
	(12, "Silver Chain Bracelet", 1.0, "Beautiful jewellery", "Sterling silver quality is evident. Lobster clasp is secure."),
	(13, "Knit Beanie Winter Hat", 0.8, "Warm and cosy", "Fleece lining is super warm. Fold-over cuff looks great."),
	(14, "Silk Pocket Square", 1.0, "Finishing touch", "Italian silk is gorgeous. Hand-rolled edges show quality."),
	(15, "Canvas Tote Bag", 0.8, "Sturdy daily bag", "Heavy canvas holds up well. Interior pocket is useful."),
	(16, "Laptop Messenger Bag", 1.0, "Work essential", "Waxed canvas is water-resistant. Fits my 15-inch laptop perfectly."),
	(17, "Gym Duffel Bag", 0.8, "Good gym bag", "Shoe compartment is a lifesaver. Water-resistant material."),
	(18, "Crossbody Sling Bag", 0.8, "Handy for travel", "RFID pocket gives peace of mind. Compact but fits essentials."),
	(19, "Compression Gym Shorts", 1.0, "Performance shorts", "Moisture-wicking fabric works. Flat-lock seams prevent chafing."),
	(20, "Thermal Base Layer Top", 0.8, "Winter essential", "Merino-blend keeps me warm. Four-way stretch is comfortable."),
	(21, "Performance Windbreaker", 1.0, "Pack it anywhere", "So lightweight it folds into its own pocket. DWR coating works."),
	(22, "Board Swim Shorts", 0.8, "Beach ready", "Quick-dry fabric is great. Internal mesh brief is comfortable."),
	(23, "Organic Cotton Cardigan", 0.8, "Cosy organic", "Soft organic cotton. Button-front design is classic."),
	(24, "Titanium Cufflinks Set", 1.0, "Premium accessory", "Brushed titanium looks sophisticated. Toggle back is secure."),
	# Extra reviews for popular items to push past 60
	(5, "Classic Cotton T-Shirt", 1.0, "Third purchase!", "Now I own three colours. Still the best tee out there."),
	(6, "Slim Fit Denim Jeans", 0.4, "Sizing inconsistent", "Ordered same size as before but this pair runs small."),
	(7, "Urban Runner Sneakers", 1.0, "Daily driver", "Wearing these every day to the gym. Still holding up great."),
	(8, "Classic Polo Shirt", 0.8, "Office favourite", "Logo is subtle. Fabric breathes well in Chennai heat."),
	(9, "Winter Puffer Jacket", 0.8, "Good but heavy", "Very warm but heavier than expected. Still great for winter trips."),
	(10, "Leather Travel Backpack", 1.0, "Gets better with age", "Been using for 2 months now. Leather is developing beautiful patina."),
	(11, "Merino Wool Sweater", 0.8, "Almost perfect", "Love the softness. Wish they had more colour options."),
	(12, "Chelsea Leather Boots", 0.8, "Solid boots", "Break-in period was short. Now they're incredibly comfortable."),
	(13, "Linen Button-Down Shirt", 0.6, "Wrinkles easily", "Beautiful fabric but wrinkles within an hour. Needs constant ironing."),
	(14, "Performance Windbreaker", 0.8, "Travel must-have", "So packable! DWR held up in light rain. Reflective details are nice."),
]


def _create_reviews(items, users):
	count = 0
	for user_idx, item_name, rating, title, text in REVIEWS_DATA:
		item_id = items.get(item_name)
		if not item_id:
			continue
		user = users[user_idx % len(users)]
		if frappe.db.exists("Review", {"item": item_id, "user": user}):
			continue
		try:
			frappe.get_doc({
				"doctype": "Review", "item": item_id, "user": user,
				"rating": rating, "review_title": title, "review_text": text,
			}).insert(ignore_permissions=True)
			count += 1
		except Exception:
			pass
	print(f"  Created {count} reviews")


# ---------------------------------------------------------------------------
# 14. Wishlists (25)
# ---------------------------------------------------------------------------
def _create_wishlists(users):
	all_variants = frappe.get_all("Variants", pluck="name", order_by="creation")
	if not all_variants:
		return
	v_idx = 0
	count = 0
	for i, user in enumerate(users):
		if frappe.db.exists("Wishlist", user):
			continue
		num = (i % 4) + 2  # 2-5 items
		picked = []
		for _ in range(num):
			picked.append(all_variants[v_idx % len(all_variants)])
			v_idx += 3  # skip to get variety
		try:
			frappe.get_doc({
				"doctype": "Wishlist", "user": user,
				"wishlist_items": [{"variant": v} for v in picked],
			}).insert(ignore_permissions=True)
			for v in picked:
				cur = frappe.db.get_value("Variants", v, "wishlist_count") or 0
				frappe.db.set_value("Variants", v, "wishlist_count", cur + 1, update_modified=False)
			count += 1
		except Exception:
			pass
	print(f"  Created {count} wishlists")


# ---------------------------------------------------------------------------
# 15. Carts (25)
# ---------------------------------------------------------------------------
def _create_carts(users):
	in_stock = frappe.get_all("Variants", filters={"is_stock": 1}, fields=["name", "price"], order_by="creation")
	if not in_stock:
		return
	v_idx = 0
	count = 0
	for i, user in enumerate(users):
		if frappe.db.exists("Cart", user):
			continue
		num = (i % 3) + 1  # 1-3 items
		items = []
		for _ in range(num):
			v = in_stock[v_idx % len(in_stock)]
			v_idx += 2
			items.append({"variant": v.name, "quantity": random.choice([1, 1, 2]), "rate": v.price})
		try:
			frappe.get_doc({"doctype": "Cart", "user": user, "cart_items": items}).insert(ignore_permissions=True)
			count += 1
		except Exception:
			pass
	print(f"  Created {count} carts")


# ---------------------------------------------------------------------------
# 16. Extra Payment Logs — Failed and Initiated
# ---------------------------------------------------------------------------
def _create_extra_payment_logs(users):
	# Need existing orders to link to (order is required)
	pending_orders = frappe.get_all(
		"Order",
		filters={"payment_status": "Unpaid", "docstatus": 1},
		fields=["name", "user", "total"],
		limit=8,
	)
	if not pending_orders:
		print("  ! No unpaid orders available for extra payment logs")
		return

	count = 0
	# 5 Failed payment attempts (linked to unpaid orders)
	for i in range(min(5, len(pending_orders))):
		order = pending_orders[i]
		txn_id = f"FAIL{random.randint(10000000, 99999999)}"
		try:
			frappe.get_doc({
				"doctype": "Payment Log", "order": order.name, "user": order.user,
				"payment_gateway": random.choice(["UPI", "Credit Card", "Debit Card"]),
				"transaction_id": txn_id, "amount": order.total,
				"status": "Failed",
				"gateway_response": frappe.as_json({
					"transaction_id": txn_id, "status": "FAILED",
					"error": random.choice([
						"Insufficient funds", "Card declined", "UPI timeout",
						"Bank server error", "3DS authentication failed",
					]),
				}),
			}).insert(ignore_permissions=True)
			count += 1
		except Exception as e:
			print(f"  ! Failed log — {str(e)[:80]}")

	# 3 Initiated (never completed — linked to remaining unpaid orders)
	for i in range(min(3, max(0, len(pending_orders) - 5))):
		order = pending_orders[5 + i]
		txn_id = f"INIT{random.randint(10000000, 99999999)}"
		try:
			frappe.get_doc({
				"doctype": "Payment Log", "order": order.name, "user": order.user,
				"payment_gateway": random.choice(["Razorpay", "UPI", "Net Banking"]),
				"transaction_id": txn_id, "amount": order.total,
				"status": "Initiated",
				"gateway_response": frappe.as_json({
					"transaction_id": txn_id, "status": "INITIATED",
					"redirect_url": "https://pay.example.com/...",
				}),
			}).insert(ignore_permissions=True)
			count += 1
		except Exception as e:
			print(f"  ! Initiated log — {str(e)[:80]}")

	print(f"  Created {count} extra payment logs (failed + initiated)")


# ---------------------------------------------------------------------------
# 17. Return Requests (10)
# ---------------------------------------------------------------------------
def _create_return_requests(orders, users, addresses):
	# Find delivered orders to create returns for
	delivered = frappe.get_all(
		"Order",
		filters={"status": "Delivered", "docstatus": 1},
		fields=["name", "user"],
		order_by="creation",
		limit=10,
	)
	if not delivered:
		print("  ! No delivered orders for returns")
		return

	reasons = ["Defective", "Wrong Item", "Size Issue", "Changed Mind", "Other"]
	return_types = ["Return", "Exchange"]
	count = 0

	for i, order_data in enumerate(delivered[:10]):
		order = frappe.get_doc("Order", order_data.name)
		if not order.order_items:
			continue

		# Pick 1-2 items from order to return
		return_items = []
		for j, oi in enumerate(order.order_items[:2]):
			return_items.append({
				"variant": oi.variant,
				"variant_title": oi.variant,
				"quantity": 1,
				"rate": oi.rate,
				"amount": oi.rate,
			})

		status_map = {
			0: "Pending", 1: "Pending", 2: "Pending",
			3: "Approved", 4: "Approved",
			5: "Rejected", 6: "Rejected",
			7: "Refund Completed", 8: "Refund Completed",
			9: "Pending",
		}
		target_status = status_map.get(i, "Pending")

		try:
			doc = frappe.get_doc({
				"doctype": "Return Request",
				"order": order.name, "user": order.user,
				"request_date": now_datetime(),
				"return_type": return_types[i % 2],
				"reason": reasons[i % len(reasons)],
				"reason_detail": f"Test return request #{i + 1}" if i % 2 == 0 else "",
				"return_items": return_items,
				"refund_method": "Original Payment" if i % 3 != 2 else "Store Credit",
			})
			# Bypass return-window validation for seed data
			doc.flags.ignore_validate = True
			doc.insert(ignore_permissions=True)

			if target_status in ("Approved", "Refund Completed"):
				# Submit to approve (triggers stock restore)
				doc.flags.ignore_validate = True
				doc.submit()
				frappe.db.set_value("Return Request", doc.name, "status", "Approved")
				if target_status == "Refund Completed":
					frappe.db.set_value("Return Request", doc.name, "status", "Refund Completed")
					frappe.db.set_value("Order", order.name, "payment_status", "Refunded")

			elif target_status == "Rejected":
				frappe.db.set_value("Return Request", doc.name, {
					"status": "Rejected",
					"admin_notes": "Return request does not meet our return policy criteria.",
				})

			count += 1
			print(f"  + {doc.name} — {order.name} | {target_status} | {doc.return_type}")

		except Exception as e:
			print(f"  ! Return for {order.name} — {str(e)[:100]}")

	print(f"\n  Created {count} return requests")


# ---------------------------------------------------------------------------
# 18. Stock Notifications (12)
# ---------------------------------------------------------------------------
def _create_stock_notifications(users):
	# Find out-of-stock or low-stock variants
	oos_variants = frappe.get_all(
		"Variants", filters={"is_stock": 0}, fields=["name"], limit=6,
	)
	low_stock = frappe.get_all(
		"Variants", filters=[["quantity", "<=", 10], ["is_stock", "=", 1]],
		fields=["name"], limit=6,
	)
	# Fill remaining slots with any in-stock variants
	remaining = max(0, 12 - len(oos_variants) - len(low_stock))
	in_stock = frappe.get_all(
		"Variants", filters=[["quantity", ">", 10], ["is_stock", "=", 1]],
		fields=["name"], limit=remaining,
	) if remaining > 0 else []
	target_variants = oos_variants + low_stock + in_stock
	count = 0
	for i, v in enumerate(target_variants[:12]):
		user = users[i % len(users)]
		try:
			frappe.get_doc({
				"doctype": "Stock Notification",
				"user": user, "variant": v.name, "email": user,
				"notified": 1 if i >= 8 else 0,
			}).insert(ignore_permissions=True)
			count += 1
		except Exception as e:
			print(f"  ! Stock notif — {str(e)[:80]}")
	print(f"  Created {count} stock notifications")


# ---------------------------------------------------------------------------
# 19. Extra Inventory Logs — Restocks and Adjustments
# ---------------------------------------------------------------------------
def _create_extra_inventory_logs():
	from velora_verse.velora_verse.doctype.inventory_log.inventory_log import create_inventory_log

	variants = frappe.get_all("Variants", fields=["name", "quantity"], limit=10, order_by="creation")
	count = 0
	for i, v in enumerate(variants):
		# Restock log
		try:
			create_inventory_log(
				variant=v.name, change_type="Restock",
				quantity_change=random.choice([20, 30, 50, 100]),
				previous_qty=max(0, v.quantity - 20), new_qty=v.quantity,
				reference_type="Manual", reference_name=f"Initial restock by admin",
			)
			count += 1
		except Exception:
			pass

		# Adjustment log for some
		if i % 3 == 0:
			try:
				create_inventory_log(
					variant=v.name, change_type="Adjustment",
					quantity_change=random.choice([-2, -5, 3, 5]),
					previous_qty=v.quantity, new_qty=v.quantity + random.choice([-2, 3]),
					reference_type="Manual", reference_name="Inventory audit adjustment",
				)
				count += 1
			except Exception:
				pass

	print(f"  Created {count} extra inventory logs")


# ---------------------------------------------------------------------------
# 20. Serviceable Pincodes — 50 serviceable + 5 non-serviceable
# ---------------------------------------------------------------------------
def _create_serviceable_pincodes():
	pincodes = [
		# Major metros — serviceable
		("110001", "New Delhi", "Delhi", "North", 1, 1, 3),
		("110020", "New Delhi", "Delhi", "North", 1, 1, 3),
		("110085", "New Delhi", "Delhi", "North", 1, 1, 3),
		("400001", "Mumbai", "Maharashtra", "West", 1, 1, 3),
		("400050", "Mumbai", "Maharashtra", "West", 1, 1, 3),
		("400069", "Mumbai", "Maharashtra", "West", 1, 1, 3),
		("560001", "Bangalore", "Karnataka", "South", 1, 1, 3),
		("560034", "Bangalore", "Karnataka", "South", 1, 1, 3),
		("560100", "Bangalore", "Karnataka", "South", 1, 1, 4),
		("600001", "Chennai", "Tamil Nadu", "South", 1, 1, 4),
		("600040", "Chennai", "Tamil Nadu", "South", 1, 1, 4),
		("700001", "Kolkata", "West Bengal", "East", 1, 1, 4),
		("700020", "Kolkata", "West Bengal", "East", 1, 1, 4),
		("500001", "Hyderabad", "Telangana", "South", 1, 1, 4),
		("500034", "Hyderabad", "Telangana", "South", 1, 1, 4),
		("380001", "Ahmedabad", "Gujarat", "West", 1, 1, 4),
		("380015", "Ahmedabad", "Gujarat", "West", 1, 1, 4),
		("411001", "Pune", "Maharashtra", "West", 1, 1, 4),
		("411038", "Pune", "Maharashtra", "West", 1, 1, 4),
		("302001", "Jaipur", "Rajasthan", "North", 1, 1, 5),
		("302020", "Jaipur", "Rajasthan", "North", 1, 1, 5),
		("226001", "Lucknow", "Uttar Pradesh", "North", 1, 1, 5),
		("226010", "Lucknow", "Uttar Pradesh", "North", 1, 1, 5),
		("462001", "Bhopal", "Madhya Pradesh", "Central", 1, 1, 5),
		("440001", "Nagpur", "Maharashtra", "West", 1, 1, 5),
		("641001", "Coimbatore", "Tamil Nadu", "South", 1, 1, 5),
		("682001", "Kochi", "Kerala", "South", 1, 1, 5),
		("682030", "Kochi", "Kerala", "South", 1, 1, 5),
		("201301", "Noida", "Uttar Pradesh", "North", 1, 1, 3),
		("122001", "Gurgaon", "Haryana", "North", 1, 1, 3),
		("122018", "Gurgaon", "Haryana", "North", 1, 1, 3),
		("160001", "Chandigarh", "Chandigarh", "North", 1, 1, 5),
		("110091", "New Delhi", "Delhi", "North", 1, 1, 3),
		("400053", "Mumbai", "Maharashtra", "West", 1, 1, 3),
		("560037", "Bangalore", "Karnataka", "South", 1, 1, 4),
		("600028", "Chennai", "Tamil Nadu", "South", 1, 1, 4),
		("700091", "Kolkata", "West Bengal", "East", 1, 1, 4),
		("500081", "Hyderabad", "Telangana", "South", 1, 1, 4),
		("380006", "Ahmedabad", "Gujarat", "West", 1, 1, 4),
		("411014", "Pune", "Maharashtra", "West", 1, 1, 4),
		("520001", "Vijayawada", "Andhra Pradesh", "South", 1, 1, 5),
		("530001", "Visakhapatnam", "Andhra Pradesh", "South", 1, 1, 5),
		("360001", "Rajkot", "Gujarat", "West", 1, 1, 6),
		("395001", "Surat", "Gujarat", "West", 1, 1, 5),
		("452001", "Indore", "Madhya Pradesh", "Central", 1, 1, 5),
		("248001", "Dehradun", "Uttarakhand", "North", 1, 0, 6),
		("800001", "Patna", "Bihar", "East", 1, 0, 6),
		("781001", "Guwahati", "Assam", "East", 1, 0, 7),
		("431001", "Aurangabad", "Maharashtra", "West", 1, 1, 5),
		("560076", "Bangalore", "Karnataka", "South", 1, 1, 4),
		# Non-serviceable pincodes
		("793001", "Shillong", "Meghalaya", "Northeast", 0, 0, None),
		("795001", "Imphal", "Manipur", "Northeast", 0, 0, None),
		("796001", "Aizawl", "Mizoram", "Northeast", 0, 0, None),
		("799001", "Agartala", "Tripura", "Northeast", 0, 0, None),
		("190001", "Srinagar", "Jammu & Kashmir", "North", 0, 0, None),
	]

	count = 0
	for pin, city, state, zone, serviceable, cod, days in pincodes:
		if frappe.db.exists("Serviceable Pincode", pin):
			continue
		doc = frappe.new_doc("Serviceable Pincode")
		doc.pincode = pin
		doc.city = city
		doc.state = state
		doc.zone = zone
		doc.is_serviceable = serviceable
		doc.cod_available = cod
		doc.estimated_days = days
		doc.insert()
		count += 1
	print(f"  Created {count} serviceable pincodes")


# ---------------------------------------------------------------------------
# 21. Recent Views — random product views for test users
# ---------------------------------------------------------------------------
def _create_recent_views(items_dict, users):
	from frappe.utils import add_days

	# items_dict is {item_name: ITEM-xxxx}, we need the ITEM-xxxx values
	item_ids = list(items_dict.values()) if isinstance(items_dict, dict) else list(items_dict)

	count = 0
	for user in users[:10]:
		viewed_items = random.sample(item_ids, min(5, len(item_ids)))
		for item_id in viewed_items:
			if frappe.db.exists("Recent View", {"user": user, "item": item_id}):
				continue
			doc = frappe.new_doc("Recent View")
			doc.user = user
			doc.item = item_id
			doc.viewed_on = add_days(now_datetime(), -random.randint(0, 14))
			doc.insert(ignore_permissions=True)
			count += 1
	print(f"  Created {count} recent views")


# ---------------------------------------------------------------------------
# 22. HSN Codes — common GST tax codes
# ---------------------------------------------------------------------------
def _create_hsn_codes():
	hsn_data = [
		("6109", "T-shirts, singlets and other vests, knitted", 2.5, 2.5, 5, 0),
		("6110", "Jerseys, pullovers, cardigans, waistcoats", 6, 6, 12, 0),
		("6104", "Women's suits, dresses, skirts, knitted", 6, 6, 12, 0),
		("6203", "Men's suits, jackets, trousers, shorts", 6, 6, 12, 0),
		("6204", "Women's suits, jackets, trousers, shorts", 6, 6, 12, 0),
		("6205", "Men's shirts", 6, 6, 12, 0),
		("6206", "Women's blouses, shirts", 6, 6, 12, 0),
		("6211", "Track suits, ski suits, swimwear", 6, 6, 12, 0),
		("6401", "Waterproof footwear", 9, 9, 18, 0),
		("6402", "Other footwear, outer soles of rubber/plastics", 9, 9, 18, 0),
		("6403", "Footwear, outer soles of rubber/leather", 9, 9, 18, 0),
		("4202", "Trunks, suitcases, handbags, wallets", 9, 9, 18, 0),
		("7113", "Articles of jewellery, precious metal", 1.5, 1.5, 3, 0),
		("7117", "Imitation jewellery", 6, 6, 12, 0),
		("9101", "Wrist-watches, pocket-watches, precious metal", 9, 9, 18, 0),
		("9102", "Wrist-watches, pocket-watches, other", 9, 9, 18, 0),
		("6217", "Clothing accessories", 6, 6, 12, 0),
		("6505", "Hats and headgear, knitted", 6, 6, 12, 0),
		("6115", "Hosiery, socks", 2.5, 2.5, 5, 0),
		("6301", "Blankets and travelling rugs", 6, 6, 12, 0),
	]

	count = 0
	for code, desc, cgst, sgst, igst, cess in hsn_data:
		if frappe.db.exists("HSN Code", code):
			continue
		doc = frappe.new_doc("HSN Code")
		doc.hsn_code = code
		doc.description = desc
		doc.cgst_rate = cgst
		doc.sgst_rate = sgst
		doc.igst_rate = igst
		doc.cess_rate = cess
		doc.is_active = 1
		doc.insert()
		count += 1
	print(f"  Created {count} HSN codes")


# ---------------------------------------------------------------------------
# 23. Promotions — flash sales and promotions
# ---------------------------------------------------------------------------
def _create_promotions(items_dict):
	from frappe.utils import add_days, add_to_date

	now = now_datetime()
	item_ids = list(items_dict.values()) if isinstance(items_dict, dict) else list(items_dict)
	variants = frappe.get_all("Variants", pluck="name", limit=20)

	promotions = [
		{
			"promotion_title": "Summer Flash Sale",
			"discount_type": "Percentage",
			"discount_value": 20,
			"start_datetime": add_days(now, -2),
			"end_datetime": add_days(now, 5),
			"is_active": 1,
			"priority_level": 1,
			"apply_to": "Specific Items",
			"badge_text": "20% OFF",
			"banner_image": _unsplash("1507525428034-b723cf961d3e", 1200, 600),
			"max_quantity_per_user": 3,
			"total_stock_limit": 100,
			"items": [{"reference_doctype": "Items", "reference_name": i} for i in item_ids[:5]],
		},
		{
			"promotion_title": "Weekend Blowout",
			"discount_type": "Flat",
			"discount_value": 200,
			"start_datetime": add_days(now, -1),
			"end_datetime": add_days(now, 3),
			"is_active": 1,
			"priority_level": 2,
			"apply_to": "Specific Items",
			"badge_text": "Rs.200 OFF",
			"banner_image": _unsplash("1441984904996-e0b6ba687e04", 1200, 600),
			"items": [{"reference_doctype": "Items", "reference_name": i} for i in item_ids[5:10]],
		},
		{
			"promotion_title": "Upcoming Diwali Sale",
			"discount_type": "Percentage",
			"discount_value": 30,
			"start_datetime": add_days(now, 10),
			"end_datetime": add_days(now, 17),
			"is_active": 0,
			"priority_level": 1,
			"apply_to": "All Items",
			"badge_text": "30% OFF",
			"banner_image": _unsplash("1441986300917-64674bd600d8", 1200, 600),
		},
		{
			"promotion_title": "Expired Monsoon Sale",
			"discount_type": "Percentage",
			"discount_value": 15,
			"start_datetime": add_days(now, -20),
			"end_datetime": add_days(now, -5),
			"is_active": 0,
			"priority_level": 3,
			"apply_to": "Specific Items",
			"badge_text": "SALE",
			"banner_image": _unsplash("1483985988355-763728e1935b", 1200, 600),
			"items": [{"reference_doctype": "Items", "reference_name": i} for i in item_ids[:3]],
		},
		{
			"promotion_title": "Category Wide — Accessories",
			"discount_type": "Percentage",
			"discount_value": 10,
			"start_datetime": add_days(now, -1),
			"end_datetime": add_days(now, 14),
			"is_active": 1,
			"priority_level": 5,
			"apply_to": "All Items",
			"badge_text": "10% OFF",
			"banner_image": _unsplash("1611923134239-b9be5816e23c", 1200, 600),
			"max_quantity_per_user": 5,
		},
	]

	count = 0
	for p in promotions:
		if frappe.db.exists("Promotion", {"promotion_title": p["promotion_title"]}):
			continue
		doc = frappe.new_doc("Promotion")
		doc.promotion_title = p["promotion_title"]
		doc.discount_type = p["discount_type"]
		doc.discount_value = p["discount_value"]
		doc.start_datetime = p["start_datetime"]
		doc.end_datetime = p["end_datetime"]
		doc.is_active = p["is_active"]
		doc.priority_level = p.get("priority_level", 1)
		doc.apply_to = p.get("apply_to", "All Items")
		doc.badge_text = p.get("badge_text", "")
		doc.banner_image = p.get("banner_image")
		doc.max_quantity_per_user = p.get("max_quantity_per_user", 0)
		doc.total_stock_limit = p.get("total_stock_limit", 0)
		for item in p.get("items", []):
			doc.append("promotion_items", item)
		doc.insert()
		count += 1
	print(f"  Created {count} promotions")


# ---------------------------------------------------------------------------
# 24. Loyalty Points Rules
# ---------------------------------------------------------------------------
def _create_loyalty_rules():
	rules = [
		{"rule_name": "Earn 1 point per Rs.10", "rule_type": "Earn Per Rupee", "points_awarded": 1, "min_order_value": 500, "multiplier": 0.1},
		{"rule_name": "Signup Bonus", "rule_type": "Signup", "points_awarded": 100, "min_order_value": 0, "multiplier": 1},
		{"rule_name": "Review Bonus", "rule_type": "Review", "points_awarded": 50, "min_order_value": 0, "multiplier": 1},
	]
	count = 0
	for r in rules:
		if frappe.db.exists("Loyalty Points Rule", r["rule_name"]):
			continue
		doc = frappe.new_doc("Loyalty Points Rule")
		for k, v in r.items():
			setattr(doc, k, v)
		doc.is_active = 1
		doc.insert()
		count += 1
	print(f"  Created {count} loyalty rules")


# ---------------------------------------------------------------------------
# 25. Loyalty Points Ledger — simulate earning for existing order users
# ---------------------------------------------------------------------------
def _create_loyalty_ledger(users, orders_dict):
	count = 0
	running = {}
	for user in users[:15]:
		running.setdefault(user, 0)

		# Signup bonus
		running[user] += 100
		doc = frappe.new_doc("Loyalty Points Ledger")
		doc.user = user
		doc.points_change = 100
		doc.transaction_type = "Earn"
		doc.running_balance = running[user]
		doc.reference_doctype = "User"
		doc.reference_name = user
		doc.expiry_date = add_days(now_datetime(), 365)
		doc.insert()
		count += 1

		# Earn from orders — 1 pt per Rs.10
		user_orders = frappe.get_all(
			"Order",
			filters={"user": user, "docstatus": 1},
			fields=["name", "total"],
			limit=3,
		)
		for order in user_orders:
			pts = int(float(order.total or 0) / 10)
			if pts <= 0:
				continue
			running[user] += pts
			doc = frappe.new_doc("Loyalty Points Ledger")
			doc.user = user
			doc.points_change = pts
			doc.transaction_type = "Earn"
			doc.running_balance = running[user]
			doc.reference_doctype = "Order"
			doc.reference_name = order.name
			doc.expiry_date = add_days(now_datetime(), 365)
			doc.insert()
			count += 1
	print(f"  Created {count} loyalty ledger entries")


# ---------------------------------------------------------------------------
# 26. Customer Segments — 4 auto segments
# ---------------------------------------------------------------------------
def _create_customer_segments(users):
	segments = [
		{"segment_name": "New Customer", "segment_type": "Automatic", "discount_percentage": 5, "loyalty_multiplier": 1, "min_order_count": 0, "max_order_count": 1, "min_total_spent": 0, "max_total_spent": 999},
		{"segment_name": "Regular Customer", "segment_type": "Automatic", "discount_percentage": 7, "loyalty_multiplier": 1.2, "min_order_count": 2, "max_order_count": 5, "min_total_spent": 1000, "max_total_spent": 9999},
		{"segment_name": "VIP Customer", "segment_type": "Automatic", "discount_percentage": 10, "loyalty_multiplier": 1.5, "min_order_count": 6, "max_order_count": 20, "min_total_spent": 10000, "max_total_spent": 49999},
		{"segment_name": "Whale Customer", "segment_type": "Automatic", "discount_percentage": 15, "loyalty_multiplier": 2, "min_order_count": 21, "max_order_count": 0, "min_total_spent": 50000, "max_total_spent": 0},
	]

	count = 0
	for s in segments:
		if frappe.db.exists("Customer Segment", s["segment_name"]):
			continue
		doc = frappe.new_doc("Customer Segment")
		doc.segment_name = s["segment_name"]
		doc.segment_type = s["segment_type"]
		doc.is_active = 1
		doc.discount_percentage = s["discount_percentage"]
		doc.loyalty_multiplier = s["loyalty_multiplier"]
		doc.min_order_count = s.get("min_order_count", 0)
		doc.max_order_count = s.get("max_order_count", 0)
		doc.min_total_spent = s.get("min_total_spent", 0)
		doc.max_total_spent = s.get("max_total_spent", 0)

		# Auto-assign first few users
		for user in users[:5]:
			doc.append("segment_members", {"user": user, "assigned_on": now_datetime()})
		doc.insert()
		count += 1
	print(f"  Created {count} customer segments")


# ---------------------------------------------------------------------------
# 27. Product Bundles — 5 bundles with variant items
# ---------------------------------------------------------------------------
def _create_product_bundles():
	variants = frappe.get_all("Variants", fields=["name", "title", "price"], order_by="name", limit=30)
	if len(variants) < 6:
		print("  Not enough variants for bundles, skipping")
		return

	bundle_images = {
		"Summer Essentials Bundle": [
			"1507525428034-b723cf961d3e",  # summer vibes
			"1523381210434-271e8be1f52b",  # casual wear
		],
		"Weekend Getaway Pack": [
			"1441984904996-e0b6ba687e04",  # travel fashion
			"1553062407-98eeb64c6a62",  # backpack
		],
		"Work From Home Kit": [
			"1556821840-3a63f95609a7",  # comfortable hoodie
			"1543163521-1bf539c55dd2",  # cozy cardigan
		],
		"Gift Set — For Him": [
			"1507679799987-c73779587ccf",  # men's fashion
			"1524592094714-0f0654e20314",  # watch
		],
		"Gift Set — For Her": [
			"1496747611176-843222e1e57c",  # women's fashion
			"1515562141-33d0ef6a4a22",  # jewellery
		],
	}

	bundles = [
		{"bundle_name": "Summer Essentials Bundle", "items": variants[0:3], "discount_pct": 15},
		{"bundle_name": "Weekend Getaway Pack", "items": variants[3:6], "discount_pct": 12},
		{"bundle_name": "Work From Home Kit", "items": variants[6:9], "discount_pct": 10},
		{"bundle_name": "Gift Set — For Him", "items": variants[9:12], "discount_pct": 18},
		{"bundle_name": "Gift Set — For Her", "items": variants[12:15], "discount_pct": 20},
	]

	count = 0
	for b in bundles:
		if frappe.db.exists("Product Bundle", {"bundle_name": b["bundle_name"]}):
			continue
		individual_total = sum(float(v.price or 0) for v in b["items"])
		bundle_price = round(individual_total * (1 - b["discount_pct"] / 100), 2)

		doc = frappe.new_doc("Product Bundle")
		doc.bundle_name = b["bundle_name"]
		doc.bundle_price = bundle_price
		doc.is_active = 1
		for v in b["items"]:
			doc.append("bundle_items", {
				"variant": v.name,
				"variant_title": v.title,
				"bundle_quantity": 1,
				"individual_price": float(v.price or 0),
			})
		# Add images
		photo_ids = bundle_images.get(b["bundle_name"], [])
		for idx, pid in enumerate(photo_ids):
			doc.append("images", {
				"image": _unsplash(pid),
				"display_order": idx + 1,
				"is_primary": 1 if idx == 0 else 0,
				"alt_text": f"{b['bundle_name']} — {'hero' if idx == 0 else 'detail'}",
			})
		doc.insert()
		count += 1
	print(f"  Created {count} product bundles")


# ---------------------------------------------------------------------------
# 28. Gift Cards — 10 cards with varied statuses
# ---------------------------------------------------------------------------
def _create_gift_cards(users):
	import uuid

	gc_data = [
		{"original_amount": 1000, "current_balance": 750, "status": "Active"},
		{"original_amount": 2000, "current_balance": 1200, "status": "Active"},
		{"original_amount": 500, "current_balance": 500, "status": "Active"},
		{"original_amount": 3000, "current_balance": 100, "status": "Active"},
		{"original_amount": 1500, "current_balance": 1500, "status": "Active"},
		{"original_amount": 1000, "current_balance": 0, "status": "Fully Redeemed"},
		{"original_amount": 2000, "current_balance": 0, "status": "Fully Redeemed"},
		{"original_amount": 500, "current_balance": 500, "status": "Expired"},
		{"original_amount": 1000, "current_balance": 1000, "status": "Expired"},
		{"original_amount": 5000, "current_balance": 5000, "status": "Active"},
	]

	count = 0
	for i, gc in enumerate(gc_data):
		code = f"GC-{uuid.uuid4().hex[:8].upper()}"
		if frappe.db.exists("Gift Card", code):
			continue
		doc = frappe.new_doc("Gift Card")
		doc.card_code = code
		doc.original_amount = gc["original_amount"]
		doc.current_balance = gc["current_balance"]
		doc.status = gc["status"]
		doc.purchased_by = users[i % len(users)] if users else "Administrator"
		doc.recipient_email = users[(i + 1) % len(users)] if users else ""
		doc.recipient_name = f"Recipient {i + 1}"
		doc.sender_message = f"Enjoy this gift card worth Rs.{gc['original_amount']}!"
		doc.expiry_date = add_days(now_datetime(), 365 if gc["status"] != "Expired" else -30)
		# Add a transaction for partial use
		if gc["current_balance"] < gc["original_amount"] and gc["current_balance"] > 0:
			doc.append("gift_card_transactions", {
				"transaction_date": add_days(now_datetime(), -5),
				"transaction_type": "Redemption",
				"amount": gc["original_amount"] - gc["current_balance"],
				"balance_after": gc["current_balance"],
				"redeemed_by": users[i % len(users)] if users else "Administrator",
			})
		doc.insert()
		count += 1
	print(f"  Created {count} gift cards")


# ---------------------------------------------------------------------------
# 29. Warehouses — 3 major city warehouses
# ---------------------------------------------------------------------------
def _create_warehouses():
	wh_data = [
		{"warehouse_name": "Delhi NCR Warehouse", "warehouse_code": "DEL-WH", "is_default": 1, "city": "New Delhi", "state": "Delhi"},
		{"warehouse_name": "Bangalore Warehouse", "warehouse_code": "BLR-WH", "is_default": 0, "city": "Bangalore", "state": "Karnataka"},
		{"warehouse_name": "Mumbai Warehouse", "warehouse_code": "MUM-WH", "is_default": 0, "city": "Mumbai", "state": "Maharashtra"},
	]
	count = 0
	for w in wh_data:
		if frappe.db.exists("Warehouse", w["warehouse_name"]):
			continue
		doc = frappe.new_doc("Warehouse")
		doc.warehouse_name = w["warehouse_name"]
		doc.warehouse_code = w["warehouse_code"]
		doc.is_active = 1
		doc.is_default = w["is_default"]
		doc.city = w.get("city", "")
		doc.state = w.get("state", "")
		doc.insert()
		count += 1
	print(f"  Created {count} warehouses")


# ---------------------------------------------------------------------------
# 30. Webhook Subscriptions — 3 inactive test webhooks
# ---------------------------------------------------------------------------
def _create_webhook_subscriptions():
	subs = [
		{"subscription_name": "Order Created Hook", "target_url": "https://httpbin.org/post", "event_type": "order.created"},
		{"subscription_name": "Payment Received Hook", "target_url": "https://httpbin.org/post", "event_type": "payment.received"},
		{"subscription_name": "Inventory Updated Hook", "target_url": "https://httpbin.org/post", "event_type": "inventory.updated"},
	]
	count = 0
	for s in subs:
		if frappe.db.exists("Webhook Subscription", {"subscription_name": s["subscription_name"]}):
			continue
		doc = frappe.new_doc("Webhook Subscription")
		doc.subscription_name = s["subscription_name"]
		doc.target_url = s["target_url"]
		doc.event_type = s["event_type"]
		doc.is_active = 0  # Inactive for testing
		doc.retry_count = 3
		doc.content_type = "application/json"
		doc.insert()
		count += 1
	print(f"  Created {count} webhook subscriptions")


# ---------------------------------------------------------------------------
# 31. User Notifications — notifications for test users
# ---------------------------------------------------------------------------
def _create_user_notifications(users, orders_dict):
	messages = [
		("Your order has been shipped!", "Order"),
		("Flash Sale: 20% off on summer collection!", "Promotion"),
		("An item from your wishlist is back in stock!", "Back in Stock"),
		("You earned 150 loyalty points!", "Loyalty"),
		("Welcome to Velora Verse!", "General"),
		("Your order has been delivered!", "Order"),
		("New collection launched!", "Promotion"),
		("Your points are about to expire", "Loyalty"),
		("Rate your recent purchase", "Review"),
		("Weekend sale starts now!", "Promotion"),
	]

	count = 0
	for user in users[:10]:
		for i, (msg, ntype) in enumerate(messages):
			doc = frappe.new_doc("User Notification")
			doc.user = user
			doc.notification_type = ntype
			doc.title_text = msg
			doc.message = f"{msg} Check your account for details."
			doc.is_read = 1 if i > 5 else 0
			doc.action_url = "/orders" if ntype == "Order" else "/shop"
			doc.insert()
			count += 1
	print(f"  Created {count} user notifications")


# ---------------------------------------------------------------------------
# 32. Analytics Events — 500+ events spanning 30 days
# ---------------------------------------------------------------------------
def _create_analytics_events(users, items_dict):
	item_ids = list(items_dict.values()) if isinstance(items_dict, dict) else list(items_dict)
	event_types = ["page_view", "add_to_cart", "remove_from_cart", "begin_checkout", "purchase", "search", "product_view", "add_to_wishlist"]
	pages = ["/", "/shop", "/cart", "/checkout", "/account", "/wishlist"]

	count = 0
	for day_offset in range(30):
		events_today = random.randint(15, 25)
		for _ in range(events_today):
			user = random.choice(users[:15]) if random.random() > 0.3 else "Guest"
			event = random.choice(event_types)

			doc = frappe.new_doc("Analytics Event")
			doc.event_name = event
			doc.user = user if user != "Guest" else ""
			doc.session_id = frappe.generate_hash(length=16)
			doc.event_timestamp = add_days(now_datetime(), -day_offset)
			doc.page_url = random.choice(pages)
			doc.user_agent = "Mozilla/5.0 (Test Seed Data)"

			if event in ("product_view", "add_to_cart", "purchase") and item_ids:
				doc.reference_doctype = "Items"
				doc.reference_name = random.choice(item_ids)

			doc.insert()
			count += 1
	print(f"  Created {count} analytics events")


# ---------------------------------------------------------------------------
# 33. Assign HSN Codes to existing Items
# ---------------------------------------------------------------------------
def _assign_hsn_to_items():
	hsn_codes = frappe.get_all("HSN Code", pluck="name")
	if not hsn_codes:
		print("  No HSN codes to assign")
		return

	items = frappe.get_all("Items", pluck="name")
	count = 0
	for item in items:
		hsn = random.choice(hsn_codes)
		frappe.db.set_value("Items", item, "hsn_code", hsn)
		count += 1
	print(f"  Assigned HSN codes to {count} items")
