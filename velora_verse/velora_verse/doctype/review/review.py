# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.rate_limiter import rate_limit


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
@rate_limit(limit=10, seconds=60)
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
	# Frappe Rating field stores 0.0-1.0 (1 star=0.2, 5 stars=1.0)
	r = float(rating)
	review.rating = r / 5 if r > 1 else r
	review.review_title = review_title
	review.review_text = review_text
	if variant:
		review.variant = variant
	review.save(ignore_permissions=True)

	# Award review loyalty bonus
	try:
		from velora_verse.api.loyalty import award_review_bonus
		award_review_bonus(user)
	except Exception:
		frappe.log_error(title=f"Review Loyalty Bonus Failed: {user}", message=frappe.get_traceback())

	return {"message": "Review submitted", "review": review.name}


@frappe.whitelist(allow_guest=True)
def get_reviews(item, limit=10, offset=0, sort_by="newest"):
	"""Get reviews for an item with sorting options."""
	order_map = {
		"newest": "creation desc",
		"oldest": "creation asc",
		"highest": "rating desc, creation desc",
		"lowest": "rating asc, creation desc",
		"helpful": "helpful_count desc, creation desc",
	}
	order_by = order_map.get(sort_by, "creation desc")

	reviews = frappe.get_all(
		"Review",
		filters={"item": item},
		fields=["name", "user", "rating", "review_title", "review_text", "is_verified", "helpful_count", "creation"],
		order_by=order_by,
		limit_page_length=int(limit),
		limit_start=int(offset),
	)

	# Resolve user display names
	for r in reviews:
		r["user_name"] = frappe.db.get_value("User", r["user"], "full_name") or r["user"]

	avg = frappe.db.get_value("Items", item, "average_rating") or 0

	return {"reviews": reviews, "average_rating": avg}


@frappe.whitelist(allow_guest=True)
def get_review_summary(item):
	"""Get rating summary with star distribution for an item."""
	if not item or not frappe.db.exists("Items", item):
		frappe.throw("Invalid item.")

	result = frappe.db.sql("""
		SELECT
			COUNT(*) as total,
			AVG(rating) as average,
			SUM(CASE WHEN rating > 0 AND rating <= 0.2 THEN 1 ELSE 0 END) as star_1,
			SUM(CASE WHEN rating > 0.2 AND rating <= 0.4 THEN 1 ELSE 0 END) as star_2,
			SUM(CASE WHEN rating > 0.4 AND rating <= 0.6 THEN 1 ELSE 0 END) as star_3,
			SUM(CASE WHEN rating > 0.6 AND rating <= 0.8 THEN 1 ELSE 0 END) as star_4,
			SUM(CASE WHEN rating > 0.8 AND rating <= 1.0 THEN 1 ELSE 0 END) as star_5
		FROM `tabReview`
		WHERE item = %s
	""", item, as_dict=True)[0]

	total = int(result.total or 0)
	return {
		"average_rating": float(result.average or 0),
		"review_count": total,
		"rating_distribution": [
			int(result.star_1 or 0),
			int(result.star_2 or 0),
			int(result.star_3 or 0),
			int(result.star_4 or 0),
			int(result.star_5 or 0),
		],
	}


@frappe.whitelist()
def mark_review_helpful(review_name):
	"""Increment the helpful count for a review."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to mark a review as helpful.")

	if not frappe.db.exists("Review", review_name):
		frappe.throw("Review not found.")

	review_user = frappe.db.get_value("Review", review_name, "user")
	if review_user == user:
		frappe.throw("You cannot mark your own review as helpful.")

	frappe.db.sql("""
		UPDATE `tabReview`
		SET helpful_count = helpful_count + 1
		WHERE name = %s
	""", review_name)
	frappe.db.commit()

	new_count = frappe.db.get_value("Review", review_name, "helpful_count")
	return {"helpful_count": int(new_count or 0)}
