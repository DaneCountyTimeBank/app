<template>
  <f7-page name="home" class="home-page">
    <f7-navbar sliding>
      <f7-nav-left>
        <f7-link icon="icon-bars" open-panel="left"></f7-link>
      </f7-nav-left>
      <f7-nav-center>
        Dane County TimeBank
      </f7-nav-center>
    </f7-navbar>

    <f7-block-title>
        <i class="material-icons header-icon color-cyan news-icon">public</i>
        News 
    </f7-block-title>
    <f7-preloader v-if="stories_loading" size="24px" color="gray"></f7-preloader>
    <f7-block v-if="stories_error">
        Error loading news.
    </f7-block>
    <template v-if="!stories_loading && !stories_error">
        <f7-list media-list v-if="stories.length !== 0">
            <f7-list-item v-for="item in stories" :link="item | story_link" @click="selectStory(item)" :key="item.story_id">
                <div class="item-title-row">
                    <div class="item-title">
                        {{item.title}}
                    </div>
                </div>
                <div class="item-text">
                    {{item.created | timestamp_to_date}}
                </div>
            </f7-list-item>
        </f7-list>
        <f7-block inner v-if="stories.length === 0">
            <p>No news available.</p>
        </f7-block>
    </template>

    <f7-block-title>
        <i class="material-icons header-icon color-deeporange event-icon">event</i>
        Events
    </f7-block-title>
    <f7-preloader v-if="events_loading && !events_error" size="24px" color="gray"></f7-preloader>
    <f7-block v-if="events_error">
        Error loading events.
    </f7-block>
    <template v-if="!events_loading && !events_error">
        <f7-list media-list v-if="events.length !== 0">
            <f7-list-item v-for="item in events" :link="item | event_link" @click="selectEvent(item)" :key="item.event_id">
                <div class="item-title-row">
                    <div class="item-title">
                        {{item.title}}
                    </div>
                </div>
                <div class="item-text" v-html="$options.filters.event_to_datetime_details(item)"></div>
            </f7-list-item>
        </f7-list>
        <f7-block inner v-if="events.length === 0">
            <p>No upcoming events.</p>
        </f7-block>
    </template>


    <f7-list>
        <f7-list-item
            link="/post"
            media="<i class='material-icons color-green3'>create</i>"
            title="List Offer / Request"
        />
        <f7-list-item
            link="/offers"
            media="<i class='material-icons color-green3'>local_offer</i>"
            title="Offers"
        />
        <f7-list-item
            link="/requests"
            media="<i class='material-icons color-green3'>local_offer</i>"
            title="Requests"
        />
        <f7-list-item
            link="/members/exchange"
            media="<i class='material-icons color-green3'>assignment</i>"
            title="Record Exchange"
        />
        <f7-list-item
            link="#"
            @click.prevent.stop="viewUserPosts()"
            media="<i class='material-icons color-green3'>local_offer</i>"
            title="Your Offers &amp; Requests"
        />
    </f7-list>


  </f7-page>
</template>

<script>

    import Timebank from '../timebank';

    export default {
        name: 'Home',
        data () {
            return {
                title: 'Home Page',
                stories: [],
                stories_loading: true,
                stories_error: false,
                events: [],
                events_loading: true,
                events_error: false,
            };
        },

        methods: {

            selectStory (item) {
                this.$root.story = item;
            },
            selectEvent (item) {
                this.$root.event = item;
            },
            viewUserPosts () {
                this.$root.view_user_name = 'you'; // cheap way to not have to query the user object

                // XXX: need to reference router this way when the component could be loaded w/o a hash path being set
                this.$f7.mainView.router.load({url: '/posts?user_id=' + localStorage.user_id});
            },

        },

        filters: {
            event_link: event => `/event/${event.event_id}`,
            story_link: story => `/news/${story.story_id}`,
        },

        created () {

            Timebank.get_stories(3, stories => {
                this.stories_loading = false;
                this.stories = stories;
            }, () => {
                this.stories_error = true;
            });

            Timebank.get_events({start: 0, num: 3}, data => {
                this.events_loading = false;
                this.events = data.events;
            }, (status, msg, logged_out) => {

                if (logged_out) {
                    window.timebank_event_bus.$emit('session-expired');
                } else {
                    this.events_error = true;
                }

            });

            // TODO later: add a projects page and show projects
            //Timebank.get_projects();
        }

        // TODO later: paypal donation option

    };
</script>

<style scoped>

.home-page .preloader {
    margin-left: 16px;
    margin-top: 8px;
    opacity: 0.4;
}

.header-icon {
    vertical-align: -30%;
    margin-right: 12px;
}

/*
.event-icon {
    color: #084A2F;
    color: #B77A44;
}

.news-icon {
    color: #439776;
}
*/

/*

#88A33C

// logo color
#0A845F

*/

</style>
