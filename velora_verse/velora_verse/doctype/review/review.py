# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Review(Document):
	def before_save(self):
		if not self.user:
			self.user = frappe.session.user

		self.validate_rating()
		self.validate_one_review_per_user()

	def validate_rating(self):
		if not self.rating or self.rating < 0.2 or self.rating > 1:
			frappe.throw("Rating must be between 1 and 5 stars.")

	def validate_one_review_per_user(self):
		existing = frappe.db.exists(
			"Review",
			{"item": self.item, "user": self.user, "name": ["!=", self.name]},
		)
		if existing:
			frappe.throw(f"You have already reviewed this item.")

	def on_update(self):
		_update_average_rating(self.item)

	def on_trash(self):
		_update_average_rating(self.item)


def _update_average_rating(item_name):
	"""Recalculate average rating for an item."""
	result = frappe.db.sql("""
		SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
		FROM `tabReview`
		WHERE item = %s
	""", item_name, as_dict=True)[0]

	avg = result.avg_rating or 0
	count = result.review_count or 0

	frappe.db.set_value("Items", item_name, {
		"average_rating": avg,
		"review_count": count,
	}, update_modified=False)


@frappe.whitelist()
def add_review(item, rating, review_title=None, review_text=None, variant=None):
	"""Add a review for an item."""
	if not item or not frappe.db.exists("Items", item):
		frappe.throw("Invalid item.")

	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to submit a review.")

	review = frappe.new_doc("Review")
	review.item = item
	review.user = user
	review.rating = float(rating)
	review.review_title = review_title
	review.review_text = review_text
	if variant:
		review.variant = variant
	review.save(ignore_permissions=True)

	return {"message": "Review submitted", "review": review.name}


@frappe.whitelist(allow_guest=True)
def get_reviews(item, limit=10, offset=0):
	"""Get reviews for an item."""
	reviews = frappe.get_all(
		"Review",
		filters={"item": item},
		fields=["name", "user", "rating", "review_title", "review_text", "is_verified", "creation"],
		order_by="creation desc",
		limit_page_length=int(limit),
		limit_start=int(offset),
	)

	avg = frappe.db.get_value("Items", item, "average_rating") or 0

	return {"reviews": reviews, "average_rating": avg}
