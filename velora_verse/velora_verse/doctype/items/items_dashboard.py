from frappe import _


def get_data():
	return {
		"fieldname": "variant_name",
		"non_standard_fieldnames": {
			"Review": "item",
		},
		"transactions": [
			{"label": _("Variants"), "items": ["Variants"]},
			{"label": _("Reviews"), "items": ["Review"]},
		],
	}
