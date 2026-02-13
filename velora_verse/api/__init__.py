# Re-export all public functions from products.py for backward compatibility.
# Allows: velora_verse.api.get_products, velora_verse.api.get_product_detail, etc.
from velora_verse.api.products import (  # noqa: F401
	get_products,
	get_product_detail,
	get_categories,
	get_category_tree,
	get_featured_products,
	search_products,
	get_product_filters,
	get_user_profile,
	get_recommendations,
	track_product_view,
	get_recently_viewed,
	get_category_detail,
	_attach_primary_images,
	_attach_categories,
)
