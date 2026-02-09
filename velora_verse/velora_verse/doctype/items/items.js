// Copyright (c) 2026, velora-verse and contributors
// For license information, please see license.txt

frappe.ui.form.on("Items", {
    setup(frm) {
        frm.set_query("category", "category", function (doc, cdt, cdn) {
            return {
                query: "velora_verse.velora_verse.doctype.items.items.get_leaf_categories"
            };
        });
    },
});
