// Copyright (c) 2026, velora-verse and contributors
// For license information, please see license.txt

frappe.ui.form.on("Variants", {
    setup(frm) {
        frm.set_query("value", "variant_values", function (doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            if (row.type) {
                return {
                    query: "velora_verse.velora_verse.doctype.variants.variants.get_variant_values",
                    filters: {
                        variant_type: row.type
                    }
                };
            }
        });
    },
});

frappe.ui.form.on("Variant Table", {
    type: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.type) {
            frappe.model.set_value(cdt, cdn, "value", ""); 
        }
    }
});
