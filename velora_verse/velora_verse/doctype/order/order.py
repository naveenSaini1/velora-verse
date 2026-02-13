# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class Order(Document):
	def validate(self):
		if not self.user:
			self.user = frappe.session.user

		self.validate_order_items()
		self.snapshot_address_display()
		self.calculate_totals()

	def on_submit(self):
		self.deduct_stock()
		self._earn_loyalty_points()
		self._send_notification("order_confirmation", "Order Confirmation")
		self._create_user_notification("Order Confirmed", f"Your order {self.name} has been placed.")
		self._dispatch_webhook("order.created")

	def on_cancel(self):
		self.restore_stock()
		self.status = "Cancelled"
		self._refund_loyalty_points()
		self._refund_gift_card()
		self._send_notification("order_cancelled", "Order Cancelled")
		self._create_user_notification("Order Cancelled", f"Your order {self.name} has been cancelled.")
		self._dispatch_webhook("order.cancelled")

	def on_update_after_submit(self):
		"""Detect status changes and send appropriate notifications."""
		prev_status = self.get_doc_before_save()
		if not prev_status:
			return

		old_status = prev_status.status
		new_status = self.status

		if old_status == new_status:
			return

		if new_status == "Shipped":
			self._send_notification("order_shipped", "Order Shipped")
			self._create_user_notification("Order Shipped", f"Your order {self.name} has been shipped.")
			self._dispatch_webhook("order.shipped")
		elif new_status == "Delivered":
			self._send_notification("order_delivered", "Order Delivered")
			self._create_user_notification("Order Delivered", f"Your order {self.name} has been delivered.")
			self._dispatch_webhook("order.delivered")

		# Track payment status changes
		old_payment = prev_status.payment_status
		if old_payment != self.payment_status and self.payment_status == "Paid":
			self._dispatch_webhook("order.paid")

	def _send_notification(self, template, subject):
		"""Send an order lifecycle email notification."""
		try:
			from velora_verse.services.notifications import send_order_email
			send_order_email(self.name, template, subject)
		except Exception:
			frappe.log_error(title=f"Order Email Failed: {self.name}", message=frappe.get_traceback())

	def _create_user_notification(self, title, message):
		"""Create an in-app notification for the user."""
		try:
			from velora_verse.api.notification_center import create_user_notification
			create_user_notification(
				user=self.user,
				notification_type="Order",
				title_text=title,
				message=message,
				reference_doctype="Order",
				reference_name=self.name,
				action_url=f"/orders/{self.name}",
			)
		except Exception:
			frappe.log_error(title=f"Order Notification Failed: {self.name}", message=frappe.get_traceback())

	def _dispatch_webhook(self, event_type):
		"""Dispatch a webhook event for this order."""
		try:
			from velora_verse.api.webhooks import dispatch_webhook_event
			dispatch_webhook_event(event_type, {
				"order": self.name,
				"user": self.user,
				"status": self.status,
				"payment_status": self.payment_status,
				"total": self.total,
			})
		except Exception:
			frappe.log_error(title=f"Order Webhook Failed: {event_type}", message=frappe.get_traceback())

	def _earn_loyalty_points(self):
		"""Award loyalty points on order submission."""
		try:
			from velora_verse.api.loyalty import earn_points_for_order
			earned = earn_points_for_order(self.name, self.user, self.total)
			if earned:
				frappe.db.set_value("Order", self.name, "loyalty_points_earned", earned)
		except Exception:
			frappe.log_error(title=f"Loyalty Earn Failed: {self.name}", message=frappe.get_traceback())

	def _refund_loyalty_points(self):
		"""Refund loyalty points on order cancellation."""
		try:
			from velora_verse.api.loyalty import refund_points_for_order
			refund_points_for_order(self.name, self.user)
		except Exception:
			frappe.log_error(title=f"Loyalty Refund Failed: {self.name}", message=frappe.get_traceback())

	def _refund_gift_card(self):
		"""Refund gift card amount on order cancellation."""
		if self.gift_card_code and self.gift_card_amount:
			try:
				from velora_verse.api.gift_cards import refund_to_gift_card
				refund_to_gift_card(self.gift_card_code, self.gift_card_amount, self.name, self.user)
			except Exception:
				frappe.log_error(title=f"Gift Card Refund Failed: {self.name}", message=frappe.get_traceback())

	def validate_order_items(self):
		if not self.order_items:
			frappe.throw("Order must have at least one item.")

		for row in self.order_items:
			if not row.quantity or row.quantity < 1:
				frappe.throw(f"Quantity for '{row.variant}' must be at least 1.")
			if not row.rate or row.rate <= 0:
				frappe.throw(f"Rate for '{row.variant}' must be greater than 0.")
			row.amount = row.rate * row.quantity

	def snapshot_address_display(self):
		"""Store address as text so it persists even if address is later changed."""
		if self.shipping_address and not self.shipping_address_display:
			self.shipping_address_display = _format_address(self.shipping_address)

		if self.billing_address and not self.billing_address_display:
			self.billing_address_display = _format_address(self.billing_address)

	def calculate_totals(self):
		from velora_verse.services.tax import calculate_order_tax

		self.subtotal = sum(row.amount or 0 for row in self.order_items)

		# Determine total pre-tax discount
		total_discount = (self.discount_amount or 0) + (self.segment_discount or 0)

		# Get shipping state for tax calculation
		shipping_state = None
		if self.shipping_address:
			shipping_state = frappe.db.get_value("Address", self.shipping_address, "state")

		# Build order items list for tax calculation
		items_for_tax = []
		for row in self.order_items:
			items_for_tax.append({
				"variant": row.variant,
				"item_name": row.item_name,
				"amount": row.amount or 0,
			})

		# Calculate tax (HSN-based or flat rate)
		tax_result = calculate_order_tax(items_for_tax, total_discount, shipping_state)
		self.tax_rate = tax_result["tax_rate"]
		self.tax_amount = tax_result["tax_amount"]
		self.is_igst = tax_result.get("is_igst", 0)
		self.cgst_amount = tax_result.get("cgst_amount", 0)
		self.sgst_amount = tax_result.get("sgst_amount", 0)
		self.igst_amount = tax_result.get("igst_amount", 0)
		self.cess_amount = tax_result.get("cess_amount", 0)

		# Apply per-item tax if available
		for item_tax in tax_result.get("item_taxes", []):
			for row in self.order_items:
				if row.variant == item_tax["variant"]:
					row.hsn_code = item_tax.get("hsn_code")
					row.tax_rate = item_tax.get("tax_rate", 0)
					row.tax_amount = item_tax.get("tax_amount", 0)

		# Total: subtotal - discounts + tax (if exclusive) + shipping - loyalty - gift card
		if self._is_gst_inclusive():
			self.total = (
				self.subtotal
				- total_discount
				+ (self.shipping_charge or 0)
				- (self.loyalty_discount or 0)
				- (self.gift_card_amount or 0)
			)
		else:
			self.total = (
				self.subtotal
				- total_discount
				+ self.tax_amount
				+ (self.shipping_charge or 0)
				- (self.loyalty_discount or 0)
				- (self.gift_card_amount or 0)
			)

		if self.total < 0:
			self.total = 0

	def _is_gst_inclusive(self):
		"""Check if GST is included in prices."""
		from velora_verse.utils import get_store_settings

		try:
			settings = get_store_settings()
			return settings.enable_gst and settings.gst_included_in_price
		except Exception:
			frappe.log_error(title="GST Settings Lookup Failed", message=frappe.get_traceback())
			return True

	def deduct_stock(self):
		"""Deduct stock for each order item using atomic SQL to prevent race conditions."""
		from velora_verse.velora_verse.doctype.inventory_log.inventory_log import create_inventory_log

		for row in self.order_items:
			# Atomic decrement — only succeeds if sufficient stock
			affected = frappe.db.sql("""
				UPDATE `tabVariants`
				SET quantity = quantity - %(qty)s
				WHERE name = %(name)s AND quantity >= %(qty)s
			""", {"qty": row.quantity, "name": row.variant})
			if not frappe.db.sql("SELECT ROW_COUNT()")[0][0]:
				current_qty = frappe.db.get_value("Variants", row.variant, "quantity") or 0
				frappe.throw(
					f"Insufficient stock for '{row.variant_title or row.variant}'. "
					f"Available: {current_qty}, Requested: {row.quantity}"
				)

			new_qty = frappe.db.get_value("Variants", row.variant, "quantity") or 0
			previous_qty = new_qty + row.quantity

			if new_qty == 0:
				frappe.db.set_value("Variants", row.variant, "is_stock", 0)

			create_inventory_log(
				variant=row.variant,
				change_type="Sale",
				quantity_change=-row.quantity,
				previous_qty=previous_qty,
				new_qty=new_qty,
				reference_type="Order",
				reference_name=self.name,
			)

		self._update_parent_stock_status()

	def restore_stock(self):
		"""Restore stock on order cancellation using atomic SQL."""
		from velora_verse.velora_verse.doctype.inventory_log.inventory_log import create_inventory_log

		for row in self.order_items:
			# Atomic increment
			frappe.db.sql("""
				UPDATE `tabVariants`
				SET quantity = quantity + %(qty)s
				WHERE name = %(name)s
			""", {"qty": row.quantity, "name": row.variant})

			new_qty = frappe.db.get_value("Variants", row.variant, "quantity") or 0
			previous_qty = new_qty - row.quantity

			if new_qty > 0:
				frappe.db.set_value("Variants", row.variant, "is_stock", 1)

			create_inventory_log(
				variant=row.variant,
				change_type="Return",
				quantity_change=row.quantity,
				previous_qty=previous_qty,
				new_qty=new_qty,
				reference_type="Order",
				reference_name=self.name,
			)

		self._update_parent_stock_status()

	def _update_parent_stock_status(self):
		"""Update in_stock flag on parent Items based on variant stock."""
		items_to_update = set()
		for row in self.order_items:
			item_name = frappe.db.get_value("Variants", row.variant, "variant_name")
			if item_name:
				items_to_update.add(item_name)

		for item_name in items_to_update:
			has_stock = frappe.db.count("Variants", {
				"variant_name": item_name,
				"is_stock": 1,
			}) > 0
			frappe.db.set_value("Items", item_name, "in_stock", 1 if has_stock else 0)


def _format_address(address_name):
	"""Format address document into a display string."""
	addr = frappe.db.get_value(
		"Address", address_name,
		["full_name", "address_line_1", "address_line_2", "city", "state", "pincode", "country", "phone"],
		as_dict=True,
	)
	if not addr:
		return ""

	parts = [addr.full_name, addr.address_line_1]
	if addr.address_line_2:
		parts.append(addr.address_line_2)
	parts.append(f"{addr.city}, {addr.state} - {addr.pincode}")
	parts.append(addr.country)
	if addr.phone:
		parts.append(f"Phone: {addr.phone}")

	return "\n".join(parts)


def _apply_discount_stack(order, user, coupon_code=None, loyalty_points=0, gift_card_code=None):
	"""
	Apply the full discount stack to an order:
	1. Flash Sale / Promotion prices (already applied per-item in order_items rates)
	2. Subtotal computed from effective prices
	3. Segment Discount (% off subtotal)
	4. Coupon Discount (applied to post-segment amount)
	5. GST/Tax calculated on (subtotal - all pre-tax discounts)
	6. Shipping added
	7. Loyalty Points redeemed (reduces payment, post-tax)
	8. Gift Card balance applied (reduces payment, post-tax)
	"""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()

	# Step 3: Segment discount
	segment_discount = 0
	segment_name = None
	if getattr(settings, "enable_customer_segments", 0):
		try:
			from velora_verse.api.segments import get_segment_discount, get_segment_name_for_user
			seg_pct = get_segment_discount(user)
			if seg_pct > 0:
				segment_discount = round(order.subtotal * seg_pct / 100, 2)
				segment_name = get_segment_name_for_user(user)
		except Exception:
			frappe.log_error(title="Segment Discount Failed", message=frappe.get_traceback())

	order.segment_discount = segment_discount
	order.segment_name = segment_name

	# Step 4: Coupon discount (on post-segment amount)
	coupon_discount = 0
	if coupon_code:
		post_segment = order.subtotal - segment_discount
		coupon_discount = _calculate_coupon_discount(coupon_code, post_segment, user)
		order.coupon_code = coupon_code
	order.discount_amount = coupon_discount

	# Step 7: Loyalty points (post-tax, reduces payment)
	loyalty_discount = 0
	loyalty_points_redeemed = 0
	if int(loyalty_points) > 0 and getattr(settings, "enable_loyalty_points", 0):
		try:
			from velora_verse.api.loyalty import redeem_points_for_order
			loyalty_discount = redeem_points_for_order(order.name, user, int(loyalty_points))
			if loyalty_discount > 0:
				loyalty_points_redeemed = int(loyalty_points)
		except Exception:
			frappe.log_error(title="Loyalty Redemption Failed", message=frappe.get_traceback())

	order.loyalty_discount = loyalty_discount
	order.loyalty_points_redeemed = loyalty_points_redeemed

	# Step 8: Gift card (post-tax, reduces payment)
	gift_card_amount = 0
	if gift_card_code and getattr(settings, "enable_gift_cards", 0):
		try:
			from velora_verse.api.gift_cards import redeem_gift_card
			# Estimate remaining total for gift card cap
			remaining = (
				order.subtotal - segment_discount - coupon_discount
				+ (order.shipping_charge or 0) - loyalty_discount
			)
			gift_card_amount = redeem_gift_card(gift_card_code, remaining, order.name, user)
		except Exception:
			frappe.log_error(title="Gift Card Redemption Failed", message=frappe.get_traceback())

	order.gift_card_code = gift_card_code if gift_card_amount > 0 else None
	order.gift_card_amount = gift_card_amount


@frappe.whitelist()
def place_order(shipping_address, billing_address=None, coupon_code=None,
	payment_method=None, notes=None, loyalty_points=0, gift_card_code=None):
	"""Convert the current user's cart into an order."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to place an order.")

	# Validate shipping address belongs to user
	addr_user = frappe.db.get_value("Address", shipping_address, "user")
	if addr_user != user and user != "Administrator":
		frappe.throw("Invalid shipping address.")

	if billing_address:
		bill_user = frappe.db.get_value("Address", billing_address, "user")
		if bill_user != user and user != "Administrator":
			frappe.throw("Invalid billing address.")

	# Get the user's cart
	cart_name = frappe.db.get_value("Cart", {"user": user})
	if not cart_name:
		frappe.throw("Your cart is empty.")

	cart = frappe.get_doc("Cart", cart_name)
	if not cart.cart_items:
		frappe.throw("Your cart is empty.")

	# Check minimum order value
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	if settings.min_order_value:
		cart_total = sum((row.rate or 0) * row.quantity for row in cart.cart_items)
		if cart_total < settings.min_order_value:
			frappe.throw(
				f"Minimum order value is {settings.currency_symbol}{settings.min_order_value}. "
				f"Your cart total is {settings.currency_symbol}{cart_total}."
			)

	# Validate pincode serviceability
	if settings.enable_pincode_check:
		shipping_pincode = frappe.db.get_value("Address", shipping_address, "pincode")
		if shipping_pincode:
			pin_data = frappe.db.get_value(
				"Serviceable Pincode",
				{"pincode": shipping_pincode},
				["is_serviceable", "cod_available"],
				as_dict=True,
			)
			if not pin_data or not pin_data.is_serviceable:
				frappe.throw(f"Delivery is not available to pincode {shipping_pincode}.")

			if payment_method == "COD" and not pin_data.cod_available:
				frappe.throw(f"Cash on Delivery is not available for pincode {shipping_pincode}.")

	# Validate COD if selected
	if payment_method == "COD" and not settings.cod_enabled:
		frappe.throw("Cash on Delivery is not available.")

	# Build order items with effective (sale) price snapshot
	order_items = []
	for row in cart.cart_items:
		variant = frappe.get_doc("Variants", row.variant)
		effective_price = variant.price

		# Apply promotion/flash sale price
		try:
			from velora_verse.api.promotions import get_effective_price
			promo_result = get_effective_price(row.variant)
			if promo_result.get("sale_price") is not None:
				effective_price = promo_result["sale_price"]
		except Exception:
			frappe.log_error(title=f"Promotion Price Failed: {row.variant}", message=frappe.get_traceback())

		item_data = {
			"variant": row.variant,
			"item_name": variant.variant_name,
			"variant_title": variant.title,
			"quantity": row.quantity,
			"rate": effective_price,
			"amount": effective_price * row.quantity,
		}

		# Carry bundle info if present
		if getattr(row, "is_bundle_item", 0):
			item_data["is_bundle_item"] = 1
			item_data["bundle_reference"] = getattr(row, "bundle_reference", None)

		order_items.append(item_data)

	# Create order
	order = frappe.new_doc("Order")
	order.user = user
	order.order_date = now_datetime()
	order.shipping_address = shipping_address
	order.billing_address = billing_address or shipping_address
	order.payment_method = payment_method
	order.notes = notes

	for item in order_items:
		order.append("order_items", item)

	# Calculate shipping
	from velora_verse.api.shipping import calculate_shipping

	shipping_state = frappe.db.get_value("Address", shipping_address, "state")
	shipping_result = calculate_shipping(order_items, shipping_state)
	order.shipping_charge = shipping_result["shipping_charge"]

	# Apply the full discount stack
	_apply_discount_stack(order, user, coupon_code, loyalty_points, gift_card_code)

	# Track analytics
	try:
		from velora_verse.api.analytics import _track_event_internal
		_track_event_internal("purchase", "Order", order.name, user, {"total": order.total})
	except Exception:
		frappe.log_error(title="Order Analytics Failed", message=frappe.get_traceback())

	order.save(ignore_permissions=True)
	order.flags.ignore_permissions = True
	order.submit()

	# Increment coupon usage atomically
	if coupon_code:
		frappe.db.sql("""
			UPDATE `tabCoupon` SET used_count = used_count + 1 WHERE name = %s
		""", coupon_code)

	# Clear the cart
	for row in list(cart.cart_items):
		cart.remove(row)
	cart.save(ignore_permissions=True)

	# Mark COD orders as Confirmed immediately
	if payment_method == "COD":
		frappe.db.set_value("Order", order.name, "status", "Confirmed")

	return {
		"message": "Order placed successfully",
		"name": order.name,
		"order": order.name,
		"total": order.total,
		"tax_amount": order.tax_amount,
		"shipping_charge": order.shipping_charge,
		"discount_amount": order.discount_amount,
		"segment_discount": order.segment_discount,
		"loyalty_discount": order.loyalty_discount,
		"gift_card_amount": order.gift_card_amount,
		"loyalty_points_earned": order.loyalty_points_earned,
	}


def _calculate_coupon_discount(coupon_code, subtotal, user):
	"""Calculate discount amount for a coupon. Raises on invalid coupon."""
	from velora_verse.velora_verse.doctype.coupon.coupon import _validate_coupon

	coupon = _validate_coupon(coupon_code, subtotal, user)
	if coupon.discount_type == "Percentage":
		discount = subtotal * (coupon.discount_value / 100)
		if coupon.max_discount and discount > coupon.max_discount:
			discount = coupon.max_discount
	else:
		discount = coupon.discount_value

	if discount > subtotal:
		discount = subtotal

	return discount


@frappe.whitelist()
def get_orders(page=1, limit=10, status=None):
	"""Get the current user's orders with pagination."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to view orders.")

	page = int(page)
	limit = int(limit)
	offset = (page - 1) * limit

	filters = {"user": user, "docstatus": ["in", [0, 1, 2]]}
	if status:
		filters["status"] = status

	orders = frappe.get_all(
		"Order",
		filters=filters,
		fields=[
			"name", "order_date", "status", "payment_status",
			"total", "discount_amount", "shipping_charge",
			"tax_amount", "segment_discount", "loyalty_discount",
			"gift_card_amount", "docstatus",
		],
		order_by="order_date desc",
		limit_page_length=limit,
		limit_start=offset,
	)

	# Normalize status based on docstatus
	for o in orders:
		if o.docstatus == 2 and o.status != "Cancelled":
			o["status"] = "Cancelled"
		elif o.docstatus == 0 and o.status not in ("Pending", "Cancelled"):
			o["status"] = "Pending"

	# Add item count for each order
	if orders:
		order_names = [o.name for o in orders]
		item_counts = frappe.db.sql("""
			SELECT parent, COUNT(*) as cnt
			FROM `tabOrder Items`
			WHERE parent IN %(names)s
			GROUP BY parent
		""", {"names": order_names}, as_dict=True)
		count_map = {r.parent: r.cnt for r in item_counts}
		for o in orders:
			o["item_count"] = count_map.get(o.name, 0)

	total_count = frappe.db.count("Order", filters)

	return {
		"orders": orders,
		"total_count": total_count,
		"page": page,
		"limit": limit,
		"total_pages": (total_count + limit - 1) // limit,
	}


@frappe.whitelist()
def get_order_detail(order_name):
	"""Get full details of a specific order."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to view order details.")

	if not frappe.db.exists("Order", order_name):
		frappe.throw("Order not found.")

	order = frappe.get_doc("Order", order_name)
	if order.user != user and user != "Administrator":
		frappe.throw("You can only view your own orders.", frappe.PermissionError)

	items = []
	for row in order.order_items:
		# Resolve image and slug from variant → parent item
		image = None
		slug = None
		if row.variant:
			variant_data = frappe.db.get_value(
				"Variants", row.variant, ["variant_name", "slug"], as_dict=True
			)
			if variant_data:
				slug = variant_data.slug or frappe.db.get_value("Items", variant_data.variant_name, "slug")
				image = frappe.db.get_value(
					"Images",
					{"parent": variant_data.variant_name, "parenttype": "Items"},
					"image",
				)

		items.append({
			"name": row.name,
			"variant": row.variant,
			"item_name": row.item_name,
			"variant_title": row.variant_title,
			"quantity": row.quantity,
			"rate": row.rate,
			"amount": row.amount,
			"hsn_code": getattr(row, "hsn_code", None),
			"tax_rate": getattr(row, "tax_rate", 0),
			"tax_amount": getattr(row, "tax_amount", 0),
			"is_bundle_item": getattr(row, "is_bundle_item", 0),
			"bundle_reference": getattr(row, "bundle_reference", None),
			"image": image,
			"slug": slug,
		})

	return {
		"name": order.name,
		"order_date": order.order_date,
		"status": order.status,
		"payment_status": order.payment_status,
		"payment_method": order.payment_method,
		"shipping_address_display": order.shipping_address_display,
		"billing_address_display": order.billing_address_display,
		"items": items,
		"subtotal": order.subtotal,
		"discount_amount": order.discount_amount,
		"segment_name": order.segment_name,
		"segment_discount": order.segment_discount,
		"tax_rate": order.tax_rate,
		"tax_amount": order.tax_amount,
		"cgst_amount": order.cgst_amount,
		"sgst_amount": order.sgst_amount,
		"igst_amount": order.igst_amount,
		"cess_amount": order.cess_amount,
		"shipping_charge": order.shipping_charge,
		"loyalty_points_redeemed": order.loyalty_points_redeemed,
		"loyalty_discount": order.loyalty_discount,
		"loyalty_points_earned": order.loyalty_points_earned,
		"gift_card_code": order.gift_card_code,
		"gift_card_amount": order.gift_card_amount,
		"total": order.total,
		"coupon_code": order.coupon_code,
		"tracking_number": order.tracking_number,
		"tracking_url": order.tracking_url,
		"delivered_on": order.delivered_on,
		"notes": order.notes,
		"cancelled_reason": order.cancelled_reason,
	}


@frappe.whitelist()
def cancel_order(order_name, reason=None):
	"""Cancel an order if it hasn't been shipped yet."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to cancel an order.")

	if not frappe.db.exists("Order", order_name):
		frappe.throw("Order not found.")

	order = frappe.get_doc("Order", order_name)
	if order.user != user and user != "Administrator":
		frappe.throw("You can only cancel your own orders.", frappe.PermissionError)

	if order.status == "Cancelled":
		frappe.throw(f"Order is already cancelled.")

	non_cancellable = ("Shipped", "Delivered", "Returned")
	if order.status in non_cancellable:
		frappe.throw(f"Cannot cancel order with status '{order.status}'.")

	if order.docstatus == 0:
		# Draft order (submit failed) — clean up directly since it was never placed
		frappe.db.sql("DELETE FROM `tabOrder Items` WHERE parent = %s", order_name)
		frappe.db.sql("DELETE FROM `tabOrder` WHERE name = %s", order_name)
		return {"message": "Order cancelled", "order": order_name}

	if order.docstatus == 2:
		# Already cancelled in Frappe's sense but status may be stale — fix it
		if order.status != "Cancelled":
			frappe.db.set_value("Order", order_name, {
				"status": "Cancelled",
				"cancelled_reason": reason,
			})
		return {"message": "Order cancelled", "order": order_name}

	order.cancelled_reason = reason
	order.flags.ignore_permissions = True
	order.cancel()

	return {"message": "Order cancelled", "order": order.name}
