# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""
Product browsing APIs for the storefront frontend.
All endpoints in this module are guest-accessible (read-only catalog data).

Call via: frappe.call("velora_verse.api.products.<method_name>", ...)
"""

import frappe
from frappe.utils import now_datetime


@frappe.whitelist(allow_guest=True)
def get_products(
	category=None,
	item_type=None,
	min_price=None,
	max_price=None,
	min_rating=None,
	in_stock=None,
	is_featured=None,
	search=None,
	sort_by="modified",
	sort_order="desc",
	page=1,
	limit=20,
):
	"""
	Get paginated product listing with filters.

	Args:
		category: Filter by category slug or name
		item_type: Filter by item type
		min_price / max_price: Price range filter
		min_rating: Minimum average_rating (0.0-1.0 scale, or 1-5 star scale auto-detected)
		in_stock: Filter by stock availability (1 or 0)
		is_featured: Filter featured items only (1 or 0)
		search: Search term for item_name, description, sku
		sort_by: Field to sort by (modified, base_price, average_rating, item_name)
		sort_order: asc or desc
		page: Page number (1-indexed)
		limit: Items per page (max 100)
	"""
	page = max(1, int(page))
	limit = min(100, max(1, int(limit)))
	offset = (page - 1) * limit

	filters = {"status": "Active"}

	if item_type:
		filters["type"] = item_type

	if in_stock is not None:
		filters["in_stock"] = int(in_stock)

	if is_featured is not None:
		filters["is_featured"] = int(is_featured)

	# Build conditions for price and rating filters
	conditions = []
	values = {}

	if min_price is not None:
		conditions.append("base_price >= %(min_price)s")
		values["min_price"] = float(min_price)

	if max_price is not None:
		conditions.append("base_price <= %(max_price)s")
		values["max_price"] = float(max_price)

	if min_rating is not None:
		rating_val = float(min_rating)
		# Auto-detect: if > 1, assume 1-5 star scale and convert to 0-1
		if rating_val > 1:
			rating_val = rating_val / 5
		conditions.append("average_rating >= %(min_rating)s")
		values["min_rating"] = rating_val

	# Category filter via child table (includes subcategories)
	category_join = ""
	if category:
		# Support both slug and name
		category_name = frappe.db.get_value("Category", {"slug": category}, "name") if frappe.db.has_column("Category", "slug") else None
		if not category_name:
			category_name = category

		# Get all subcategories (children) to include their products too
		all_categories = [category_name]
		children = frappe.get_all(
			"Category",
			filters={"parent_category": category_name, "is_active": 1},
			pluck="name",
		)
		all_categories.extend(children)

		category_join = "INNER JOIN `tabItem Category` ic ON ic.parent = i.name AND ic.category IN %(categories)s"
		values["categories"] = all_categories

	# Search
	if search:
		search_term = f"%{search}%"
		conditions.append("(i.item_name LIKE %(search)s OR i.description LIKE %(search)s OR i.sku LIKE %(search)s)")
		values["search"] = search_term

	# Validate sort fields to prevent injection
	allowed_sort_fields = {"modified", "base_price", "average_rating", "item_name", "creation"}
	if sort_by not in allowed_sort_fields:
		sort_by = "modified"
	if sort_order.lower() not in ("asc", "desc"):
		sort_order = "desc"

	# Build WHERE clause from filters dict
	filter_conditions = []
	for key, val in filters.items():
		filter_conditions.append(f"i.`{key}` = %({key})s")
		values[key] = val

	all_conditions = filter_conditions + conditions
	where_clause = " AND ".join(all_conditions) if all_conditions else "1=1"

	# Count query
	count_sql = f"""
		SELECT COUNT(DISTINCT i.name)
		FROM `tabItems` i
		{category_join}
		WHERE {where_clause}
	"""
	total_count = frappe.db.sql(count_sql, values)[0][0]

	# Data query
	data_sql = f"""
		SELECT DISTINCT
			i.name, i.item_name, i.slug, i.type, i.status,
			i.base_price, i.sku, i.average_rating, i.review_count,
			i.in_stock, i.has_variants, i.is_featured, i.description,
			COALESCE(
				(SELECT SUM(v.quantity) FROM `tabVariants` v WHERE v.variant_name = i.name),
				0
			) as stock_qty
		FROM `tabItems` i
		{category_join}
		WHERE {where_clause}
		ORDER BY i.`{sort_by}` {sort_order}
		LIMIT %(limit)s OFFSET %(offset)s
	"""
	values["limit"] = limit
	values["offset"] = offset

	products = frappe.db.sql(data_sql, values, as_dict=True)

	# Attach primary image and categories for each product
	if products:
		product_names = [p.name for p in products]
		_attach_primary_images(products, product_names)
		_attach_categories(products, product_names)

	return {
		"products": products,
		"total_count": total_count,
		"page": page,
		"limit": limit,
		"total_pages": (total_count + limit - 1) // limit if total_count else 0,
	}


@frappe.whitelist(allow_guest=True)
def get_product_detail(slug=None, name=None):
	"""
	Get full product details including all variants, images, and categories.

	Args:
		slug: Product slug (URL-friendly name)
		name: Product ID (e.g., ITEM-0001)
	"""
	if not slug and not name:
		frappe.throw("Either slug or name is required.")

	# Find the item
	if slug:
		item_name = frappe.db.get_value("Items", {"slug": slug, "status": "Active"}, "name") if frappe.db.has_column("Items", "slug") else None
		if not item_name:
			# Fallback: try by name
			item_name = frappe.db.get_value("Items", {"name": slug, "status": "Active"}, "name")
	else:
		item_name = name

	if not item_name or not frappe.db.exists("Items", item_name):
		frappe.throw("Product not found.", frappe.DoesNotExistError)

	item = frappe.get_doc("Items", item_name)
	if item.status != "Active":
		frappe.throw("Product not found.", frappe.DoesNotExistError)

	# Get all images
	images = []
	for row in item.item_image or []:
		images.append({
			"image": row.image,
			"alt_text": row.alt_text,
			"is_primary": row.is_primary,
			"display_order": row.display_order,
		})

	# Get categories
	categories = []
	for row in item.category or []:
		categories.append({
			"category": row.category,
			"category_name": row.category_name,
			"is_primary": row.is_primary,
		})

	# Get variants with their values and images
	variants = []
	if item.has_variants:
		variant_docs = frappe.get_all(
			"Variants",
			filters={"variant_name": item.name},
			fields=["name", "title", "slug", "sku", "price", "quantity", "is_stock", "wishlist_count"],
			order_by="title asc",
		)

		# Bulk fetch variant values and images
		variant_names = [v.name for v in variant_docs]
		variant_values_map = {}
		variant_images_map = {}

		if variant_names:
			all_values = frappe.get_all(
				"Variant Table",
				filters={"parent": ["in", variant_names]},
				fields=["parent", "type", "value"],
			)
			for row in all_values:
				variant_values_map.setdefault(row.parent, []).append({
					"type": row.type,
					"value": row.value,
				})

			all_images = frappe.get_all(
				"Images",
				filters={"parent": ["in", variant_names], "parenttype": "Variants"},
				fields=["parent", "image", "alt_text", "is_primary", "display_order"],
			)
			for row in all_images:
				variant_images_map.setdefault(row.parent, []).append({
					"image": row.image,
					"alt_text": row.alt_text,
					"is_primary": row.is_primary,
					"display_order": row.display_order,
				})

		for v in variant_docs:
			variants.append({
				"name": v.name,
				"title": v.title,
				"slug": v.slug,
				"sku": v.sku,
				"price": v.price,
				"quantity": v.quantity,
				"in_stock": v.is_stock,
				"wishlist_count": v.wishlist_count,
				"values": variant_values_map.get(v.name, []),
				"images": variant_images_map.get(v.name, []),
			})

	# Get available variant types for this product
	variant_types = []
	if variants:
		type_set = set()
		for v in variants:
			for val in v.get("values", []):
				type_set.add(val["type"])

		for vt in type_set:
			# Get all unique values for this type across variants
			unique_values = set()
			for v in variants:
				for val in v.get("values", []):
					if val["type"] == vt:
						unique_values.add(val["value"])
			variant_types.append({
				"type": vt,
				"values": sorted(unique_values),
			})

	# Auto-include top 4 recommendations
	recs = get_recommendations(item.name, limit=4)

	# Compute total stock quantity across all variants
	total_stock_qty = sum(v.get("quantity", 0) for v in variants) if variants else 0

	return {
		"name": item.name,
		"item_name": item.item_name,
		"slug": getattr(item, "slug", None),
		"type": item.type,
		"base_price": item.base_price,
		"sku": item.sku,
		"description": item.description,
		"average_rating": item.average_rating,
		"review_count": item.review_count,
		"in_stock": item.in_stock,
		"has_variants": item.has_variants,
		"is_featured": getattr(item, "is_featured", 0),
		"stock_qty": total_stock_qty,
		"images": images,
		"categories": categories,
		"variants": variants,
		"variant_types": variant_types,
		"recommendations": recs.get("recommendations", []),
	}


@frappe.whitelist(allow_guest=True)
def get_categories(parent=None, include_inactive=False):
	"""
	Get category tree structure.

	Args:
		parent: Get children of a specific parent category. None = top-level.
		include_inactive: Include inactive categories (default False).
	"""
	filters = {}
	if not include_inactive:
		filters["is_active"] = 1

	if parent:
		filters["parent_category"] = parent
	else:
		# Top-level categories (not children)
		filters["is_child"] = 0

	categories = frappe.get_all(
		"Category",
		filters=filters,
		fields=[
			"name", "category_name", "slug", "parent_category",
			"is_child", "is_active", "display_order", "image", "description",
		],
		order_by="display_order asc, category_name asc",
	)

	# For each category, count items and get children
	for cat in categories:
		cat["item_count"] = frappe.db.count("Item Category", {"category": cat.name})
		cat["has_children"] = bool(frappe.db.exists("Category", {"parent_category": cat.name}))

	return {"categories": categories}


@frappe.whitelist(allow_guest=True)
def get_category_tree():
	"""Get the full category tree with nested children. Cached for 5 minutes."""
	cache_key = "velora_verse:category_tree"
	cached = frappe.cache().get_value(cache_key)
	if cached:
		return cached

	filters = {"is_active": 1}

	all_categories = frappe.get_all(
		"Category",
		filters=filters,
		fields=[
			"name", "category_name", "slug", "parent_category",
			"is_child", "is_active", "display_order", "image", "description",
		],
		order_by="display_order asc, category_name asc",
	)

	# Attach item counts
	for cat in all_categories:
		cat["item_count"] = frappe.db.count("Item Category", {"category": cat.name})

	# Build tree
	cat_map = {c.name: {**c, "children": []} for c in all_categories}
	tree = []

	for cat in all_categories:
		if cat.parent_category and cat.parent_category in cat_map:
			cat_map[cat.parent_category]["children"].append(cat_map[cat.name])
		else:
			tree.append(cat_map[cat.name])

	result = {"categories": tree}
	frappe.cache().set_value(cache_key, result, expires_in_sec=300)
	return result


@frappe.whitelist(allow_guest=True)
def get_featured_products(limit=10):
	"""Get featured products for homepage. Cached for 5 minutes."""
	limit = min(50, max(1, int(limit)))

	cache_key = f"velora_verse:featured_products:{limit}"
	cached = frappe.cache().get_value(cache_key)
	if cached:
		return cached

	products = frappe.get_all(
		"Items",
		filters={"status": "Active", "is_featured": 1},
		fields=[
			"name", "item_name", "slug", "type", "base_price",
			"average_rating", "review_count", "in_stock",
		],
		order_by="modified desc",
		limit_page_length=limit,
	)

	if products:
		product_names = [p.name for p in products]
		_attach_primary_images(products, product_names)

	result = {"products": products}
	frappe.cache().set_value(cache_key, result, expires_in_sec=300)
	return result


@frappe.whitelist(allow_guest=True)
def search_products(query, limit=20):
	"""
	Full-text search across item name, description, and SKU.

	Args:
		query: Search string
		limit: Max results (default 20, max 50)
	"""
	if not query or len(query.strip()) < 2:
		return {"products": [], "total_count": 0}

	query = query.strip()
	limit = min(50, max(1, int(limit)))
	search_term = f"%{query}%"

	# Track search for recent/popular (best-effort)
	try:
		from velora_verse.api.search import _save_recent_search

		_save_recent_search(query)
	except Exception:
		pass

	products = frappe.db.sql("""
		SELECT
			name, item_name, slug, type, base_price,
			average_rating, review_count, in_stock, sku
		FROM `tabItems`
		WHERE status = 'Active'
		AND (
			item_name LIKE %(search)s
			OR description LIKE %(search)s
			OR sku LIKE %(search)s
		)
		ORDER BY
			CASE
				WHEN item_name LIKE %(exact)s THEN 1
				WHEN item_name LIKE %(prefix)s THEN 2
				ELSE 3
			END,
			average_rating DESC
		LIMIT %(limit)s
	""", {
		"search": search_term,
		"exact": query,
		"prefix": f"{query}%",
		"limit": limit,
	}, as_dict=True)

	if products:
		product_names = [p.name for p in products]
		_attach_primary_images(products, product_names)

	return {"products": products, "total_count": len(products)}


@frappe.whitelist(allow_guest=True)
def get_product_filters():
	"""Get available filter options for the product listing page. Cached for 15 minutes."""
	cache_key = "velora_verse:product_filters"
	cached = frappe.cache().get_value(cache_key)
	if cached:
		return cached

	# Price range
	price_range = frappe.db.sql("""
		SELECT MIN(base_price) as min_price, MAX(base_price) as max_price
		FROM `tabItems` WHERE status = 'Active'
	""", as_dict=True)[0]

	# Item types
	item_types = frappe.get_all(
		"Item Type",
		fields=["name", "description"],
		order_by="name asc",
	)

	# Top-level categories with counts
	categories = frappe.db.sql("""
		SELECT c.name, c.category_name, c.slug,
			(SELECT COUNT(*) FROM `tabItem Category` ic WHERE ic.category = c.name) as item_count
		FROM `tabCategory` c
		WHERE c.is_active = 1
		ORDER BY c.display_order ASC, c.category_name ASC
	""", as_dict=True)

	result = {
		"price_range": {
			"min": price_range.get("min_price") or 0,
			"max": price_range.get("max_price") or 0,
		},
		"item_types": item_types,
		"categories": categories,
	}
	frappe.cache().set_value(cache_key, result, expires_in_sec=900)
	return result


@frappe.whitelist(allow_guest=True)
def get_user_profile():
	"""Get the current user's profile details."""
	user = frappe.session.user
	if user == "Guest":
		return {"logged_in": False}

	user_doc = frappe.get_doc("User", user)

	# Get default address
	default_address = frappe.db.get_value(
		"Address",
		{"user": user, "is_default": 1},
		["name", "full_name", "city", "state"],
		as_dict=True,
	)

	# Counts
	cart_count = frappe.db.sql("""
		SELECT COALESCE(SUM(ci.quantity), 0)
		FROM `tabCart Items` ci
		INNER JOIN `tabCart` c ON c.name = ci.parent
		WHERE c.user = %s
	""", user)[0][0]

	wishlist_count = frappe.db.sql("""
		SELECT COUNT(*)
		FROM `tabWishlist Items` wi
		INNER JOIN `tabWishlist` w ON w.name = wi.parent
		WHERE w.user = %s
	""", user)[0][0]

	order_count = frappe.db.count("Order", {"user": user, "docstatus": 1})

	total_spent = frappe.db.sql("""
		SELECT COALESCE(SUM(total), 0) FROM `tabOrder`
		WHERE user = %s AND docstatus = 1 AND payment_status = 'Paid'
	""", user)[0][0]

	# Get user roles
	roles = [r.role for r in user_doc.roles] if user_doc.roles else []

	return {
		"logged_in": True,
		"user": user,
		"full_name": user_doc.full_name,
		"first_name": user_doc.first_name,
		"last_name": user_doc.last_name,
		"email": user_doc.email,
		"phone": user_doc.phone,
		"roles": roles,
		"member_since": str(user_doc.creation.date()) if user_doc.creation else None,
		"default_address": default_address,
		"cart_count": int(cart_count),
		"wishlist_count": int(wishlist_count),
		"order_count": order_count,
		"total_spent": float(total_spent),
	}


@frappe.whitelist(allow_guest=True)
def get_recommendations(item, limit=8):
	"""
	Get product recommendations based on shared categories and similar price.

	Args:
		item: Items document name or slug
		limit: Max recommendations (default 8, max 20)
	"""
	limit = min(20, max(1, int(limit)))

	# Resolve item by slug or name
	item_name = None
	if frappe.db.exists("Items", item):
		item_name = item
	else:
		item_name = frappe.db.get_value("Items", {"slug": item}, "name")

	if not item_name:
		return {"recommendations": []}

	# Get item's categories and price
	item_data = frappe.db.get_value("Items", item_name, ["base_price", "status"], as_dict=True)
	if not item_data or item_data.status != "Active":
		return {"recommendations": []}

	base_price = item_data.base_price or 0

	# Get this item's categories
	categories = frappe.get_all(
		"Item Category",
		filters={"parent": item_name},
		pluck="category",
	)

	if not categories:
		# Fallback: just find similarly priced items
		price_low = base_price * 0.7
		price_high = base_price * 1.3

		products = frappe.db.sql("""
			SELECT name, item_name, slug, base_price, average_rating, review_count, in_stock
			FROM `tabItems`
			WHERE status = 'Active' AND name != %(item)s
			AND base_price BETWEEN %(low)s AND %(high)s
			ORDER BY average_rating DESC
			LIMIT %(limit)s
		""", {"item": item_name, "low": price_low, "high": price_high, "limit": limit}, as_dict=True)
	else:
		# Find items in same categories with similar price (±30%)
		price_low = base_price * 0.7
		price_high = base_price * 1.3

		products = frappe.db.sql("""
			SELECT DISTINCT i.name, i.item_name, i.slug, i.base_price,
				i.average_rating, i.review_count, i.in_stock
			FROM `tabItems` i
			INNER JOIN `tabItem Category` ic ON ic.parent = i.name
			WHERE i.status = 'Active'
			AND i.name != %(item)s
			AND ic.category IN %(categories)s
			AND i.base_price BETWEEN %(low)s AND %(high)s
			ORDER BY i.average_rating DESC
			LIMIT %(limit)s
		""", {
			"item": item_name,
			"categories": categories,
			"low": price_low,
			"high": price_high,
			"limit": limit,
		}, as_dict=True)

		# If too few results, broaden the price range
		if len(products) < limit:
			remaining = limit - len(products)
			existing_names = [p.name for p in products] + [item_name]
			more = frappe.db.sql("""
				SELECT DISTINCT i.name, i.item_name, i.slug, i.base_price,
					i.average_rating, i.review_count, i.in_stock
				FROM `tabItems` i
				INNER JOIN `tabItem Category` ic ON ic.parent = i.name
				WHERE i.status = 'Active'
				AND i.name NOT IN %(exclude)s
				AND ic.category IN %(categories)s
				ORDER BY i.average_rating DESC
				LIMIT %(limit)s
			""", {
				"exclude": existing_names,
				"categories": categories,
				"limit": remaining,
			}, as_dict=True)
			products.extend(more)

	# Attach primary images
	if products:
		product_names = [p.name for p in products]
		_attach_primary_images(products, product_names)

	return {"recommendations": products}


@frappe.whitelist()
def track_product_view(item):
	"""
	Track that the current user viewed a product. Upserts the view record.

	Args:
		item: Items document name
	"""
	user = frappe.session.user
	if user == "Guest":
		return  # Don't track guest views

	if not frappe.db.exists("Items", item):
		frappe.throw("Product not found.")

	existing = frappe.db.get_value("Recent View", {"user": user, "item": item}, "name")

	if existing:
		frappe.db.set_value("Recent View", existing, "viewed_on", now_datetime())
	else:
		doc = frappe.new_doc("Recent View")
		doc.user = user
		doc.item = item
		doc.viewed_on = now_datetime()
		doc.insert(ignore_permissions=True)

	return {"message": "View tracked"}


@frappe.whitelist()
def get_recently_viewed(limit=10):
	"""
	Get the current user's recently viewed products with details and images.

	Args:
		limit: Max items to return (default 10, max 50)
	"""
	user = frappe.session.user
	if user == "Guest":
		return {"products": []}

	limit = min(50, max(1, int(limit)))

	views = frappe.db.sql("""
		SELECT rv.item, rv.viewed_on
		FROM `tabRecent View` rv
		INNER JOIN `tabItems` i ON i.name = rv.item
		WHERE rv.user = %(user)s AND i.status = 'Active'
		ORDER BY rv.viewed_on DESC
		LIMIT %(limit)s
	""", {"user": user, "limit": limit}, as_dict=True)

	if not views:
		return {"products": []}

	item_names = [v.item for v in views]

	products = frappe.get_all(
		"Items",
		filters={"name": ["in", item_names], "status": "Active"},
		fields=[
			"name", "item_name", "slug", "type", "base_price",
			"average_rating", "review_count", "in_stock",
		],
	)

	if products:
		product_names = [p.name for p in products]
		_attach_primary_images(products, product_names)

	# Maintain viewed_on order
	view_order = {v.item: v.viewed_on for v in views}
	products.sort(key=lambda p: view_order.get(p.name, ""), reverse=True)

	for p in products:
		p["viewed_on"] = str(view_order.get(p.name, ""))

	return {"products": products}


@frappe.whitelist(allow_guest=True)
def get_category_detail(slug=None, name=None):
	"""
	Get full details for a single category page.

	Args:
		slug: Category slug
		name: Category name/ID
	"""
	if not slug and not name:
		frappe.throw("Either slug or name is required.")

	if slug:
		cat_name = frappe.db.get_value("Category", {"slug": slug}, "name")
		if not cat_name:
			cat_name = frappe.db.get_value("Category", {"name": slug}, "name")
	else:
		cat_name = name

	if not cat_name or not frappe.db.exists("Category", cat_name):
		frappe.throw("Category not found.", frappe.DoesNotExistError)

	cat = frappe.get_doc("Category", cat_name)

	# Get children
	children = frappe.get_all(
		"Category",
		filters={"parent_category": cat.name, "is_active": 1},
		fields=["name", "category_name", "slug", "image", "description", "display_order"],
		order_by="display_order asc, category_name asc",
	)

	# Get breadcrumb (walk up the tree)
	breadcrumbs = []
	current = cat.parent_category
	while current:
		parent = frappe.db.get_value(
			"Category", current, ["name", "category_name", "slug"], as_dict=True
		)
		if not parent:
			break
		breadcrumbs.insert(0, parent)
		current = frappe.db.get_value("Category", parent.name, "parent_category")

	# Count items (include subcategories)
	all_cats = [cat.name] + [c.name for c in children]
	item_count = frappe.db.sql("""
		SELECT COUNT(DISTINCT parent) FROM `tabItem Category`
		WHERE category IN %s
	""", [all_cats])[0][0]

	return {
		"name": cat.name,
		"category_name": cat.category_name,
		"slug": cat.slug,
		"description": cat.description,
		"image": cat.image,
		"parent_category": cat.parent_category,
		"is_active": cat.is_active,
		"meta_title": getattr(cat, "meta_title", None),
		"meta_description": getattr(cat, "meta_description", None),
		"item_count": item_count,
		"children": children,
		"breadcrumbs": breadcrumbs,
	}


# --- Helper functions ---

def _attach_primary_images(products, product_names):
	"""Bulk attach primary images to product list."""
	images = frappe.get_all(
		"Images",
		filters={"parent": ["in", product_names], "parenttype": "Items", "is_primary": 1},
		fields=["parent", "image", "alt_text"],
	)
	image_map = {img.parent: img for img in images}

	# Fallback: if no primary, get any image
	missing = [p.name for p in products if p.name not in image_map]
	if missing:
		fallback_images = frappe.get_all(
			"Images",
			filters={"parent": ["in", missing], "parenttype": "Items"},
			fields=["parent", "image", "alt_text"],
			order_by="display_order asc",
			group_by="parent",
		)
		for img in fallback_images:
			if img.parent not in image_map:
				image_map[img.parent] = img

	for product in products:
		img = image_map.get(product.name)
		product["image"] = img.image if img else None
		product["image_alt"] = img.alt_text if img else None


def _attach_categories(products, product_names):
	"""Bulk attach categories to product list."""
	categories = frappe.get_all(
		"Item Category",
		filters={"parent": ["in", product_names]},
		fields=["parent", "category", "category_name", "is_primary"],
	)
	cat_map = {}
	for cat in categories:
		cat_map.setdefault(cat.parent, []).append({
			"category": cat.category,
			"category_name": cat.category_name,
			"is_primary": cat.is_primary,
		})

	for product in products:
		product["categories"] = cat_map.get(product.name, [])
