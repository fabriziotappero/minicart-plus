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
        shipping_subtxt = "International Registered Mail",
        shipping_currency = "EUR",
        check_out_button_txt = "Check Out",
        cont_shopping_button_txt = "Continue Shopping",
        cart_total_txt = "",
        discount_txt = "";

    /* Fill in allowable country and the shipping price */
    var countries = [
        {countryName: 'United States', shippingPrice: 10.00},
        {countryName: 'Canada', shippingPrice: 20.00},
        {countryName: 'England', shippingPrice: 30.00}
    ]
    /* ################################################################### */


    // Initialized options for shipping locations
    var option = '';
    countries.forEach(function(country, index) {
        //if location equals countryName set option selected
        if (document.cookie.replace(/(?:(?:^|.*;\s*)location\s*\=\s*([^;]*).*$)|^.*$/, "$1") == country.countryName) {
            option += '<option selected value="'+ country.shippingPrice + '">' + country.countryName + '</option>';
        }else {
            option += '<option value="'+ country.shippingPrice + '">' + country.countryName + '</option>';
        }
    });

    function calculateLocationShipping() {
        // alert( "Handler for .change() called." );
        if (document.cookie.replace(/(?:(?:^|.*;\s*)location\s*\=\s*([^;]*).*$)|^.*$/, "$1") === $( "#location option:selected" ).text()) {
        }else {
            document.cookie = "locationPrice="+ $( "#location option:selected" ).val() +";";
            document.cookie = "location="+ $( "#location option:selected" ).text() +";";
        }
        update_cart_shipping_cost();
    }

    /* restyle the shopping cart has we like */
    function restyle_shopping_cart() {
        /* make all quantity fields not editable */
        $('#PPMiniCart .minicart-quantity').attr('readonly', 'readonly');
        $('#PPMiniCart .minicart-quantity').css({
            'background': 'white',
            'border': '0',
            'box-shadow': 'none'
        });

        //Make sure this only run once so it doesnt duplicate the selectbox
        if (!$(".minicart-location").length) {
            /* Add country select list */    
            $('.minicart-footer').before("<div class='minicart-location'><strong>Location: </strong><select id='location'>"+option+"</select></div>");
            /* style selectbox location */
            $('#PPMiniCart .minicart-location').css({
                'margin': '6px',
                'margin-bottom': '15px'
            });
            $( ".minicart-location" ).change(function() {
                calculateLocationShipping();
            });
        }

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
        var i, ii, shop_items;
        var location_cost = $( "#location option:selected" ).val()

        /* get all current shopping items */
        shop_items = paypal.minicart.cart.items();

        /* delete any previous shipping charge item */
        for (i = 0; i < shop_items.length; i++) {
            if (shop_items[i].get('item_name').toLowerCase() == shipping_txt.toLowerCase()) {
                //console.log(shop_items);
                paypal.minicart.cart.remove(i);
            }
        }

        // console.log("shop_items:", shop_items);

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

        //console.log("n", cart_items_n);
        //console.log("q", cart_items_q);

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
        //console.log("New Shipping Weight:",shipping_weight_g);

        // calculate total shipping cost and add to cart
        var shipping_cost = parseFloat(location_cost) + shipping_fee_base + (shipping_weight_g / 1E3) * shipping_fee_per_kg;
        if (shipping_weight_g > 0) {
            shipping_cost = shipping_cost.toFixed(2);
        } else {
            shipping_cost = 0.00;
        }
        p = {
            "business": business_name,
            "item_name": shipping_txt,
            "item_number": shipping_subtxt,
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
