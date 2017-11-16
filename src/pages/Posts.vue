<template>

  <f7-page name="posts" pull-to-refresh @ptr:refresh="onPullToRefresh" :pull-to-refresh-distance="44" >
    <f7-navbar sliding :back-link="user_id && 'Back'">
      <f7-nav-left v-if="!user_id">
        <f7-link icon="icon-bars" open-panel="left"></f7-link>
      </f7-nav-left>
      <f7-nav-center>
          {{ title }}
      </f7-nav-center>
      <f7-nav-right>
          <f7-link icon="icon-search"> <!--  open-panel="right" -->
              <!-- <i class="material-icons">search</i> XXX: could display this once the search field is hidden from view -->
              <i v-if="false && !user_id" class="material-icons" alt="Post filters">tune</i> <!-- filter_list more_virt more_horiz  -->
          </f7-link>
      </f7-nav-right>
    </f7-navbar>

    <f7-block v-if="user_id" class="showing-posts-header">
        Showing posts by <template v-if="exchange">you and </template><strong><a :href="user_id | member_link">{{user_name}}</a></strong>
    </f7-block>

    <!-- TODO later: extract to a component -->
    <f7-list form class="posts-search-form">
        <f7-list-item>
            <f7-icon slot="media" class="search-icon"><i class="material-icons">search</i></f7-icon>
            
            <f7-input slot="inner-start" type="text" placeholder="Search" v-model.trim="search_query" @input="triggerSearch()" @keydown.enter.prevent />

            <f7-icon slot="content">
                <i class="material-icons reset-search" @click="clearSearch()" alt="Clear Search">close</i>
            </f7-icon>
        </f7-list-item>
    </f7-list>

    <f7-list media-list class="post-list">
        <f7-list-item v-if="exchange" @click="selectPost(null)" title="Custom" class="custom-exchange">
            <div class="item-text">
                Record a custom exchange
            </div>
        </f7-list-item>
        
        <f7-list-item v-for="post in posts" @click="selectPost(post)" :title="post.title">
            <div class="item-text">
                {{post.type_display}}
                <template v-if="exchange || !user_id">
                    by {{post.user_name}}
                </template>
                <div class="item-text-right" v-if="!user_id">
                    {{post.area}}
                </div>
            </div>
        </f7-list-item>

        <infinite-loading :on-infinite="onInfinite" ref="infiniteLoading" :distance="20" spinner="spiral">
            <div slot="no-results">
                <br />
                No posts found
            </div>
            <div slot="no-more">
                <br />
                No more posts
            </div>
        </infinite-loading>

    </f7-list>

  </f7-page>
</template>

<script>

    import Timebank from '../timebank';
    import InfiniteLoading from 'vue-infinite-loading';
    // https://peachscript.github.io/vue-infinite-loading/#!/events

    /*
          
    ios icons (have to be installed)
        http://framework7.io/icons/

        filter
        sort
        more
        search
        settings
        
        list
        menu

    android icons (ditto)
        https://material.io/icons/

    

    TODO later: filtering via a right panel (categories, locations, people, organizations)

          https://peachscript.github.io/vue-infinite-loading/#!/getting-started/with-filter

    TODO later: get image thumbnails in listing view
         (will probably requires editing PHP code / maybe creating a new module to return the image thumbnails)

    TODO later: make clicking search icon focus on search

    */

    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    export default {
        name: 'Posts',

        data () {

            var user_id = this.$route.query.user_id,
                exchange = this.$route.query.exchange,
                title,
                post_type;

            if (user_id) {
                post_type = ''; 
                
                if (exchange) {
                    title = 'Select Exchange';
                } else {
                    title = 'Member Posts';
                }
            } else if (this.$route.path === '/offers') {
                post_type = 'offer';
                title = 'Offers';
            } else {
                post_type = 'want';
                title = 'Requests';
            }

            return {
                posts: [], 
                post_type: post_type,
                old_search_query: '',
                search_query: '',
                user_id: user_id,
                user_name: this.$root.view_user_name || ('Member ' + user_id),
                exchange: exchange,
                title: title,
            };
        },
        created () {
            if (!this.$root.view_user_name && this.user_id) {
                Timebank.get_user(
                    this.user_id,
                    user => {
                        this.user_name = user.name;
                    }
                );
            }
        },
        components: {
            InfiniteLoading,
        },

        filters: {
            member_link: user_id => `/member/${user_id}`,
        },

        methods: {

            resetPosts () {
                this.posts = [];
                this.$refs.infiniteLoading.$emit('$InfiniteLoading:reset');
            },

            onPullToRefresh () {
                this.$f7.pullToRefreshDone();
                this.resetPosts();
            },

            postsError () {
                this.$f7.addNotification({message: 'Error loading posts- please try again later.', hold: 3500});
            },

            getPosts () {
                var self = this,
                    start = this.posts.length,
                    num = 20, // XXX: currently search has 20 hardcoded in the PHP code
                    active_query = self.search_query,
                    same_query = (!active_query || (active_query === self.old_search_query)),
                    args = {
                        start: same_query ? start : 0,
                        num: num,
                        type: self.post_type
                    };

                if (this.user_id) {
                    if (this.exchange) {
                        args.user_ids = this.user_id + ',' + localStorage.user_id;
                    } else {
                        args.user_ids = this.user_id;
                    }
                }

                if (self.search_query) {
                    args.query = self.search_query;
                }

                Timebank.get_posts(args, function(data) {

                    for (var p of data.posts) {
                        if (self.user_id) {
                            p.type_display = (p.type === 'offer' ? 'Offer' : 'Request');
                        } else {
                            p.type_display = '';
                        }
                    }
                    
                    if (!active_query || self.old_search_query === active_query) {
                        self.old_search_query = '';
                        self.posts = self.posts.concat(data.posts);
                    } else {
                        self.posts = data.posts;
                    }

                    if (data.posts.length > 0) {
                        self.$refs.infiniteLoading.$emit('$InfiniteLoading:loaded');
                    }
                    if (data.posts.length < num) {
                        self.$refs.infiniteLoading.$emit('$InfiniteLoading:complete');
                    }

                    if (active_query) self.old_search_query = active_query;

                }, function(xhr, status, msg){

                    if (status === 404) { // TODO later: check via msg if possible..

                        // complete w/o loaded causes no posts found message to be displayed
                    } else {
                        self.postsError();
                        //console.log('get posts err', xhr, status, msg);
                    }

                    self.$refs.infiniteLoading.$emit('$InfiniteLoading:complete');

                });
            },

            onInfinite () {
                this.getPosts();
            },

            triggerSearch: debounce(function(){

                if (!this.search_query) {
                    //console.log('resetting');

                    window.Dom7('.posts-search-form .reset-search').removeClass('active');

                    this.resetPosts();

                } else {

                    window.Dom7('.posts-search-form .reset-search').addClass('active');

                    if (this.search_query.length >= 2) {
                        this.resetPosts();
                    }

                }

            }, 250),

            clearSearch () {
                //console.log('clearing search');
                this.search_query = '';
                this.triggerSearch();
            },

            selectPost (post) {
                // post may be null if selecting custom option for exchange flow

                this.$root.post = post; // for exchange to use title, type (offer|want), 
                this.$root.view_user_name = this.user_name;

                var url,
                    enc_user_id;

                if (this.exchange) {
                    enc_user_id = encodeURIComponent(this.user_id);
                    url = `/exchanges/new?user_id=${enc_user_id}`;
                    if (post) {
                        url = url + `&post_id=${post.post_id}`;
                    }
                } else {
                    url = `/post/${post.post_id}`;
                }
                this.$router.load({url: url});
            },

        },
    };

</script>

<style>

.custom-exchange .item-title-row {
    font-style: italic;
    color: green;
}

.showing-posts-header {
    margin-top: 15px !important;
    margin-bottom: 15px !important;
}

.post-list {
    margin-top: 0 !important;
}
.item-text-right {
    display: inline-block;
    float: right;
    margin-right: 30px;
}

.posts-search-form.list-block {
    margin: 0;
}
.posts-search-form.list-block .item-inner {
    padding-top: 14px;
    padding-bottom: 0px;
}

.posts-search-form .material-icons {
    /* margin-top: -4px; */
    color: #aaa;
}

.posts-search-form .search-icon {
    width: 24px;
    margin-top: 10px;
}
.posts-search-form .reset-search {
    width: 40px;
    margin-top: 10px;
    color: #fff; /* hide at first until there is text present */
}
.posts-search-form .reset-search.active {
    color: #aaa;
}

/*
#search-form.list-block .item-media {
    min-width: 26px;
}
*/

</style>

