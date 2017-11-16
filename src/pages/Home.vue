<template>
  <f7-page name="home" class="home-page">
    <f7-navbar sliding>
      <f7-nav-left>
        <f7-link icon="icon-bars" open-panel="left"></f7-link>
      </f7-nav-left>
      <f7-nav-center>
        Home
      </f7-nav-center>
    </f7-navbar>
    <!-- Scrollable page content-->

    <f7-block-title>
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
        Events
    </f7-block-title>
    <f7-preloader v-if="events_loading" size="24px" color="gray"></f7-preloader>
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
                <div class="item-text">
                    {{item.date | timestamp_to_date}}<br />
                    {{item.date | timestamp_to_time}}
                </div>
            </f7-list-item>
        </f7-list>
        <f7-block inner v-if="events.length === 0">
            <p>No upcoming events.</p>
        </f7-block>
    </template>


    <f7-block-title>Links</f7-block-title>
    <f7-list>
        <f7-list-item link="/post" title="New Post"></f7-list-item>
        <f7-list-item link="/offers" title="Offers"></f7-list-item>
        <f7-list-item link="/requests" title="Requests"></f7-list-item>
        <f7-list-item link="/members/exchange" title="Record an Exchange"></f7-list-item>
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
            }, () => {
                this.events_error = true;
            });

            // TODO later: add a projects page and show projects
            //Timebank.get_projects();
        }

        // TODO later: paypal donation option

    };
</script>

<style>

.home-page .preloader {
    margin-left: 16px;
    margin-top: 8px;
    opacity: 0.4;
}

</style>
