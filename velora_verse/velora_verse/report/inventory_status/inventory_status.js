frappe.query_reports["Inventory Status"] = {
	filters: [
		{
			fieldname: "stock_status",
			label: __("Stock Status"),
			fieldtype: "Select",
			options: "\nIn Stock\nOut of Stock\nLow Stock",
		},
	],
};
