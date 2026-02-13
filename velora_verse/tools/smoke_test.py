"""
Smoke test for all 90 Velora Verse API endpoints.
Run: bench --site veloraverse.com execute velora_verse.tools.smoke_test.run
"""

import frappe
import json

PASS = 0
FAIL = 0
ERRORS = []


def _test(label, fn):
	global PASS, FAIL, ERRORS
	try:
		result = fn()
		PASS += 1
		print(f"  PASS  {label}")
		return result
	except Exception as e:
		FAIL += 1
		err = str(e)[:120]
		ERRORS.append((label, err))
		print(f"  FAIL  {label} — {err}")
		return None


def run():
	global PASS, FAIL, ERRORS
	PASS, FAIL, ERRORS = 0, 0, []

	print("=" * 70)
	print("VELORA VERSE — API SMOKE TEST (90 endpoints)")
	print("=" * 70)

	# ── Setup: get test data ──────────────────────────────────────
	test_user = "aarav.sharma@veloraverse.com"
	test_pass = "Test@12345"
	item = frappe.get_all("Items", limit=1, pluck="name")[0]
	item_doc = frappe.get_doc("Items", item)
	variant = frappe.get_all("Variants", filters={"is_stock": 1}, limit=1, pluck="name")[0]
	category = frappe.get_all("Category", limit=1, pluck="name")[0]
	cat_doc = frappe.get_doc("Category", category)
	order = frappe.get_all("Order", filters={"docstatus": 1, "status": "Delivered"}, limit=1, pluck="name")[0]
	coupon = "WELCOME10"

	# ── 1. GUEST APIs (api.py) — 8 endpoints ─────────────────────
	print("\n--- 1. Product Browsing APIs (api.py) ---")
	frappe.set_user("Guest")

	_test("get_products()", lambda: frappe.call(
		"velora_verse.api.products.get_products"))

	_test("get_products(category, filters)", lambda: frappe.call(
		"velora_verse.api.products.get_products", category=cat_doc.slug, min_price=100, max_price=5000, in_stock=1, page=1, limit=5))

	_test("get_product_detail(slug)", lambda: frappe.call(
		"velora_verse.api.products.get_product_detail", slug=item_doc.slug))

	_test("get_product_detail(name)", lambda: frappe.call(
		"velora_verse.api.products.get_product_detail", name=item))

	_test("get_categories()", lambda: frappe.call(
		"velora_verse.api.products.get_categories"))

	_test("get_categories(parent)", lambda: frappe.call(
		"velora_verse.api.products.get_categories", parent=category))

	_test("get_category_tree()", lambda: frappe.call(
		"velora_verse.api.products.get_category_tree"))

	_test("get_featured_products()", lambda: frappe.call(
		"velora_verse.api.products.get_featured_products", limit=5))

	_test("search_products(query)", lambda: frappe.call(
		"velora_verse.api.products.search_products", query="cotton"))

	_test("get_product_filters()", lambda: frappe.call(
		"velora_verse.api.products.get_product_filters"))

	_test("get_category_detail(slug)", lambda: frappe.call(
		"velora_verse.api.products.get_category_detail", slug=cat_doc.slug))

	_test("get_recommendations(item)", lambda: frappe.call(
		"velora_verse.api.products.get_recommendations", item=item, limit=4))

	_test("check_pincode(serviceable)", lambda: frappe.call(
		"velora_verse.api.shipping.check_pincode", pincode="110001"))

	_test("check_pincode(non-serviceable)", lambda: frappe.call(
		"velora_verse.api.shipping.check_pincode", pincode="999999"))

	_test("get_user_profile() [guest]", lambda: frappe.call(
		"velora_verse.api.products.get_user_profile"))

	# ── 1b. Search APIs (search.py) — Guest ──────────────────────
	print("\n--- 1b. Search APIs (search.py) [Guest] ---")

	_test("autocomplete(query='shirt')", lambda: frappe.call(
		"velora_verse.api.search.autocomplete", query="shirt"))

	_test("autocomplete(query='')", lambda: frappe.call(
		"velora_verse.api.search.autocomplete", query=""))

	_test("trending_searches()", lambda: frappe.call(
		"velora_verse.api.search.trending_searches"))

	# ── 1c. Sitemap APIs (sitemap.py) — Guest ────────────────────
	print("\n--- 1c. Sitemap APIs (sitemap.py) [Guest] ---")

	_test("get_sitemap()", lambda: frappe.call(
		"velora_verse.api.sitemap.get_sitemap"))

	_test("get_sitemap_index()", lambda: frappe.call(
		"velora_verse.api.sitemap.get_sitemap_index"))

	_test("get_robots_txt()", lambda: frappe.call(
		"velora_verse.api.sitemap.get_robots_txt"))

	# ── 1d. Promotions APIs (promotions.py) — Guest ──────────────
	print("\n--- 1d. Promotions APIs (promotions.py) [Guest] ---")

	_test("get_active_promotions()", lambda: frappe.call(
		"velora_verse.api.promotions.get_active_promotions"))

	promo = frappe.get_all("Promotion", filters={"is_active": 1}, limit=1, pluck="name")
	if promo:
		_test("get_flash_sale_products(promotion)", lambda: frappe.call(
			"velora_verse.api.promotions.get_flash_sale_products", promotion=promo[0]))
	else:
		print("  SKIP  get_flash_sale_products() — no active promotion")

	# ── 1e. Bundles APIs (bundles.py) — Guest ────────────────────
	print("\n--- 1e. Bundles APIs (bundles.py) [Guest] ---")

	_test("get_bundles()", lambda: frappe.call(
		"velora_verse.api.bundles.get_bundles"))

	bundle = frappe.get_all("Product Bundle", limit=1, pluck="name")
	if bundle:
		bundle_slug = frappe.db.get_value("Product Bundle", bundle[0], "slug")
		_test("get_bundle_detail(slug)", lambda: frappe.call(
			"velora_verse.api.bundles.get_bundle_detail", slug=bundle_slug or bundle[0]))
	else:
		print("  SKIP  get_bundle_detail() — no bundle")

	# ── 1f. Gift Cards — Guest endpoints ─────────────────────────
	print("\n--- 1f. Gift Card APIs (gift_cards.py) [Guest] ---")

	gc = frappe.get_all("Gift Card", filters={"status": "Active"}, limit=1, pluck="name")
	if gc:
		_test("check_gift_card_balance(card_code)", lambda: frappe.call(
			"velora_verse.api.gift_cards.check_gift_card_balance", card_code=gc[0]))
	else:
		print("  SKIP  check_gift_card_balance() — no active gift card")

	# ── 1g. Analytics — Guest endpoint ───────────────────────────
	print("\n--- 1g. Analytics APIs (analytics.py) [Guest] ---")

	_test("track_event(page_view)", lambda: frappe.call(
		"velora_verse.api.analytics.track_event", event_name="page_view", page_url="/test"))

	# ── 2. AUTH APIs (auth.py) — 6 endpoints ─────────────────────
	print("\n--- 2. Auth APIs (auth.py) ---")

	# login/logout need HTTP request context (LoginManager) — skip in bench console
	print("  SKIP  login() — needs HTTP request context (works via curl/frontend)")
	print("  SKIP  logout() — needs HTTP request context (works via curl/frontend)")

	# Now logged in as test user
	frappe.set_user(test_user)

	_test("get_user_profile() [logged in]", lambda: frappe.call(
		"velora_verse.api.products.get_user_profile"))

	_test("update_profile(first_name)", lambda: frappe.call(
		"velora_verse.api.auth.update_profile", first_name="Aarav"))

	# Skip change_password (would change test user password)
	# Skip register (would create new user)
	# Skip forgot_password (would send email)
	print("  SKIP  register() — would create user")
	print("  SKIP  change_password() — would alter test credentials")
	print("  SKIP  forgot_password() — would send email")

	# ── 2b. Recently Viewed APIs (api.py) — 2 endpoints ─────────
	print("\n--- 2b. Recently Viewed APIs (api.py) ---")

	_test("track_product_view(item)", lambda: frappe.call(
		"velora_verse.api.products.track_product_view", item=item))

	_test("get_recently_viewed()", lambda: frappe.call(
		"velora_verse.api.products.get_recently_viewed", limit=5))

	# ── 2c. Notification Center APIs (notification_center.py) ────
	print("\n--- 2c. Notification Center APIs [Auth] ---")

	_test("get_notifications()", lambda: frappe.call(
		"velora_verse.api.notification_center.get_notifications"))

	_test("get_unread_count()", lambda: frappe.call(
		"velora_verse.api.notification_center.get_unread_count"))

	user_notif = frappe.get_all("User Notification", filters={"user": test_user, "is_read": 0}, limit=1, pluck="name")
	if user_notif:
		_test("mark_as_read(notification_name)", lambda: frappe.call(
			"velora_verse.api.notification_center.mark_as_read", notification_name=user_notif[0]))
	else:
		print("  SKIP  mark_as_read() — no unread notification")

	_test("mark_all_read()", lambda: frappe.call(
		"velora_verse.api.notification_center.mark_all_read"))

	user_notif2 = frappe.get_all("User Notification", filters={"user": test_user}, limit=1, pluck="name")
	if user_notif2:
		_test("delete_notification(notification_name)", lambda: frappe.call(
			"velora_verse.api.notification_center.delete_notification", notification_name=user_notif2[0]))
	else:
		print("  SKIP  delete_notification() — no notification")

	# ── 2d. Loyalty APIs (loyalty.py) ────────────────────────────
	print("\n--- 2d. Loyalty APIs (loyalty.py) [Auth] ---")

	_test("get_loyalty_balance()", lambda: frappe.call(
		"velora_verse.api.loyalty.get_loyalty_balance"))

	_test("get_loyalty_history()", lambda: frappe.call(
		"velora_verse.api.loyalty.get_loyalty_history"))

	_test("preview_loyalty_redemption(points=10)", lambda: frappe.call(
		"velora_verse.api.loyalty.preview_loyalty_redemption", points_to_redeem=10))

	# ── 2e. Segments APIs (segments.py) ──────────────────────────
	print("\n--- 2e. Segments APIs (segments.py) [Auth] ---")

	_test("get_my_segments()", lambda: frappe.call(
		"velora_verse.api.segments.get_my_segments"))

	# ── 2f. Gift Card APIs — Auth endpoints ──────────────────────
	print("\n--- 2f. Gift Card APIs (gift_cards.py) [Auth] ---")

	_test("purchase_gift_card(amount=1000)", lambda: frappe.call(
		"velora_verse.api.gift_cards.purchase_gift_card",
		amount=1000, recipient_email="test@test.com", recipient_name="Test"))

	_test("get_my_gift_cards()", lambda: frappe.call(
		"velora_verse.api.gift_cards.get_my_gift_cards"))

	_test("preview_gift_card_redemption(card_code='TEST')", lambda: frappe.call(
		"velora_verse.api.gift_cards.preview_gift_card_redemption",
		card_code="TEST", amount=100))

	# ── 3. VARIANT APIs (variants.py) — 1 endpoint ───────────────
	print("\n--- 3. Variant APIs ---")

	# get_variant_values is a Frappe link-field query function (not a regular API)
	_test("get_variant_values(query)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.variants.variants.get_variant_values",
		doctype="Variants", txt="", searchfield="name", start=0, page_len=10, filters={"item": item}))

	# ── 4. ITEM APIs (items.py) — 1 endpoint ─────────────────────
	print("\n--- 4. Item APIs ---")

	# get_leaf_categories is a Frappe link-field query function
	_test("get_leaf_categories(query)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.items.items.get_leaf_categories",
		doctype="Category", txt="", searchfield="name", start=0, page_len=10, filters={}))

	# ── 5. REVIEW APIs (review.py) — 2 endpoints ─────────────────
	print("\n--- 5. Review APIs (review.py) ---")

	_test("get_reviews(item)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.review.review.get_reviews", item=item))

	# add_review — test with a non-reviewed item variant combo
	non_reviewed_variant = frappe.get_all("Variants", filters={"variant_name": item}, limit=1, pluck="name")
	if non_reviewed_variant:
		# Check if user already reviewed this
		existing = frappe.db.exists("Review", {"user": test_user, "item": item, "variant": non_reviewed_variant[0]})
		if not existing:
			_test("add_review(item, rating, title, text)", lambda: frappe.call(
				"velora_verse.velora_verse.doctype.review.review.add_review",
				item=item, variant=non_reviewed_variant[0], rating=4,
				review_title="Smoke test review", review_text="Testing the review API"))
		else:
			print("  SKIP  add_review() — already reviewed")
	else:
		print("  SKIP  add_review() — no variant found")

	# ── 6. CART APIs (cart.py) — 5 endpoints ──────────────────────
	print("\n--- 6. Cart APIs (cart.py) ---")

	_test("add_to_cart(variant, qty)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.cart.cart.add_to_cart", variant=variant, quantity=1))

	_test("get_cart()", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.cart.cart.get_cart"))

	_test("update_cart_quantity(variant, qty)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.cart.cart.update_cart_quantity", variant=variant, quantity=2))

	_test("remove_from_cart(variant)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.cart.cart.remove_from_cart", variant=variant))

	# Re-add for later tests
	frappe.call("velora_verse.velora_verse.doctype.cart.cart.add_to_cart", variant=variant, quantity=1)

	_test("move_wishlist_to_cart(variant)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.cart.cart.move_wishlist_to_cart", variant=variant))

	# ── 7. WISHLIST APIs (wishlist.py) — 4 endpoints ─────────────
	print("\n--- 7. Wishlist APIs (wishlist.py) ---")

	_test("add_to_wishlist(variant)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.wishlist.wishlist.add_to_wishlist", variant=variant))

	_test("is_in_wishlist(variant)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.wishlist.wishlist.is_in_wishlist", variant=variant))

	_test("remove_from_wishlist(variant)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.wishlist.wishlist.remove_from_wishlist", variant=variant))

	# ── 8. ADDRESS APIs (address.py) — 4 endpoints ───────────────
	print("\n--- 8. Address APIs (address.py) ---")

	_test("get_addresses()", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.address.address.get_addresses"))

	addr_result = _test("add_address()", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.address.address.add_address",
		full_name="Test Address", phone="9999999999",
		address_type="Shipping", address_line_1="123 Smoke Test Lane",
		city="TestCity", state="TestState", pincode="999999", country="India"))

	if addr_result:
		addr_name = addr_result.get("address") if isinstance(addr_result, dict) else addr_result
		if addr_name:
			_test("update_address(name, city)", lambda: frappe.call(
				"velora_verse.velora_verse.doctype.address.address.update_address",
				address_name=addr_name, city="UpdatedCity"))
			_test("delete_address(name)", lambda: frappe.call(
				"velora_verse.velora_verse.doctype.address.address.delete_address",
				address_name=addr_name))
		else:
			print("  SKIP  update_address() — no name returned")
			print("  SKIP  delete_address() — no name returned")
	else:
		print("  SKIP  update_address() — add_address failed")
		print("  SKIP  delete_address() — add_address failed")

	# ── 9. COUPON APIs (coupon.py) — 2 endpoints ─────────────────
	print("\n--- 9. Coupon APIs (coupon.py) ---")

	_test("validate_coupon(coupon_code)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.coupon.coupon.validate_coupon", coupon_code=coupon))

	_test("apply_coupon(coupon_code, subtotal)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.coupon.coupon.apply_coupon", coupon_code=coupon, subtotal=2000))

	# ── 10. SHIPPING APIs (shipping.py) — 1 endpoint ─────────────
	print("\n--- 10. Shipping APIs (shipping.py) ---")

	user_addr = frappe.get_all("Address", filters={"user": test_user}, limit=1, pluck="name")
	if user_addr:
		_test("get_shipping_rates(address)", lambda: frappe.call(
			"velora_verse.api.shipping.get_shipping_rates", shipping_address=user_addr[0]))
	else:
		print("  SKIP  get_shipping_rates() — no address")

	# ── 11. ORDER APIs (order.py) — 4 endpoints ──────────────────
	print("\n--- 11. Order APIs (order.py) ---")

	_test("get_orders()", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.order.order.get_orders"))

	_test("get_orders(status=Delivered)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.order.order.get_orders", status="Delivered"))

	user_order = frappe.get_all("Order", filters={"user": test_user, "docstatus": 1}, limit=1, pluck="name")
	if user_order:
		_test("get_order_detail(order)", lambda: frappe.call(
			"velora_verse.velora_verse.doctype.order.order.get_order_detail", order_name=user_order[0]))
	else:
		print("  SKIP  get_order_detail() — no order")

	# place_order — test with current cart
	_test("place_order()", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.order.order.place_order",
		shipping_address=user_addr[0] if user_addr else None,
		payment_method="COD"))

	# Skip cancel_order (destructive)
	print("  SKIP  cancel_order() — destructive, would cancel a real order")

	# ── 12. PAYMENT APIs (payment_log.py) — 4 endpoints ──────────
	print("\n--- 12. Payment APIs (payment_log.py) ---")

	# Find the order just placed
	new_order = frappe.get_all("Order", filters={"user": test_user, "payment_status": "Unpaid"}, order_by="creation desc", limit=1, pluck="name")
	if new_order:
		_test("create_payment(order_name, gateway)", lambda: frappe.call(
			"velora_verse.velora_verse.doctype.payment_log.payment_log.create_payment",
			order_name=new_order[0], payment_gateway="Razorpay"))

		# process_cod_payment needs Store Admin role — test under admin context
		print("  SKIP  process_cod_payment() — tested under admin section below")
	else:
		print("  SKIP  create_payment() — no unpaid order")
		print("  SKIP  process_cod_payment() — no unpaid order")

	# Skip verify_payment (needs real Razorpay data)
	# Skip razorpay_webhook (needs POST with signature)
	print("  SKIP  verify_payment() — needs real Razorpay credentials")
	print("  SKIP  razorpay_webhook() — needs POST with signature")

	# ── 13. RETURN REQUEST APIs (return_request.py) — 4 endpoints ─
	print("\n--- 13. Return Request APIs (return_request.py) ---")

	_test("get_return_requests()", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.return_request.return_request.get_return_requests"))

	# Skip create_return_request (needs valid delivered order within 7 days)
	print("  SKIP  create_return_request() — needs order delivered within 7 days")

	# ── 14. STOCK NOTIFICATION APIs — 2 endpoints ────────────────
	print("\n--- 14. Stock Notification APIs ---")

	oos_variant = frappe.get_all("Variants", filters={"is_stock": 0}, limit=1, pluck="name")
	if oos_variant:
		_test("subscribe_stock_notification(variant)", lambda: frappe.call(
			"velora_verse.velora_verse.doctype.stock_notification.stock_notification.subscribe_stock_notification",
			variant=oos_variant[0]))

		_test("unsubscribe_stock_notification(variant)", lambda: frappe.call(
			"velora_verse.velora_verse.doctype.stock_notification.stock_notification.unsubscribe_stock_notification",
			variant=oos_variant[0]))
	else:
		print("  SKIP  subscribe/unsubscribe — no OOS variant")

	# ── 15. INVENTORY APIs (inventory_log.py) — 2 endpoints ──────
	print("\n--- 15. Inventory & Payment Admin APIs [Admin] ---")
	frappe.set_user("Administrator")

	# process_cod_payment (needs Store Admin)
	cod_order = frappe.get_all("Order", filters={"payment_method": "COD", "payment_status": "Unpaid", "docstatus": 1}, limit=1, pluck="name")
	if cod_order:
		_test("process_cod_payment(order_name) [Admin]", lambda: frappe.call(
			"velora_verse.velora_verse.doctype.payment_log.payment_log.process_cod_payment",
			order_name=cod_order[0]))
	else:
		print("  SKIP  process_cod_payment() — no unpaid COD order")

	_test("restock_variant(variant, qty)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.inventory_log.inventory_log.restock_variant",
		variant=variant, quantity=5, reason="Smoke test restock"))

	_test("adjust_stock(variant, new_qty)", lambda: frappe.call(
		"velora_verse.velora_verse.doctype.inventory_log.inventory_log.adjust_stock",
		variant=variant, new_quantity=50, reason="Smoke test adjustment"))

	# ── 16. RETURN ADMIN APIs — 2 endpoints ──────────────────────
	print("\n--- 16. Return Admin APIs [Admin] ---")

	pending_return = frappe.get_all("Return Request", filters={"status": "Pending", "docstatus": 0}, limit=1, pluck="name")
	if pending_return:
		_test("approve_return(return_request)", lambda: frappe.call(
			"velora_verse.velora_verse.doctype.return_request.return_request.approve_return",
			return_request=pending_return[0], admin_notes="Smoke test approval"))

		pending2 = frappe.get_all("Return Request", filters={"status": "Pending", "docstatus": 0}, limit=1, pluck="name")
		if pending2:
			_test("reject_return(return_request)", lambda: frappe.call(
				"velora_verse.velora_verse.doctype.return_request.return_request.reject_return",
				return_request=pending2[0], admin_notes="Smoke test rejection"))
		else:
			print("  SKIP  reject_return() — no more pending returns")
	else:
		print("  SKIP  approve_return() — no pending returns")
		print("  SKIP  reject_return() — no pending returns")

	# ── 17. DASHBOARD APIs (dashboard.py) — 3 endpoints ──────────
	print("\n--- 17. Dashboard APIs (dashboard.py) [Admin] ---")

	_test("get_dashboard_stats(monthly)", lambda: frappe.call(
		"velora_verse.api.dashboard.get_dashboard_stats", period="monthly"))

	_test("get_revenue_chart(monthly, day)", lambda: frappe.call(
		"velora_verse.api.dashboard.get_revenue_chart", period="monthly", group_by="day"))

	_test("get_order_funnel()", lambda: frappe.call(
		"velora_verse.api.dashboard.get_order_funnel"))

	# ── 18. BULK OPERATIONS (bulk_operations.py) — 1 endpoint ────
	print("\n--- 18. Bulk Operations (bulk_operations.py) [Admin] ---")

	_test("export_products()", lambda: frappe.call(
		"velora_verse.api.bulk_operations.export_products"))

	# Skip import/bulk_update (need actual CSV files, runs background jobs)
	print("  SKIP  import_products() — needs CSV file")
	print("  SKIP  bulk_update_stock() — needs CSV file")
	print("  SKIP  bulk_update_prices() — needs CSV file")

	# ── 19. Analytics Admin APIs (analytics.py) — 2 endpoints ────
	print("\n--- 19. Analytics Admin APIs (analytics.py) [Admin] ---")

	_test("get_event_summary() [Admin]", lambda: frappe.call(
		"velora_verse.api.analytics.get_event_summary"))

	_test("get_conversion_funnel() [Admin]", lambda: frappe.call(
		"velora_verse.api.analytics.get_conversion_funnel"))

	# ── 20. Webhook Admin APIs (webhooks.py) — 2 endpoints ───────
	print("\n--- 20. Webhook Admin APIs (webhooks.py) [Admin] ---")

	wh_sub = frappe.get_all("Webhook Subscription", limit=1, pluck="name")
	if wh_sub:
		_test("test_webhook(subscription) [Admin]", lambda: frappe.call(
			"velora_verse.api.webhooks.test_webhook", subscription_name=wh_sub[0]))

		_test("get_webhook_logs(subscription) [Admin]", lambda: frappe.call(
			"velora_verse.api.webhooks.get_webhook_logs", subscription_name=wh_sub[0]))
	else:
		print("  SKIP  test_webhook() — no webhook subscription")
		print("  SKIP  get_webhook_logs() — no webhook subscription")

	# ── RESULTS ───────────────────────────────────────────────────
	frappe.set_user("Administrator")
	total = PASS + FAIL
	print("\n" + "=" * 70)
	print(f"RESULTS: {PASS} PASSED / {FAIL} FAILED / {total} TESTED")
	skipped = 90 - total
	print(f"SKIPPED: {skipped} (destructive, need credentials, or need CSV)")
	print("=" * 70)

	if ERRORS:
		print("\nFAILURES:")
		for label, err in ERRORS:
			print(f"  {label}")
			print(f"    {err}")

	# Cleanup: rollback any test mutations
	frappe.db.rollback()
	print("\nRolled back all test mutations.")
