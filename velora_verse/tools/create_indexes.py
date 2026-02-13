# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""
Idempotent database index creation for production performance.

Run via:
    bench --site veloraverse.com execute velora_verse.tools.create_indexes.run
"""

import frappe


INDEXES = [
	# tabItems
	("tabItems", "idx_items_slug", ["slug"]),
	("tabItems", "idx_items_published", ["published"]),
	("tabItems", "idx_items_status_price", ["status", "base_price"]),
	("tabItems", "idx_items_featured_status", ["is_featured", "status"]),
	("tabItems", "idx_items_name_sku", ["item_name(50)", "sku"]),

	# tabCategory
	("tabCategory", "idx_category_is_active", ["is_active"]),

	# tabVariants
	("tabVariants", "idx_variants_variant_name", ["variant_name"]),
	("tabVariants", "idx_variants_name_stock", ["variant_name", "is_stock"]),
	("tabVariants", "idx_variants_quantity", ["quantity"]),

	# tabItem Category (child table)
	("tabItem Category", "idx_item_category_category", ["category"]),

	# tabOrder
	("tabOrder", "idx_order_user", ["user"]),
	("tabOrder", "idx_order_status", ["status"]),
	("tabOrder", "idx_order_user_docstatus_status", ["user", "docstatus", "status"]),
	("tabOrder", "idx_order_order_date", ["order_date"]),

	# tabCart
	("tabCart", "idx_cart_user", ["user"]),

	# tabLoyalty Points Ledger
	("tabLoyalty Points Ledger", "idx_loyalty_user", ["user"]),

	# tabAnalytics Event
	("tabAnalytics Event", "idx_analytics_timestamp", ["event_timestamp"]),

	# tabReview
	("tabReview", "idx_review_item", ["item"]),
]


def run():
	"""Create all indexes idempotently."""
	created = 0
	skipped = 0

	for table, index_name, columns in INDEXES:
		if _index_exists(table, index_name):
			skipped += 1
			continue

		col_str = ", ".join(f"`{c}`" if "(" not in c else c for c in columns)
		frappe.db.sql_ddl(f"CREATE INDEX `{index_name}` ON `{table}` ({col_str})")
		created += 1
		print(f"  Created index {index_name} on {table} ({col_str})")

	print(f"\nDone: {created} indexes created, {skipped} already existed.")


def _index_exists(table, index_name):
	"""Check if an index already exists on a table."""
	result = frappe.db.sql("""
		SELECT COUNT(*) FROM information_schema.statistics
		WHERE table_schema = DATABASE()
		AND table_name = %s
		AND index_name = %s
	""", (table, index_name))
	return result[0][0] > 0
