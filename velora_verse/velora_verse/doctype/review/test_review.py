# Copyright (c) 2026, velora-verse and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase


class TestReview(FrappeTestCase):
	def setUp(self):
		# Create a test item
		if not frappe.db.exists("Items", {"item_name": "Test Review Item"}):
			item = frappe.new_doc("Items")
			item.item_name = "Test Review Item"
			item.base_price = 100
			item.insert(ignore_permissions=True)
		self.item = frappe.db.get_value("Items", {"item_name": "Test Review Item"})

		# Clean up reviews
		for r in frappe.get_all("Review", filters={"item": self.item}):
			frappe.delete_doc("Review", r.name, force=True)
		frappe.db.commit()

	def test_create_review(self):
		review = frappe.new_doc("Review")
		review.item = self.item
		review.user = "Administrator"
		review.rating = 0.8  # 4 stars (Frappe Rating is 0-1 scale)
		review.review_title = "Great product"
		review.review_text = "Loved it"
		review.insert(ignore_permissions=True)

		self.assertTrue(review.name)
		self.assertEqual(review.rating, 0.8)

	def test_duplicate_review_blocked(self):
		review1 = frappe.new_doc("Review")
		review1.item = self.item
		review1.user = "Administrator"
		review1.rating = 0.6
		review1.insert(ignore_permissions=True)

		review2 = frappe.new_doc("Review")
		review2.item = self.item
		review2.user = "Administrator"
		review2.rating = 0.8

		self.assertRaises(frappe.ValidationError, review2.insert, ignore_permissions=True)

	def test_average_rating_updated(self):
		review = frappe.new_doc("Review")
		review.item = self.item
		review.user = "Administrator"
		review.rating = 0.8
		review.insert(ignore_permissions=True)

		avg = frappe.db.get_value("Items", self.item, "average_rating")
		self.assertEqual(float(avg), 0.8)

	def test_invalid_rating_rejected(self):
		review = frappe.new_doc("Review")
		review.item = self.item
		review.user = "Administrator"
		review.rating = 0

		self.assertRaises(frappe.ValidationError, review.insert, ignore_permissions=True)
