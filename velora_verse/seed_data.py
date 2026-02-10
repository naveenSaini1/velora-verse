import frappe


def seed():
	"""Seed the database with sample e-commerce data for Velora Verse.

	Usage: bench --site veloraverse.com execute velora_verse.seed_data.seed
	"""
	frappe.flags.ignore_permissions = True

	print("\n=== Seeding Velora Verse Data ===\n")

	print("0/11 Cleaning up existing data...")
	_cleanup()
	frappe.db.commit()

	print("\n1/11 Creating Number Cards...")
	_create_number_cards()
	frappe.db.commit()

	print("\n2/11 Creating Item Types...")
	_create_item_types()
	frappe.db.commit()

	print("\n3/11 Creating Categories...")
	_create_categories()
	frappe.db.commit()

	print("\n4/11 Creating Variant Types...")
	_create_variant_types()
	frappe.db.commit()

	print("\n5/11 Creating Variant Type Properties...")
	_create_variant_type_properties()
	frappe.db.commit()

	print("\n6/11 Creating Items...")
	items = _create_items()
	frappe.db.commit()

	print("\n7/11 Creating Variants...")
	_create_variants(items)
	frappe.db.commit()

	print("\n8/11 Creating Users...")
	users = _create_users()
	frappe.db.commit()

	print("\n9/11 Creating Reviews...")
	_create_reviews(items, users)
	frappe.db.commit()

	print("\n10/11 Creating Wishlists...")
	_create_wishlists(users)
	frappe.db.commit()

	print("\n11/11 Creating Carts...")
	_create_carts(users)
	frappe.db.commit()

	print("\n=== Seed complete! ===\n")


# ---------------------------------------------------------------------------
# 0. Cleanup — remove all existing data so we start fresh
# ---------------------------------------------------------------------------
def _cleanup():
	# Delete in reverse dependency order — new doctypes first, then original ones
	for dt in [
		"Cart", "Review", "Wishlist",
		"Variants", "Items",
		"Variant Type Property", "Variants Type", "Category", "Item Type",
	]:
		docs = frappe.get_all(dt, pluck="name")
		for name in docs:
			frappe.delete_doc(dt, name, ignore_permissions=True, force=True)
		if docs:
			print(f"  Deleted {len(docs)} {dt} records")

	# Delete workspace number cards
	for card_name in ["Total Products", "In-Stock Variants", "Customer Reviews", "Active Carts"]:
		if frappe.db.exists("Number Card", card_name):
			frappe.delete_doc("Number Card", card_name, ignore_permissions=True, force=True)
			print(f"  Deleted Number Card: {card_name}")

	# Delete test customer users (customer1@ through customer20@)
	test_users = frappe.get_all(
		"User",
		filters={"email": ["like", "customer%@veloraverse.com"]},
		pluck="name",
	)
	for email in test_users:
		frappe.delete_doc("User", email, ignore_permissions=True, force=True)
	if test_users:
		print(f"  Deleted {len(test_users)} test User records")

	# Reset Items naming series so we start from ITEM-0001
	if frappe.db.exists("Series", "ITEM-"):
		frappe.db.sql("UPDATE `tabSeries` SET current=0 WHERE name='ITEM-'")


# ---------------------------------------------------------------------------
# 1. Number Cards (4) — KPI tiles for the workspace dashboard
# ---------------------------------------------------------------------------
def _create_number_cards():
	cards = [
		{
			"name": "Total Products",
			"label": "Total Products",
			"document_type": "Items",
			"function": "Count",
			"is_public": 1,
			"filters_json": '[["Items","status","=","Active"]]',
			"show_percentage_stats": 1,
			"stats_time_interval": "Monthly",
			"color": "#29cd42",
		},
		{
			"name": "In-Stock Variants",
			"label": "In-Stock Variants",
			"document_type": "Variants",
			"function": "Count",
			"is_public": 1,
			"filters_json": '[["Variants","is_stock","=",1]]',
			"show_percentage_stats": 1,
			"stats_time_interval": "Monthly",
			"color": "#4299e1",
		},
		{
			"name": "Customer Reviews",
			"label": "Customer Reviews",
			"document_type": "Review",
			"function": "Count",
			"is_public": 1,
			"filters_json": "[]",
			"show_percentage_stats": 1,
			"stats_time_interval": "Monthly",
			"color": "#ECAD4B",
		},
		{
			"name": "Active Carts",
			"label": "Active Carts",
			"document_type": "Cart",
			"function": "Count",
			"is_public": 1,
			"filters_json": "[]",
			"show_percentage_stats": 1,
			"stats_time_interval": "Monthly",
			"color": "#EC864B",
		},
	]

	for card in cards:
		if frappe.db.exists("Number Card", card["name"]):
			print(f"  - {card['name']} (exists)")
			continue

		doc = frappe.get_doc({"doctype": "Number Card", "type": "Document Type", **card})
		doc.insert(ignore_permissions=True)
		print(f"  + {card['name']}")


# ---------------------------------------------------------------------------
# 2. Item Types (20)
# ---------------------------------------------------------------------------
def _create_item_types():
	types = [
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
	]
	for name, desc in types:
		if not frappe.db.exists("Item Type", name):
			doc = frappe.new_doc("Item Type")
			doc.__newname = name
			doc.description = desc
			doc.insert(ignore_permissions=True)
			print(f"  + {name}")
		else:
			print(f"  - {name} (exists)")


# ---------------------------------------------------------------------------
# 2. Categories (20) — 4 parents + 16 children
# ---------------------------------------------------------------------------
def _create_categories():
	parents = [
		("Clothing", "All types of clothing and apparel", 1),
		("Footwear", "Shoes, boots, sandals and more", 2),
		("Accessories", "Fashion accessories and add-ons", 3),
		("Bags", "Bags, backpacks and luggage", 4),
	]

	children = [
		# ── Clothing (8 children) ──
		("T-Shirts & Tanks", "Clothing", "Casual tees and tank tops", 1),
		("Polo Shirts", "Clothing", "Classic polo neck shirts", 2),
		("Hoodies & Sweatshirts", "Clothing", "Hoodies, sweatshirts and zip-ups", 3),
		("Jeans & Trousers", "Clothing", "Denim jeans and formal trousers", 4),
		("Shorts", "Clothing", "Casual and athletic shorts", 5),
		("Jackets & Coats", "Clothing", "Outerwear for all seasons", 6),
		("Sweaters", "Clothing", "Knit sweaters and cardigans", 7),
		("Dresses & Skirts", "Clothing", "Dresses and skirts for women", 8),
		# ── Footwear (3 children) ──
		("Sneakers", "Footwear", "Casual and athletic sneakers", 1),
		("Boots", "Footwear", "Ankle boots, chelsea boots and more", 2),
		("Sandals & Slippers", "Footwear", "Open-toe and casual footwear", 3),
		# ── Accessories (4 children) ──
		("Watches", "Accessories", "Wristwatches and smartwatches", 1),
		("Sunglasses", "Accessories", "Fashion and sport sunglasses", 2),
		("Belts & Wallets", "Accessories", "Leather belts and wallets", 3),
		("Hats & Scarves", "Accessories", "Caps, hats, scarves and wraps", 4),
		# ── Bags (1 child) ──
		("Backpacks & Totes", "Bags", "Everyday carry bags and totes", 1),
	]

	for name, desc, order in parents:
		if not frappe.db.exists("Category", name):
			frappe.get_doc(
				{
					"doctype": "Category",
					"category_name": name,
					"description": desc,
					"is_child": 0,
					"is_active": 1,
					"display_order": order,
				}
			).insert(ignore_permissions=True)
			print(f"  + {name} (parent)")
		else:
			print(f"  - {name} (exists)")

	for name, parent, desc, order in children:
		if not frappe.db.exists("Category", name):
			frappe.get_doc(
				{
					"doctype": "Category",
					"category_name": name,
					"description": desc,
					"is_child": 1,
					"parent_category": parent,
					"is_active": 1,
					"display_order": order,
				}
			).insert(ignore_permissions=True)
			print(f"  + {name} → {parent}")
		else:
			print(f"  - {name} (exists)")


# ---------------------------------------------------------------------------
# 3. Variant Types (6)
# ---------------------------------------------------------------------------
def _create_variant_types():
	types = [
		("Color", "Color options for products"),
		("Size", "Size options (XS to XXL)"),
		("Material", "Fabric and material types"),
		("Pattern", "Visual patterns and prints"),
		("Fit", "Fit styles from slim to oversized"),
		("Sleeve Length", "Sleeve length variations"),
	]
	for name, desc in types:
		if not frappe.db.exists("Variants Type", name):
			doc = frappe.new_doc("Variants Type")
			doc.__newname = name
			doc.description = desc
			doc.insert(ignore_permissions=True)
			print(f"  + {name}")
		else:
			print(f"  - {name} (exists)")


# ---------------------------------------------------------------------------
# 4. Variant Type Properties (6) — each with multiple property values
# ---------------------------------------------------------------------------
def _create_variant_type_properties():
	properties = {
		"Color": [
			("Red", "R"),
			("Blue", "B"),
			("Black", "BLK"),
			("White", "W"),
			("Green", "G"),
			("Navy", "NV"),
			("Grey", "GR"),
			("Beige", "BG"),
			("Brown", "BR"),
			("Pink", "PK"),
		],
		"Size": [
			("XS", "XS"),
			("S", "S"),
			("M", "M"),
			("L", "L"),
			("XL", "XL"),
			("XXL", "XXL"),
		],
		"Material": [
			("Cotton", "CT"),
			("Polyester", "PL"),
			("Leather", "LT"),
			("Denim", "DN"),
			("Wool", "WL"),
			("Silk", "SK"),
			("Nylon", "NY"),
			("Linen", "LN"),
		],
		"Pattern": [
			("Solid", "SLD"),
			("Striped", "STR"),
			("Plaid", "PLD"),
			("Floral", "FLR"),
			("Graphic", "GFX"),
			("Camo", "CMO"),
		],
		"Fit": [
			("Slim", "SLM"),
			("Regular", "REG"),
			("Relaxed", "RLX"),
			("Oversized", "OVR"),
		],
		"Sleeve Length": [
			("Short Sleeve", "SS"),
			("Long Sleeve", "LS"),
			("Three Quarter", "3Q"),
			("Sleeveless", "SL"),
		],
	}

	for vtype, props in properties.items():
		if not frappe.db.exists("Variant Type Property", vtype):
			doc = frappe.new_doc("Variant Type Property")
			doc.variant_type = vtype
			for val, abbr in props:
				row = doc.append("variant_properties", {})
				row.values = val
				row.abbreviation = abbr
			doc.insert(ignore_permissions=True)
			print(f"  + {vtype} ({len(props)} values)")
		else:
			print(f"  - {vtype} (exists)")


# ---------------------------------------------------------------------------
# 5. Items (20) — with categories, SKUs, descriptions, and proper base prices
# ---------------------------------------------------------------------------
def _create_items():
	items_data = [
		# (item_name, type, base_price, has_variants, sku, [categories], description, status)
		(
			"Classic Cotton T-Shirt", "T-Shirt", 599, 1, "VV-TSH-001",
			["T-Shirts & Tanks"],
			"A timeless crew-neck tee crafted from 100% combed cotton. Soft, breathable, and perfect for everyday layering or solo wear.",
			"Active",
		),
		(
			"Premium Zip Hoodie", "Hoodie", 1499, 1, "VV-HOD-001",
			["Hoodies & Sweatshirts"],
			"A heavyweight zip-up hoodie with brushed fleece lining. Features a kangaroo pocket, metal zipper, and ribbed cuffs.",
			"Active",
		),
		(
			"Slim Fit Denim Jeans", "Jeans", 1299, 1, "VV-JNS-001",
			["Jeans & Trousers"],
			"Modern slim-fit jeans in premium stretch denim. Five-pocket styling with a tapered leg for a clean silhouette.",
			"Active",
		),
		(
			"Urban Runner Sneakers", "Sneakers", 2499, 1, "VV-SNK-001",
			["Sneakers"],
			"Lightweight mesh-upper running sneakers with cushioned EVA soles. Designed for both gym sessions and street style.",
			"Active",
		),
		(
			"Winter Puffer Jacket", "Jacket", 3999, 1, "VV-JKT-001",
			["Jackets & Coats"],
			"Insulated puffer jacket with a water-resistant shell and synthetic down fill. Keeps you warm in sub-zero temps.",
			"Active",
		),
		(
			"Floral Maxi Dress", "Dress", 1899, 1, "VV-DRS-001",
			["Dresses & Skirts"],
			"An elegant floor-length maxi dress with an all-over floral print. V-neckline with a fitted waist and flowing skirt.",
			"Active",
		),
		(
			"Cotton Cargo Shorts", "Shorts", 899, 1, "VV-SHR-001",
			["Shorts"],
			"Durable cotton cargo shorts with multiple utility pockets. Relaxed fit with an elastic waistband for comfort.",
			"Active",
		),
		(
			"Classic Polo Shirt", "Polo Shirt", 799, 1, "VV-POL-001",
			["Polo Shirts"],
			"A refined pique polo with a two-button placket and embroidered logo. Perfect for smart-casual occasions.",
			"Active",
		),
		(
			"Merino Wool Sweater", "Sweater", 1799, 1, "VV-SWR-001",
			["Sweaters"],
			"Ultra-fine merino wool crew-neck sweater. Naturally temperature-regulating and itch-free for all-day comfort.",
			"Active",
		),
		(
			"Snapback Baseball Cap", "Cap", 499, 1, "VV-CAP-001",
			["Hats & Scarves"],
			"A structured six-panel snapback cap with an embroidered front logo and adjustable snap closure.",
			"Active",
		),
		(
			"Leather Travel Backpack", "Backpack", 3499, 1, "VV-BPK-001",
			["Backpacks & Totes"],
			"Full-grain leather backpack with a padded laptop compartment and brass hardware. Built for daily commutes and weekend trips.",
			"Active",
		),
		(
			"Chronograph Wrist Watch", "Watch", 4999, 0, "VV-WCH-001",
			["Watches"],
			"Stainless steel chronograph watch with sapphire crystal glass. 50m water resistance and Japanese quartz movement.",
			"Active",
		),
		(
			"Aviator Sunglasses", "Sunglasses", 1299, 1, "VV-SNG-001",
			["Sunglasses"],
			"Classic aviator-style sunglasses with polarized lenses and lightweight metal frames. 100% UV400 protection.",
			"Active",
		),
		(
			"Genuine Leather Belt", "Belt", 699, 1, "VV-BLT-001",
			["Belts & Wallets"],
			"A single-piece genuine leather belt with a brushed nickel pin buckle. Available in multiple colors.",
			"Active",
		),
		(
			"Bi-fold Leather Wallet", "Wallet", 999, 0, "VV-WLT-001",
			["Belts & Wallets"],
			"Slim bi-fold wallet in full-grain leather with RFID blocking. Six card slots, two note compartments, and a coin pocket.",
			"Active",
		),
		(
			"Cashmere Winter Scarf", "Scarf", 1499, 1, "VV-SCR-001",
			["Hats & Scarves"],
			"Luxuriously soft 100% cashmere scarf with fringed edges. Lightweight yet warm, perfect for layering in winter.",
			"Active",
		),
		(
			"Striped Crew Neck T-Shirt", "T-Shirt", 699, 1, "VV-TSH-002",
			["T-Shirts & Tanks"],
			"A nautical-inspired striped tee in soft jersey cotton. Relaxed fit with ribbed crew neckline.",
			"Active",
		),
		(
			"Chelsea Leather Boots", "Boots", 4499, 1, "VV-BOT-001",
			["Boots"],
			"Premium leather Chelsea boots with elastic side panels and a pull tab. Goodyear-welted leather sole for durability.",
			"Active",
		),
		(
			"Summer Slide Sandals", "Sandals", 799, 1, "VV-SND-001",
			["Sandals & Slippers"],
			"Minimalist slide sandals with a contoured footbed and non-slip rubber outsole. Perfect for pool and beach days.",
			"Active",
		),
		(
			"Graphic Tank Top", "Tank Top", 449, 1, "VV-TNK-001",
			["T-Shirts & Tanks"],
			"A bold graphic print tank top in lightweight cotton. Racerback cut with raw-edge armholes for a street-style look.",
			"Draft",
		),
	]

	created = {}  # item_name -> ITEM-xxxx name

	for item_name, itype, price, has_var, sku, cats, desc, status in items_data:
		existing = frappe.db.get_value("Items", {"item_name": item_name}, "name")
		if existing:
			created[item_name] = existing
			print(f"  - {item_name} (exists as {existing})")
			continue

		doc = frappe.get_doc(
			{
				"doctype": "Items",
				"item_name": item_name,
				"type": itype,
				"base_price": price,
				"has_variants": has_var,
				"sku": sku,
				"in_stock": 0,
				"status": status,
				"description": desc,
				"category": [{"category": c} for c in cats],
			}
		)
		doc.insert(ignore_permissions=True)
		created[item_name] = doc.name
		print(f"  + {item_name} ({doc.name}) — {itype}, ₹{price}")

	# For items without variants, set in_stock directly
	for item_name in ["Chronograph Wrist Watch", "Bi-fold Leather Wallet"]:
		item_id = created.get(item_name)
		if item_id:
			frappe.db.set_value("Items", item_id, "in_stock", 1)

	return created


# ---------------------------------------------------------------------------
# 6. Variants (20) — with proper type/value combinations, prices, stock
# ---------------------------------------------------------------------------
def _create_variants(items):
	# Build lookup: (variant_type_name, value_label) -> child row name
	# NOTE: r.get("values") is required because `values` is a Python dict method
	# and Frappe's _dict extends dict, so r.values returns dict.values() not the field.
	prop_lookup = {}
	for vtype in ["Color", "Size", "Material", "Pattern", "Fit", "Sleeve Length"]:
		rows = frappe.get_all(
			"Variant Properties",
			filters={"parent": vtype, "parenttype": "Variant Type Property"},
			fields=["name", "values"],
		)
		for r in rows:
			prop_lookup[(vtype, r.get("values"))] = r.name

	# (item_name, [(type, value), ...], price, quantity, is_stock)
	variants_data = [
		# ── Classic Cotton T-Shirt (3 variants) ──
		("Classic Cotton T-Shirt", [("Color", "Red"), ("Size", "M")], 599, 50, 1),
		("Classic Cotton T-Shirt", [("Color", "Blue"), ("Size", "L")], 599, 30, 1),
		("Classic Cotton T-Shirt", [("Color", "Black"), ("Size", "S")], 599, 0, 0),
		# ── Premium Zip Hoodie (2 variants) ──
		("Premium Zip Hoodie", [("Color", "Grey"), ("Size", "L")], 1499, 25, 1),
		("Premium Zip Hoodie", [("Color", "Black"), ("Size", "XL")], 1599, 15, 1),
		# ── Slim Fit Denim Jeans (2 variants) ──
		("Slim Fit Denim Jeans", [("Color", "Blue"), ("Size", "M")], 1299, 40, 1),
		("Slim Fit Denim Jeans", [("Color", "Black"), ("Size", "L")], 1299, 20, 1),
		# ── Urban Runner Sneakers (2 variants) ──
		("Urban Runner Sneakers", [("Color", "White"), ("Size", "M")], 2499, 10, 1),
		("Urban Runner Sneakers", [("Color", "Black"), ("Size", "L")], 2699, 5, 1),
		# ── Winter Puffer Jacket (1 variant) ──
		("Winter Puffer Jacket", [("Color", "Black"), ("Size", "XL")], 3999, 8, 1),
		# ── Floral Maxi Dress (2 variants) ──
		("Floral Maxi Dress", [("Color", "Red"), ("Size", "S")], 1899, 12, 1),
		("Floral Maxi Dress", [("Color", "Blue"), ("Size", "M")], 1899, 0, 0),
		# ── Cotton Cargo Shorts (1 variant) ──
		("Cotton Cargo Shorts", [("Color", "Beige"), ("Size", "M")], 899, 35, 1),
		# ── Classic Polo Shirt (2 variants) ──
		("Classic Polo Shirt", [("Color", "Navy"), ("Size", "M")], 799, 45, 1),
		("Classic Polo Shirt", [("Color", "White"), ("Size", "L")], 799, 30, 1),
		# ── Merino Wool Sweater (1 variant) ──
		("Merino Wool Sweater", [("Color", "Grey"), ("Size", "L")], 1799, 15, 1),
		# ── Snapback Baseball Cap (1 variant — color only) ──
		("Snapback Baseball Cap", [("Color", "Black")], 499, 60, 1),
		# ── Leather Travel Backpack (1 variant — color only) ──
		("Leather Travel Backpack", [("Color", "Brown")], 3499, 10, 1),
		# ── Aviator Sunglasses (1 variant — color only) ──
		("Aviator Sunglasses", [("Color", "Black")], 1299, 25, 1),
		# ── Genuine Leather Belt (1 variant — color only) ──
		("Genuine Leather Belt", [("Color", "Brown")], 699, 20, 1),
	]

	count = 0
	for item_name, variant_values, price, qty, is_stock in variants_data:
		item_id = items.get(item_name)
		if not item_id:
			print(f"  ! Skipping variant for '{item_name}' — item not found")
			continue

		vv_rows = []
		for vtype, vval in variant_values:
			prop_name = prop_lookup.get((vtype, vval))
			if not prop_name:
				print(f"  ! Property not found: {vtype}/{vval}")
				continue
			vv_rows.append({"type": vtype, "value": prop_name})

		doc = frappe.get_doc(
			{
				"doctype": "Variants",
				"variant_name": item_id,
				"price": price,
				"quantity": qty,
				"is_stock": is_stock,
				"variant_values": vv_rows,
			}
		)

		try:
			doc.insert(ignore_permissions=True)
			count += 1
			vals_str = ", ".join(f"{vt}:{vv}" for vt, vv in variant_values)
			print(f"  + {item_name} → [{vals_str}] qty:{qty}, ₹{price}")
		except frappe.exceptions.ValidationError as e:
			print(f"  ! {item_name} — {str(e)[:80]}")

	print(f"\n  Total variants created: {count}")


# ---------------------------------------------------------------------------
# 7. Users (20) — test customer accounts for reviews, wishlists, and carts
# ---------------------------------------------------------------------------
def _create_users():
	user_profiles = [
		("customer1@veloraverse.com", "Aarav", "Sharma"),
		("customer2@veloraverse.com", "Priya", "Patel"),
		("customer3@veloraverse.com", "Rohan", "Mehta"),
		("customer4@veloraverse.com", "Ananya", "Gupta"),
		("customer5@veloraverse.com", "Vikram", "Singh"),
		("customer6@veloraverse.com", "Sneha", "Reddy"),
		("customer7@veloraverse.com", "Arjun", "Kumar"),
		("customer8@veloraverse.com", "Diya", "Nair"),
		("customer9@veloraverse.com", "Karthik", "Iyer"),
		("customer10@veloraverse.com", "Meera", "Joshi"),
		("customer11@veloraverse.com", "Aditya", "Verma"),
		("customer12@veloraverse.com", "Ishita", "Rao"),
		("customer13@veloraverse.com", "Rahul", "Desai"),
		("customer14@veloraverse.com", "Kavya", "Menon"),
		("customer15@veloraverse.com", "Siddharth", "Bhatt"),
		("customer16@veloraverse.com", "Neha", "Chopra"),
		("customer17@veloraverse.com", "Pranav", "Malhotra"),
		("customer18@veloraverse.com", "Riya", "Saxena"),
		("customer19@veloraverse.com", "Harsh", "Tiwari"),
		("customer20@veloraverse.com", "Pooja", "Kulkarni"),
	]

	users = []
	for email, first, last in user_profiles:
		if frappe.db.exists("User", email):
			print(f"  - {email} (exists)")
			users.append(email)
			continue

		doc = frappe.get_doc({
			"doctype": "User",
			"email": email,
			"first_name": first,
			"last_name": last,
			"user_type": "Website User",
			"send_welcome_email": 0,
			"new_password": "Velora@2026#Cx",
		})
		doc.insert(ignore_permissions=True)
		users.append(email)
		print(f"  + {first} {last} ({email})")

	print(f"\n  Total users: {len(users)}")
	return users


# ---------------------------------------------------------------------------
# 8. Reviews (20) — one review per user, spread across items
# ---------------------------------------------------------------------------
def _create_reviews(items, users):
	# Frappe Rating: 0.2 = 1 star, 0.4 = 2 stars, 0.6 = 3 stars, 0.8 = 4 stars, 1.0 = 5 stars
	# One review per user per item — each user reviews a different item
	reviews_data = [
		# (user_index, item_name, rating, title, text)
		(
			0, "Classic Cotton T-Shirt", 1.0,
			"Best everyday tee",
			"Super soft cotton, fits perfectly. The color hasn't faded after multiple washes. Highly recommend for daily wear!",
		),
		(
			1, "Premium Zip Hoodie", 0.8,
			"Great hoodie, runs a bit large",
			"Quality fleece lining keeps me warm. The zipper is solid. Only downside is it runs a size bigger than expected.",
		),
		(
			2, "Slim Fit Denim Jeans", 1.0,
			"Perfect fit and quality",
			"These jeans are exactly what I was looking for. The stretch denim is comfortable all day and the slim fit looks sharp.",
		),
		(
			3, "Urban Runner Sneakers", 0.8,
			"Comfortable and stylish",
			"Great for both running and casual wear. Cushioning is excellent. Wish they had more color options.",
		),
		(
			4, "Winter Puffer Jacket", 1.0,
			"Essential winter gear",
			"Survived a -10°C trip without any issues. Lightweight yet incredibly warm. The water-resistant shell is a bonus.",
		),
		(
			5, "Floral Maxi Dress", 0.6,
			"Pretty but fabric could be better",
			"The print is gorgeous and the fit is flattering. However, the fabric feels a bit thin for the price point.",
		),
		(
			6, "Classic Polo Shirt", 0.8,
			"Smart casual staple",
			"Perfect for office and weekend wear. The pique fabric breathes well. Logo embroidery is tasteful and subtle.",
		),
		(
			7, "Merino Wool Sweater", 1.0,
			"Luxury feel at a great price",
			"Incredibly soft merino wool that doesn't itch at all. Keeps me warm without overheating. Worth every penny.",
		),
		(
			8, "Leather Travel Backpack", 0.8,
			"Beautiful craftsmanship",
			"The leather quality is outstanding and the brass hardware adds a premium feel. Laptop compartment fits my 15-inch perfectly.",
		),
		(
			9, "Chronograph Wrist Watch", 1.0,
			"Stunning timepiece",
			"The sapphire crystal is crystal clear and the chronograph functions work flawlessly. Gets compliments every time I wear it.",
		),
		(
			10, "Aviator Sunglasses", 0.8,
			"Classic look, great protection",
			"Polarized lenses make a huge difference. Lightweight and comfortable for all-day wear. Classic aviator style never goes out of fashion.",
		),
		(
			11, "Genuine Leather Belt", 1.0,
			"Solid leather belt",
			"Heavy-duty genuine leather that gets better with age. The nickel buckle is sturdy and the sizing is accurate.",
		),
		(
			12, "Cashmere Winter Scarf", 0.8,
			"Soft and luxurious",
			"The cashmere is incredibly soft. Keeps my neck warm without being bulky. The fringed edges add a nice touch.",
		),
		(
			13, "Chelsea Leather Boots", 1.0,
			"Worth the investment",
			"These boots are built to last. The Goodyear welt construction means they can be resoled. Comfortable right out of the box.",
		),
		(
			14, "Cotton Cargo Shorts", 0.6,
			"Good for the price",
			"Decent cargo shorts for summer. Pockets are useful. The elastic waistband is comfortable but the fabric could be softer.",
		),
		(
			15, "Classic Cotton T-Shirt", 0.8,
			"Reliable and comfortable",
			"Bought this as a second purchase after the first one held up so well. Great value for the price.",
		),
		(
			16, "Slim Fit Denim Jeans", 0.8,
			"Solid jeans for the price",
			"Nice stretch and the color is rich. The slim fit is flattering without being too tight. Good everyday jeans.",
		),
		(
			17, "Snapback Baseball Cap", 1.0,
			"Perfect summer cap",
			"Love the snapback fit — adjustable and comfortable. The embroidery is clean and the cap holds its shape well.",
		),
		(
			18, "Summer Slide Sandals", 0.6,
			"Decent for the beach",
			"Comfortable footbed and grippy sole. The straps could be a bit softer, but overall good for pool and beach use.",
		),
		(
			19, "Bi-fold Leather Wallet", 1.0,
			"Sleek and functional",
			"The RFID blocking is a great feature. Slim profile fits easily in my pocket. Leather quality is top-notch.",
		),
	]

	count = 0
	for user_idx, item_name, rating, title, text in reviews_data:
		item_id = items.get(item_name)
		if not item_id:
			print(f"  ! Skipping review for '{item_name}' — item not found")
			continue

		user = users[user_idx]
		existing = frappe.db.exists("Review", {"item": item_id, "user": user})
		if existing:
			print(f"  - {item_name} by {user} (review exists)")
			continue

		doc = frappe.get_doc({
			"doctype": "Review",
			"item": item_id,
			"user": user,
			"rating": rating,
			"review_title": title,
			"review_text": text,
		})

		try:
			doc.insert(ignore_permissions=True)
			count += 1
			stars = int(rating * 5)
			print(f"  + {item_name} by {user} — {'★' * stars}{'☆' * (5 - stars)} \"{title}\"")
		except frappe.exceptions.ValidationError as e:
			print(f"  ! {item_name} — {str(e)[:80]}")

	print(f"\n  Total reviews created: {count}")


# ---------------------------------------------------------------------------
# 9. Wishlists (20) — one wishlist per user with 2-5 variants each
# ---------------------------------------------------------------------------
def _create_wishlists(users):
	all_variants = frappe.get_all("Variants", pluck="name", order_by="creation")
	if not all_variants:
		print("  ! No variants found — skipping wishlists")
		return

	# Distribute variants across wishlists: each user gets 2-5 variants
	# Cycle through variants to ensure good spread
	variant_counts = [3, 4, 2, 5, 3, 4, 2, 3, 5, 2, 4, 3, 2, 5, 3, 4, 2, 3, 4, 5]
	v_idx = 0

	count = 0
	for i, user in enumerate(users):
		if frappe.db.exists("Wishlist", user):
			print(f"  - {user} wishlist (exists)")
			continue

		num_items = variant_counts[i % len(variant_counts)]
		picked = []
		for _ in range(num_items):
			picked.append(all_variants[v_idx % len(all_variants)])
			v_idx += 1

		doc = frappe.get_doc({
			"doctype": "Wishlist",
			"user": user,
			"wishlist_items": [{"variant": v} for v in picked],
		})

		try:
			doc.insert(ignore_permissions=True)
			count += 1
			print(f"  + {user} — {num_items} items")

			# Update wishlist counts on variants
			for v in picked:
				current = frappe.db.get_value("Variants", v, "wishlist_count") or 0
				frappe.db.set_value("Variants", v, "wishlist_count", current + 1, update_modified=False)
		except frappe.exceptions.ValidationError as e:
			print(f"  ! {user} — {str(e)[:80]}")

	print(f"\n  Total wishlists created: {count}")


# ---------------------------------------------------------------------------
# 10. Carts (20) — one cart per user with 1-3 in-stock variants each
# ---------------------------------------------------------------------------
def _create_carts(users):
	in_stock = frappe.get_all(
		"Variants",
		filters={"is_stock": 1},
		fields=["name", "price"],
		order_by="creation",
	)
	if not in_stock:
		print("  ! No in-stock variants found — skipping carts")
		return

	# Each user gets 1-3 items with varying quantities
	cart_configs = [
		(2, [1, 2]),
		(1, [1]),
		(3, [1, 1, 1]),
		(2, [2, 1]),
		(1, [3]),
		(2, [1, 1]),
		(3, [2, 1, 1]),
		(1, [2]),
		(2, [1, 3]),
		(3, [1, 1, 2]),
		(1, [1]),
		(2, [2, 2]),
		(3, [1, 1, 1]),
		(1, [2]),
		(2, [1, 1]),
		(3, [1, 2, 1]),
		(2, [3, 1]),
		(1, [1]),
		(2, [1, 2]),
		(3, [2, 1, 1]),
	]

	v_idx = 0
	count = 0
	for i, user in enumerate(users):
		if frappe.db.exists("Cart", user):
			print(f"  - {user} cart (exists)")
			continue

		num_items, quantities = cart_configs[i % len(cart_configs)]
		cart_items = []
		for j in range(num_items):
			variant = in_stock[v_idx % len(in_stock)]
			v_idx += 1
			cart_items.append({
				"variant": variant.name,
				"quantity": quantities[j],
				"rate": variant.price,
			})

		doc = frappe.get_doc({
			"doctype": "Cart",
			"user": user,
			"cart_items": cart_items,
		})

		try:
			doc.insert(ignore_permissions=True)
			count += 1
			print(f"  + {user} — {num_items} items, total: ₹{doc.total}")
		except frappe.exceptions.ValidationError as e:
			print(f"  ! {user} — {str(e)[:80]}")

	print(f"\n  Total carts created: {count}")
