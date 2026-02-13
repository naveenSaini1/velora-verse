# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Search autocomplete, recent searches, and popular searches APIs.

Recent searches are stored per-user in Redis lists (fast, no DB overhead).
Popular searches use a Redis hash counter incremented on every search.
"""

import frappe
from frappe.rate_limiter import rate_limit

# Redis key helpers
RECENT_SEARCHES_KEY = "velora_verse:recent_searches:{user}"
POPULAR_SEARCHES_KEY = "velora_verse:popular_searches"
MAX_RECENT = 10


def _save_recent_search(query):
	"""Save a search query to the current user's recent searches in Redis.

	Logged-in users only. Keeps at most MAX_RECENT unique entries (LIFO).
	Also increments the global popular searches counter.
	"""
	user = frappe.session.user
	if not query or user == "Guest":
		return

	query = query.strip().lower()
	if len(query) < 2:
		return

	cache = frappe.cache()
	key = RECENT_SEARCHES_KEY.format(user=user)

	# Remove the query if it already exists (so we can push it to the front)
	cache.lrem(key, 0, query)
	# Push to front of list
	cache.lpush(key, query)
	# Trim to keep only the last MAX_RECENT
	cache.ltrim(key, 0, MAX_RECENT - 1)
	# Expire after 30 days of inactivity
	cache.expire(key, 30 * 24 * 60 * 60)

	# Increment global popular searches counter
	cache.hincrby(POPULAR_SEARCHES_KEY, query, 1)


@frappe.whitelist(allow_guest=True)
def autocomplete(query, limit=8):
	"""
	Search autocomplete across Items, Categories, and Item Types.
	Returns merged results sorted by relevance.

	Also records the search query for logged-in users (recent + popular tracking).

	Args:
		query: Search prefix (min 2 chars)
		limit: Max total results (default 8)
	"""
	if not query or len(query.strip()) < 2:
		return {"results": []}

	query = query.strip()
	limit = min(20, max(1, int(limit)))
	prefix = f"{query}%"
	search_term = f"%{query}%"

	# Track search for recent/popular (non-blocking, best-effort)
	try:
		_save_recent_search(query)
	except Exception:
		pass

	results = []

	# Items (up to limit/2 or 4)
	item_limit = max(2, limit // 2)
	items = frappe.db.sql("""
		SELECT name, item_name, slug, base_price, 'Items' as result_type
		FROM `tabItems`
		WHERE status = 'Active'
		AND (item_name LIKE %(prefix)s OR item_name LIKE %(search)s)
		ORDER BY
			CASE WHEN item_name LIKE %(prefix)s THEN 1 ELSE 2 END,
			average_rating DESC
		LIMIT %(limit)s
	""", {"prefix": prefix, "search": search_term, "limit": item_limit}, as_dict=True)
	results.extend(items)

	# Categories (up to 2)
	categories = frappe.db.sql("""
		SELECT name, category_name, slug, 'Category' as result_type
		FROM `tabCategory`
		WHERE is_active = 1
		AND (category_name LIKE %(prefix)s OR category_name LIKE %(search)s)
		ORDER BY
			CASE WHEN category_name LIKE %(prefix)s THEN 1 ELSE 2 END,
			display_order ASC
		LIMIT 2
	""", {"prefix": prefix, "search": search_term}, as_dict=True)
	results.extend(categories)

	# Item Types (up to 2)
	item_types = frappe.db.sql("""
		SELECT name, name as type_name, 'Item Type' as result_type
		FROM `tabItem Type`
		WHERE name LIKE %(prefix)s OR name LIKE %(search)s
		ORDER BY
			CASE WHEN name LIKE %(prefix)s THEN 1 ELSE 2 END
		LIMIT 2
	""", {"prefix": prefix, "search": search_term}, as_dict=True)
	results.extend(item_types)

	return {"results": results[:limit]}


@frappe.whitelist(allow_guest=True)
def trending_searches(limit=6):
	"""
	Get trending search terms based on popular searches counter.

	Args:
		limit: Max results (default 6)
	"""
	limit = min(20, max(1, int(limit)))

	cache = frappe.cache()
	raw = cache.hgetall(POPULAR_SEARCHES_KEY)

	if raw:
		# raw is {b"query": b"count", ...} — decode and sort by count descending
		decoded = {}
		for k, v in raw.items():
			term = k.decode() if isinstance(k, bytes) else k
			count = int(v.decode() if isinstance(v, bytes) else v)
			decoded[term] = count

		sorted_terms = sorted(decoded.items(), key=lambda x: x[1], reverse=True)[:limit]
		trending = [{"search_term": term, "search_count": count} for term, count in sorted_terms]
		return {"trending": trending}

	# Fallback: return popular item names
	popular = frappe.get_all(
		"Items",
		filters={"status": "Active"},
		fields=["item_name as search_term"],
		order_by="review_count desc, average_rating desc",
		limit_page_length=limit,
	)
	return {"trending": popular}


@frappe.whitelist()
@rate_limit(limit=30, seconds=60)
def get_recent_searches(limit=10):
	"""Get the current user's recent search terms from Redis."""
	user = frappe.session.user
	if user == "Guest":
		return {"searches": []}

	limit = min(20, max(1, int(limit)))

	cache = frappe.cache()
	key = RECENT_SEARCHES_KEY.format(user=user)
	raw = cache.lrange(key, 0, limit - 1)

	if not raw:
		return {"searches": []}

	searches = []
	for item in raw:
		term = item.decode() if isinstance(item, bytes) else item
		if term:
			searches.append(term)

	return {"searches": searches}


@frappe.whitelist()
@rate_limit(limit=30, seconds=60)
def remove_recent_search(query):
	"""Remove a specific search term from the current user's recent searches."""
	user = frappe.session.user
	if user == "Guest" or not query:
		return {"success": False}

	query = query.strip().lower()
	cache = frappe.cache()
	key = RECENT_SEARCHES_KEY.format(user=user)
	cache.lrem(key, 0, query)

	return {"success": True}


@frappe.whitelist(allow_guest=True)
@rate_limit(limit=30, seconds=60)
def get_popular_searches(limit=8):
	"""Get the most searched terms globally from Redis counter."""
	limit = min(20, max(1, int(limit)))

	cache = frappe.cache()
	raw = cache.hgetall(POPULAR_SEARCHES_KEY)

	if raw:
		decoded = {}
		for k, v in raw.items():
			term = k.decode() if isinstance(k, bytes) else k
			count = int(v.decode() if isinstance(v, bytes) else v)
			decoded[term] = count

		sorted_terms = sorted(decoded.items(), key=lambda x: x[1], reverse=True)[:limit]
		return {"searches": [term for term, _count in sorted_terms]}

	# Fallback: popular item names
	popular = frappe.get_all(
		"Items",
		filters={"status": "Active"},
		fields=["item_name as search_term"],
		order_by="review_count desc, average_rating desc",
		limit_page_length=limit,
	)
	return {"searches": [p.search_term for p in popular]}
