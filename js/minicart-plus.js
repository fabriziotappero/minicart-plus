/*!
 * Minicart-plus is a great PayPal shopping cart written in JavaScript.
 *
 * @version 1.2
 * @author Fabrizio Tappero <https://github.com/fabriziotappero>
 * @license <https://github.com/fabriziotappero/minicart-plus/blob/gh-pages/LICENSE>
 */
$(document).ready(function() {

    /* ################################################################### */
    var business_name = "myName@example.com",
        shipping_fee_base = 12.00,
        shipping_fee_per_kg = 6.50,
        shipping_txt = "Shipping and Handling",
        shipping_subtxt = "International Mail",
        shipping_currency = "EUR",
        min_items_order = 6,
        check_out_button_txt = "Check Out",
        cont_shopping_button_txt = "Continue Shopping",
        cart_total_txt = "",
        discount_txt = "";
    /* ################################################################### */

    /* restyle the shopping cart has we like */
    function restyle_shopping_cart() {
        /* make all quantity fields not editable */
        $('#PPMiniCart .minicart-quantity').attr('readonly', 'readonly');
        $('#PPMiniCart .minicart-quantity').css({
            'background': 'white',
            'border': '0',
            'box-shadow': 'none'
        });
        /* hide shipping cost item quantity and delete button*/
        $("#PPMiniCart .minicart-item").each(function() {
            if ($(this).find('.minicart-name').text().toLowerCase() == shipping_txt.toLowerCase()) {
                $(this).find('.minicart-quantity').css('visibility', 'hidden');
                $(this).find('.minicart-remove').css('visibility', 'hidden');
            }
        });
        /* style close button and check out buttons */
        $('.minicart-submit').css({
            'right': '148px',
            'min-width': '77px',
            'font-size': '14px',
            'padding': '5px 2px',
            'font-weight': 'normal',
            'background': 'linear-gradient(to bottom, #fff6e9 0%, #ffaa00 100%) repeat scroll 0 0 rgba(0, 0, 0, 0)',
            'color': '#2F2F2F'
        });

        $('.minicart-closer').text(cont_shopping_button_txt);
        $('.minicart-closer').css({
            'position': 'absolute',
            'right': '5px',
            'height': '33px',
            'min-width': '90px',
            'font-size': '14px',
            'font-weight': 'normal',
            'margin': '-3px -2px',
            'padding': '5px 2px',
            'background': 'linear-gradient(to bottom, #fff6e9 0%, #ffaa00 100%) repeat scroll 0 0 rgba(0, 0, 0, 0)',
            'color': '#2F2F2F',
            'border': '1px solid #ffc727',
            'border-radius': '5px'
        });
        $('.minicart-closer').insertAfter('.minicart-submit');

        return 0;
    }


    /* calcualate shipping costs and update the cart */
    function update_cart_shipping_cost(idx, product) {
        var i, ii, shop_items, num_items=0;

        /* get all current shopping items */
        shop_items = paypal.minicart.cart.items();

        /* delete any previous shipping charge item */
        for (i = 0; i < shop_items.length; i++) {
            if (shop_items[i].get('item_name').toLowerCase() == shipping_txt.toLowerCase()) {
                paypal.minicart.cart.remove(i);
            }
        }

        /* get quantity and weight for each cart item and calculate total weight */
        var cart_items_q = [],
            cart_items_n = [],
            w = 0;

        var forms = $('#PayPalMiniCart form'),
            shipping_weight_g = 0;

        for (i = 0; i < shop_items.length; i++) {
            cart_items_q.push(shop_items[i].get('quantity')); //shopping cart item quantity
            cart_items_n.push(shop_items[i].get('item_name')); //shopping cart item name
        }

        //console.log("Numbers:",cart_items_q.length);

        // search for the corresponding weight of each item in the cart
        for (i = 0; i < cart_items_n.length; i++) {
            // search for the weight of cart_items_n[i] inside forms
            for (ii = 0; ii < forms.length; ii++) {
                if (forms.children('input[name="item_name"]')[ii].value == cart_items_n[i]) {
                    w = forms.children('input[name="weight_g"]')[ii].value;
                    shipping_weight_g += parseFloat(cart_items_q[i] * w);
                }
            }
        }
        
        // number of items in the basket
        num_items = cart_items_n.length;
    

        // calculate total shipping cost and add to cart
        var shipping_cost = shipping_fee_base + (shipping_weight_g / 1E3) * shipping_fee_per_kg;
        if (shipping_weight_g > 0) {
            shipping_cost = shipping_cost.toFixed(2);
        } else {
            shipping_cost = 0.00;
        }
        p = {
            "business": business_name,
            "item_name": shipping_txt,
            // Add purchased items in shipping_subtxt,
            "item_number": shipping_subtxt + " (" + num_items.toString() + " items)",
            "amount": shipping_cost,
            "currency_code": shipping_currency
        };
        paypal.minicart.cart.add(p);

        /* restyle shopping cart as we like */
        restyle_shopping_cart()

        return 0;
    }

    /* show shopping cart*/
    $('#PayPalMiniCart_ViewCart').click(function(e) {
        e.stopPropagation();
        paypal.minicart.view.show();

        /* restyle shopping cart as we like */
        restyle_shopping_cart()

    });

    /* render shopping cart and reposition on the right*/
    paypal.minicart.render({
        strings: {
            button: check_out_button_txt,
            subtotal: cart_total_txt,
            discount: discount_txt
        }
    });
    
    /* fix a minimum order of items in the shopping cart */
    paypal.minicart.cart.on('checkout', function (evt) {
        var items = this.items(),
            len = items.length,
            total = 0,
            i;
        // Count the number of each item in the cart
        for (i = 0; i < len; i++) {
            total += items[i].get('quantity');
        }
        if (total < (min_items_order+1)) {
            alert('Minimum order quantity is ' + min_items_order.toString() + '. Please add more to your shopping cart.');
            evt.preventDefault();
        }
    });

    $('#PPMiniCart').css({
        "right": "10px",
        "left": "auto"
    });

    // every time an item is removed calculate and update the cart shipping weight
    paypal.minicart.cart.on('remove', function(idx, product) {
        // do nothing if the item removed is the shipping cost
        if (product.get('item_name').toLowerCase() == shipping_txt.toLowerCase()) {
            return 0;
        }

        // calculate shipping costs
        update_cart_shipping_cost(idx, product);

        return 0;
    });

    // every time an item is added calculate and update the cart shipping weight
    paypal.minicart.cart.on('add', function(idx, product, isExisting) {
        // do nothing if the item added is the shipping cost
        if (product.get('item_name').toLowerCase() == shipping_txt.toLowerCase()) {
            return 0;
        }
        // calculate and update shipping costs
        update_cart_shipping_cost(idx, product);
        return 0;
    });

});
