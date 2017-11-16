<template>
  <f7-page name="members" pull-to-refresh @ptr:refresh="onPullToRefresh" :pull-to-refresh-distance="44" >
    <f7-navbar sliding>
      <f7-nav-left>
        <f7-link icon="icon-bars" open-panel="left"></f7-link>
      </f7-nav-left>
      <f7-nav-center>
          {{ title }}
      </f7-nav-center>
    </f7-navbar>

    <f7-list form class="member-search-form">
        <f7-list-item>
            <f7-icon slot="media" class="search-icon"><i class="material-icons">search</i></f7-icon>
            
            <f7-input slot="inner-start" type="text" placeholder="Search" v-model.trim="search_query" @input="triggerSearch()" @keydown.enter.prevent />

            <f7-icon slot="content">
                <i class="material-icons reset-search" @click="clearSearch()" alt="Clear Search">close</i>
            </f7-icon>
        </f7-list-item>
    </f7-list>

    <f7-list media-list class="member-list">
        
        <f7-list-item v-for="member in members"
            link="#"
            @click="selectMember(member)"
            :title="member.name"
            :key="member.user_id"
            >
            <div slot="media">
                <img :src="member | member_picture" style="max-width:64px; max-height:90px;" />
            </div>
        </f7-list-item>

        <infinite-loading @infinite="onInfinite" ref="infiniteLoading" :distance="20" spinner="spiral">
            <div slot="no-results">
                <br />
                <div v-if="above_no_results_text">
                    <!--
                    
                    TODO maybe: probably better to have this above the search field rather than below it..

                    -->
                    <strong>{{above_no_results_text}}</strong>
                    <br /><br />
                </div>
                {{no_results_text}}
            </div>
            <div slot="no-more">
                <br />
                No more members
            </div>
        </infinite-loading>

    </f7-list>
  </f7-page>
</template>

<script>

    import Timebank from '../timebank';
    import InfiniteLoading from 'vue-infinite-loading';

    /*

    TODO later:
        would be nice to show by default
        - most recently messaged users 
        - most recently viewed users


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
        name: 'Members',
        data () {

            var instructions_txt = 'Type a name in the field above to search.',
                member_exchange = (this.$route.path === '/members/exchange');

            return {
                title: member_exchange ? 'Select Member' : 'Members',
                members: [], 
                old_search_query: '',
                search_query: '',
                num_per_query: 20,
                no_results_text: instructions_txt,
                instructions_txt: instructions_txt,
                member_exchange: member_exchange,
                above_no_results_text: member_exchange ? 'Which member did you exchange with?' : '',
                infinite: {loaded: () => {}, complete: () => {}, reset: () => {}},
            };
        },
        computed: {
            no_matches_text () {
                return 'No members matching "' + this.search_query + '" found';
            }
        },
        components: {
            InfiniteLoading,
        },
        methods: {

            resetMembers () {
                this.no_results_text = this.instructions_txt;
                this.members = [];
                this.infinite.reset();
            },

            onPullToRefresh () {
                this.$f7.pullToRefreshDone();
                this.resetMembers();
            },

            loadError () {
                this.$f7.addNotification({message: 'Error loading members - please try again later.', hold: 3500});
            },

            searchMembers (start) {

                var active_query = this.search_query,
                    same_query = (active_query === this.old_search_query);

                if (!same_query) {
                    start = 0;
                }

                this.no_results_text = this.no_matches_text;

                Timebank.search_users({start: start, num: this.num_per_query, query: this.search_query}, members => {

                    // only do if the search term is the same!
                    if (this.old_search_query === active_query) {
                        this.members = this.members.concat(members);
                    } else {
                        this.members = members;
                    }

                    if (this.members.length > 0) {
                        this.infinite.loaded();
                    }

                    if (members.length < this.num_per_query) { 
                        this.infinite.complete();
                    }

                    this.old_search_query = active_query;

                }, (status, msg) => {

                    if (status === 403) {

                        this.members = [];
                        // complete w/o loaded causes no members found message to be displayed
                    } else {
                        this.loadError();
                        //console.log('search members err', xhr, status, msg);
                    }

                    this.infinite.complete();
                });
            },

            onInfinite ($state) {

                this.infinite = $state;

                var start = this.members.length;

                if (!this.search_query) {
                    this.infinite.complete();
                } else {
                    this.searchMembers(start);
                }

            },

            triggerSearch: debounce(function(){

                if (!this.search_query) {
                    //console.log('resetting');

                    window.Dom7('.member-search-form .reset-search').removeClass('active');

                    this.resetMembers();

                } else {

                    window.Dom7('.member-search-form .reset-search').addClass('active');

                    if (this.search_query.length >= 2) {
                        this.resetMembers();
                    }

                }

            }, 250),

            clearSearch () {
                //console.log('clearing search');
                this.search_query = '';
                this.triggerSearch();
            },

            selectMember (member) {
                this.$root.view_user_name = member.name;

                var url;
                if (this.member_exchange) {
                    if (member.user_id * 1 === localStorage.user_id * 1) {
                        this.$f7.addNotification({message: "You can't record an exchange with yourself!", hold: 3500});
                    } else {
                        url = `/posts?user_id=${member.user_id}&exchange=1`;
                    }
                } else {
                    url = `/member/${member.user_id}`;
                }
                if (url) {
                    this.$router.load({url: url});
                }
                
            },

        },

        filters: {
            member_picture: member => member.picture_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAABCAQAAADEZGCcAAAADklEQVR42mP8/59hQAEA/wMCAJC8F4kAAAAASUVORK5CYII='
        },

        created () {
            // need next tick so that the input exists (or at least is more likely to exist) when we try to focus it
            this.$nextTick(() => {
                var input = window.Dom7('.member-search-form input');
                if (input.length) {
                    input[0].focus();
                }
            });
        },
    };

</script>

<style>

.member-list {
    margin-top: 0 !important;
}
.item-text-right {
    display: inline-block;
    float: right;
    margin-right: 30px;
}

.member-search-form.list-block {
    margin: 0;
}
.member-search-form.list-block .item-inner {
    padding-top: 14px;
    padding-bottom: 0px;
}

.member-search-form .material-icons {
    /* margin-top: -4px; */
    color: #aaa;
}

.member-search-form .search-icon {
    width: 24px;
    margin-top: 10px;
}
.member-search-form .reset-search {
    width: 40px;
    margin-top: 10px;
    color: #fff; /* hide at first until there is text present */
}
.member-search-form .reset-search.active {
    color: #aaa;
}

.member-search-form.list-block .item-media {
    min-width: 26px;
}

</style>

