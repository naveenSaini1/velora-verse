# Copyright (c) 2026, velora-verse and Contributors
# See license.txt

"""Tests for the product browsing APIs (velora_verse.api)."""

import frappe
from frappe.tests.utils import FrappeTestCase


class TestProductBrowsingAPIs(FrappeTestCase):
	def test_get_products_returns_active_items(self):
		from velora_verse.api.products import get_products

		result = get_products()
		self.assertIn("products", result)
		self.assertIn("total_count", result)
		self.assertIn("total_pages", result)

		# All returned products should be Active
		for product in result["products"]:
			self.assertEqual(product.get("status"), "Active")

	def test_get_products_pagination(self):
		from velora_verse.api.products import get_products

		result = get_products(page=1, limit=5)
		self.assertLessEqual(len(result["products"]), 5)
		self.assertEqual(result["page"], 1)
		self.assertEqual(result["limit"], 5)

	def test_get_products_price_filter(self):
		from velora_verse.api.products import get_products

		result = get_products(min_price=100, max_price=500)
		for product in result["products"]:
			self.assertGreaterEqual(product["base_price"], 100)
			self.assertLessEqual(product["base_price"], 500)

	def test_get_products_search(self):
		from velora_verse.api.products import get_products

		# Search for an item that should exist from seed data
		items = frappe.get_all("Items", filters={"status": "Active"}, limit=1, pluck="item_name")
		if not items:
			self.skipTest("No active items in database")

		# Search by first word
		search_term = items[0].split()[0] if " " in items[0] else items[0][:4]
		result = get_products(search=search_term)
		self.assertTrue(len(result["products"]) >= 1)

	def test_get_product_detail(self):
		from velora_verse.api.products import get_product_detail

		items = frappe.get_all("Items", filters={"status": "Active"}, limit=1, pluck="name")
		if not items:
			self.skipTest("No active items in database")

		result = get_product_detail(name=items[0])
		self.assertEqual(result["name"], items[0])
		self.assertIn("images", result)
		self.assertIn("categories", result)
		self.assertIn("variants", result)

	def test_get_product_detail_not_found(self):
		from velora_verse.api.products import get_product_detail

		self.assertRaises(Exception, get_product_detail, name="NONEXISTENT-ITEM")

	def test_get_categories(self):
		from velora_verse.api.products import get_categories

		result = get_categories()
		self.assertIn("categories", result)
		if result["categories"]:
			cat = result["categories"][0]
			self.assertIn("name", cat)
			self.assertIn("category_name", cat)
			self.assertIn("item_count", cat)

	def test_get_category_tree(self):
		from velora_verse.api.products import get_category_tree

		result = get_category_tree()
		self.assertIn("categories", result)

	def test_search_products(self):
		from velora_verse.api.products import search_products

		# Empty query returns empty
		result = search_products(query="")
		self.assertEqual(len(result["products"]), 0)

		# Short query returns empty
		result = search_products(query="a")
		self.assertEqual(len(result["products"]), 0)

	def test_get_product_filters(self):
		from velora_verse.api.products import get_product_filters

		result = get_product_filters()
		self.assertIn("price_range", result)
		self.assertIn("item_types", result)
		self.assertIn("categories", result)
		self.assertIn("min", result["price_range"])
		self.assertIn("max", result["price_range"])

	def test_get_featured_products(self):
		from velora_verse.api.products import get_featured_products

		result = get_featured_products(limit=5)
		self.assertIn("products", result)
		# All returned should be featured
		for product in result["products"]:
			self.assertEqual(product.get("is_featured"), 1)

	def test_get_user_profile_guest(self):
		from velora_verse.api.products import get_user_profile

		# Save current user and set to Guest
		original_user = frappe.session.user
		frappe.set_user("Guest")
		try:
			result = get_user_profile()
			self.assertFalse(result["logged_in"])
		finally:
			frappe.set_user(original_user)

	def test_get_user_profile_logged_in(self):
		from velora_verse.api.products import get_user_profile

		result = get_user_profile()
		self.assertTrue(result["logged_in"])
		self.assertEqual(result["user"], frappe.session.user)
		self.assertIn("cart_count", result)
		self.assertIn("wishlist_count", result)
		self.assertIn("order_count", result)
