const retail = ['shopping', 'retail', 'service'];
const health = ['gym', 'health', 'beauty'];
const food = ['food', 'drink', 'eat'];
const entertainment = ['fun', 'entertainment'];

const keywords = {
    'Retail' : retail,
    'Health' : health,
    'Food' : food,
    'Entertainment' : entertainment
};

let getKeyword = function(phrase) {
    var keys = Object.keys(keywords);
    for(let i = 0; i < keys.length; i++) {
        for(let j = 0; j < keywords[keys[i]].length; j++) {
            if(keywords[keys[i]][j] === phrase) {
                return keys[i];
            }
        }
    }
};

/*
 Index of Return Array
 0 - Title of Deal
 1 - Original Price
 2 - New Price
 3 - Image URI
 4 - Address
 5 - Latitude
 6 - Longitude
 7 - City
 8 - Name
 9 - Link
 10 - State
 */
let getDealbyType = function(data, type) {
    let deals = [];
    if(data != null || data != undefined) {
        data.map((item) => {
            let category = JSON.stringify(item.deal.category).toString().split(" ")[0].replace(/['"]+/g, '');
            if(category === type) {
                let info = [];

                let title = JSON.stringify(item.deal.title).toString().replace(/['"]+/g, '');
                let price = JSON.stringify(item.deal.price).toString().replace(/['"]+/g, '');
                let value = JSON.stringify(item.deal.value).toString().replace(/['"]+/g, '');
                let image = JSON.stringify(item.deal.image_thumb_retina).toString().replace(/['"]+/g, '');
                let address = JSON.stringify(item.merchant.address).toString().replace(/['"]+/g, '');
                let lat = JSON.stringify(item.merchant.latitude).toString().replace(/['"]+/g, '');
                let long = JSON.stringify(item.merchant.longitude).toString().replace(/['"]+/g, '');
                let city = JSON.stringify(item.merchant.city).toString().replace(/['"]+/g, '');
                let name = JSON.stringify(item.merchant.name).toString().replace(/['"]+/g, '');
                let link = JSON.stringify(item.deal.link).toString().replace(/['"]+/g, '');
                let state = JSON.stringify(item.merchant.state).toString().replace(/['"]+/g, '');

                info.push(title);
                info.push(price);
                info.push(value);
                info.push(image);
                info.push(address);
                info.push(lat);
                info.push(long);
                info.push(city);
                info.push(name);
                info.push(link);
                info.push(state);

                deals.push(info);
            }
        });
    }
    let rand = Math.floor((Math.random() * deals.length));
    return deals[rand];
};

let getMerchantTitle = function(deal) {
    let raw_name = deal;
    let name = "";
    for(let i = 0; i < raw_name.length; i++) {
        if(raw_name[i] === '[') {
            return name.replace(/['"]+/g, '');
        } else {
            name += raw_name[i];
        }
    }
    return name.replace(/['"]+/g, '');
};

exports.getKeyword = getKeyword;
exports.getDealbyType = getDealbyType;
exports.getMerchantTitle = getMerchantTitle;
