/* global console Drupal node_delete node_load user_login user_logout user_retrieve node_create entity_create entity_index node_index taxonomy_term_index system_connect */

import { map, forIn, filter, get, property, trimEnd, sortBy, escape as htmlescape } from "lodash";

import sanitizeHtml from 'sanitize-html';

// if need date stuff, use https://date-fns.org/ instead of moment.js

// packaging as an app for app stores... another 2-3 days per app store.. but maybe quicker w/ phonegap build..
// packaging as a PWA .. 1-2 days?


var DEBUG = true;

function log() {
    if (!DEBUG) return;
    console.log.apply(console, arguments);
}

var USE_PROD_API = true, // enable for development to use production data instead of test data

    PROD_DOMAIN = "danecountytimebank.org",
    MOBILE_DOMAIN = "m.danecountytimebank.org",
    TEST_DOMAIN = "timebank-testsite.org",

    PROD = USE_PROD_API || (window.location.href.indexOf('https://' + MOBILE_DOMAIN + '/') === 0),

    API_PATH = 'https://' + (PROD ? MOBILE_DOMAIN : TEST_DOMAIN),
    SITE_PATH = 'https://' + (PROD ? PROD_DOMAIN : TEST_DOMAIN),

    FILE_PATH = SITE_PATH + '/sites/danecountytimebank.org/files/',

    //ORIG_PIC_PATH = FILE_PATH,
    LARGE_PIC_PATH = FILE_PATH + 'styles/large/public/',
    THUMB_PATH = FILE_PATH + 'styles/thumbnail/public/';
    //PROFILE_PIC_PATH = THUMB_PATH + 'pictures/';


Drupal.settings.site_path = API_PATH;
Drupal.settings.endpoint = "rest";
Drupal.settings.cache.entity.enabled = true;
Drupal.settings.cache.entity.expiration = 60*60; // *24; // seconds

Drupal.settings.debug = false;

/*
function sc() {
    log('system connect');
    // resets user login if already logged in..
    system_connect({
        success: function(result) {
            log('connected user', Drupal.user);
        }
    });
}
*/

function get_site_path() {
    return SITE_PATH;
}

function error_logged_out(status, msg) {
    return status === 403 && (
        msg.indexOf('Access restricted to logged in users') > -1 ||
        msg.indexOf('Access denied for user anonymous') > -1
    );
}

function logout(success, error) {
    user_logout({
        success: success,
        error: function(xhr, status, msg) {
            if (error) error(status, msg);
        }
    });
}

function login(username_or_email, password, success, error) {
    user_login(username_or_email, password, {
        success: function(result) {
            if (success) success(result.user.uid); // could pass the whole user.. but if I do will want it to be the same format as get_user returns
        },
        error: function(xhr, status, message) {
            if (error) error(status, message);
        }
    });
}


var iso8601_numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ];

function iso8601_parse(date) {
    var timestamp, struct, minutesOffset = 0;

    // ES5 §15.9.4.2 states that the string should attempt to be parsed as a Date Time String Format string
    // before falling back to any implementation-specific date parsing, so that’s what we do, even if native
    // implementations could be faster
    //              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ±    10 tzHH    11 tzmm
    if ((struct = /^(\d{4}|[+-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
        // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
        for (var i = 0, k; (k = iso8601_numericKeys[i]); ++i) {
            struct[k] = +struct[k] || 0;
        }

        // allow undefined days and months
        struct[2] = (+struct[2] || 1) - 1;
        struct[3] = +struct[3] || 1;

        if (struct[8] !== 'Z' && struct[9] !== undefined) {
            minutesOffset = struct[10] * 60 + struct[11];

            if (struct[9] === '+') {
                minutesOffset = 0 - minutesOffset;
            }
        }

        timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
    } else {
        timestamp = Date.parse ? Date.parse(date) : NaN;
    }

    return timestamp;
}


function html2text(html) {
    // may need to make this much more complicated based on the text found in post bodies..
    //return html.replace(/<p>/g, '').replace(/<\/p>/g, '\n');
    var el = document.createElement("div");
    el.innerHTML = html;
    return el.innerText || el.textContent || '';
}

function plaintext2html(text, tabstop, nofollow, noreferrer) {
    if (tabstop === undefined) tabstop = 4;
    if (nofollow === undefined) nofollow = 1;
    if (noreferrer === undefined) noreferrer = 0;

    // fix for linkifying links right after '\n ' or at beginning w/ a space
    // kinda hacky by using a unicode character but somewhat easier than
    // debugging the complex regex
    text = text.replace(/(^|\n)([ ]+)http/gim, function(){
        var txt = arguments[0],
            out = txt[0] === '\n' ? '\n' : '';

        for (var i = 0; i < arguments[2].length; ++i) {
            out += '¦'; // broken bar unicode as a placeholder for space
        }
        out += ' http'; // adding an extra space that will be removed later
        return out;
    });

    var plaintext_re = /([<&>])|(^[ \t]+)|(\r\n|\r|\n)|((^|\s|)(https?:\/\/[^\s)\]>*]+))(\s|$|\)|\]|>|\*)/gim,
        space = '&nbsp;',
        tab = '';
    for (var i = 0; i < tabstop; ++i) { tab += space; }
    
    function do_sub(){
        var arr = arguments;
        if (arr[1]) {
            return htmlescape(arr[1]);
        } else if (arr[3]) {
            return '<br />';
        } else if (arr[2]) {
            return arr[0].replace(/\t/g, tab).replace(/ /g, space);
        } else if (arr[2] === '\t') {
            return tab;
        } else {
            var url = arr[4],
                prefix = '';
            if (url.charAt(0) === ' ') {
                prefix = ' ';
                url = url.slice(1);
            }
            var last = arr[0][arr[0].length - 1]; // last char in full match
            if (['\n', '\r', '\r\n'].indexOf(last) > -1) {
                last = '<br />';
            } else if (last === ' ') {
                // leave it be
            } else {
                last = '';
            }
            var display_url = url;
            if (url.length > 78) {
                display_url = url.slice(0, 75) + '...';
            }
            var nf = 'rel="nofollow"';
            if (!nofollow) nf = '';
            if (noreferrer) nf += ' rel="noreferrer"';

            return prefix + '<a target="_blank" rel="external" href="'+url+'" '+nf+'>'+display_url+'</a>'+last;
        }
    }
    return text.replace(plaintext_re, do_sub).replace(/¦ /g, '¦').replace(/¦/g, space);
}


function cleanup_html(html, user_submitted) {

    html = sanitizeHtml(
        html,
        {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'span']),
            //allowedAttributes: ,
            allowedAttributes: {
                a: ['href', 'name', 'target'],
                img: ['src', 'alt', 'width', 'height', 'max-width', 'max-height'], // style max-width, max-height
                div: ['style'],
                p: ['style'],
                span: ['style'],
            },
            allowedStyles: {
                '*': {
                    // don't allow user submitted content to change the color or font-size
                    // (b/c they could make it too small or too light such that it is unreadable)
                    'color': [user_submitted ? /^$/ : /.*/],
                    'font-size': [user_submitted ? /^$/ : /^(?!12px)(.*)$/], // 12px is too small on mobile // https://stackoverflow.com/questions/2078915/a-regular-expression-to-exclude-a-word-string
                    'font-weight': [/.*/],
                    'text-decoration': [/.*/],
                    'font-style': [/.*/],
                    'text-decoration-line': [/.*/],
                    'text-align': [/.*/],
                }
            }

        }
    );

    // XXX: not sure if we should allow iframes..
    // <iframe allowfullscreen="" frameborder="0" height="360" mozallowfullscreen="" src="https://player.vimeo.com/video/147421311" webkitallowfullscreen="" width="640"></iframe>

    // could use a sanitizeHTML transformation to more cleanly make this change.. https://github.com/punkave/sanitize-html
    html = trimEnd(html.replace(/<a /g, '<a class="link external" target="_blank" ')); // very naive implementation..

    // remove paragraph based whitespace
    html = trimEnd(html).replace(/(\s+<p>(\s|&nbsp;)+<\/p>)+$/g, ''); 

    return html;
}


function args_to_str(args) {
    return Object.keys(args).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(args[k])).join('&');
}

function get_posts(args, success, error) {
    // wants args to be of format: {type: 'offer'/'want', start:0, num:20, query:'search term (optional)', user_ids: '1,2' (optional)}

    // TODO later: figure out how to do advanced searches though..
    //             eg. zip code, neighborhood, containing words
    //
    // TODO later: figure out how to list specific categories (may not be a search thing..) 
    //             w/o search probably just call taxonomy_select_nodes or in jdrupal taxonomy_term_index
    //             each category has a different number when shown on site, eg. http://timebank-testsite.org/wants/555
    //             and search works within the categories.. (probably uses Taxonomy module ..)

    args = args_to_str(args);

    entity_index('post/index', args || '', {
        success: function(entities) {
            if (success) success(entities);
        },
        error: function(xhr, status, msg) {
            if (error) error(status, msg, error_logged_out(status, msg));
        }
    });
}

/*
function get_propositions(success) { 
    var query = {
        parameters: {
            'type': 'proposition'
        }
    };
    node_index(query, {
        success: function(nodes) {
            log('propositions', nodes);
            if (success) success(nodes);
        }
    });
}
*/


function image_uri_to_path(uri) {
    return uri.replace('public://', '');
}

function thumb_image(uri) {
    return THUMB_PATH + image_uri_to_path(uri);
}

function large_image(uri) {
    return LARGE_PIC_PATH + image_uri_to_path(uri);
}

function _user(user) {
    // normalizes user data
    //console.log('got full user', user);

    // XXX: should probably also cleanup/delete unused user properties before returning

    user.user_id = user.uid;

    var filepath = get(user, 'picture.uri') || get(user, 'field_user_photo.und[0].uri');

    if (filepath) {
        /*
        user.picture_width = 1 * user.picture.width;
        user.picture_height = 1 * user.picture.height;

        doesn't have width or height..
        */
        user.picture_url = large_image(filepath);
        user.thumbnail_url = thumb_image(filepath);
    }

    var addr_info = user.profile_address ? user.profile_address.und : null;
    if (addr_info) {
        addr_info = addr_info[0];
    }
    if (addr_info) {
        user.location = {
            street: addr_info.thoroughfare,
            area: addr_info.dependent_locality,
            city: addr_info.locality,
            postal_code: addr_info.postal_code
        };
        // user.display_addr = [addr_info.dependent_locality, addr_info.locality, addr_info.name_line, addr_info.organisation_name, addr_info.postal_code, addr_info.thoroughfare];
    } else {
        user.location = {};
    }

    // user.profile_phones.und[0] .. [1] ..  .value
    // user.profile_notes.und[0].safe_value / value

    user.phones = [];
    if (user.profile_phones && user.profile_phones.und) {
        for (var i = 0; i < user.profile_phones.und.length; ++i) {
            user.phones.push(user.profile_phones.und[i].value);
        }
    }
    if (user.phones.length === 0) {
        user.phones = null;
    }

    // user.profile_notes.und[0].safe_value
    if (user.profile_notes && user.profile_notes.und) {
        user.description = user.profile_notes.und[0].safe_value;
    }
    return user;
}

function get_current_user(success, error) {
    system_connect({
        success: function(data){
            if (success) success(_user(data.user)); // XXX: may not retrieve full user data like get_user does..
        },
        error: function(xhr, status, msg) {
            if (error) error(status, msg);
        }
    });
}

function get_user(user_id, success, error) {
    user_retrieve([user_id], {
        success: function(user) {
            //console.log('got user', user);
            if (success) success(_user(user));
        },
        error: function(xhr, status, msg) {
            //console.log('error get user', status, msg);
            if (error) error(status, msg, error_logged_out(status, msg));
        }
    });
    /*
{'access': '1487811798',
 'account_offline': {'und': [{'value': '0'}]},
 'created': '1433370545',
 'data': {'block': {'views': {'calendar-block_1': 0}},
  'cforge_broadcast_optout': 0,
  'contact': 1,
  'mimemail_textonly': False},
 'demog_born': {'und': [{'value': '1971'}]},
 'demog_education': {'und': [{'value': 'graduate'}]},
 'demog_income_dollars_year': {'und': [{'value': '15000'}]},
 'demog_langs_spoken': {'und': [{'value': 'english'}]},
 'demog_misc': [],
 'demog_race_ethnicity': [],
 'field_person_or_organization_': {'und': [{'value': '1'}]},
 'language': '',
 'login': '1487811798',
 'manage_responsibility': [],
 'name': 'Anita Pradhan',
 'picture': {'fid': '561',
  'filemime': 'image/jpeg',
  'filename': 'picture-4190-1433372685.jpg',
  'filesize': '4986',
  'status': '1',
  'timestamp': '1433372685',
  'uid': '4190',
  'uri': 'public://pictures/picture-4190-1433372685.jpg',
  'url': 'http://timebank-testsite.org/sites/danecountytimebank.org/files/pictures/picture-4190-1433372685.jpg'},
 'profile_address': {'und': [{'administrative_area': None,
    'country': 'US',
    'data': None,
    'dependent_locality': 'Madison/West',
    'first_name': 'Anita',
    'last_name': 'Pradhan',
    'locality': 'Madison',
    'name_line': 'Anita Pradhan',
    'organisation_name': None,
    'postal_code': '53705',
    'premise': None,
    'sub_administrative_area': None,
    'sub_premise': None,
    'thoroughfare': '318 Cheyenne Trail'}]},
 'profile_notes': {'und': [{'format': None,
    'safe_value': 'I like contributing to non-profit information management.',
    'value': 'I like contributing to non-profit information management.'}]},
 'profile_phones': {'und': [{'format': None,
    'safe_value': '608 333-4455',
    'value': '608 333-4455'}]},
 'roles': {'2': 'authenticated user', '3': 'trader', '4': 'committee'},
 'signature': '',
 'signature_format': 'editor_filtered_html',
 'status': '1',
 'theme': '',
 'timezone': None,
 'uid': '4190'}
    */
}


function get_node(nid, success, error) {
    // can get one or more nodes
    // 
    // can also call node_load which uses caching..

    // node_retrieve([nid], 

    // node load is more useful than node_retrieve for the case of one node
    // b/c it caches for a day
    node_load(nid, {
        success: success,
        error: function(xhr, status, msg) {
            if (error) error(status, msg);
        }
    });
}


function get_post(pid, success, error) {
    get_post_categories();

    get_node(pid, function(node) {
        var img = null,
            categories = [];

        // TODO later: have get_post return the area
        //             b/c it's a property on the user and not the post
        //             it doesn't come back when we just request the post node..
        //             ( users_node__field_data_profile_address.profile_address_dependent_locality )
        //             alternatively can request the user after requesting the post

        if (node.image && node.image.und) {
            img = node.image.und[0]; // may be multiple images..
            img = {
                image_id: img.fid,
                thumbnail_url: thumb_image(img.uri),
                url: large_image(img.uri),

                // width and height are for the original unresized image..
                
                // TODO later: find out what constraints the large image size map to.. ask Jon
                //             480x369 is what one large image size is..
                //             480x480 is another one..
                //             so i'm gonna guess 480

                //height: 1 * img.height,
                //width: 1 * img.width,
            };
        }

        if (node.offers_wants_categories && node.offers_wants_categories.und) {
            var cats = node.offers_wants_categories.und,
                cstr,
                cid;
            if (CATEGORIES) {
                //console.log('cats', CATEGORIES);
                for (var i = 0; i < cats.length; ++i) {
                    //console.log(cats[i]);
                    cid = cats[i].tid * 1;
                    cstr = CATEGORIES[cid];
                    if (cstr) categories.push({id: cid, name: cstr});
                }
            }
        }

        // support newer field and older field
        var end = get(node, 'field_expiration_date.und[0].value', '');
        if (end) {
            // newer field is stored as a string, eg. 2018-12-21 00:00:00
            end = (new Date(end)).getTime() / 1000; 
        } else if (node.end) {
            // older field is stored as a unix timestamp
            end = 1 * node.end;
        }

        var post = {
            post_id: node.nid,
            type: node.want === '1' ? 'want' : 'offer',
            title: node.title,
            body: cleanup_html(get(node, 'body.und[0].safe_value', ''), true),
            text_body: html2text(get(node, 'body.und[0].value')),
            changed: 1 * node.changed,
            created: 1 * node.created,
            end: end,
            image: img,
            user_name: node.name,
            user_id: node.uid,
            categories: categories // as array of {id:, name:} objects
        };

        if (!post.body) {
            post.body = plaintext2html(post.text_body); // .replace(/\n\n/g, '<br>');
        }

        //console.log('n end');

        if (success) success(post);
    }, error);
}

function delete_post(pid, success, error) {
    node_delete(pid, {
        success: function(){
            if (success) success();
        },
        error: function(xhr, status, msg) {
            if (error) error(status, msg, error_logged_out(status, msg));
        }
    });
}

/*
function get_nodes_by_ids(nids, success, error) {
    node_retrieve(nids, {success: success, error: error});
}
*/


function create_transaction(args, success, error) {
    /*
    var args = {
        description: 'Bike repair',
        payer: 4380,
        payee: 4383,
        hours: '1.0',
        date: '2017-05-23',
        category_ids: '581,554,551',
    };
    */

    if (args.hours && ('' + args.hours).indexOf('.') === -1) {
        // hours needs decimal
        args.hours += '.0';
    }

    if (args.category_ids) {
        args.category_ids = args.category_ids.join(',');
    }

    entity_create('transaction/create', null, args, {
        success: function(r) {
            // result should have transaction & balance properties
            // but client not using transaction currently, so just return it w/o the transaction
            // (b/c we would want to normalize the transaction before returning it in any case)
            //log('entity created', r);
            if (success) success({balance: r.balance});
        },
        error: function(xhr, status, msg) {
            //log('entity creation error', status, msg);
            if (error) error(status, msg, error_logged_out(status, msg));
        }
    });
}

function _transaction(x) {
    // x also has a serial property..

    var category_ids = [];

    map(get(x, 'offers_wants_categories.und', []), function(c){
        category_ids.push(c.tid);
    });

    return {
        transaction_id: x.xid,
        created: x.created, // timestamp

        // user_ids
        creator: x.creator, 
        payee: x.payee,
        payee_name: x.payee_name,
        payer: x.payer,
        payer_name: x.payer_name,

        description: cleanup_html(get(x, 'transaction_description.und[0].safe_value', ''), true),
        hours: get(x, 'worth.und[0].quantity', null),
        category_ids: category_ids
    };
}

function get_transactions(args, success, error) {
    // may be wrong b/c i was in maintenance mode.. // transact & 1stparty & transact/1stparty didn't work as entity_type

    // args accepts start=0&num=10 (defaults)

    args = args_to_str(args);

    entity_index('transaction/index', args || '', {
        success: function(data) {

            data.transactions = map(data.transactions, _transaction);

            if (success) success(data);
        },
        error: function(xhr, status, msg) {
            if (error) error(status, msg, error_logged_out(status, msg));
        }
    });
}

window.get_transactions = get_transactions;


/* not really search, gets exact matches only
function get_users(user_query) {
    //var user_query = query || {parameters: {'uid': '4387'}};

    console.log('user query', user_query);
    user_index(user_query, {
        success: function(users) {
            log('get users', users);
        }
    });
}
*/


function hour_minute_display(num_hours, num_minutes) {
    var display = '';

    if (num_hours < 0) {
        num_hours = Math.abs(num_hours);
        num_minutes = Math.abs(num_minutes);
        display = '-';
    }

    if (num_hours >= 1) {
        display += (
            num_hours + ' hour' +
            (num_hours === 1 ? '' : 's') +
            ' '
        );
    }
    if (num_minutes > 0) {
        if (num_hours >= 1) {
            display += 'and ';
        }
        display += num_minutes + ' minutes';
    }

    /*
    if (num_minutes > 0) {
        display = `${num_hours} hours and ${num_minutes} minutes`;
    } else {
        display = `${num_hours} hours`;
    }
    */
    return display;
}

function hours_to_hour_minute_display(n) {
    var num_hours = parseInt(n),
        num_minutes = (n - num_hours) * 60;
    return hour_minute_display(num_hours, num_minutes);
}


function send_msg(args, success, error) {
    // args should have {user_id, subject, message}

    // but api expects uid
    args.uid = args.user_id;
    delete args.user_id;

    // TODO later: test copy option

    // see: https://github.com/signalpoint/DrupalGap/blob/7.x-1.x/src/modules/contact/contact.js
    //      in particular, contact_personal_form_submit

    Drupal.services.call({
        service: null,
        resource: null,
        method: 'POST',
        path: 'contact/personal.json',
        data: JSON.stringify(args),
        success: function(data) {
            if (success) success(data);
        },
        error: function(xhr, status, message) {
            if (error) error(status, message, error_logged_out(status, message));
        }
    });
}

function send_site_msg(args, success, error) {

    // TODO later: probably need to remove captcha before using this w/ logged out users
    //             doesn't work b/c captcha on site contact form requires submitting what code is in the image..

    // args should have {name, email, subject, message}

    // but api excepts mail instead of email
    args.mail = args.email;
    delete args.email;

    Drupal.services.call({
        service: null,
        resource: null,
        method: 'POST',
        path: 'contact/site.json',
        data: JSON.stringify(args),
        success: function(data) {
            if (success) success(data);
        },
        error: function(xhr, status, message) {
            if (error) error(status, message);
        }
    });
}

window.send_site_msg = send_site_msg;


function search_users(args, success, error) {

    // args supports start, num, query

    if (!args.start) {
        args.start = 0;
    }
    if (!args.num) {
        args.num = 20;
    }

    var url = 'search_user2/index.json?' + (args_to_str(args) || '');

    Drupal.services.call({
        method: 'GET',
        
        path: url, 
        // was using search_user/retrieve.json but the services_search module doesn't return user IDs

        success: function(data) {
            //log('search users success', data);
            if (success) success(data); // [{uid, name, picture_url}, ...]
        },
        error: function(xhr, status, message) {
            //log('search users error', xhr, status, message);
            if (error) error(status, message, error_logged_out(status, message));
        }
    });
}

/*
function search_offers_wants(query, success) {
    _search(query + ' type:offer,want', 'offers_wants', success);
}
function search_nodes(query, success) {
    _search(query, 'node', success);
}
*/
/*
function _search(query, type, success, error) {

    // this does search offers and wants
    // but also searches content pages (eg. news)

    // type: "Offer/Request"
    // type: "Event"
    // type: "News"
    // type: "Web Page"
    // type: "Projects"

    query = query || '';
    type = type || '';

    Drupal.services.call({
        service: null,
        resource: null,
        method: 'GET',
        path: 'search_node/retrieve.json?keys=' + encodeURIComponent(query) + '&type=' + encodeURIComponent(type),
        success: function(data) {
            log('search nodes success', data);
            if (success) success(data);
        },
        error: function(xhr, status, message) {
            log('search nodes error', xhr, status, message);
            if (error) error(xhr, status, message);
        }
    });
}
*/

var CATEGORIES = null,
    ls_categories = localStorage.post_categories;

if (ls_categories) {
    try {
        CATEGORIES = JSON.parse(ls_categories);
        ls_categories = null;
    } catch (exc) {}
}

function _post_categories_sorted() {
    var categories2 = [];

    forIn(CATEGORIES, (value, key) => {
        categories2.push({id: key, name: value});
    });

    return sortBy(categories2, property('name'));
}

function get_post_categories(success, error) {
    if (CATEGORIES) {
        if (success) success(_post_categories_sorted(CATEGORIES));
        return;
    }

    var query = {
      parameters: {
        vid: 2 // is the taxonomy id for offer wants taxonomies
      }
    };
    taxonomy_term_index(query, {
        success: function(terms) {
            CATEGORIES = {};
            for (var i = 0; i < terms.length; ++i) {
                CATEGORIES[terms[i].tid] = terms[i].name;
            }
            //log('got post categories', CATEGORIES);
            localStorage.post_categories = JSON.stringify(CATEGORIES);
            if (success) success(_post_categories_sorted(CATEGORIES));
            //log('Loaded ' + terms.length + ' term(s)!', terms); // each one has tid & name
        },
        error: function(xhr, status, msg) {
            if (error) error(status, msg);
        }
    });
}

function update_post(post_id, options, success, error) {

    // TODO later: support editing the image

    var args = {
        post_id: post_id,
        type: options.type, // offer | want
        title: options.title,
        body: options.body,
        end_date: options.end_date, // eg. '2018-12-30'
        category_ids: options.category_ids.join(','), // [1,2,3]
    };

    Drupal.services.call({
        method: 'PUT',
        path: 'post/update.json',
        data: JSON.stringify(args),
        success: function(result) {

            // need to delete cache so the post will be refetched with updated values
            delete localStorage['node_' + post_id];

            if (success) success();
        },
        error: function(xhr, status, message) {
            if (error) error(status, message, error_logged_out(status, message));
        }
    });
}


function create_post(options, success, error) {

    // options should have
    // title
    // body
    // type
    // category_ids (optional?)  (if multiple, will have to use update_post to add additional categories)
    // end_date '2017-12-01'

    // TODO later: support images/photos (may have to create image nodes and attach to proposition nodes..)
    //             and could just upload to non-drupal at first
    //             probably just need to use file_create from jdrupal

    var first_category = options.category_ids[0],
        node = {
            type: 'proposition',
            title: options.title,
            body: {
                und: [{value: options.body}]
            },
            want: options.type === 'offer' ? '0' : '1',
            
            // image: {und: [fid: "1120"]} // fid = file id?  (and  display: '1' & upload: null  show up in args copied below)
    };

    if (first_category) {
        node.offers_wants_categories = {und: [{tid: first_category}]};

        /*
        offers_wants_categories: {
            und: [{tid: first_category}] // works for one category
            
            //und: [{tid: 581}, {tid:554}] // only gets first category
            //und: {0: {tid: 554}, 1: {tid:581}} // only gets first category
            //und: [{tid: [554, 581]}] // doesn't work at all

            // multiple didn't work when added to the list, only the first is applied.. tried adding _weight setting too..
        },
        */
    }

    node_create(node, {
        success: function(new_node) {
            // full node doesn't come back, just
            // {nid: "16132", uri: "https://timebank-testsite.org/rest/node/16132"}

            var node_id = new_node.nid;

            // use update post to set the categories and the expiration
            // b/c can't make adding multiple categories work at creation
            // or setting the expiration
            var update_args = {
                type: options.type,
                title: options.title,
                body: options.body,
                end_date: options.end_date,
                category_ids: options.category_ids
            };

            update_post(node_id, update_args, function(){
                if (success) success(node_id);
            }, error);

        },
        error: function(xhr, status, message) {
            log('create error', xhr, status, message);
            if (error) error(status, message, error_logged_out(status, message));
        }
    });

}


//import { sortBy, reverse, property } from "lodash";
// to best import lodash, see
// may want to use lodash-es along w/ a plugin? or will treeshaking work w/o the plugin.. oy
// and write all my modules in ES module format
// https://medium.com/modus-create-front-end-development/webpack-2-tree-shaking-configuration-9f1de90f3233

function get_nodes(type, num, success, error) { 
    var query = {
        parameters: {
            'type': type,
            'status': '1',
        },
        orderby: {changed: 'DESC'},
        pagesize: num,
    };

    // see node_resource.inc for how this works
    // and http://www.drupalcontrib.org/api/drupal/contributions%21services%21services.module/function/services_resource_build_index_query/7

    /*
    if (type === 'event') {
        // query.parameters.event_date >= ..
        query.parameters.event_date = ('' + ((new Date()).getTime() / 1000)).split(".")[0];
        query.parameters_op = {event_date: '>='};
    }
    
    // doesn't work b/c event_date isn't a default field but is a custom field for the type..
    // .. then how the heck do you query custom fields??
    // by default only can query node properties & not node fields
    //
    // https://drupal.stackexchange.com/questions/84744/passing-custom-fields-as-parameters-in-a-rest-query
    // says to use
    // https://www.drupal.org/project/services_entity
    // which isn't covered by drupal security policy..
    //
    // or use services_views to access views via services (not available in drupal 8)

    */

    node_index(query, {
        success: function(nodes) {
            /*
            if (nodes && nodes[0].changed) {
                //nodes = sortBy(nodes, property('changed'));
                //reverse(nodes); // newest first
            }
            */

            //log(type, nodes);

            if (success) success(nodes);
        },
        error: function() {
            if (error) error();
        }
    });
}


function get_projects(num, success, error) {
    return get_nodes('projects', num, success, error);
}

//window.get_projects = get_projects;

/*
function unix_time() {
    // in seconds
    return (new Date()).getTime() / 1000;
}
*/

/*
var cached_events = null,
    cached_events_time = null; // (new Date()).getTime() / 1000;
*/

/*
Timebank.get_node(events[0].nid, function(ev){
    console.log('full event from get_node', ev);
});
*/

//import Promise from "bluebird";
// return new Promise(function(resolve, reject){


function get_node_image(node, path) {
    path = path || 'image';

    var im = null,
        i = get(node, path + '.und[0]');

    if (i) {
        im = {
            url: large_image(i.uri),
            // the width & height don't seem to be accurate for the large image.. may be for a larger/full resolution version
            //width: 1 * i.width,
            //height: 1 * i.height,
        };
    }
    return im;
}

function get_node_body(node) {
    var html = null,
        val = get(node, 'body.und[0].safe_value');
    if (val) {
        html = cleanup_html(val);
    }
    return html;
}

function get_story(story_id, success, error) {
    get_node(story_id, function(story){
        var s = {
            story_id: story.nid,
            title: story.title,
            created: story.created,
            user_id: story.uid,
            user_name: story.name,
            image: get_node_image(story),
            body_html: get_node_body(story),
        };
        if (success) success(s);
    }, error);
}


function get_event(event_id, success, error) {
    get_node(event_id, function(event){

        var evt = {
            event_id: event.nid,
            title: event.title,
            created: 1 * event.created,
            user_name: event.name, // XXX: could return user object (name + user_id so could be clickable to view user profile)
            image: get_node_image(event, 'field_event_image'),
            body_html: get_node_body(event),
        };

        if (event.field_date_recurring) { // DCTB specific

            // event.field_date_recurring: {"und":[{"value":"2018-02-15T19:00:00","value2":"2018-02-15T20:00:00","timezone":"America/Chicago","timezone_db":"UTC","date_type":"date"},
            //
            // und is an array of dates, in order from oldest date to newest
            // the oldest date may be in the past though
            // 
            // and value & value2 are in UTC, so they need to be converted to local time

            var dates = event.field_date_recurring.und,
                now = (new Date()).getTime();

            // get each date that is in the future
            var future_dates = filter(dates, function(x){
                // event hasn't ended yet
                return iso8601_parse(x.value2) > now;
            });

            var show_date;
            if (future_dates.length) {
                show_date = future_dates[0];
            } else {
                // no future dates, use the newest of the old dates
                show_date = dates[dates.length - 1];
            }

            // convert date/times to local timestamp via iso8601_parse(x.value) (which returns milliseconds)
            evt.datetime_start = iso8601_parse(show_date.value) / 1000; // ms to seconds
            evt.datetime_end = iso8601_parse(show_date.value2) / 1000;

        } else { // old event_date field 
            evt.datetime_start = (function () {
                var dt = null,
                    dt_data = get(event, 'event_date.und[0].value');
                if (dt_data) {
                    dt = 1 * dt_data;
                }
                return dt;
            }());
        }

        evt.details_html = (function () {
            var addr = get(event, 'field_event_street_address.und[0].safe_value'),
                city = get(event, 'field_event_city.und[0].safe_value'),
                zip = get(event, 'field_event_zip.und[0].safe_value');

            return filter([addr, city, zip]).join('<br />\n') || null;

            /*
                (also has timezone, date_type, ..)

                website shows like:  Wednesday, November 22, 2017 - 21:45

            field_event_city.und[0].safe_value
            field_event_state.und[0].safe_value
            field_event_street_address.und[0].safe_value
            field_event_zip.und[0].safe_value
            */
        }());

        if (success) success(evt);
    }, error);
}

function get_events(args, success, error) {

    args = args_to_str(args);

    entity_index('event/index', args || '', {
        success: function(data) {

            data.events = map(data.events, function(evt){
                evt.datetime_start = iso8601_parse(evt.datetime_start) / 1000; // TODO: extract
                evt.datetime_end = iso8601_parse(evt.datetime_end) / 1000;
                return evt;
            });

            if (success) success(data);
        },
        error: function(xhr, status, msg) {
            if (error) error(status, msg, error_logged_out(status, msg));
        }
    });
}

function get_stories(num, success, error) {

    // XXX: ideally would return pagination data like get_events BUT
    //      the underlying node_index doesn't return anything other than the nodes..
    //      eg. {news: [], start: 0, num: 3}

    return get_nodes('story', num, function(nodes){

        var stories = map(nodes, function(n){
            return {
                story_id: n.nid,
                title: n.title,
                created: 1 * n.created,
            };
        });

        if (success) success(stories);

    }, error);

}


// other types: document, page
//
// probably provide a way to get content of pages like:
//
// http://timebank-testsite.org/home
// http://danecountytimebank.org/start
// http://danecountytimebank.org/share
// http://danecountytimebank.org/join
// http://danecountytimebank.org/timebanking
// http://danecountytimebank.org/faq



//log('end script');

module.exports = {
    
    create_post: create_post,
    create_transaction: create_transaction,

    get_post_categories: get_post_categories,

    get_post: get_post,
    get_posts: get_posts,
    delete_post: delete_post,
    update_post: update_post,

    get_transactions: get_transactions,

    get_current_user: get_current_user,
    get_user: get_user,
    //get_users: get_users,

    get_story: get_story,
    get_stories: get_stories,

    //get_story: get_story,
    get_projects: get_projects,

    get_event: get_event,
    get_events: get_events,

    //get_node: get_node,

    log: log,
    login: login,
    logout: logout,

    //sc: sc,

    //search_nodes: search_nodes,
    //search_offers_wants: search_offers_wants,
    search_users: search_users,
    
    send_msg: send_msg,
    send_site_msg: send_site_msg,

    hour_minute_display: hour_minute_display,
    hours_to_hour_minute_display: hours_to_hour_minute_display,

    get_site_path: get_site_path,

};





