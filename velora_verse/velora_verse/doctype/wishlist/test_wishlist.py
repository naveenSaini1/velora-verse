# Copyright (c) 2026, velora-verse and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase


class TestWishlist(FrappeTestCase):
	def setUp(self):
		if frappe.db.exists("Wishlist", "Administrator"):
			frappe.delete_doc("Wishlist", "Administrator", force=True)
			frappe.db.commit()

	def test_add_to_wishlist(self):
		from velora_verse.velora_verse.doctype.wishlist.wishlist import add_to_wishlist

		variants = frappe.get_all("Variants", limit=1, pluck="name")
		if not variants:
			self.skipTest("No variants")

		result = add_to_wishlist(variants[0])
		self.assertEqual(result["message"], "Added to wishlist")

	def test_duplicate_blocked(self):
		from velora_verse.velora_verse.doctype.wishlist.wishlist import add_to_wishlist

		variants = frappe.get_all("Variants", limit=1, pluck="name")
		if not variants:
			self.skipTest("No variants")

		add_to_wishlist(variants[0])
		frappe.db.commit()

		self.assertRaises(frappe.ValidationError, add_to_wishlist, variants[0])

	def test_remove_from_wishlist(self):
		from velora_verse.velora_verse.doctype.wishlist.wishlist import add_to_wishlist, remove_from_wishlist

		variants = frappe.get_all("Variants", limit=1, pluck="name")
		if not variants:
			self.skipTest("No variants")

		add_to_wishlist(variants[0])
		frappe.db.commit()

		result = remove_from_wishlist(variants[0])
		self.assertEqual(result["message"], "Removed from wishlist")

	def test_wishlist_count_updated(self):
		from velora_verse.velora_verse.doctype.wishlist.wishlist import add_to_wishlist

		variants = frappe.get_all("Variants", limit=1, pluck="name")
		if not variants:
			self.skipTest("No variants")

		# Get the count before adding (seed data may have existing wishlists)
		count_before = frappe.db.get_value("Variants", variants[0], "wishlist_count") or 0

		add_to_wishlist(variants[0])
		frappe.db.commit()

		count_after = frappe.db.get_value("Variants", variants[0], "wishlist_count")
		self.assertEqual(count_after, count_before + 1)

	def test_is_in_wishlist(self):
		from velora_verse.velora_verse.doctype.wishlist.wishlist import add_to_wishlist, is_in_wishlist

		variants = frappe.get_all("Variants", limit=1, pluck="name")
		if not variants:
			self.skipTest("No variants")

		result = is_in_wishlist(variants[0])
		self.assertFalse(result["in_wishlist"])

		add_to_wishlist(variants[0])
		frappe.db.commit()

		result = is_in_wishlist(variants[0])
		self.assertTrue(result["in_wishlist"])
