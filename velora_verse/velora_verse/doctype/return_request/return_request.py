# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, date_diff, getdate


class ReturnRequest(Document):
	def validate(self):
		if not self.user:
			self.user = frappe.session.user

		self.validate_order()
		self.validate_return_items()
		self.calculate_refund_amount()

	def on_submit(self):
		"""On submit (admin approval), restore stock and initiate refund."""
		self.status = "Approved"
		self.approved_by = frappe.session.user
		self.approved_on = now_datetime()
		self._restore_stock()
		self._initiate_refund()

		try:
			from velora_verse.services.notifications import send_return_email
			send_return_email(self.name, "return_approved", "Return Approved")
		except Exception:
			frappe.log_error(title=f"Return Approval Email Failed: {self.name}", message=frappe.get_traceback())

	def on_cancel(self):
		self.status = "Closed"

	def validate_order(self):
		"""Ensure the order is delivered and within the return window."""
		if not frappe.db.exists("Order", self.order):
			frappe.throw("Order not found.")

		order = frappe.get_doc("Order", self.order)

		if order.status not in ("Delivered", "Returned"):
			frappe.throw("Returns can only be requested for delivered orders.")

		# Check return window only for new requests (not admin approve/reject)
		if self.is_new() and order.delivered_on:
			days_since = date_diff(getdate(), getdate(order.delivered_on))
			if days_since > 7:
				frappe.throw("Return window has expired. Returns must be requested within 7 days of delivery.")

	def validate_return_items(self):
		"""Validate return items against the original order."""
		if not self.return_items:
			frappe.throw("At least one item must be selected for return.")

		order = frappe.get_doc("Order", self.order)

		# Build a map of order items
		order_item_map = {}
		for row in order.order_items:
			order_item_map[row.variant] = {
				"quantity": row.quantity,
				"rate": row.rate,
				"variant_title": row.variant_title,
			}

		for row in self.return_items:
			if row.variant not in order_item_map:
				frappe.throw(f"Variant '{row.variant}' is not in the original order.")

			oi = order_item_map[row.variant]

			if row.quantity < 1:
				frappe.throw(f"Return quantity for '{row.variant}' must be at least 1.")

			if row.quantity > oi["quantity"]:
				frappe.throw(
					f"Return quantity ({row.quantity}) for '{row.variant}' "
					f"exceeds the ordered quantity ({oi['quantity']})."
				)

			# Set rate and amount from order
			row.rate = oi["rate"]
			row.amount = row.rate * row.quantity
			if not row.variant_title:
				row.variant_title = oi["variant_title"]

	def calculate_refund_amount(self):
		"""Calculate the total refund amount from return items."""
		self.refund_amount = sum(row.amount or 0 for row in self.return_items)

	def _restore_stock(self):
		"""Restore stock for returned items."""
		from velora_verse.velora_verse.doctype.inventory_log.inventory_log import create_inventory_log

		for row in self.return_items:
			current_qty = frappe.db.get_value("Variants", row.variant, "quantity") or 0
			new_qty = current_qty + row.quantity

			frappe.db.set_value("Variants", row.variant, "quantity", new_qty)
			if new_qty > 0:
				frappe.db.set_value("Variants", row.variant, "is_stock", 1)

			create_inventory_log(
				variant=row.variant,
				change_type="Return",
				quantity_change=row.quantity,
				previous_qty=current_qty,
				new_qty=new_qty,
				reference_type="Return Request",
				reference_name=self.name,
			)

		# Update parent item stock status
		items_to_update = set()
		for row in self.return_items:
			item_name = frappe.db.get_value("Variants", row.variant, "variant_name")
			if item_name:
				items_to_update.add(item_name)

		for item_name in items_to_update:
			has_stock = frappe.db.count("Variants", {"variant_name": item_name, "is_stock": 1}) > 0
			frappe.db.set_value("Items", item_name, "in_stock", 1 if has_stock else 0)

	def _initiate_refund(self):
		"""Initiate refund via payment gateway or mark for manual processing."""
		order = frappe.get_doc("Order", self.order)

		if self.refund_method == "Original Payment" and order.payment_id:
			# Try Razorpay refund
			try:
				from velora_verse.utils import get_store_settings
				settings = get_store_settings()

				if settings.razorpay_enabled and order.payment_method == "Razorpay":
					from velora_verse.services.payments import initiate_refund
					refund = initiate_refund(order.payment_id, self.refund_amount)
					self.refund_transaction_id = refund.get("id")
					self.status = "Refund Initiated"
				else:
					self.status = "Refund Initiated"
			except Exception as e:
				frappe.log_error(f"Refund failed for {self.name}: {e}", "Refund Error")
				self.status = "Approved"  # Keep as approved, admin can process manually
		else:
			self.status = "Refund Initiated"

		# Update order status
		# Check if all items are returned
		order_total_qty = sum(row.quantity for row in order.order_items)
		returned_qty = sum(row.quantity for row in self.return_items)

		if returned_qty >= order_total_qty:
			frappe.db.set_value("Order", self.order, {
				"status": "Returned",
				"payment_status": "Refunded",
			})
		else:
			frappe.db.set_value("Order", self.order, "payment_status", "Partially Refunded")


@frappe.whitelist()
def create_return_request(order, return_type, reason, items, reason_detail=None):
	"""
	Create a return request (customer-facing API).

	Args:
		order: Order name
		return_type: 'Return' or 'Exchange'
		reason: Reason for return
		items: JSON list of {variant, quantity}
		reason_detail: Optional detailed reason
	"""
	import json

	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to request a return.")

	if not frappe.db.exists("Order", order):
		frappe.throw("Order not found.")

	order_doc = frappe.get_doc("Order", order)
	if order_doc.user != user and user != "Administrator":
		frappe.throw("You can only request returns for your own orders.", frappe.PermissionError)

	# Check for existing pending return
	existing = frappe.db.exists("Return Request", {"order": order, "status": ["in", ["Pending", "Approved"]], "docstatus": ["!=", 2]})
	if existing:
		frappe.throw("A return request is already pending for this order.")

	if isinstance(items, str):
		items = json.loads(items)

	return_items = []
	for item in items:
		return_items.append({
			"variant": item["variant"],
			"quantity": item.get("quantity", 1),
		})

	doc = frappe.get_doc({
		"doctype": "Return Request",
		"order": order,
		"user": user,
		"return_type": return_type,
		"reason": reason,
		"reason_detail": reason_detail,
		"return_items": return_items,
	})
	doc.insert(ignore_permissions=True)

	return {
		"message": "Return request submitted",
		"return_request": doc.name,
		"status": doc.status,
		"refund_amount": doc.refund_amount,
	}


@frappe.whitelist()
def get_return_requests(page=1, limit=10):
	"""Get the current user's return requests."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to view return requests.")

	page = int(page)
	limit = int(limit)
	offset = (page - 1) * limit

	returns = frappe.get_all(
		"Return Request",
		filters={"user": user, "docstatus": ["!=", 2]},
		fields=[
			"name", "order", "request_date", "status",
			"return_type", "reason", "refund_amount",
		],
		order_by="request_date desc",
		limit_page_length=limit,
		limit_start=offset,
	)

	total_count = frappe.db.count("Return Request", {"user": user, "docstatus": ["!=", 2]})

	return {
		"return_requests": returns,
		"total_count": total_count,
		"page": page,
		"limit": limit,
		"total_pages": (total_count + limit - 1) // limit,
	}


@frappe.whitelist()
def approve_return(return_request, admin_notes=None):
	"""Approve a return request (Store Admin / Admin only)."""
	if "Store Admin" not in frappe.get_roles() and frappe.session.user != "Administrator":
		frappe.throw("Only Store Admin can approve returns.", frappe.PermissionError)

	if not frappe.db.exists("Return Request", return_request):
		frappe.throw("Return request not found.")

	doc = frappe.get_doc("Return Request", return_request)

	if doc.status != "Pending":
		frappe.throw(f"Cannot approve a return with status '{doc.status}'.")

	if admin_notes:
		doc.admin_notes = admin_notes

	doc.submit()

	return {"message": "Return approved", "return_request": doc.name, "status": doc.status}


@frappe.whitelist()
def reject_return(return_request, admin_notes=None):
	"""Reject a return request (Store Admin / Admin only)."""
	if "Store Admin" not in frappe.get_roles() and frappe.session.user != "Administrator":
		frappe.throw("Only Store Admin can reject returns.", frappe.PermissionError)

	if not frappe.db.exists("Return Request", return_request):
		frappe.throw("Return request not found.")

	doc = frappe.get_doc("Return Request", return_request)

	if doc.status != "Pending":
		frappe.throw(f"Cannot reject a return with status '{doc.status}'.")

	doc.status = "Rejected"
	if admin_notes:
		doc.admin_notes = admin_notes
	doc.save(ignore_permissions=True)

	try:
		from velora_verse.services.notifications import send_return_email
		send_return_email(doc.name, "return_rejected", "Return Request Update")
	except Exception:
		frappe.log_error(title=f"Return Rejection Email Failed: {doc.name}", message=frappe.get_traceback())

	return {"message": "Return rejected", "return_request": doc.name, "status": doc.status}
