<template>
  <f7-page name="exchanges" pull-to-refresh @ptr:refresh="onPullToRefresh" :pull-to-refresh-distance="44" >
    <f7-navbar sliding back-link="Back">
      <f7-nav-center>
          Exchanges
      </f7-nav-center>
    </f7-navbar>

    <template v-if="!loading">

        <f7-block class="balance-block">
            <strong>Current balance:</strong> &nbsp;
            {{ current_balance }}
        </f7-block>

        <f7-list form class="exchange-search-form">
            <f7-list-item>
                <f7-icon slot="media" class="search-icon"><i class="material-icons">search</i></f7-icon>
                
                <f7-input slot="inner-start" type="text" placeholder="Search" v-model.trim="search_query" @input="triggerSearch()" @keydown.enter.prevent />

                <f7-icon slot="content">
                    <i class="material-icons reset-search" @click="clearSearch()" alt="Clear Search">close</i>
                </f7-icon>
            </f7-list-item>
        </f7-list>

    </template>

    <f7-list media-list class="exchange-list">

        <f7-list-item v-for="exchange in exchanges"
            :title="exchange.description" :key="exchange.transaction_id">
            <div class="item-text">
                {{exchange.created | timestamp_to_date}}
                <div class="exchange-details">
                    <template v-if="current_user_id === (exchange.payer * 1)">
                        You paid <a :href="exchange.payee | member_link" @click="setViewUserName(exchange.payee_name)">{{exchange.payee_name}}</a>
                    </template>
                    <template v-else>
                        <a :href="exchange.payer | member_link" @click="setViewUserName(exchange.payer_name)">{{exchange.payer_name}}</a> paid you
                    </template>
                    {{hoursToHoursMinutes(exchange.hours)}}
                </div>                
            </div>
        </f7-list-item>

        <infinite-loading :on-infinite="onInfinite" ref="infiniteLoading" :distance="20" spinner="spiral">
            <div slot="no-results">
                <br />
                <template v-if="search_query">
                    No exchanges matching "{{search_query}}" found
                </template>
                <template v-if="!search_query">
                    No exchanges found
                </template>
            </div>
            <div slot="no-more">
                <br />
                No more exchanges
            </div>
        </infinite-loading>

    </f7-list>
  </f7-page>
</template>

<script>

    import Timebank from '../timebank';
    import InfiniteLoading from 'vue-infinite-loading';

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
        name: 'Exchanges',
        data () {
            return {
                exchanges: [], 
                old_search_query: '',
                search_query: '',
                num_per_query: 20,
                current_user_id: localStorage.user_id * 1,
                current_balance: null,
                loading: true,
            };
        },
        components: {
            InfiniteLoading,
        },
        filters: {
            member_link: user_id => `/member/${user_id}`, // TODO later: extract common filters
        },
        methods: {

            // XXX: could, on each line, show balance tally as of that exchange so it adds up to what is on top?
            //      (but on search results, don't show the tallying b/c that would be confusing)

            hoursToHoursMinutes (n) {
                var num_hours = parseInt(n),
                    num_minutes = (n - num_hours) * 60;

                if (num_minutes < 10) {
                    num_minutes = '0' + num_minutes;
                }

                return `${num_hours}:${num_minutes}`;
            },

            setViewUserName (name) {
                this.$root.view_user_name = name;
            },

            resetExchanges () {
                this.exchanges = [];
                this.$refs.infiniteLoading.$emit('$InfiniteLoading:reset');
            },

            onPullToRefresh () {
                this.$f7.pullToRefreshDone();
                this.resetExchanges();
            },

            loadError () {
                this.$f7.addNotification({message: 'Error loading exchanges - please try again later.', hold: 3500});
            },

            getExchanges (start) {

                // exchanges are ordered by created date
                // which is the date the exchange took place as specified by user
                // NOT the date that they recorded the exchange through the site/app

                var self = this,
                    active_query = self.search_query,
                    same_query = (active_query === self.old_search_query);

                if (!same_query) {
                    start = 0;
                }

                Timebank.get_transactions(
                    {start: start, num: this.num_per_query, query: this.search_query}, 
                    data => {

                        this.current_balance = Timebank.hours_to_hour_minute_display(data.balance);

                        // only do if the search term is the same!
                        if (this.old_search_query === active_query) {
                            this.exchanges = this.exchanges.concat(data.transactions);
                        } else {
                            this.exchanges = data.transactions;
                        }

                        if (this.exchanges.length > 0) {
                            this.$refs.infiniteLoading.$emit('$InfiniteLoading:loaded');
                        }

                        if (data.transactions.length < this.num_per_query) { 
                            this.$refs.infiniteLoading.$emit('$InfiniteLoading:complete');
                        }

                        this.old_search_query = active_query;

                        this.loading = false;

                    }, (status, msg) => {

                        if (status === 403) {

                            this.exchanges = [];
                            // complete w/o loaded causes no members found message to be displayed
                        } else {
                            this.loadError();
                            //console.log('search members err', xhr, status, msg);
                        }

                        this.$refs.infiniteLoading.$emit('$InfiniteLoading:complete');
                    }
                );
            },

            onInfinite () {

                var start = this.exchanges.length;
                this.getExchanges(start);

            },

            triggerSearch: debounce(function(){

                if (!this.search_query) {
                    //console.log('resetting');

                    window.Dom7('.exchange-search-form .reset-search').removeClass('active');

                    this.resetExchanges();

                } else {

                    window.Dom7('.exchange-search-form .reset-search').addClass('active');

                    if (this.search_query.length >= 2) {
                        this.resetExchanges();
                    }

                }

            }, 250),

            clearSearch () {
                //console.log('clearing search');
                this.search_query = '';
                this.triggerSearch();
            },

        },

    };

</script>

<style>

.balance-block {
    margin-top: 15px !important;
    margin-bottom: 10px !important;
}
.balance-block strong {
    color: #784dc7;
}

.exchange-list {
    margin-top: 0 !important;
}
.item-text-right {
    display: inline-block;
    float: right;
    margin-right: 30px;
}

.exchange-search-form.list-block {
    margin: 0;
}
.exchange-search-form.list-block .item-inner {
    padding-top: 14px;
    padding-bottom: 0px;
}

.exchange-search-form .material-icons {
    /* margin-top: -4px; */
    color: #aaa;
}

.exchange-search-form .search-icon {
    width: 24px;
    margin-top: 10px;
}
.exchange-search-form .reset-search {
    width: 40px;
    margin-top: 10px;
    color: #fff; /* hide at first until there is text present */
}
.exchange-search-form .reset-search.active {
    color: #aaa;
}
.exchange-details {
    color: #1a5573;
}

</style>

