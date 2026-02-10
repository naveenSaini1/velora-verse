from frappe import _


def get_data():
	return {
		"fieldname": "variant",
		"non_standard_fieldnames": {},
		"internal_links": {
			"Wishlist": ["wishlist_items", "variant"],
			"Cart": ["cart_items", "variant"],
		},
		"transactions": [
			{"label": _("Wishlist"), "items": ["Wishlist"]},
			{"label": _("Cart"), "items": ["Cart"]},
		],
	}
