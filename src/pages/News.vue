<template>
  <f7-page name="news">
    <f7-navbar sliding back-link="Back">
      <f7-nav-center>
          {{story.title}}
      </f7-nav-center>
    </f7-navbar>

    <f7-block class="center-preloader" v-if="!loaded && !load_error">
        <f7-preloader></f7-preloader>
    </f7-block>
    <f7-block v-if="load_error">
        Error loading news - please try again later.
    </f7-block>

    <f7-block-title class="story-title">{{story.title}}</f7-block-title>
    <f7-block inner v-if="loaded">

        <img v-if="story.image" :src="story.image.url" class="medium-image" />

        <div class="story-body" v-html="story.body_html"></div>

        <div class="story-meta">
            Posted {{story.created | timestamp_to_date}}
            by
            <f7-link :href="story | profile_link" @click="viewProfile(story)">{{story.user_name}}</f7-link>
        </div>

    </f7-block>

  </f7-page>
</template>

<script>

    import Timebank from '../timebank';

    export default {
        props: ['story_id'],
        name: 'News',
        data () {
            return {
                story: this.$root.story || {},
                loaded: false,
                load_error: false,
            };
        },

        filters: {
            profile_link: story => `/member/${story.user_id}`,
        },

        methods: {
            viewProfile (story) {
                this.$root.view_user_name = story.user_name;
            },
        },

        created () {
            Timebank.get_story(
                this.story_id, 
                story => {
                    this.loaded = true;
                    this.story = story;
                },
                () => {
                    this.load_error = true;
                }
            );
        }
    };

</script>

<style scoped>

.story-title {
    white-space: normal;
    margin-top: 15px;
    text-transform: none;
}

.story-meta {
    color: #666;
    margin: 35px 0;
}

</style>

<style>

.story-body p {
    margin: 0;
}

.story-body {
    margin-top: 1em;
}

</style>

