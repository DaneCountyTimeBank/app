/* global console Drupal node_save node_delete node_load user_login user_logout user_retrieve node_create entity_create entity_index node_index taxonomy_term_index system_connect */

import { map, forIn, filter, get, endsWith, property, trimEnd, sortBy } from "lodash";

// if need date stuff, use https://date-fns.org/ instead of moment.js

// packaging as an app for app stores... another 2-3 days per app store.. but maybe quicker w/ phonegap build..
// packaging as a PWA .. 1-2 days?


var DEBUG = true;

function log() {
    if (!DEBUG) return;
    console.log.apply(console, arguments);
}

var SITE_PATH = "https://timebank-testsite.org",
    FILE_PATH = SITE_PATH + '/sites/danecountytimebank.org/files/',
    //ORIG_PIC_PATH = FILE_PATH,
    LARGE_PIC_PATH = FILE_PATH + 'styles/large/public/',
    THUMB_PATH = FILE_PATH + 'styles/thumbnail/public/';
    //PROFILE_PIC_PATH = THUMB_PATH + 'pictures/';


Drupal.settings.site_path = SITE_PATH;
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

function args_to_str(args) {
    return Object.keys(args).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(args[k])).join('&');
}

function get_posts(args, success) {
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
            //log('offers', entities);
            if (success) success(entities);
        }
    });
}

function post_set_categories(post_id, category_ids, success, error) {
    // categories is comma delimeted string of category ids, eg.  581,556,550
    Drupal.services.call({
        method: 'PUT',
        path: 'post/set-categories.json',
        data: JSON.stringify({post_id: post_id, category_ids: category_ids}),
        success: function(result) {
            if (success) success();
        },
        error: function(xhr, status, message) {
            if (error) error(status, message);
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

    if (user.picture && user.picture.uri) {

        /*
        user.picture_width = 1 * user.picture.width;
        user.picture_height = 1 * user.picture.height;

        doesn't have width or height..
        */
        user.picture_url = large_image(user.picture.uri);

        user.thumbnail_url = thumb_image(user.picture.uri);
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
            if (error) error(status, msg);
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

                height: 1 * img.height,
                width: 1 * img.width,
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

        var post = {
            post_id: node.nid,
            type: node.want === '1' ? 'want' : 'offer',
            title: node.title,
            body: cleanup_html(get(node, 'body.und[0].safe_value', '')),
            changed: 1 * node.changed,
            created: 1 * node.created,
            end: 1 * node.end,
            image: img,
            user_name: node.name,
            user_id: node.uid,
            categories: categories // as array of {id:, name:} objects
        };

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
            if (error) error(status, msg);
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
            if (error) error(status, msg);
        }
    });
}

function _transaction(x) {
    // serial, xid, 

    var category_ids = [];

    map(get(x, 'offers_wants_categories.und', []), function(c){
        category_ids.push(c.tid);
    });

    return {
        created: x.created, // timestamp

        // user_ids
        creator: x.creator, 
        payee: x.payee,
        payee_name: x.payee_name,
        payer: x.payer,
        payer_name: x.payer_name,

        description: cleanup_html(get(x, 'transaction_description.und[0].safe_value', '')),
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
            if (error) error(status, msg);
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
            if (error) error(status, message);
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
            if (error) error(status, message);
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
            log('got post categories', CATEGORIES);
            localStorage.post_categories = JSON.stringify(CATEGORIES);
            if (success) success(_post_categories_sorted(CATEGORIES));
            //log('Loaded ' + terms.length + ' term(s)!', terms); // each one has tid & name
        },
        error: function(xhr, status, msg) {
            if (error) error(status, msg);
        }
    });
}

function date_to_object(date_str) {
    
    // date_str in format 2018-12-30

    // JS Date always counts month starting from 0, January = 0, December = 11

    var [year, month, day] = date_str.split('-');
    /*
        date = new Date(year, month - 1, day),
        day_ms = 24 * 3600 * 1000,
        timestamp_ms = date.getTime() + day_ms,
        date2 = new Date(timestamp_ms);

    month = date2.getMonth() + 1;
    day = date2.getDate();
    year = date2.getFullYear();
    */

    //console.log('given', date_str, 'js date', date, 'timestamp ms', timestamp_ms, 'js date 2', date2, 'returning', year, month, day);

    return {month: month, day: day, year: year};
}

function update_post(node_id, options, success, error) {

    // TODO later: support editing the image

    // XXX: could speed up by getting node earlier than at update submission..

    get_node(node_id, function(node) {

        node.title = options.title;
        if (node.body.und && node.body.und[0]) { // body may not be set if empty
            node.body.und[0].value = options.body;
        } else {
            node.body = {und: [{value: options.body}]};
        }
        node.end = date_to_object(options.end_date);

        var old_category_ids = [],
            categories = sortBy(options.category_ids).join(','),
            old_categories,
            set_categories;

        map(node.offers_wants_categories.und, function(x){
            old_category_ids.push(x.tid);
        });

        old_categories = sortBy(old_category_ids).join(',');

        set_categories = (categories !== old_categories);

        node_save(node, {
            success: function(result) {
                if (set_categories) {
                    post_set_categories(node_id, categories, function(){
                        if (success) success();
                    }, error);
                } else {
                    if (success) success();
                }
            },
            error: function(xhr, status, message) {
                if (error) error(status, message);
            }
        });

    }, function(xhr, status, message){
        if (error) error(status, message);
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

    var [first_category, ...other_categories] = options.category_ids,
        categories = options.category_ids.join(','),
        node = {
            type: 'proposition',
            title: options.title,
            body: {
                und: [{value: options.body}]
            },
            want: options.type === 'offer' ? '0' : '1',
            end: date_to_object(options.end_date)
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

            var node_id = new_node['nid'];

            if (other_categories) {

                post_set_categories(node_id, categories, function(){
                    if (success) success(node_id);
                }, error);

                // XXX: ideally all categories could be added at creation but couldn't get that to work
                //      so all extra categories have to be added post creation..
                //add_other_categories(node_id, other_categories);
            } else {
                if (success) success(node_id);
            }
        },
        error: function(xhr, status, message) {
            log('create error', xhr, status, message);
            if (error) error(status, message);
        }
    });

}

/*
function category_adder(node_id, category_ids, cb) {
    // returns a function that adds the given category to the given node
    // and calls the given callback when done successfully
    return function() {
        get_node(node_id, function(node){

            for (var category_id of category_ids) {
                node['offers_wants_categories']['und'].push({tid: category_id});
            }

            node_save(node, {
                success: function(result){
                    cb();
                }, 
                error: function(xhr, status, msg){
                    // not handling for now..
                }
            });

        }, function(status, msg){
            // not handling for now ..
        });
    };
}
*/
/*
function add_other_categories(node_id, other_categories) {
    // we can only add one category at a time
    // so we create a list of functions each of which will add a specific category
    // and then execute them sequentially

    var funcs = [],
        cb = function() {
            if (funcs.length > 0) {
                var f = funcs.pop();
                f();
            }
        };

    //funcs.push(category_adder(node_id, other_categories, cb)); // doesn't work for whatever reason

    for (var category_id of other_categories) {
        funcs.push(category_adder(node_id, [category_id], cb));
    }
    cb();
}
*/

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
            width: 1 * i.width,
            height: 1 * i.height,
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

        evt.date = (function () {
            var dt = null,
                dt_data = get(event, 'event_date.und[0].value');
            if (dt_data) {
                dt = 1 * dt_data;
            }
            return dt;
        }());

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
        success: success,
        error: error
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


function cleanup_html(html) {
    html = trimEnd(html.replace(/<a /g, '<a class="link external" target="_blank" ')); // very naive implementation..

    var empty = '<p>&nbsp;</p>';
    if (endsWith(html, empty)) {
        html = trimEnd(html.replace(new RegExp(empty + '$'), ''));
    }
    return html;
}



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

    //cleanup_html: cleanup_html,

};





