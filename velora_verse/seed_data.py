import frappe


def seed():
	"""Seed the database with sample e-commerce data for Velora Verse.

	Usage: bench --site veloraverse.com execute velora_verse.seed_data.seed
	"""
	frappe.flags.ignore_permissions = True

	print("\n=== Seeding Velora Verse Data ===\n")

	print("0/6 Cleaning up existing data...")
	_cleanup()
	frappe.db.commit()

	print("\n1/6 Creating Item Types...")
	_create_item_types()
	frappe.db.commit()

	print("\n2/6 Creating Categories...")
	_create_categories()
	frappe.db.commit()

	print("\n3/6 Creating Variant Types...")
	_create_variant_types()
	frappe.db.commit()

	print("\n4/6 Creating Variant Type Properties...")
	_create_variant_type_properties()
	frappe.db.commit()

	print("\n5/6 Creating Items...")
	items = _create_items()
	frappe.db.commit()

	print("\n6/6 Creating Variants...")
	_create_variants(items)
	frappe.db.commit()

	print("\n=== Seed complete! ===\n")


# ---------------------------------------------------------------------------
# 0. Cleanup — remove all existing data so we start fresh
# ---------------------------------------------------------------------------
def _cleanup():
	# Delete in reverse dependency order
	for dt in ["Variants", "Items", "Variant Type Property", "Variants Type", "Category", "Item Type"]:
		docs = frappe.get_all(dt, pluck="name")
		for name in docs:
			frappe.delete_doc(dt, name, ignore_permissions=True, force=True)
		if docs:
			print(f"  Deleted {len(docs)} {dt} records")

	# Reset Items naming series so we start from ITEM-0001
	if frappe.db.exists("Series", "ITEM-"):
		frappe.db.sql("UPDATE `tabSeries` SET current=0 WHERE name='ITEM-'")


# ---------------------------------------------------------------------------
# 1. Item Types (20)
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
